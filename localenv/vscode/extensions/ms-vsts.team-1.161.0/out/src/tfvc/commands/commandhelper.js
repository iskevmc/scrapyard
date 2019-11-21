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
const path = require("path");
const xml2js_1 = require("xml2js");
const constants_1 = require("../../helpers/constants");
const logger_1 = require("../../helpers/logger");
const strings_1 = require("../../helpers/strings");
const utils_1 = require("../../helpers/utils");
const tfvcerror_1 = require("../tfvcerror");
class CommandHelper {
    static RequireArgument(argument, argumentName) {
        if (!argument) {
            throw tfvcerror_1.TfvcError.CreateArgumentMissingError(argumentName);
        }
    }
    static RequireStringArgument(argument, argumentName) {
        if (!argument || argument.trim().length === 0) {
            throw tfvcerror_1.TfvcError.CreateArgumentMissingError(argumentName);
        }
    }
    static RequireStringArrayArgument(argument, argumentName) {
        if (!argument || argument.length === 0) {
            throw tfvcerror_1.TfvcError.CreateArgumentMissingError(argumentName);
        }
    }
    static HasError(result, errorPattern) {
        if (result && result.stderr && errorPattern) {
            return new RegExp(errorPattern, "i").test(result.stderr);
        }
        return false;
    }
    static ProcessErrors(result) {
        if (result.exitCode) {
            let tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.UnknownError;
            let message;
            let messageOptions = [];
            if (/Authentication failed/.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.AuthenticationFailed;
            }
            else if (/workspace could not be determined/i.test(result.stderr) ||
                /The workspace could not be determined from any argument paths or the current working directory/i.test(result.stderr) ||
                /Unable to determine the source control server/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.NotATfvcRepository;
                message = strings_1.Strings.NoWorkspaceMappings;
            }
            else if (/Repository not found/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.RepositoryNotFound;
            }
            else if (/project collection URL to use could not be determined/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.NotATfvcRepository;
                message = strings_1.Strings.NotATfvcRepository;
            }
            else if (/Access denied connecting.*authenticating as OAuth/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.AuthenticationFailed;
                message = strings_1.Strings.TokenNotAllScopes;
            }
            else if (/'java' is not recognized as an internal or external command/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.NotFound;
                message = strings_1.Strings.TfInitializeFailureError;
            }
            else if (/Error occurred during initialization of VM/i.test(result.stdout)) {
                //Example: "Error occurred during initialization of VM\nCould not reserve enough space for 2097152KB object heap\n"
                //This one occurs with the error message in stdout!
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.NotFound;
                message = `${strings_1.Strings.TfInitializeFailureError} (${utils_1.Utils.FormatMessage(result.stdout)})`;
            }
            else if (/There is no working folder mapping/i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.FileNotInMappings;
            }
            else if (/could not be found in your workspace, or you do not have permission to access it./i.test(result.stderr)) {
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.FileNotInWorkspace;
            }
            else if (/TF30063: You are not authorized to access/i.test(result.stderr)) {
                //For now, we're assuming this is an indication of a Server workspace
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.NotAuthorizedToAccess;
                message = strings_1.Strings.TfServerWorkspace;
                messageOptions = [{ title: strings_1.Strings.LearnMore,
                        url: constants_1.Constants.ServerWorkspaceUrl }];
            }
            else if (/TF400017: The local properties table for the local workspace/i.test(result.stderr)) {
                //For now, we're assuming this is an indication of a workspace the CLC doesn't know about (but exists locally)
                tfvcErrorCode = tfvcerror_1.TfvcErrorCodes.WorkspaceNotKnownToClc;
                message = strings_1.Strings.ClcCannotAccessWorkspace;
                messageOptions = [{ title: strings_1.Strings.MoreDetails,
                        url: constants_1.Constants.WorkspaceNotDetectedByClcUrl,
                        telemetryId: constants_1.TfvcTelemetryEvents.ClcCannotAccessWorkspace }];
            }
            //Log any information we receive via either stderr or stdout
            if (result.stderr) {
                logger_1.Logger.LogDebug(`TFVC errors (via stderr): ${result.stderr}`);
            }
            if (result.stdout) {
                logger_1.Logger.LogDebug(`TFVC errors (via stdout): ${result.stdout}`);
            }
            throw new tfvcerror_1.TfvcError({
                message: message || strings_1.Strings.TfExecFailedError,
                messageOptions: messageOptions,
                exitCode: result.exitCode,
                tfvcErrorCode: tfvcErrorCode
            });
        }
    }
    /**
     * This method is used by Checkin to parse out the changeset number.
     */
    static GetChangesetNumber(stdout) {
        // parse output for changeset number
        if (stdout) {
            const prefix = "Changeset #";
            const start = stdout.indexOf(prefix) + prefix.length;
            if (start >= 0) {
                const end = stdout.indexOf(" ", start);
                if (end > start) {
                    return stdout.slice(start, end);
                }
            }
        }
        return "";
    }
    static GetNewLineCharacter(stdout) {
        if (stdout && /\r\n/.test(stdout)) {
            return "\r\n";
        }
        return "\n";
    }
    static SplitIntoLines(stdout, skipWarnings, filterEmptyLines) {
        if (!stdout) {
            return [];
        }
        let lines = stdout.replace(/\r\n/g, "\n").split("\n");
        skipWarnings = skipWarnings === undefined ? true : skipWarnings;
        // Ignore WARNings that may be above the desired lines
        if (skipWarnings) {
            let index = 0;
            while (index < lines.length && lines[index].startsWith("WARN")) {
                index++;
            }
            lines = lines.splice(index);
        }
        if (filterEmptyLines) {
            lines = lines.filter((e) => e.trim() !== "");
        }
        return lines;
    }
    static ParseXml(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!xml) {
                return;
            }
            return new Promise((resolve, reject) => {
                xml2js_1.parseString(xml, {
                    tagNameProcessors: [CommandHelper.normalizeName],
                    attrNameProcessors: [CommandHelper.normalizeName]
                }, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        });
    }
    static TrimToXml(xml) {
        if (xml) {
            const start = xml.indexOf("<?xml");
            const end = xml.lastIndexOf(">");
            if (start >= 0 && end > start) {
                return xml.slice(start, end + 1);
            }
        }
        return xml;
    }
    static normalizeName(name) {
        if (name) {
            return name.replace(/\-/g, "").toLowerCase();
        }
        return name;
    }
    /**
     * Returns true if the line is of the form...
     * 'folder1:' or 'folder1\folder2:' or 'd:\folder1\folder2:'
     */
    static IsFilePath(line) {
        if (line && line.length > 0 && line.endsWith(":", line.length)) {
            return true;
        }
        return false;
    }
    /**
     * Returns the full path of the file where...
     * filePath could be 'folder1\folder2:'
     * filename is something like 'file.txt'
     * pathRoot is the root of any relative paths
     */
    static GetFilePath(filePath, filename, pathRoot) {
        let folderPath = filePath;
        //Remove any ending ':'
        if (filePath && filePath.length > 0 && filePath.endsWith(":", filePath.length)) {
            folderPath = filePath.slice(0, filePath.length - 1);
        }
        //If path isn't rooted, add in the root
        if (folderPath && !path.isAbsolute(folderPath) && pathRoot) {
            folderPath = path.join(pathRoot, folderPath);
        }
        else if (!folderPath && pathRoot) {
            folderPath = pathRoot;
        }
        if (folderPath && filename) {
            return path.join(folderPath, filename);
        }
        else if (filename) {
            return filename;
        }
        else {
            return folderPath;
        }
    }
}
exports.CommandHelper = CommandHelper;

//# sourceMappingURL=commandhelper.js.map
