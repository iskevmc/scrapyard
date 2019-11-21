// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const opener = require("opener");
const commandExists = require("command-exists");
const vscode = require("vscode");
const AzdsCliClient_1 = require("./clients/AzdsCliClient");
const AzdsConfigFileUtility_1 = require("./utility/AzdsConfigFileUtility");
const Logger_1 = require("./logger/Logger");
const PromptItem_1 = require("./PromptItem");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const ThenableUtility_1 = require("./utility/ThenableUtility");
const RecognizerResult_1 = require("./models/RecognizerResult");
const ServiceClassifier_1 = require("./ServiceClassifier");
const DebugAssetsInitializer_1 = require("./DebugAssetsInitializer");
const Constants_1 = require("./Constants");
const AzdsWorkspaceFolder_1 = require("./AzdsWorkspaceFolder");
const CommandRunner_1 = require("./models/CommandRunner");
class AzdsInitializer {
    constructor(context, workspacesCommonId, workspaceFolder, commandEnvironmentVariables, logger) {
        this._context = context;
        this._workspacesCommonId = workspacesCommonId;
        this._workspaceFolder = workspaceFolder;
        this._logger = logger;
        const commandRunner = new CommandRunner_1.CommandRunner(/*currentWorkingDirectory*/ this._workspaceFolder.uri.fsPath, commandEnvironmentVariables);
        this._azdsCliClient = new AzdsCliClient_1.AzdsCliClient(commandRunner, this._logger);
    }
    // Makes sure that the AZDS CLI is installed and retrieve its current version.
    ensureAzdsCliAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAzdsCliPresent()) {
                this.promptToInstallCli(this._workspaceFolder, /*updateRequired*/ false);
                this._logger.warning(`AZDS CLI is not present locally`);
                return null;
            }
            const cliVersion = yield this._azdsCliClient.getCliVersionAsync();
            if (!this.isAzdsCliUpToDate(cliVersion)) {
                this.promptToInstallCli(this._workspaceFolder, /*updateRequired*/ true);
                this._logger.warning(`AZDS CLI is not up to date. Current version: ${cliVersion}`);
                return null;
            }
            return cliVersion;
        });
    }
    prepAsync(cliVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Prep command started on ${this._workspaceFolder.name}`);
            const serviceClassifier = new ServiceClassifier_1.ServiceClassifier(this._workspaceFolder.uri.fsPath, this._logger);
            const recognizerResult = yield serviceClassifier.runAsync();
            const showErrorMessage = (error) => {
                let errorMsg = `Failed to configure '${this._workspaceFolder.name}' for ${Constants_1.Constants.AzdsShortSingular}`;
                if (error) {
                    errorMsg = `${errorMsg} with error: ${error}`;
                }
                vscode.window.showErrorMessage(errorMsg);
            };
            try {
                if (!(yield ServiceClassifier_1.ServiceClassifier.getAdditionalProperties(recognizerResult))) {
                    // We couldn't retrieve the Java additional properties. An error message has been displayed by the ServiceClassifier.
                    return;
                }
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`Getting service classifier additional properties failed: ${error.message}`));
                showErrorMessage(error);
                return;
            }
            let shouldAddPublicEndpoint = false;
            let customData = null;
            if (recognizerResult.identifier != RecognizerResult_1.LanguageIdentifier.Unknown && recognizerResult.properties && recognizerResult.properties.prepData) {
                customData = JSON.stringify(recognizerResult.properties.prepData);
            }
            let isChartConfigFilePresent = false;
            try {
                const azdsConfigFileUtility = new AzdsConfigFileUtility_1.AzdsConfigFileUtility(this._workspaceFolder);
                yield azdsConfigFileUtility.getChartConfigAsync();
                isChartConfigFilePresent = true;
            }
            catch (error) {
                // This error is expected to happen if the Chart.yaml file is not present.
                this._logger.trace(`Impossible to retrieve the Chart.yaml config file in ${this._workspaceFolder.name}`, /*properties*/ null, error);
            }
            if (!isChartConfigFilePresent) {
                // As we're about to generate a new Helm chart, let's ask first the users whether they want a publicly accessible endpoint configured as well.
                shouldAddPublicEndpoint = yield this.promptToAddPrepPublicEndpointAsync();
            }
            const prepData = {
                public: shouldAddPublicEndpoint.toString(),
                customData: customData,
                cliVersion: cliVersion,
                language: recognizerResult.identifier.toString()
            };
            try {
                yield this._azdsCliClient.prepAsync(/*shouldUpgrade*/ false, shouldAddPublicEndpoint, customData);
                if (recognizerResult.identifier == RecognizerResult_1.LanguageIdentifier.Unknown) {
                    // It is possible to trigger a prep for a workspaceFolder corresponding to a language we don't support.
                    // In such case, we just let the user know that he won't be able to debug it through VS Code.
                    // TODO: Display a specific error message to the user in case of prep when we didn't recognize the language, similar
                    // to "Dockerfile could not be generated due to unsupported language. Please create a Dockerfile manually.".
                }
                else {
                    const areDebugAssetsPresent = yield this.ensureDebugAssetsArePresentAsync(this._workspaceFolder, /*forceCreateDebugAssets*/ true, recognizerResult);
                    if (!areDebugAssetsPresent) {
                        // We should have been able to create/update the configs, as we recognized the language and forced the creation.
                        throw new Error(`${Constants_1.Constants.AzdsShortSingular} assets in launch.json and tasks.json couldn't be created properly.`);
                    }
                    vscode.window.showInformationMessage(`'${this._workspaceFolder.name}' is configured for ${Constants_1.Constants.AzdsShortSingular}.`);
                }
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.PrepCommandSuccess, prepData);
            }
            catch (error) {
                showErrorMessage(error.message);
                this._logger.error(TelemetryEvent_1.TelemetryEvent.PrepCommandError, error, prepData);
            }
        });
    }
    // Determines if the current workspace folder can be initialized for AZDS debug. This implies verifying multiple things,
    // such as the debug assets presence, etc. If the workspace folder can be initialized, it  will be returned.
    initializeWorkspaceFolderAsync(cliVersion, commandEnvironmentVariables, fileLogWriter) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Initialization started on ${this._workspaceFolder.name}`);
            try {
                const azdsConfigFileUtility = new AzdsConfigFileUtility_1.AzdsConfigFileUtility(this._workspaceFolder);
                if (!(yield azdsConfigFileUtility.isFilePresentAsync())) {
                    this._logger.warning(`Initialization canceled on ${this._workspaceFolder.name}: no azds.yaml file`);
                    return null;
                }
                if (yield azdsConfigFileUtility.isFileOutdatedAsync()) {
                    // The azds.yaml config file needs to be upgraded. Displaying a prompt to the user.
                    const isConfigFileUpgraded = yield this.promptToUpgradeConfigFileAsync(this._workspaceFolder);
                    if (!isConfigFileUpgraded) {
                        this._logger.warning(`Initialization canceled on ${this._workspaceFolder.name}: azds.yaml file is outdated`);
                        return null;
                    }
                }
                const serviceClassifier = new ServiceClassifier_1.ServiceClassifier(this._workspaceFolder.uri.fsPath, this._logger);
                const recognizerResult = yield serviceClassifier.runAsync();
                if (recognizerResult.identifier == RecognizerResult_1.LanguageIdentifier.Unknown) {
                    // The language used in the workspace folder isn't one of the languages we support.
                    this._logger.warning(`Initialization canceled on ${this._workspaceFolder.name}: unknown language`);
                    return null;
                }
                if (!(yield this.ensureDebugAssetsArePresentAsync(this._workspaceFolder, /*forceCreateDebugAssets*/ false, recognizerResult))) {
                    this._logger.warning(`Initialization canceled on ${this._workspaceFolder.name}: the debug assets couldn't be created`);
                    return null;
                }
                // All validations were successful! We have everything we need to initialize and debug the current workspace folder.
                // Create a new Logger specific to this workspace so that it can log its logs distincly from the extension host.
                const azdsWorkspaceLogger = new Logger_1.Logger(fileLogWriter, this._workspaceFolder.name);
                const azdsWorkspaceFolder = new AzdsWorkspaceFolder_1.AzdsWorkspaceFolder(this._context, this._workspaceFolder, recognizerResult, azdsWorkspaceLogger, commandEnvironmentVariables);
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.InitializationSuccess, {
                    workspacesCommonId: this._workspacesCommonId.toString(),
                    cliVersion: cliVersion,
                    language: recognizerResult.identifier
                });
                return azdsWorkspaceFolder;
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.InitializationError, error, {
                    workspacesCommonId: this._workspacesCommonId.toString(),
                    cliVersion: cliVersion
                });
                vscode.window.showErrorMessage(`Failed to initialize '${this._workspaceFolder.name}' for ${Constants_1.Constants.AzdsShortSingular}: ${error.message}`);
            }
        });
    }
    isAzdsCliPresent() {
        return commandExists.sync(`azds`);
    }
    isAzdsCliUpToDate(cliVersion) {
        try {
            const versionArray = cliVersion.split(`.`);
            // Handle local builds where third part of the version is 0.
            if (versionArray[2] === `0`) {
                return true;
            }
            const minVersionArray = Constants_1.Constants.AzdsCLIMinVersion.split(`.`);
            if (versionArray.length != minVersionArray.length) {
                throw new Error(`Invalid CLI version format: ${cliVersion}`);
            }
            for (var i = 0; i < versionArray.length; ++i) {
                const isIntegerPositive = /^\d+$/.test(versionArray[i]);
                if (!isIntegerPositive) {
                    throw new Error(`Invalid CLI version: ${cliVersion}`);
                }
                if (versionArray[i] > minVersionArray[i]) {
                    return true;
                }
                if (versionArray[i] === minVersionArray[i]) {
                    continue;
                }
                return false;
            }
            return true;
        }
        catch (error) {
            this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`Impossible to retrieve or parse the CLI version: ${error.message}`));
            throw error;
        }
    }
    promptToInstallCli(workspaceFolder, updateRequired) {
        const yesItem = { title: `${updateRequired ? `Update` : `Install`} the ${Constants_1.Constants.AzdsShortSingular} CLI`, result: PromptItem_1.PromptResult.Yes };
        vscode.window.showErrorMessage(`Required tools to build and debug '${workspaceFolder.name}' are ${updateRequired ? `out of date` : `missing`}.
            ${updateRequired ? `Update` : `Install`} the ${Constants_1.Constants.AzdsShortSingular} CLI and restart Visual Studio Code.`, yesItem)
            .then((selectedItem) => {
            const promptResult = selectedItem != null ? selectedItem.result : PromptItem_1.PromptResult.No;
            if (promptResult == PromptItem_1.PromptResult.Yes) {
                opener(updateRequired ? `https://aka.ms/azds-tools-outofdate` : `https://aka.ms/azds-tools-missing`);
            }
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.DownloadCliBannerClosed, {
                response: PromptItem_1.PromptResult[promptResult]
            });
        });
    }
    promptToUpgradeConfigFileAsync(workspaceFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const yesItem = { title: `Yes`, result: PromptItem_1.PromptResult.Yes };
            const noItem = { title: `Not Now`, result: PromptItem_1.PromptResult.No, isCloseAffordance: true };
            const selectedItem = yield ThenableUtility_1.ThenableUtility.ToPromise(vscode.window.showErrorMessage(`[${Constants_1.Constants.AzdsShortSingular}] The configuration file of '${workspaceFolder.name}' requires an update. Update now?`, yesItem, noItem));
            const promptResult = selectedItem ? selectedItem.result : PromptItem_1.PromptResult.No;
            let isConfigFileUpgraded;
            switch (promptResult) {
                case PromptItem_1.PromptResult.Yes:
                    yield this._azdsCliClient.prepAsync(/*shouldUpgrade*/ true);
                    isConfigFileUpgraded = true;
                    break;
                default:
                    isConfigFileUpgraded = false;
                    break;
            }
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.UpgradeConfigBannerClosed, {
                response: PromptItem_1.PromptResult[promptResult]
            });
            return isConfigFileUpgraded;
        });
    }
    // Ensures that the AZDS configs in tasks.json and launch.json are present and up-to-date.
    // If the configs are missing, unless we're in a prep context (forceCreateDebugAssets), we'll ask for user validation before adding our configs.
    ensureDebugAssetsArePresentAsync(workspaceFolder, forceCreateDebugAssets, recognizerResult) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const debugAssetsInitializer = new DebugAssetsInitializer_1.DebugAssetsInitializer(this._context, workspaceFolder, this._logger);
                const areDebugAssetsPresent = yield debugAssetsInitializer.ensureDebugAssetsArePresentAsync(recognizerResult, /*shouldCreateIfMissing*/ forceCreateDebugAssets);
                if (areDebugAssetsPresent) {
                    return true;
                }
                // The configs aren't there, let's ask the user if it's OK to add them.
                const shouldAddDebugAssets = yield this.promptToAddDebugAssetsAsync(workspaceFolder, recognizerResult);
                if (shouldAddDebugAssets && (yield ServiceClassifier_1.ServiceClassifier.getAdditionalProperties(recognizerResult))) {
                    yield debugAssetsInitializer.ensureDebugAssetsArePresentAsync(recognizerResult, /*shouldCreateIfMissing*/ true);
                    return true;
                }
            }
            catch (error) {
                this._logger.warning(`Failed to validate assets in launch.json and tasks.json in ${this._workspaceFolder.name}`, error);
                vscode.window.showErrorMessage(`[${Constants_1.Constants.AzdsShortSingular}] Failed to validate assets in launch.json and tasks.json for '${workspaceFolder.name}'. ${error}`);
            }
            return false;
        });
    }
    promptToAddDebugAssetsAsync(workspaceFolder, recognizerResult) {
        return __awaiter(this, void 0, void 0, function* () {
            const yesItem = { title: `Yes`, result: PromptItem_1.PromptResult.Yes };
            const noItem = { title: `Not Now`, result: PromptItem_1.PromptResult.No, isCloseAffordance: true };
            const selectedItem = yield ThenableUtility_1.ThenableUtility.ToPromise(vscode.window.showWarningMessage(`[${Constants_1.Constants.AzdsShortSingular}] Required assets to build and debug in ${Constants_1.Constants.AzdsShortSingular} are missing from '${workspaceFolder.name}'. Add them?`, yesItem, noItem));
            const promptResult = selectedItem ? selectedItem.result : PromptItem_1.PromptResult.No;
            const languageIdentifier = recognizerResult ? recognizerResult.identifier : RecognizerResult_1.LanguageIdentifier.Unknown;
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.AddAssetsBannerClosed, {
                language: languageIdentifier,
                response: PromptItem_1.PromptResult[promptResult]
            });
            const shouldAddDebugAssets = (promptResult == PromptItem_1.PromptResult.Yes);
            return shouldAddDebugAssets;
        });
    }
    promptToAddPrepPublicEndpointAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const yesItem = { label: `Yes` };
                const noItem = { label: `No` };
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = [yesItem, noItem];
                quickPick.placeholder = `Do you want a publicly accessible endpoint to be configured for this service?`;
                quickPick.activeItems = [noItem];
                quickPick.ignoreFocusOut = true;
                quickPick.onDidChangeSelection(selection => {
                    if (selection.length > 0) {
                        quickPick.hide();
                        const shouldAddPublicEndpoint = (selection[0] == yesItem);
                        resolve(shouldAddPublicEndpoint);
                    }
                });
                quickPick.onDidHide(() => {
                    resolve(false);
                    quickPick.dispose();
                });
                quickPick.show();
            });
        });
    }
}
exports.AzdsInitializer = AzdsInitializer;
//# sourceMappingURL=AzdsInitializer.js.map