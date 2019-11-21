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
 * This command renames the file passed in.
 * It returns...
 * rename [/lock:none|checkin|checkout] <oldItem> <newItem>
 */
class Rename {
    constructor(serverContext, sourcePath, destinationPath) {
        commandhelper_1.CommandHelper.RequireStringArgument(sourcePath, "sourcePath");
        commandhelper_1.CommandHelper.RequireStringArgument(destinationPath, "destinationPath");
        this._serverContext = serverContext;
        this._sourcePath = sourcePath;
        this._destinationPath = destinationPath;
    }
    GetArguments() {
        return new argumentbuilder_1.ArgumentBuilder("rename", this._serverContext)
            .Add(this._sourcePath)
            .Add(this._destinationPath);
    }
    GetOptions() {
        return {};
    }
    /**
     * Example of output
        //Zero or one argument
        //An argument error occurred: rename requires exactly two local or server path arguments.
        //100

        //Source file doesn't exist
        //The item C:\repos\Tfvc.L2VSCodeExtension.RC\team-extension.log could not be found in your workspace, or you do not have permission to access it.
        //100

        //Single file (no path)
        //file11.txt
        //0

        //Single file (with path)
        //folder1:
        //file11.txt
        //0
    */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            //Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, false, true /*filterEmptyLines*/);
            let path = "";
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                if (commandhelper_1.CommandHelper.IsFilePath(line)) {
                    path = line;
                }
                else {
                    const file = this.getFileFromLine(line);
                    return commandhelper_1.CommandHelper.GetFilePath(path, file);
                }
            }
            return "";
        });
    }
    GetExeArguments() {
        return new argumentbuilder_1.ArgumentBuilder("rename", this._serverContext, true /* skipCollectionOption */)
            .Add(this._sourcePath)
            .Add(this._destinationPath);
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
exports.Rename = Rename;

//# sourceMappingURL=rename.js.map
