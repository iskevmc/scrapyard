/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("../interfaces");
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
/**
 * This command gets the latest version of one or more files or folders
 * (we add the switch nosummary to make sure that errors only print once)
 *
 * tf get [itemspec] [/version:versionspec] [/all] [/overwrite] [/force] [/remap]
 * [/recursive] [/preview] [/noautoresolve] [/noprompt]
 * [/login:username,[password]]
 */
class Sync {
    constructor(serverContext, itemPaths, recursive) {
        this._serverContext = serverContext;
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        this._itemPaths = itemPaths;
        this._recursive = recursive;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("get", this._serverContext)
            .AddSwitch("nosummary")
            .AddAll(this._itemPaths);
        if (this._recursive) {
            builder.AddSwitch("recursive");
        }
        return builder;
    }
    GetOptions() {
        return {};
    }
    /**
     * Example output from TF Get:
     * D:\tmp\test:
     * Getting addFold
     * Getting addFold-branch
     *
     * D:\tmp\test\addFold-branch:
     * Getting testHereRename.txt
     *
     * D:\tmp\test\addFold:
     * Getting testHere3
     * Getting testHereRename7.txt
     *
     * D:\tmp\test:
     * Getting Rename2.txt
     * Getting test3.txt
     * Conflict test_renamed.txt - Unable to perform the get operation because you have a conflicting rename, edit
     * Getting TestAdd.txt
     *
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Any exit code other than 0 or 1 means that something went wrong, so simply throw the error
            if (executionResult.exitCode !== 0 && executionResult.exitCode !== 1) {
                commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            }
            // Check for up to date message (slightly different in EXE and CLC)
            if (/All files( are)? up to date/i.test(executionResult.stdout)) {
                // There was nothing to download so return an empty result
                return {
                    hasConflicts: false,
                    hasErrors: false,
                    itemResults: []
                };
            }
            else {
                // Get the item results and any warnings or errors
                const itemResults = this.getItemResults(executionResult.stdout);
                const errorMessages = this.getErrorMessages(executionResult.stderr);
                return {
                    hasConflicts: errorMessages.filter((err) => err.syncType === interfaces_1.SyncType.Conflict).length > 0,
                    hasErrors: errorMessages.filter((err) => err.syncType !== interfaces_1.SyncType.Conflict).length > 0,
                    itemResults: itemResults.concat(errorMessages)
                };
            }
        });
    }
    GetExeArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("get", this._serverContext, true /* skipCollectionOption */)
            .AddSwitch("nosummary")
            .AddAll(this._itemPaths);
        if (this._recursive) {
            builder.AddSwitch("recursive");
        }
        return builder;
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ParseOutput(executionResult);
        });
    }
    getItemResults(stdout) {
        const itemResults = [];
        let folderPath = "";
        const lines = commandhelper_1.CommandHelper.SplitIntoLines(stdout, true, true);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (commandhelper_1.CommandHelper.IsFilePath(line)) {
                folderPath = line;
            }
            else if (line) {
                const sr = this.getSyncResultFromLine(folderPath, line);
                if (sr) {
                    itemResults.push(sr);
                }
            }
        }
        return itemResults;
    }
    getSyncResultFromLine(folderPath, line) {
        if (!line) {
            return undefined;
        }
        let newResult = undefined;
        if (line.startsWith("Getting ")) {
            newResult = {
                syncType: interfaces_1.SyncType.New,
                itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice("Getting ".length).trim())
            };
        }
        else if (line.startsWith("Replacing ")) {
            newResult = {
                syncType: interfaces_1.SyncType.Updated,
                itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice("Replacing ".length).trim())
            };
        }
        else if (line.startsWith("Deleting ")) {
            newResult = {
                syncType: interfaces_1.SyncType.Deleted,
                itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice("Deleting ".length).trim())
            };
        }
        else if (line.startsWith("Conflict ")) {
            const dashIndex = line.lastIndexOf("-");
            newResult = {
                syncType: interfaces_1.SyncType.Conflict,
                itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice("Conflict ".length, dashIndex).trim()),
                message: line.slice(dashIndex + 1).trim()
            };
        }
        else if (line.startsWith("Warning ")) {
            const dashIndex = line.lastIndexOf("-");
            newResult = {
                syncType: interfaces_1.SyncType.Warning,
                itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice("Warning ".length, dashIndex).trim()),
                message: line.slice(dashIndex + 1).trim()
            };
        }
        else {
            // This must be an error. Usually of the form "filename - message" or "filename cannot be deleted reason"
            let index = line.lastIndexOf("-");
            if (index >= 0) {
                newResult = {
                    syncType: interfaces_1.SyncType.Error,
                    itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice(0, index).trim()),
                    message: line.slice(index + 1).trim()
                };
            }
            else {
                index = line.indexOf("cannot be deleted");
                if (index >= 0) {
                    newResult = {
                        syncType: interfaces_1.SyncType.Warning,
                        itemPath: commandhelper_1.CommandHelper.GetFilePath(folderPath, line.slice(0, index).trim()),
                        message: line.trim()
                    };
                }
            }
        }
        return newResult;
    }
    /**
     * An error will be in one of the following forms:
     *
     * Warning - Unable to refresh testHereRename.txt because you have a pending edit.
     * Conflict TestAdd.txt - Unable to perform the get operation because you have a conflicting edit
     * new4.txt - Unable to perform the get operation because you have a conflicting rename (to be moved from D:\tmp\folder\new5.txt)
     * D:\tmp\vscodeBugBash\folder1 cannot be deleted because it is not empty.
     */
    getErrorMessages(stderr) {
        const errorMessages = [];
        const lines = commandhelper_1.CommandHelper.SplitIntoLines(stderr, false, true);
        for (let i = 0; i < lines.length; i++) {
            // stderr doesn't get any file path lines, so the files will all be just the filenames
            errorMessages.push(this.getSyncResultFromLine("", lines[i]));
        }
        return errorMessages;
    }
}
exports.Sync = Sync;

//# sourceMappingURL=sync.js.map
