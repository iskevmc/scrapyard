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
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const aws_sdk_1 = require("aws-sdk");
const opn = require("opn");
const vscode_1 = require("vscode");
const extensionConstants = require("./constants");
const defaultCredentialSelectionDataProvider_1 = require("./credentials/defaultCredentialSelectionDataProvider");
const defaultCredentialsFileReaderWriter_1 = require("./credentials/defaultCredentialsFileReaderWriter");
const userCredentialsUtils_1 = require("./credentials/userCredentialsUtils");
const extensionGlobals_1 = require("./extensionGlobals");
/**
 * The actions that can be taken when we discover that a profile's default region is not
 * showing in the Explorer.
 *
 * Keep this in sync with the onDefaultRegionMissing configuration defined in package.json.
 */
var OnDefaultRegionMissingOperation;
(function (OnDefaultRegionMissingOperation) {
    /**
     * Ask the user what they would like to happen
     */
    OnDefaultRegionMissingOperation["Prompt"] = "prompt";
    /**
     * Automatically add the region to the Explorer
     */
    OnDefaultRegionMissingOperation["Add"] = "add";
    /**
     * Do nothing
     */
    OnDefaultRegionMissingOperation["Ignore"] = "ignore";
})(OnDefaultRegionMissingOperation || (OnDefaultRegionMissingOperation = {}));
class DefaultRegionMissingPromptItems {
}
DefaultRegionMissingPromptItems.add = localize('AWS.message.prompt.defaultRegionHidden.add', 'Yes');
DefaultRegionMissingPromptItems.alwaysAdd = localize('AWS.message.prompt.defaultRegionHidden.alwaysAdd', "Yes, and don't ask again");
DefaultRegionMissingPromptItems.ignore = localize('AWS.message.prompt.defaultRegionHidden.ignore', 'No');
DefaultRegionMissingPromptItems.alwaysIgnore = localize('AWS.message.prompt.defaultRegionHidden.alwaysIgnore', "No, and don't ask again");
class DefaultAWSContextCommands {
    constructor(awsContext, awsContextTrees, regionProvider) {
        this._awsContext = awsContext;
        this._awsContextTrees = awsContextTrees;
        this._regionProvider = regionProvider;
    }
    onCommandLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            const profileName = yield this.getProfileNameFromUser();
            if (!profileName) {
                // user clicked away from quick pick or entered nothing
                return;
            }
            const successfulLogin = yield userCredentialsUtils_1.UserCredentialsUtils.addUserDataToContext(profileName, this._awsContext);
            if (successfulLogin) {
                this.refresh();
                yield this.checkExplorerForDefaultRegion(profileName);
            }
            else {
                yield this.onCommandLogout();
                yield userCredentialsUtils_1.UserCredentialsUtils.notifyUserCredentialsAreBad(profileName);
            }
        });
    }
    onCommandCreateCredentialsProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            const credentialsFiles = yield userCredentialsUtils_1.UserCredentialsUtils.findExistingCredentialsFilenames();
            if (credentialsFiles.length === 0) {
                // Help user make a new credentials profile
                const profileName = yield this.promptAndCreateNewCredentialsFile();
                if (profileName) {
                    const successfulLogin = yield userCredentialsUtils_1.UserCredentialsUtils.addUserDataToContext(profileName, this._awsContext);
                    if (!successfulLogin) {
                        // credentials are invalid. Prompt user and log out
                        yield this.onCommandLogout();
                        yield userCredentialsUtils_1.UserCredentialsUtils.notifyUserCredentialsAreBad(profileName);
                    }
                }
            }
            else {
                // Get the editor set up and turn things over to the user
                yield this.editCredentials();
            }
        });
    }
    onCommandLogout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield userCredentialsUtils_1.UserCredentialsUtils.removeUserDataFromContext(this._awsContext);
            this.refresh();
        });
    }
    onCommandShowRegion() {
        return __awaiter(this, void 0, void 0, function* () {
            const explorerRegions = new Set(yield this._awsContext.getExplorerRegions());
            const newRegion = yield this.promptForFilteredRegion(candidateRegion => !explorerRegions.has(candidateRegion.regionCode));
            if (newRegion) {
                yield this._awsContext.addExplorerRegion(newRegion);
                this.refresh();
            }
        });
    }
    onCommandHideRegion(regionCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const region = regionCode || (yield this.promptForRegion(yield this._awsContext.getExplorerRegions()));
            if (region) {
                yield this._awsContext.removeExplorerRegion(region);
                this.refresh();
            }
        });
    }
    refresh() {
        this._awsContextTrees.refreshTrees();
    }
    /**
     * @description Ask user for credentials information, store
     * it in new credentials file.
     *
     * @returns The profile name, or undefined if user cancelled
     */
    promptAndCreateNewCredentialsFile() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const dataProvider = new defaultCredentialSelectionDataProvider_1.DefaultCredentialSelectionDataProvider([], extensionGlobals_1.ext.context);
                const state = yield defaultCredentialSelectionDataProvider_1.promptToDefineCredentialsProfile(dataProvider);
                if (!state.profileName || !state.accesskey || !state.secretKey) {
                    return undefined;
                }
                const validationResult = yield userCredentialsUtils_1.UserCredentialsUtils.validateCredentials(new aws_sdk_1.Credentials(state.accesskey, state.secretKey));
                if (validationResult.isValid) {
                    yield userCredentialsUtils_1.UserCredentialsUtils.generateCredentialDirectoryIfNonexistent();
                    yield userCredentialsUtils_1.UserCredentialsUtils.generateCredentialsFile(extensionGlobals_1.ext.context.extensionPath, {
                        profileName: state.profileName,
                        accessKey: state.accesskey,
                        secretKey: state.secretKey
                    });
                    return state.profileName;
                }
                const responseNo = localize('AWS.generic.response.no', 'No');
                const responseYes = localize('AWS.generic.response.no', 'Yes');
                const response = yield vscode_1.window.showWarningMessage(localize('AWS.message.prompt.credentials.definition.tryAgain', 'The credentials do not appear to be valid ({0}). Would you like to try again?', validationResult.invalidMessage), responseYes, responseNo);
                if (!response || response !== responseYes) {
                    return undefined;
                }
            } // Keep asking until cancel or valid credentials are entered
        });
    }
    /**
     * @description Responsible for getting a profile from the user,
     * working with them to define one if necessary.
     *
     * @returns User's selected Profile name, or undefined if none was selected.
     * undefined is also returned if we leave the user in a state where they are
     * editing their credentials file.
     */
    getProfileNameFromUser() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new defaultCredentialsFileReaderWriter_1.DefaultCredentialsFileReaderWriter().setCanUseConfigFileIfExists();
            const responseYes = localize('AWS.generic.response.yes', 'Yes');
            const responseNo = localize('AWS.generic.response.no', 'No');
            const credentialsFiles = yield userCredentialsUtils_1.UserCredentialsUtils.findExistingCredentialsFilenames();
            if (credentialsFiles.length === 0) {
                const userResponse = yield vscode_1.window.showInformationMessage(localize('AWS.message.prompt.credentials.create', 'You do not appear to have any AWS Credentials defined. Would you like to set one up now?'), responseYes, responseNo);
                if (userResponse !== responseYes) {
                    return undefined;
                }
                return yield this.promptAndCreateNewCredentialsFile();
            }
            else {
                const credentialReaderWriter = new defaultCredentialsFileReaderWriter_1.DefaultCredentialsFileReaderWriter();
                const profileNames = yield credentialReaderWriter.getProfileNames();
                // If no credentials were found, the user should be
                // encouraged to define some.
                if (profileNames.length === 0) {
                    const userResponse = yield vscode_1.window.showInformationMessage(localize('AWS.message.prompt.credentials.create', 'You do not appear to have any AWS Credentials defined. Would you like to set one up now?'), responseYes, responseNo);
                    if (userResponse === responseYes) {
                        // Start edit, the user will have to try connecting again
                        // after they have made their edits.
                        yield this.editCredentials();
                    }
                    return undefined;
                }
                // If we get here, there are credentials for the user to choose from
                const dataProvider = new defaultCredentialSelectionDataProvider_1.DefaultCredentialSelectionDataProvider(profileNames, extensionGlobals_1.ext.context);
                const state = yield defaultCredentialSelectionDataProvider_1.credentialProfileSelector(dataProvider);
                if (state && state.credentialProfile) {
                    return state.credentialProfile.label;
                }
                return undefined;
            }
        });
    }
    /**
     * @description Sets the user up to edit the credentials files.
     */
    editCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const credentialsFiles = yield userCredentialsUtils_1.UserCredentialsUtils.findExistingCredentialsFilenames();
            let preserveFocus = false;
            let viewColumn = vscode_1.ViewColumn.Active;
            for (const filename of credentialsFiles) {
                yield vscode_1.window.showTextDocument(vscode_1.Uri.file(filename), {
                    preserveFocus: preserveFocus,
                    preview: false,
                    viewColumn: viewColumn
                });
                preserveFocus = true;
                viewColumn = vscode_1.ViewColumn.Beside;
            }
            const responseNo = localize('AWS.generic.response.no', 'No');
            const responseYes = localize('AWS.generic.response.yes', 'Yes');
            const response = yield vscode_1.window.showInformationMessage(localize('AWS.message.prompt.credentials.definition.help', 'Would you like some information related to defining credentials?'), responseYes, responseNo);
            if (response && response === responseYes) {
                yield opn(extensionConstants.aboutCredentialsFileUrl);
            }
        });
    }
    /**
     * @description
     * Prompts the user to select a region.
     * The set shown to the user is filtered from all available regions.
     *
     * @param filter Filter to apply to the available regions
     */
    promptForFilteredRegion(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const availableRegions = yield this._regionProvider.getRegionData();
            const regionsToShow = availableRegions.filter(filter).map(r => r.regionCode);
            return this.promptForRegion(regionsToShow);
        });
    }
    /**
     * Prompts the user to select a region.
     *
     * @param regions (Optional) The regions to show the user. If none provided, all available
     * regions are shown. Regions provided must exist in the available regions to be shown.
     */
    promptForRegion(regions) {
        return __awaiter(this, void 0, void 0, function* () {
            const availableRegions = yield this._regionProvider.getRegionData();
            const regionsToShow = availableRegions
                .filter(r => {
                if (regions) {
                    return regions.some(x => x === r.regionCode);
                }
                return true;
            })
                .map(r => ({
                label: r.regionName,
                detail: r.regionCode
            }));
            const input = yield vscode_1.window.showQuickPick(regionsToShow, {
                placeHolder: localize('AWS.message.selectRegion', 'Select an AWS region'),
                matchOnDetail: true
            });
            return input ? input.detail : undefined;
        });
    }
    checkExplorerForDefaultRegion(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentialReaderWriter = new defaultCredentialsFileReaderWriter_1.DefaultCredentialsFileReaderWriter();
            const profileRegion = yield credentialReaderWriter.getDefaultRegion(profileName);
            if (!profileRegion) {
                return;
            }
            const explorerRegions = new Set(yield this._awsContext.getExplorerRegions());
            if (explorerRegions.has(profileRegion)) {
                return;
            }
            // Explorer does not contain the default region. See if we should add it.
            const config = vscode_1.workspace.getConfiguration(extensionConstants.extensionSettingsPrefix);
            const defaultAction = config.get('onDefaultRegionMissing', OnDefaultRegionMissingOperation.Prompt);
            // Bypass prompt if user has requested to suppress it.
            if (defaultAction === OnDefaultRegionMissingOperation.Add) {
                yield this.addRegion(profileRegion);
                return;
            }
            else if (defaultAction === OnDefaultRegionMissingOperation.Ignore) {
                return;
            }
            // Ask user what to do
            const regionHiddenResponse = yield vscode_1.window.showQuickPick([
                DefaultRegionMissingPromptItems.add,
                DefaultRegionMissingPromptItems.alwaysAdd,
                DefaultRegionMissingPromptItems.ignore,
                DefaultRegionMissingPromptItems.alwaysIgnore
            ], {
                placeHolder: localize('AWS.message.prompt.defaultRegionHidden', "This profile's default region ({0}) is currently hidden. " +
                    'Would you like to show it in the Explorer?', profileRegion)
            });
            // User Cancelled
            if (!regionHiddenResponse) {
                return;
            }
            switch (regionHiddenResponse) {
                case DefaultRegionMissingPromptItems.add:
                case DefaultRegionMissingPromptItems.alwaysAdd:
                    yield this.addRegion(profileRegion);
                    break;
            }
            switch (regionHiddenResponse) {
                case DefaultRegionMissingPromptItems.alwaysAdd:
                case DefaultRegionMissingPromptItems.alwaysIgnore:
                    // User does not want to be prompted anymore
                    const action = regionHiddenResponse === DefaultRegionMissingPromptItems.alwaysAdd
                        ? OnDefaultRegionMissingOperation.Add
                        : OnDefaultRegionMissingOperation.Ignore;
                    yield config.update('onDefaultRegionMissing', action, !vscode_1.workspace.name);
                    vscode_1.window.showInformationMessage(localize('AWS.message.prompt.defaultRegionHidden.suppressed', "You will no longer be asked what to do when the current profile's default region is " +
                        "hidden from the Explorer. This behavior can be changed by modifying the '{0}' setting.", 'aws.onDefaultRegionMissing'));
                    break;
            }
        });
    }
    addRegion(profileRegion) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._awsContext.addExplorerRegion(profileRegion);
            this.refresh();
        });
    }
}
exports.DefaultAWSContextCommands = DefaultAWSContextCommands;
//# sourceMappingURL=defaultAwsContextCommands.js.map