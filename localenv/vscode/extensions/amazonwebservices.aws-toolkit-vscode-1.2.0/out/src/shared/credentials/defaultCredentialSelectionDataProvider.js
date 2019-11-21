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
// Implements a multi-step capable selector for traditional AWS credential profiles
// (access key/secret key based) for with the ability for users to add new credential
// profiles. As other sign-in mechanisms become available in the future, we should be
// able to extend this selector to handle them quite easily. The handler currently
// returns the name of the selected or created credential profile.
//
// Based on the multiStepInput code in the QuickInput VSCode extension sample.
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const multiStepInputFlowController_1 = require("../multiStepInputFlowController");
const credentialsProfileMru_1 = require("./credentialsProfileMru");
class DefaultCredentialSelectionDataProvider {
    constructor(existingProfileNames, context) {
        this.existingProfileNames = existingProfileNames;
        this.context = context;
        this._credentialsMru = new credentialsProfileMru_1.CredentialsProfileMru(context);
    }
    pickCredentialProfile(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield input.showQuickPick({
                title: localize('AWS.title.selectCredentialProfile', 'Select an AWS credential profile'),
                step: 1,
                totalSteps: 1,
                placeholder: localize('AWS.placeHolder.selectProfile', 'Select a credential profile'),
                items: this.getProfileSelectionList(),
                activeItem: state.credentialProfile,
                shouldResume: this.shouldResume.bind(this)
            });
        });
    }
    inputProfileName(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield input.showInputBox({
                title: localize('AWS.title.createCredentialProfile', 'Create a new AWS credential profile'),
                step: 1,
                totalSteps: 3,
                value: '',
                prompt: localize('AWS.placeHolder.newProfileName', 'Choose a unique name for the new profile'),
                validate: this.validateNameIsUnique.bind(this),
                shouldResume: this.shouldResume.bind(this)
            });
        });
    }
    inputAccessKey(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield input.showInputBox({
                title: localize('AWS.title.createCredentialProfile', 'Create a new AWS credential profile'),
                step: 2,
                totalSteps: 3,
                value: '',
                prompt: localize('AWS.placeHolder.inputAccessKey', 'Input the AWS Access Key'),
                validate: this.validateAccessKey.bind(this),
                ignoreFocusOut: true,
                shouldResume: this.shouldResume.bind(this)
            });
        });
    }
    inputSecretKey(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield input.showInputBox({
                title: localize('AWS.title.createCredentialProfile', 'Create a new AWS credential profile'),
                step: 3,
                totalSteps: 3,
                value: '',
                prompt: localize('AWS.placeHolder.inputSecretKey', 'Input the AWS Secret Key'),
                validate: this.validateSecretKey.bind(this),
                ignoreFocusOut: true,
                shouldResume: this.shouldResume.bind(this)
            });
        });
    }
    validateNameIsUnique(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const duplicate = this.existingProfileNames.find(k => k === name);
            return duplicate ? 'Name not unique' : undefined;
        });
    }
    validateAccessKey(accessKey) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: is there a regex pattern we could use?
            return undefined;
        });
    }
    validateSecretKey(accessKey) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: don't believe there is a regex but at this point we could try a 'safe' call
            return undefined;
        });
    }
    shouldResume() {
        return __awaiter(this, void 0, void 0, function* () {
            // Could show a notification with the option to resume.
            return false;
        });
    }
    /**
     * Builds and returns the list of QuickPickItem objects representing the profile names to select from in the UI
     */
    getProfileSelectionList() {
        const orderedProfiles = this.getOrderedProfiles();
        const selectionList = [];
        orderedProfiles.forEach(profile => {
            const selectionItem = { label: profile.profileName };
            if (profile.isRecentlyUsed) {
                selectionItem.description = localize('AWS.profile.recentlyUsed', 'recently used');
            }
            selectionList.push(selectionItem);
        });
        return selectionList;
    }
    /**
     * Returns a list of profiles, and whether or not they have been
     * used recently. Ordered by: MRU, default, all others
     */
    getOrderedProfiles() {
        const mostRecentProfileNames = this.getMostRecentlyUsedProfileNames();
        const orderedProfiles = [];
        const orderedNames = new Set();
        // Add MRU entries first
        mostRecentProfileNames.forEach(profileName => {
            orderedProfiles.push({ profileName: profileName, isRecentlyUsed: true });
            orderedNames.add(profileName);
        });
        // Add default if it hasn't been, and is an existing profile name
        const defaultProfileName = DefaultCredentialSelectionDataProvider.defaultCredentialsProfileName;
        if (!orderedNames.has(defaultProfileName) && this.existingProfileNames.indexOf(defaultProfileName) !== -1) {
            orderedProfiles.push({ profileName: defaultProfileName, isRecentlyUsed: false });
            orderedNames.add(DefaultCredentialSelectionDataProvider.defaultCredentialsProfileName);
        }
        // Add remaining items, sorted alphanumerically
        const remainingProfiles = this.existingProfileNames
            .filter(x => !orderedNames.has(x))
            .sort()
            .map(profileName => ({ profileName: profileName, isRecentlyUsed: false }));
        orderedProfiles.push(...remainingProfiles);
        return orderedProfiles;
    }
    /**
     * Returns a list of the profile names that are currently in the MRU list
     */
    getMostRecentlyUsedProfileNames() {
        const mru = this._credentialsMru.getMruList();
        return mru.filter(x => this.existingProfileNames.indexOf(x) !== -1);
    }
}
DefaultCredentialSelectionDataProvider.defaultCredentialsProfileName = 'default';
exports.DefaultCredentialSelectionDataProvider = DefaultCredentialSelectionDataProvider;
function credentialProfileSelector(dataProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        function pickCredentialProfile(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.credentialProfile = yield dataProvider.pickCredentialProfile(input, state);
            });
        }
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield multiStepInputFlowController_1.MultiStepInputFlowController.run((input) => __awaiter(this, void 0, void 0, function* () { return yield pickCredentialProfile(input, state); }));
                return state;
            });
        }
        return yield collectInputs();
    });
}
exports.credentialProfileSelector = credentialProfileSelector;
function promptToDefineCredentialsProfile(dataProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        function inputProfileName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.profileName = yield dataProvider.inputProfileName(input, state);
                /* tslint:disable promise-function-async */
                return (inputController) => inputAccessKey(inputController, state);
                /* tslint:enable promise-function-async */
            });
        }
        function inputAccessKey(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.accesskey = yield dataProvider.inputAccessKey(input, state);
                /* tslint:disable promise-function-async */
                return (inputController) => inputSecretKey(inputController, state);
                /* tslint:enable promise-function-async */
            });
        }
        function inputSecretKey(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.secretKey = yield dataProvider.inputSecretKey(input, state);
            });
        }
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                /* tslint:disable promise-function-async */
                yield multiStepInputFlowController_1.MultiStepInputFlowController.run(input => inputProfileName(input, state));
                /* tslint:enable promise-function-async */
                return state;
            });
        }
        return yield collectInputs();
    });
}
exports.promptToDefineCredentialsProfile = promptToDefineCredentialsProfile;
//# sourceMappingURL=defaultCredentialSelectionDataProvider.js.map