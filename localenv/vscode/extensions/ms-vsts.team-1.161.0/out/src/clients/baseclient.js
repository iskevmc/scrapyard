/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../helpers/logger");
const telemetry_1 = require("../services/telemetry");
const constants_1 = require("../helpers/constants");
const strings_1 = require("../helpers/strings");
const utils_1 = require("../helpers/utils");
const vscodeutils_1 = require("../helpers/vscodeutils");
class BaseClient {
    constructor(context, statusBarItem) {
        this._serverContext = context;
        this._statusBarItem = statusBarItem;
    }
    handleError(err, offlineText, polling, infoMessage) {
        const offline = utils_1.Utils.IsOffline(err);
        const msg = utils_1.Utils.GetMessageForStatusCode(err, err.message);
        const logPrefix = (infoMessage === undefined) ? "" : infoMessage + " ";
        //When polling, we never display an error, we only log it (no telemetry either)
        if (polling === true) {
            logger_1.Logger.LogError(logPrefix + msg);
            if (offline === true) {
                if (this._statusBarItem !== undefined) {
                    this._statusBarItem.text = offlineText;
                    this._statusBarItem.tooltip = strings_1.Strings.StatusCodeOffline + " " + strings_1.Strings.ClickToRetryConnection;
                    this._statusBarItem.command = constants_1.CommandNames.RefreshPollingStatus;
                }
            }
            else {
                //Could happen if PAT doesn't have proper permissions
                if (this._statusBarItem !== undefined) {
                    this._statusBarItem.text = offlineText;
                    this._statusBarItem.tooltip = msg;
                }
            }
            //If we aren't polling, we always log an error and, optionally, send telemetry
        }
        else {
            const logMessage = logPrefix + msg;
            if (offline === true) {
                logger_1.Logger.LogError(logMessage);
            }
            else {
                logger_1.Logger.LogError(logMessage);
                telemetry_1.Telemetry.SendException(err);
            }
            vscodeutils_1.VsCodeUtils.ShowErrorMessage(msg);
        }
    }
}
exports.BaseClient = BaseClient;

//# sourceMappingURL=baseclient.js.map
