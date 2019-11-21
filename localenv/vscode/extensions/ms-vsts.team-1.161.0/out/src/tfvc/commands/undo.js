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
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
/**
 * This command undoes the changes to the files passed in.
 * It returns a list of all files undone.
 * undo [/recursive] <itemSpec>...
 */
class Undo {
    constructor(serverContext, itemPaths) {
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        this._serverContext = serverContext;
        this._itemPaths = itemPaths;
    }
    GetArguments() {
        // If exactly 1 and it is our wildcard, undo all
        if (this._itemPaths.length === 1 && this._itemPaths[0] === "*") {
            return new argumentbuilder_1.ArgumentBuilder("undo", this._serverContext)
                .Add(".")
                .AddSwitch("recursive");
        }
        return new argumentbuilder_1.ArgumentBuilder("undo", this._serverContext)
            .AddAll(this._itemPaths);
    }
    GetOptions() {
        return {};
    }
    /**
     * Example of output
     * Undoing edit: file1.java
     * Undoing add: file2.java
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            let lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, false, true /*filterEmptyLines*/);
            //If we didn't succeed without any issues, we have a bit of work to do.
            //'tf undo' can return a non-zero exit code when:
            //  * Some of the files have no pending changes (exitCode === 1)
            //  * All of the files have no pending changes (exitCode === 100)
            //If some of the files have no pending changes, we want to process the ones that did.
            //If all of the files have no pending changes, return []
            //Otherwise, we assume some error occurred so allow that to be thrown.
            if (executionResult.exitCode !== 0) {
                //Remove any entries for which there were no pending changes
                lines = lines.filter((e) => !e.startsWith("No pending changes "));
                if (executionResult.exitCode === 100 && lines.length === 0) {
                    //All of the files had no pending changes, return []
                    return [];
                }
                else if (executionResult.exitCode !== 1) {
                    //Otherwise, some other error occurred, const that be thrown.
                    commandhelper_1.CommandHelper.ProcessErrors(executionResult);
                }
            }
            const filesUndone = [];
            let path = "";
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                if (commandhelper_1.CommandHelper.IsFilePath(line)) {
                    path = line;
                }
                else if (line) {
                    const file = this.getFileFromLine(line);
                    filesUndone.push(commandhelper_1.CommandHelper.GetFilePath(path, file));
                }
            }
            return filesUndone;
        });
    }
    GetExeArguments() {
        return this.GetArguments();
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ParseOutput(executionResult);
        });
    }
    //line could be 'Undoing edit: file1.txt', 'Undoing add: file1.txt'
    getFileFromLine(line) {
        const prefix = ": "; //"Undoing edit: ", "Undoing add: ", etc.
        const idx = line.indexOf(prefix);
        if (idx > 0) {
            return line.substring(idx + prefix.length);
        }
    }
}
exports.Undo = Undo;

//# sourceMappingURL=undo.js.map
