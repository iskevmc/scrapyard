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
const filesystemUtilities = require("../../filesystemUtilities");
class DefaultSamCliConfiguration {
    constructor(configuration, samCliLocationProvider) {
        this._configuration = configuration;
        this._samCliLocationProvider = samCliLocationProvider;
    }
    getSamCliLocation() {
        return this._configuration.readSetting(DefaultSamCliConfiguration.CONFIGURATION_KEY_SAMCLI_LOCATION);
    }
    setSamCliLocation(location) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._configuration.writeSetting(DefaultSamCliConfiguration.CONFIGURATION_KEY_SAMCLI_LOCATION, location, vscode.ConfigurationTarget.Global);
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const configLocation = this.getSamCliLocation();
            if (!!configLocation) {
                if (yield filesystemUtilities.fileExists(configLocation)) {
                    return;
                }
            }
            const detectedLocation = yield this._samCliLocationProvider.getLocation();
            yield this.setSamCliLocation(detectedLocation);
        });
    }
}
DefaultSamCliConfiguration.CONFIGURATION_KEY_SAMCLI_LOCATION = 'samcli.location';
exports.DefaultSamCliConfiguration = DefaultSamCliConfiguration;
//# sourceMappingURL=samCliConfiguration.js.map