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
const tfvcerror_1 = require("../tfvcerror");
const strings_1 = require("../../helpers/strings");
const constants_1 = require("../../helpers/constants");
/**
 * This command calls the command line doing a simple call to get the help for the add command.
 * The first line of all commands is the version info...
 * Team Explorer Everywhere Command Line Client (version 14.0.3.201603291047)
 */
class GetVersion {
    GetArguments() {
        return new argumentbuilder_1.ArgumentBuilder("add")
            .AddSwitch("?");
    }
    GetOptions() {
        return {};
    }
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            //Ex. Team Explorer Everywhere Command Line Client (Version 14.0.3.201603291047)
            return yield this.getVersion(executionResult, /version\s+([\.\d]+)/i);
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
            //Ex. Microsoft (R) TF - Team Foundation Version Control Tool, Version 14.102.25619.0
            return yield this.getVersion(executionResult, /version\s+([\.\d]+)/i);
        });
    }
    getVersion(executionResult, expression) {
        return __awaiter(this, void 0, void 0, function* () {
            // Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            //Find just the version number and return it. Ex. Microsoft (R) TF - Team Foundation Version Control Tool, Version 14.102.25619.0
            //Spanish tf.exe example: "Microsoft (R) TF - Herramienta Control de versiones de Team Foundation, versi�n 14.102.25619.0"
            //value = "Microsoft (R) TF - Herramienta Control de versiones de Team Foundation, versi�n 14.102.25619.0"
            //French  tf.exe example: "Microsoft (R) TF�- Outil Team Foundation Version Control, version�14.102.25619.0"
            //value = ""
            //German  tf.exe example: "Microsoft (R) TF - Team Foundation-Versionskontrolltool, Version 14.102.25619.0"
            //value = "14.102.25619.0"
            const matches = executionResult.stdout.match(expression);
            if (matches) {
                //Sample tf.exe matches:
                // Version 15.112.2641.0
                // 15.112.2641.0
                //Sample tf.cmd matches:
                // Version 14.114.0.201703081734
                // 14.114.0.201703081734
                return matches[matches.length - 1];
            }
            else {
                //If we can't find a version, that's pretty important. Therefore, we throw in this instance.
                const messageOptions = [{ title: strings_1.Strings.MoreDetails,
                        url: constants_1.Constants.NonEnuTfExeConfiguredUrl,
                        telemetryId: constants_1.TfvcTelemetryEvents.ExeNonEnuConfiguredMoreDetails }];
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.NotAnEnuTfCommandLine,
                    messageOptions: messageOptions,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NotAnEnuTfCommandLine
                });
            }
        });
    }
}
exports.GetVersion = GetVersion;

//# sourceMappingURL=getversion.js.map
