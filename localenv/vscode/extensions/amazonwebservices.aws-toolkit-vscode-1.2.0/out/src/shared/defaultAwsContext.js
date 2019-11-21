"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const awsContext_1 = require("./awsContext");
const constants_1 = require("./constants");
const credentialsProfileMru_1 = require("./credentials/credentialsProfileMru");
const credentialsManager_1 = require("./credentialsManager");
const localize = nls.loadMessageBundle();
// Wraps an AWS context in terms of credential profile and zero or more regions. The
// context listens for configuration updates and resets the context accordingly.
class DefaultAwsContext {
    constructor(settingsConfiguration, context, credentialsManager = new credentialsManager_1.CredentialsManager()) {
        this.settingsConfiguration = settingsConfiguration;
        this.context = context;
        this.credentialsManager = credentialsManager;
        this._onDidChangeContext = new vscode.EventEmitter();
        this.onDidChangeContext = this._onDidChangeContext.event;
        this.profileName = settingsConfiguration.readSetting(constants_1.profileSettingKey, '');
        const persistedRegions = context.globalState.get(constants_1.regionSettingKey);
        this.explorerRegions = persistedRegions || [];
        this.credentialsMru = new credentialsProfileMru_1.CredentialsProfileMru(context);
    }
    /**
     * @description Gets the Credentials for the current specified profile.
     * If a profile name is provided, overrides existing profile.
     * If no profile is attached to the context and no profile was specified, returns undefined.
     * If an error is encountered, or the profile cannot be found, an Error is thrown.
     *
     * @param profileName (optional): override profile name to pull credentials for (useful for validation)
     */
    getCredentials(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = profileName || this.profileName;
            if (!profile) {
                return undefined;
            }
            try {
                return yield this.credentialsManager.getCredentials(profile);
            }
            catch (err) {
                const error = err;
                vscode.window.showErrorMessage(localize('AWS.message.credentials.error', 'There was an issue trying to use credentials profile {0}: {1}', profile, error.message));
                throw error;
            }
        });
    }
    // returns the configured profile, if any
    getCredentialProfileName() {
        return this.profileName;
    }
    // resets the context to the indicated profile, saving it into settings
    setCredentialProfileName(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.profileName = profileName;
            yield this.settingsConfiguration.writeSetting(constants_1.profileSettingKey, profileName, vscode.ConfigurationTarget.Global);
            if (this.profileName) {
                yield this.credentialsMru.setMostRecentlyUsedProfile(this.profileName);
            }
            this.emitEvent();
        });
    }
    // returns the configured profile's account ID, if any
    getCredentialAccountId() {
        return this.accountId;
    }
    // resets the context to the indicated profile, saving it into settings
    setCredentialAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.accountId = accountId;
            // nothing using this even at this time...is this necessary?
            this.emitEvent();
        });
    }
    // async so that we could *potentially* support other ways of obtaining
    // region in future - for example from instance metadata if the
    // user was running Code on an EC2 instance.
    getExplorerRegions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.explorerRegions;
        });
    }
    // adds one or more regions into the preferred set, persisting the set afterwards as a
    // comma-separated string.
    addExplorerRegion(...regions) {
        return __awaiter(this, void 0, void 0, function* () {
            regions.forEach(r => {
                const index = this.explorerRegions.findIndex(regionToProcess => regionToProcess === r);
                if (index === -1) {
                    this.explorerRegions.push(r);
                }
            });
            yield this.context.globalState.update(constants_1.regionSettingKey, this.explorerRegions);
            this.emitEvent();
        });
    }
    // removes one or more regions from the user's preferred set, persisting the set afterwards as a
    // comma-separated string.
    removeExplorerRegion(...regions) {
        return __awaiter(this, void 0, void 0, function* () {
            regions.forEach(r => {
                const index = this.explorerRegions.findIndex(explorerRegion => explorerRegion === r);
                if (index >= 0) {
                    this.explorerRegions.splice(index, 1);
                }
            });
            yield this.context.globalState.update(constants_1.regionSettingKey, this.explorerRegions);
            this.emitEvent();
        });
    }
    emitEvent() {
        this._onDidChangeContext.fire(new awsContext_1.ContextChangeEventsArgs(this.profileName, this.accountId, this.explorerRegions));
    }
}
exports.DefaultAwsContext = DefaultAwsContext;
//# sourceMappingURL=defaultAwsContext.js.map