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
 * This command adds the files passed in.
 * It returns the list of files that were successfully added.
 * add [/lock:none|checkin|checkout] [/type:<value>] [/recursive] [/silent] [/noignore] <localItemSpec>...
 */
class Add {
    constructor(serverContext, itemPaths) {
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        this._serverContext = serverContext;
        this._itemPaths = itemPaths;
    }
    GetArguments() {
        return new argumentbuilder_1.ArgumentBuilder("add", this._serverContext)
            .AddAll(this._itemPaths);
    }
    GetOptions() {
        return {};
    }
    /**
     * Example of output
     * folder1\folder2:
     * file5.txt
     * file2.java
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Any exit code other than 0 or 1 means that something went wrong, so simply throw the error
            if (executionResult.exitCode !== 0 && executionResult.exitCode !== 1) {
                commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            }
            let lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, false, true /*filterEmptyLines*/);
            //Remove any lines indicating that there were no files to add (e.g., calling add on files that don't exist)
            lines = lines.filter((e) => !e.startsWith("No arguments matched any files to add.")); //CLC
            //Ex. /usr/alias/repos/Tfvc.L2VSCodeExtension.RC/file-does-not-exist.md: No file matches.
            lines = lines.filter((e) => !e.endsWith(" No file matches.")); //tf.exe
            const filesAdded = [];
            let path = "";
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                if (commandhelper_1.CommandHelper.IsFilePath(line)) {
                    path = line;
                }
                else {
                    const file = this.getFileFromLine(line);
                    filesAdded.push(commandhelper_1.CommandHelper.GetFilePath(path, file));
                }
            }
            return filesAdded;
        });
    }
    GetExeArguments() {
        return new argumentbuilder_1.ArgumentBuilder("add", this._serverContext, true /* skipCollectionOption */)
            .AddAll(this._itemPaths);
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ParseOutput(executionResult);
        });
    }
    getFileFromLine(line) {
        //There's no prefix on the filename line for the Add command
        return line;
    }
}
exports.Add = Add;

//# sourceMappingURL=add.js.map
