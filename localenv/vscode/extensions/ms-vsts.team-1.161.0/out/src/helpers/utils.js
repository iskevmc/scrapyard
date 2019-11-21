/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildInterfaces_1 = require("vso-node-api/interfaces/BuildInterfaces");
const strings_1 = require("./strings");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const open = require("open");
const opener = require("opener");
class Utils {
    static FormatMessage(message) {
        if (message) {
            //Replace newlines with spaces
            return message.replace(/\r\n/g, " ").replace(/\n/g, " ").trim();
        }
        return message;
    }
    //gitDir provided for unit testing purposes
    static FindGitFolder(startingPath, gitDir) {
        if (!fs.existsSync(startingPath)) {
            return undefined;
        }
        let gitPath;
        let lastPath;
        let currentPath = startingPath;
        do {
            gitPath = path.join(currentPath, gitDir || ".git");
            if (fs.existsSync(gitPath)) {
                return gitPath;
            }
            lastPath = currentPath;
            currentPath = path.resolve(currentPath, "..");
        } while (lastPath !== currentPath);
        return undefined;
    }
    //Returns the icon string to use for a particular BuildResult
    static GetBuildResultIcon(result) {
        switch (result) {
            case BuildInterfaces_1.BuildResult.Succeeded:
                return "check";
            case BuildInterfaces_1.BuildResult.Canceled:
                return "alert";
            case BuildInterfaces_1.BuildResult.Failed:
                return "stop";
            case BuildInterfaces_1.BuildResult.PartiallySucceeded:
                return "alert";
            case BuildInterfaces_1.BuildResult.None:
                return "question";
            default:
                return "question";
        }
    }
    //Returns a particular message for a particular reason.  Otherwise, returns the optional prefix + message
    static GetMessageForStatusCode(reason, message, prefix) {
        let msg = undefined;
        if (prefix === undefined) {
            msg = "";
        }
        else {
            msg = prefix + " ";
        }
        let statusCode = "0";
        if (reason.statusCode !== undefined) {
            statusCode = reason.statusCode.toString();
        }
        else if (reason.code !== undefined) {
            statusCode = reason.code;
        }
        switch (statusCode) {
            case "401":
                msg = msg + strings_1.Strings.StatusCode401;
                break;
            case "ENOENT":
            case "ENOTFOUND":
            case "EAI_AGAIN":
                msg = msg + strings_1.Strings.StatusCodeOffline;
                break;
            case "ECONNRESET":
            case "ECONNREFUSED":
                if (this.IsProxyEnabled()) {
                    msg = msg + strings_1.Strings.ProxyUnreachable;
                    break;
                }
                return message;
            default:
                return message;
        }
        return msg;
    }
    //Use some common error codes to indicate offline status
    static IsProxyEnabled() {
        if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
            return true;
        }
        return false;
    }
    static IsProxyIssue(reason) {
        // If the proxy isn't enabled/set, it can't be a proxy issue
        if (!this.IsProxyEnabled()) {
            return false;
        }
        // If proxy is set, check for error codes
        if (reason !== undefined) {
            if (reason.code === "ECONNRESET" || reason.code === "ECONNREFUSED") {
                return true;
            }
            if (reason.statusCode === "ECONNRESET" || reason.statusCode === "ECONNREFUSED") {
                return true;
            }
        }
        return false;
    }
    //Use some common error codes to indicate offline status
    static IsOffline(reason) {
        if (reason !== undefined) {
            if (reason.code === "ENOENT" || reason.code === "ENOTFOUND" || reason.code === "EAI_AGAIN") {
                return true;
            }
            if (reason.statusCode === "ENOENT" || reason.statusCode === "ENOTFOUND" || reason.statusCode === "EAI_AGAIN") {
                return true;
            }
        }
        return false;
    }
    //Use some common error codes to indicate unauthorized status
    static IsUnauthorized(reason) {
        if (reason !== undefined) {
            if (reason.code === 401 || reason.statusCode === 401) {
                return true;
            }
        }
        return false;
    }
    //Use open for Windows and Mac, opener for Linux
    static OpenUrl(url) {
        // Use the built in VS Code openExternal function if present.
        if (vscode.env.openExternal) {
            vscode.env.openExternal(vscode.Uri.parse(url));
            return;
        }
        // Fallback to other node modules for old versions of VS Code
        switch (process.platform) {
            case "win32":
            case "darwin":
                open(url);
                break;
            default:
                opener(url);
                break;
        }
    }
}
exports.Utils = Utils;

//# sourceMappingURL=utils.js.map
