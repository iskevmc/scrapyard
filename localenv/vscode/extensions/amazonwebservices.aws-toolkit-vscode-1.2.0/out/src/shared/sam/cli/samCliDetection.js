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
const AsyncLock = require("async-lock");
const vscode = require("vscode");
const nls = require("vscode-nls");
const constants_1 = require("../../constants");
const settingsConfiguration_1 = require("../../settingsConfiguration");
const samCliConfiguration_1 = require("./samCliConfiguration");
const samCliLocator_1 = require("./samCliLocator");
const localize = nls.loadMessageBundle();
const lock = new AsyncLock();
const learnMore = localize('AWS.samcli.userChoice.visit.install.url', 'Get SAM CLI');
const browseToSamCli = localize('AWS.samcli.userChoice.browse', 'Locate SAM CLI...');
const settingsUpdated = localize('AWS.samcli.detect.settings.updated', 'Settings updated.');
const settingsNotUpdated = localize('AWS.samcli.detect.settings.not.updated', 'No settings changes necessary.');
function detectSamCli(showMessageIfDetected) {
    return __awaiter(this, void 0, void 0, function* () {
        yield lock.acquire('detect SAM CLI', () => __awaiter(this, void 0, void 0, function* () {
            const samCliConfig = new samCliConfiguration_1.DefaultSamCliConfiguration(new settingsConfiguration_1.DefaultSettingsConfiguration(constants_1.extensionSettingsPrefix), new samCliLocator_1.DefaultSamCliLocationProvider());
            const initialSamCliLocation = samCliConfig.getSamCliLocation();
            yield samCliConfig.initialize();
            const currentsamCliLocation = samCliConfig.getSamCliLocation();
            if (showMessageIfDetected) {
                if (!currentsamCliLocation) {
                    notifyUserSamCliNotDetected(samCliConfig);
                }
                else {
                    const message = initialSamCliLocation === currentsamCliLocation
                        ? getSettingsNotUpdatedMessage(initialSamCliLocation)
                        : getSettingsUpdatedMessage(currentsamCliLocation);
                    vscode.window.showInformationMessage(message);
                }
            }
        }));
    });
}
exports.detectSamCli = detectSamCli;
function notifyUserSamCliNotDetected(samCliConfig) {
    // inform the user, but don't wait for this to complete
    vscode.window
        .showErrorMessage(localize('AWS.samcli.error.notFound', 
    // tslint:disable-next-line:max-line-length
    'Unable to find the SAM CLI, which is required to create new Serverless Applications and debug them locally. If you have already installed the SAM CLI, update your User Settings by locating it.'), learnMore, browseToSamCli)
        .then((userResponse) => __awaiter(this, void 0, void 0, function* () {
        if (userResponse === learnMore) {
            yield vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(constants_1.samAboutInstallUrl));
        }
        else if (userResponse === browseToSamCli) {
            const location = yield vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                openLabel: 'Apply location to Settings'
            });
            if (!!location && location.length === 1) {
                const path = location[0].fsPath;
                yield samCliConfig.setSamCliLocation(path);
                vscode.window.showInformationMessage(getSettingsUpdatedMessage(path));
            }
        }
    }));
}
function getSettingsUpdatedMessage(location) {
    const configuredLocation = localize('AWS.samcli.configured.location', 'Configured SAM CLI Location: {0}', location);
    return `${settingsUpdated} ${configuredLocation}`;
}
function getSettingsNotUpdatedMessage(location) {
    const configuredLocation = localize('AWS.samcli.configured.location', 'Configured SAM CLI Location: {0}', location);
    return `${settingsNotUpdated} ${configuredLocation}`;
}
//# sourceMappingURL=samCliDetection.js.map