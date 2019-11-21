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
const fs = require("fs");
const path = require("path");
const util = require("util");
const vscode = require("vscode");
const AzdsConfigFileUtility_1 = require("./utility/AzdsConfigFileUtility");
const ThenableUtility_1 = require("./utility/ThenableUtility");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const readFileAsync = util.promisify(fs.readFile);
// TODO (950284): Add unit-tests.
class DebugAssetsInitializer {
    constructor(context, workspaceFolder, logger) {
        this.DebugAssetsFormatRevisionIdentifier = `debugAssetsFormatRevision`;
        // Every time the format of launch.json or tasks.json is updated, we should increase this to force an update on clients.
        this.DebugAssetsFormatRevision = 0;
        this._workspaceFolder = workspaceFolder;
        this._context = context;
        this._logger = logger;
    }
    static isAzdsConfiguration(configurationName) {
        return configurationName != null && configurationName.endsWith(this.AzdsIdentifierPostfix);
    }
    static isAzdsTask(taskLabel) {
        return taskLabel != null && taskLabel.startsWith(this.AzdsIdentifierPrefix);
    }
    ensureDebugAssetsArePresentAsync(recognizerResult, shouldCreateIfMissing) {
        return __awaiter(this, void 0, void 0, function* () {
            // Enriches the recognizerResult with the current workspaceFolder.
            const azdsConfigFileUtility = new AzdsConfigFileUtility_1.AzdsConfigFileUtility(this._workspaceFolder);
            yield this.updateSourceFolderAsync(recognizerResult, azdsConfigFileUtility);
            const areDebugAssetsUpToDate = this._context.workspaceState.get(this.DebugAssetsFormatRevisionIdentifier) == this.DebugAssetsFormatRevision;
            const areDebugAssetsPresent = (yield this.ensureDebugAssetsInTasksJsonAsync(recognizerResult, shouldCreateIfMissing, areDebugAssetsUpToDate))
                && (yield this.ensureDebugAssetsInLaunchJsonAsync(recognizerResult, shouldCreateIfMissing, areDebugAssetsUpToDate));
            if (!areDebugAssetsUpToDate && areDebugAssetsPresent) {
                // The debug assets were initially out of date, but we recreated them with the latest revision of the debug assets format.
                // We can now register the latest revision as the workspace's debug assets format revision.
                this._context.workspaceState.update(this.DebugAssetsFormatRevisionIdentifier, this.DebugAssetsFormatRevision);
            }
            return areDebugAssetsPresent;
        });
    }
    ensureDebugAssetsInTasksJsonAsync(recognizerResult, shouldCreateIfMissing, isDebugAssetUpToDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasksConfig = vscode.workspace.getConfiguration(`tasks`, this._workspaceFolder.uri);
            let tasks = tasksConfig.get(`tasks`, /*defaultValue*/ []);
            let azdsDebugAssetExists = false;
            // Looping in reverse order so that we can remove all outdated debug assets in a single pass.
            for (let i = tasks.length - 1; i >= 0; i--) {
                const taskLabel = tasks[i][`label`];
                if (DebugAssetsInitializer.isAzdsTask(taskLabel)) {
                    if (isDebugAssetUpToDate) {
                        // The AZDS debug asset in tasks.json exists and is up to date. No need to check all
                        // remaining tasks: if the user modified manually the file and created
                        // an inconsistency, there isn't much we can do anyway.
                        return true;
                    }
                    // The AZDS debug asset exists but is outdated. Let's remove it.
                    azdsDebugAssetExists = true;
                    tasks.splice(i, 1);
                    this._logger.trace(`Task in tasks.json is outdated, and will be replaced`);
                }
            }
            // The AZDS debug asset doesn't exist, and we're not about to create a new one.
            if (!azdsDebugAssetExists && !shouldCreateIfMissing) {
                return false;
            }
            // At this point either we previously had an outdated debug asset that we want to replace,
            // or we want to create the debug asset as it was missing.
            const azdsTask = yield this.loadFromTemplateAsync(recognizerResult, `tasks.json`);
            tasks = tasks.concat(azdsTask);
            yield ThenableUtility_1.ThenableUtility.ToPromise(tasksConfig.update(`tasks`, tasks, vscode.ConfigurationTarget.WorkspaceFolder));
            this._logger.trace(`Task is added to tasks.json at ${this._workspaceFolder.uri.fsPath}`);
            return true;
        });
    }
    ensureDebugAssetsInLaunchJsonAsync(recognizerResult, shouldCreateIfMissing, isDebugAssetUpToDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const launchConfig = vscode.workspace.getConfiguration(`launch`, this._workspaceFolder.uri);
            let debugConfigurations = launchConfig.get(`configurations`, /*defaultValue*/ []);
            let azdsDebugAssetExists = false;
            // Looping in reverse order so that we can remove all outdated debug assets in a single pass.
            for (let i = debugConfigurations.length - 1; i >= 0; i--) {
                const configurationName = debugConfigurations[i][`name`];
                if (DebugAssetsInitializer.isAzdsConfiguration(configurationName)) {
                    if (isDebugAssetUpToDate) {
                        // The AZDS debug asset in launch.json exists and is up to date. No need to check all
                        // remaining configurations: if the user modified manually the file and created
                        // an inconsistency, there isn't much we can do anyway.
                        return true;
                    }
                    // The AZDS debug asset exists but is outdated. Let's remove it.
                    azdsDebugAssetExists = true;
                    debugConfigurations.splice(i, 1);
                    this._logger.trace(`Configuration in launch.json is outdated, and will be replaced`);
                }
            }
            // The AZDS debug asset doesn't exist, and we're not about to create a new one.
            if (!azdsDebugAssetExists && !shouldCreateIfMissing) {
                return false;
            }
            // At this point either we previously had an outdated debug asset that we want to replace,
            // or we want to create the debug asset as it was missing.
            const azdsConfiguration = yield this.loadFromTemplateAsync(recognizerResult, `launch.json`);
            debugConfigurations = debugConfigurations.concat(azdsConfiguration);
            yield ThenableUtility_1.ThenableUtility.ToPromise(launchConfig.update(`configurations`, debugConfigurations, vscode.ConfigurationTarget.WorkspaceFolder));
            this._logger.trace(`Configuration is added to launch.json at ${this._workspaceFolder.uri.fsPath}`);
            return true;
        });
    }
    loadFromTemplateAsync(r, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateFile = path.join(__dirname, "template", r.identifier, fileName);
            let template = yield readFileAsync(templateFile, 'utf8');
            let content = this.replaceTokens(template, r.properties);
            let result = [];
            try {
                let jsonContent = JSON.parse(content);
                // Ensure that required launch configuration gets picked up when list of configIds exists
                if (r.properties && r.properties.configIds) {
                    let iterator = r.properties.configIds.entries();
                    for (let configId of iterator) {
                        if (jsonContent[configId[0]]) {
                            result = result.concat(jsonContent[configId[0]]);
                        }
                    }
                }
                else {
                    result = jsonContent;
                }
                return result;
            }
            catch (error) {
                vscode.window.showErrorMessage(`Something went wrong while replacing the template parameters`);
                this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`Something went wrong while replacing the template parameters: ${error.message}`));
            }
        });
    }
    replaceTokens(s, tokens) {
        for (const token in tokens) {
            if (tokens.hasOwnProperty(token) && typeof tokens[token] == 'string') {
                s = s.split("$" + token + "$").join(tokens[token]);
            }
        }
        return s;
    }
    updateSourceFolderAsync(recognizerResult, azdsConfigFileUtility) {
        return __awaiter(this, void 0, void 0, function* () {
            // Here, we're keeping "${workspaceFolder}" in standard quotes rather than backtick quotes because this is
            // actually the string we want: it should *not* be replaced by any local variable's value.
            const rootWorkspaceFolder = "${workspaceFolder}";
            let recognizerWorkspaceFolder;
            try {
                const buildContext = yield azdsConfigFileUtility.getBuildContextAsync();
                recognizerWorkspaceFolder = rootWorkspaceFolder.concat(`/`, buildContext);
            }
            catch (error) {
                this._logger.warning(`Couldn't determine the workspace folder. Defaulting to root workspace`, error);
                recognizerWorkspaceFolder = rootWorkspaceFolder;
            }
            recognizerResult.properties[`workspaceFolder`] = recognizerWorkspaceFolder;
        });
    }
}
DebugAssetsInitializer.AzdsIdentifierPostfix = ` (AZDS)`;
DebugAssetsInitializer.AzdsIdentifierPrefix = `azds: `;
exports.DebugAssetsInitializer = DebugAssetsInitializer;
//# sourceMappingURL=DebugAssetsInitializer.js.map