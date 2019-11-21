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
 * This command deletes the files passed in.
 * It returns a list of all files marked for deletion.
 * delete /detect [/lock:none|checkin|checkout] [/recursive]
 * delete [/lock:none|checkin|checkout] [/recursive] <itemSpec>...
 */
class Delete {
    constructor(serverContext, itemPaths) {
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        this._serverContext = serverContext;
        this._itemPaths = itemPaths;
    }
    GetArguments() {
        return new argumentbuilder_1.ArgumentBuilder("delete", this._serverContext)
            .AddAll(this._itemPaths);
    }
    GetOptions() {
        return {};
    }
    /* Delete returns either 0 (success) or 100 (failure).  IF we fail, simply throw.

        Sample output:
        //Single file
        tf.cmd delete folder1\folder2\file2.txt
        folder1\folder2:
        file2.txt

        //Multiple files in a folder
        tf.cmd delete folder2
        folder2:
        file2.txt
        newfile.txt
        folder2

        //Deleting a file that doesn't exist
        tf.cmd delete file2.txt
        The item C:\repos\Tfvc.L2VSCodeExtension.RC\folder1\file2.txt could not be found in your workspace, or you do not have permission to access it.
        No arguments matched any files to delete.

        //Deleting a file with existing pending changes
        tf.cmd delete file2.txt
        TF203069: $/L2.VSCodeExtension.RC/folder1/folder2/file2.txt could not be deleted because that change conflicts with one or more other pending *snip*
        No arguments matched any files to delete.
    */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, false, true /*filterEmptyLines*/);
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
        return new argumentbuilder_1.ArgumentBuilder("delete", this._serverContext, true /* skipCollectionOption */)
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
        //There's no prefix on the filename line for the Delete command
        return line;
    }
}
exports.Delete = Delete;

//# sourceMappingURL=delete.js.map
