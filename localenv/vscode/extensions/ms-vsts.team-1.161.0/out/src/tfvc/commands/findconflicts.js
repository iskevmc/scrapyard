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
const status_1 = require("../scm/status");
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
/**
 * This command finds conflicts existing in the workspace by calling tf resolve -preview
 *
 * tf resolve [itemspec]
 * [/auto:(AutoMerge|TakeTheirs|KeepYours|OverwriteLocal|DeleteConflict|KeepYoursRenameTheirs)]
 * [/preview] [(/overridetype:overridetype | /converttotype:converttype] [/recursive] [/newname:path] [/noprompt] [/login:username, [password]]
 */
class FindConflicts {
    constructor(serverContext, itemPath) {
        this._serverContext = serverContext;
        commandhelper_1.CommandHelper.RequireStringArgument(itemPath, "itemPath");
        this._itemPath = itemPath;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("resolve", this._serverContext)
            .Add(this._itemPath)
            .AddSwitch("recursive")
            .AddSwitch("preview");
        return builder;
    }
    GetOptions() {
        return {};
    }
    /**
     * Outputs the conflicts found in the workspace in the following format:
     *
     * tfsTest_01/addFold/testHere2: The item content has changed
     * tfsTest_01/TestAdd.txt: The item content has changed
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Any exit code other than 0 or 1 means that something went wrong, so simply throw the error
            if (executionResult.exitCode !== 0 && executionResult.exitCode !== 1) {
                commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            }
            const conflicts = [];
            //"Picked up _JAVA_OPTIONS: -Xmx1024M"
            let outputToProcess = executionResult.stderr;
            if (outputToProcess && outputToProcess.includes("_JAVA_OPTIONS")) {
                //When you don't need _JAVA_OPTIONS set, the results we want are always in stderr (this is the default case)
                //With _JAVA_OPTIONS set and there are no conflicts, _JAVA_OPTIONS is in stderr but the result we want to process is moved to stdout
                //With _JAVA_OPTIONS set and there are conflicts, _JAVA_OPTIONS will appear in stderr along with the results also in stderr (and stdout will be empty)
                if (executionResult.stdout && executionResult.stdout.length > 0) {
                    outputToProcess = executionResult.stdout;
                }
            }
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(outputToProcess, false, true);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes("_JAVA_OPTIONS")) {
                    continue; //This is not a conflict
                }
                const colonIndex = line.lastIndexOf(":");
                if (colonIndex >= 0) {
                    const localPath = line.slice(0, colonIndex);
                    let type = status_1.ConflictType.CONTENT;
                    if (/You have a conflicting pending change/i.test(line) ||
                        /A newer version exists on the server/i.test(line)) {
                        // This is the ambiguous response given by the EXE.
                        // We will assume it is both a name and content change for now.
                        type = status_1.ConflictType.NAME_AND_CONTENT;
                    }
                    else if (/The item name and content have changed/i.test(line)) {
                        type = status_1.ConflictType.NAME_AND_CONTENT;
                    }
                    else if (/The item name has changed/i.test(line)) {
                        type = status_1.ConflictType.RENAME;
                    }
                    else if (/The source and target both have changes/i.test(line)) {
                        type = status_1.ConflictType.MERGE;
                    }
                    else if (/The item has already been deleted/i.test(line) ||
                        /The item has been deleted in the source branch/i.test(line) ||
                        /The item has been deleted from the server/i.test(line)) {
                        type = status_1.ConflictType.DELETE;
                    }
                    else if (/The item has been deleted in the target branch/i.test(line)) {
                        type = status_1.ConflictType.DELETE_TARGET;
                    }
                    conflicts.push({
                        localPath: localPath,
                        type: type,
                        message: line
                    });
                }
            }
            return conflicts;
        });
    }
    GetExeArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("resolve", this._serverContext, true /* skipCollectionOption */)
            .Add(this._itemPath)
            .AddSwitch("recursive")
            .AddSwitch("preview");
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
}
exports.FindConflicts = FindConflicts;

//# sourceMappingURL=findconflicts.js.map
