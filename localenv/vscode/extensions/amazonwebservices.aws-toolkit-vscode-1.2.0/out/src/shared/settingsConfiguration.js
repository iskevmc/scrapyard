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
// default configuration settings handler for production release
class DefaultSettingsConfiguration {
    constructor(extensionSettingsPrefix) {
        this.extensionSettingsPrefix = extensionSettingsPrefix;
    }
    readSetting(settingKey, defaultValue) {
        // tslint:disable-next-line:no-null-keyword
        const settings = vscode.workspace.getConfiguration(this.extensionSettingsPrefix, null);
        if (settings) {
            const val = settings.get(settingKey);
            if (val) {
                return val;
            }
        }
        return defaultValue || undefined;
    }
    writeSetting(settingKey, value, target) {
        return __awaiter(this, void 0, void 0, function* () {
            // tslint:disable-next-line:no-null-keyword
            const settings = vscode.workspace.getConfiguration(this.extensionSettingsPrefix, null);
            yield settings.update(settingKey, value, target);
        });
    }
}
exports.DefaultSettingsConfiguration = DefaultSettingsConfiguration;
//# sourceMappingURL=settingsConfiguration.js.map