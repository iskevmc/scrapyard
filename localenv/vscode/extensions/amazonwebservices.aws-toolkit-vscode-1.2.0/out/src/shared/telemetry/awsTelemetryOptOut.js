"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nls = require("vscode-nls");
const extensionGlobals_1 = require("../extensionGlobals");
const localize = nls.loadMessageBundle();
var TelemetryOptOutOptions;
(function (TelemetryOptOutOptions) {
    TelemetryOptOutOptions[TelemetryOptOutOptions["Enable"] = 0] = "Enable";
    TelemetryOptOutOptions[TelemetryOptOutOptions["Disable"] = 1] = "Disable";
    TelemetryOptOutOptions[TelemetryOptOutOptions["SameAsVsCode"] = 2] = "SameAsVsCode";
})(TelemetryOptOutOptions = exports.TelemetryOptOutOptions || (exports.TelemetryOptOutOptions = {}));
class AwsTelemetryOptOut {
    constructor(service, settings, getVSCodeTelemetrySetting = () => !!vscode.workspace.getConfiguration('telemetry').get('enableTelemetry')) {
        this.service = service;
        this.settings = settings;
        this.getVSCodeTelemetrySetting = getVSCodeTelemetrySetting;
        this.responseYes = localize('AWS.telemetry.notificationYes', 'Enable');
        this.responseNo = localize('AWS.telemetry.notificationNo', 'Disable');
        vscode.workspace.onDidChangeConfiguration((event) => __awaiter(this, void 0, void 0, function* () {
            // if telemetry.enableTelemetry changed and user has not expressed a preference
            if (event.affectsConfiguration('telemetry.enableTelemetry') &&
                this.settings.readSetting(AwsTelemetryOptOut.AWS_TELEMETRY_KEY) === undefined) {
                yield this.updateTelemetryConfiguration(TelemetryOptOutOptions.SameAsVsCode);
            }
        }));
    }
    updateTelemetryConfiguration(response) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (response) {
                case TelemetryOptOutOptions.Enable:
                    yield this.settings.writeSetting(AwsTelemetryOptOut.AWS_TELEMETRY_KEY, true, vscode.ConfigurationTarget.Global);
                    this.service.telemetryEnabled = true;
                    break;
                case TelemetryOptOutOptions.Disable:
                    yield this.settings.writeSetting(AwsTelemetryOptOut.AWS_TELEMETRY_KEY, false, vscode.ConfigurationTarget.Global);
                    this.service.telemetryEnabled = false;
                    break;
                case TelemetryOptOutOptions.SameAsVsCode:
                    yield this.settings.writeSetting(AwsTelemetryOptOut.AWS_TELEMETRY_KEY, undefined, vscode.ConfigurationTarget.Global);
                    const vsCodeTelemetryEnabled = this.getVSCodeTelemetrySetting();
                    this.service.telemetryEnabled = vsCodeTelemetryEnabled;
                    break;
            }
        });
    }
    /**
     * Caution: you probably do not want to await this method
     *
     * This method awaits a showInfo call, which blocks until the user selects an option
     * or explicitly cancels the dialog. 'Esc' on the dialog will continue to block, waiting for a response
     * Ensure that you handle this suitably.
     */
    ensureUserNotified() {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            if (!extensionGlobals_1.ext.context.globalState.get(AwsTelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN)) {
                response = yield this.showNotification();
                yield extensionGlobals_1.ext.context.globalState.update(AwsTelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN, true);
            }
            else {
                response = this.settings.readSetting(AwsTelemetryOptOut.AWS_TELEMETRY_KEY);
            }
            const enumValue = this.responseToOptionEnumValue(response);
            yield this.updateTelemetryConfiguration(enumValue);
            this.service.notifyOptOutOptionMade();
        });
    }
    showNotification() {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationMessage = localize('AWS.telemetry.notificationMessage', 'Please help improve the AWS Toolkit by enabling it to send usage data to AWS. ' +
                'You can always change your mind later by going to the "AWS Configuration" section in your user settings.');
            return vscode.window.showInformationMessage(notificationMessage, this.responseYes, this.responseNo);
        });
    }
    responseToOptionEnumValue(response) {
        switch (response) {
            case this.responseYes:
                return TelemetryOptOutOptions.Enable;
            case this.responseNo:
                return TelemetryOptOutOptions.Disable;
            default:
                return TelemetryOptOutOptions.SameAsVsCode;
        }
    }
}
AwsTelemetryOptOut.AWS_TELEMETRY_KEY = 'telemetry';
AwsTelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN = 'awsTelemetryOptOutShown';
exports.AwsTelemetryOptOut = AwsTelemetryOptOut;
//# sourceMappingURL=awsTelemetryOptOut.js.map