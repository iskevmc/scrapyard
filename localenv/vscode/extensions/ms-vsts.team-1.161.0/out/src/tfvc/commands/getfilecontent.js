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
 * This command calls Print to get the contents of the file at the version provided and returns them as a string
 * file.
 * <p/>
 * This command actually wraps the print command:
 * print [/version:<value>] <itemSpec>
 */
class GetFileContent {
    constructor(serverContext, localPath, versionSpec, ignoreFileNotFound) {
        commandhelper_1.CommandHelper.RequireStringArgument(localPath, "localPath");
        this._serverContext = serverContext;
        this._localPath = localPath;
        this._versionSpec = versionSpec;
        this._ignoreFileNotFound = ignoreFileNotFound;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("print", this._serverContext)
            .Add(this._localPath);
        if (this._versionSpec) {
            builder.AddSwitchWithValue("version", this._versionSpec, false);
        }
        return builder;
    }
    GetOptions() {
        return {};
    }
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check for "The specified file does not exist at the specified version" (or "No file matches" in case of the EXE)
            // and write out empty string
            if (this._ignoreFileNotFound &&
                (commandhelper_1.CommandHelper.HasError(executionResult, "The specified file does not exist at the specified version") ||
                    commandhelper_1.CommandHelper.HasError(executionResult, "No file matches"))) {
                // The file doesn't exist, but the ignore flag is set, so we will simply return an emtpy string
                return "";
            }
            // Throw if any OTHER errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            // Split the lines to take advantage of the WARNing skip logic and rejoin them to return
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout);
            return lines.join(commandhelper_1.CommandHelper.GetNewLineCharacter(executionResult.stdout));
        });
    }
    GetExeArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("view", this._serverContext)
            .Add(this._localPath);
        if (this._versionSpec) {
            builder.AddSwitchWithValue("version", this._versionSpec, false);
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
}
exports.GetFileContent = GetFileContent;

//# sourceMappingURL=getfilecontent.js.map
