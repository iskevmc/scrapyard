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
const vscode = require("vscode");
const DebugAssetsInitializer_1 = require("./DebugAssetsInitializer");
const AzureCliClient_1 = require("./clients/AzureCliClient");
const CommandRunner_1 = require("./models/CommandRunner");
const SurveyManager_1 = require("./SurveyManager");
const AzdsInitializer_1 = require("./AzdsInitializer");
const Constants_1 = require("./Constants");
const ThenableUtility_1 = require("./utility/ThenableUtility");
const AzdsConfigFileUtility_1 = require("./utility/AzdsConfigFileUtility");
const ConnectManager = require("./ConnectManager");
class WorkspaceFolderManager {
    constructor(context, workspaceFolders, workspacesCommonId, packageReader, fileLogWriter, logger) {
        this.AzdsTraceTerminalChannelName = `azds trace`;
        this._activeTrace = false;
        this._azdsWorkspaceFolderMap = new Map();
        this._connectManagerMap = new Map();
        this._context = context;
        this._workspacesCommonId = workspacesCommonId;
        this._packageReader = packageReader;
        this._fileLogWriter = fileLogWriter;
        this._logger = logger;
        const userAgent = `VSCode/${this._packageReader.getProperty(`version`)}`;
        this._commandEnvironmentVariables = { AZDS_SOURCE_USER_AGENT: userAgent };
        // Copy the main process environment variables in the enviroment variables to use when running commands.
        Object.assign(this._commandEnvironmentVariables, process.env);
        const workspaceIndependentCommandRunner = new CommandRunner_1.CommandRunner();
        const azureCliClient = new AzureCliClient_1.AzureCliClient(workspaceIndependentCommandRunner, this._logger);
        const surveyManager = new SurveyManager_1.SurveyManager(context, this._logger, azureCliClient);
        surveyManager.showIfNeededAsync();
        if (workspaceFolders) {
            this.initializeAzdsWorkspaceFoldersAsync(workspaceFolders);
        }
    }
    dispose() {
        this._azdsWorkspaceFolderMap.forEach((azdsWorkspaceFolder) => {
            if (azdsWorkspaceFolder) {
                azdsWorkspaceFolder.disposeAsync();
            }
        });
        this.killAzdsTraceProcess();
    }
    runPrepCommandAsync(workspaceFolders) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Prep command triggered by the user`);
            const workspaceFolder = yield this.pickCommandWorkspaceFolderAsync(workspaceFolders);
            if (workspaceFolder != null) {
                yield this.initializeAzdsWorkspaceFolderAndRunPrepAsync(workspaceFolder);
            }
        });
    }
    /* #region Event Handlers */
    onDidChangeWorkspaceFoldersAsync(workspaceChangeEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            const addedFolders = workspaceChangeEvent.added;
            const removedFolders = workspaceChangeEvent.removed;
            this._logger.trace(`Workspace folders update`, {
                workspaceFoldersAdded: addedFolders.map((workspaceFolder) => workspaceFolder.name).join(`, `),
                workspaceFoldersRemoved: removedFolders.map((workspaceFolder) => workspaceFolder.name).join(`, `)
            });
            if (addedFolders && addedFolders.length > 0) {
                yield this.initializeAzdsWorkspaceFoldersAsync(addedFolders);
            }
            if (removedFolders && removedFolders.length > 0) {
                for (const workspaceFolder of removedFolders) {
                    if (this._azdsWorkspaceFolderMap.has(workspaceFolder)) {
                        this._azdsWorkspaceFolderMap.get(workspaceFolder).disposeAsync();
                        this._azdsWorkspaceFolderMap.delete(workspaceFolder);
                    }
                    if (this._connectManagerMap.has(workspaceFolder)) {
                        this._connectManagerMap.delete(workspaceFolder);
                    }
                }
            }
        });
    }
    onDidStartDebugSession(debugSession) {
        if (DebugAssetsInitializer_1.DebugAssetsInitializer.isAzdsConfiguration(debugSession.name) && debugSession.workspaceFolder) {
            this._azdsWorkspaceFolderMap.get(debugSession.workspaceFolder).onDidStartDebugSessionAsync(debugSession);
            this.startAzdsTraceProcess(this._context);
        }
    }
    onDidTerminateDebugSession(debugSession) {
        if (DebugAssetsInitializer_1.DebugAssetsInitializer.isAzdsConfiguration(debugSession.name) && debugSession.workspaceFolder) {
            this._azdsWorkspaceFolderMap.get(debugSession.workspaceFolder).onDidTerminateDebugSession(debugSession);
            this.killAzdsTraceProcess();
        }
    }
    /* #endregion Event Handlers*/
    startAzdsTraceProcess(context) {
        if (this._activeTrace) {
            return;
        }
        this._activeTrace = true;
        this._traceTerminal = vscode.window.createTerminal(this.AzdsTraceTerminalChannelName);
        context.subscriptions.push(this._traceTerminal);
        this._traceTerminal.sendText(`${Constants_1.Constants.AzdsCLICommand} trace`);
        this._logger.trace(`"azds trace" process started`);
    }
    killAzdsTraceProcess() {
        if (this._activeTrace && this._traceTerminal) {
            this._traceTerminal.dispose();
            this._traceTerminal = null;
            this._logger.trace(`"azds trace" process terminated`);
        }
        this._activeTrace = false;
    }
    initializeAzdsWorkspaceFoldersAsync(workspaceFolders) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspaceFolders || workspaceFolders.length < 1) {
                return;
            }
            workspaceFolders.forEach((workspaceFolder) => __awaiter(this, void 0, void 0, function* () {
                if (!this._azdsWorkspaceFolderMap.has(workspaceFolder)) {
                    // As of today, we have to check for the azds.yaml file presence before executing any logic, because
                    // we don't want to pop AZDS CLI modals to users who open a folder totally unrelated to AZDS.
                    // TODO: Remove this extra check once the binaries are embedded with the extension.
                    const azdsConfigFileUtility = new AzdsConfigFileUtility_1.AzdsConfigFileUtility(workspaceFolder);
                    if (yield azdsConfigFileUtility.isFilePresentAsync()) {
                        const azdsInitializer = new AzdsInitializer_1.AzdsInitializer(this._context, this._workspacesCommonId, workspaceFolder, this._commandEnvironmentVariables, this._logger);
                        const cliVersion = yield azdsInitializer.ensureAzdsCliAsync();
                        if (cliVersion != null) {
                            yield this.tryInitializeAzdsWorkspaceFolder(workspaceFolder, azdsInitializer, cliVersion);
                        }
                    }
                }
            }));
        });
    }
    initializeAzdsWorkspaceFolderAndRunPrepAsync(workspaceFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Running prep and initializing workspace folder ${workspaceFolder.name}`);
            const azdsInitializer = new AzdsInitializer_1.AzdsInitializer(this._context, this._workspacesCommonId, workspaceFolder, this._commandEnvironmentVariables, this._logger);
            const cliVersion = yield azdsInitializer.ensureAzdsCliAsync();
            if (cliVersion != null) {
                yield azdsInitializer.prepAsync(cliVersion);
                if (!this._azdsWorkspaceFolderMap.has(workspaceFolder)) {
                    yield this.tryInitializeAzdsWorkspaceFolder(workspaceFolder, azdsInitializer, cliVersion);
                }
            }
        });
    }
    tryInitializeAzdsWorkspaceFolder(workspaceFolder, azdsInitializer, cliVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Trying to initialize the workspace folder ${workspaceFolder.name}`);
            const azdsWorkspaceFolder = yield azdsInitializer.initializeWorkspaceFolderAsync(cliVersion, this._commandEnvironmentVariables, this._fileLogWriter);
            if (azdsWorkspaceFolder == null) {
                // One of the validations failed during the initialization check.
                return;
            }
            this._azdsWorkspaceFolderMap.set(workspaceFolder, azdsWorkspaceFolder);
            // Registers a file system watcher for this workspace folder so that we detect changes that impact AZDS.
            const releasable = azdsWorkspaceFolder.watchedFilesChanged.subscribe(() => __awaiter(this, void 0, void 0, function* () {
                this._logger.warning(`AZDS files have changed: triggering a new initialization for ${workspaceFolder.name}`);
                releasable.release();
                // Deletes the workspaceFolder kept, and try to create a new one so that we go again through a complete initialization.
                yield this._azdsWorkspaceFolderMap.get(workspaceFolder).disposeAsync();
                this._azdsWorkspaceFolderMap.delete(workspaceFolder);
                yield this.tryInitializeAzdsWorkspaceFolder(workspaceFolder, azdsInitializer, cliVersion);
            }));
        });
    }
    pickCommandWorkspaceFolderAsync(workspaceFolders) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspaceFolders || workspaceFolders.length < 1) {
                this._logger.warning(`No workspace folders to run the command on`);
                return null;
            }
            let workspaceFolder;
            if (workspaceFolders.length === 1) { // single folder case
                workspaceFolder = workspaceFolders[0];
            }
            else { // workspace mode
                workspaceFolder = yield ThenableUtility_1.ThenableUtility.ToPromise(vscode.window.showWorkspaceFolderPick({
                    placeHolder: `Pick a workspace folder to run the command`
                }));
                if (!workspaceFolder) {
                    return null;
                }
            }
            return workspaceFolder;
        });
    }
    provideDebugConfigurationAsync(workspaceFolder, debugConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Retrieving debug configuration for workspace folder ${workspaceFolder.name}`);
            var connectManager = this._connectManagerMap.get(workspaceFolder);
            return connectManager ? yield connectManager.provideDebugConfiguration(debugConfiguration) : debugConfiguration;
        });
    }
    runConnectCommandAsync(workspaceFolders, wizardType) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Connect command triggered by the user`);
            if (process.platform !== `win32` && process.platform !== `darwin`) {
                this._logger.warning(`Impossible to run the connect command: platform is ${process.platform}`);
                vscode.window.showErrorMessage(`This command is not supported on this platform.`);
                return;
            }
            const workspaceFolder = yield this.pickCommandWorkspaceFolderAsync(workspaceFolders);
            if (workspaceFolder == null) {
                return;
            }
            this._logger.trace(`Initializing workspace folder ${workspaceFolder.name} and running connect command on it`);
            var connectManager;
            if (this._connectManagerMap.has(workspaceFolder)) {
                connectManager = this._connectManagerMap.get(workspaceFolder);
                yield connectManager.runConnectWizard(wizardType);
            }
            else {
                const azdsInitializer = new AzdsInitializer_1.AzdsInitializer(this._context, this._workspacesCommonId, workspaceFolder, this._commandEnvironmentVariables, this._logger);
                const cliVersion = yield azdsInitializer.ensureAzdsCliAsync();
                if (cliVersion != null) {
                    connectManager = new ConnectManager.ConnectManager(workspaceFolder, this._context, this._logger, this._commandEnvironmentVariables);
                    this._connectManagerMap.set(workspaceFolder, connectManager);
                    yield connectManager.runConnectWizard(wizardType);
                }
            }
        });
    }
    runOpenConnectTerminalCommandAsync(workspaceFolders) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(`Open connect terminal command triggered by the user`);
            if (process.platform !== `win32` && process.platform !== `darwin`) {
                this._logger.warning(`Impossible to run the open connect terminal command: platform is ${process.platform}`);
                vscode.window.showErrorMessage(`This command is not supported on this platform.`);
                return;
            }
            const workspaceFolder = yield this.pickCommandWorkspaceFolderAsync(workspaceFolders);
            if (workspaceFolder == null) {
                return;
            }
            if (this._connectManagerMap.has(workspaceFolder)) {
                this._connectManagerMap.get(workspaceFolder).launchTerminal();
            }
            else {
                vscode.window.showErrorMessage("Please connect first!");
            }
        });
    }
}
exports.WorkspaceFolderManager = WorkspaceFolderManager;
//# sourceMappingURL=WorkspaceFolderManager.js.map