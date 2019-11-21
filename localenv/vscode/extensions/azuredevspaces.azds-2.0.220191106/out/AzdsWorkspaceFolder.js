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
const guid_typescript_1 = require("guid-typescript");
const open_browser = require("opener");
const process = require("process");
const url_1 = require("url");
const vscode = require("vscode");
const RecognizerResult_1 = require("./models/RecognizerResult");
const AzdsCliClient_1 = require("./clients/AzdsCliClient");
const CommandRunner_1 = require("./models/CommandRunner");
const AzdsConfigFileUtility_1 = require("./utility/AzdsConfigFileUtility");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const Event_1 = require("./utility/Event");
const Constants_1 = require("./Constants");
class AzdsWorkspaceFolder {
    constructor(context, workspaceFolder, recognizerResult, logger, commandEnvironmentVariables) {
        this._context = context;
        this._workspaceFolder = workspaceFolder;
        this._recognizerResult = recognizerResult;
        this._logger = logger;
        const commandRunner = new CommandRunner_1.CommandRunner(/*currentWorkingDirectory*/ this._workspaceFolder.uri.fsPath, commandEnvironmentVariables);
        this._onOutputEmittedReleasable = commandRunner.outputEmitted.subscribe((data) => this._output.appendLine(data));
        this._azdsCliClient = new AzdsCliClient_1.AzdsCliClient(commandRunner, this._logger);
        const outputChannelName = `azds (${this._workspaceFolder.name})`;
        this._output = vscode.window.createOutputChannel(outputChannelName);
        this._context.subscriptions.push(this._output);
        this._output.appendLine(`${Constants_1.Constants.AzdsShortSingular} initialization (package v${vscode.version})`);
        this._output.appendLine(`Logs: ${this._logger.logFilePath}`);
        const uniqueId = guid_typescript_1.Guid.create();
        const openBrowserCommand = `azds.open.browser.${uniqueId}`;
        this._context.subscriptions.push(vscode.commands.registerCommand(openBrowserCommand, () => {
            if (this._currentTunnelUrl) {
                open_browser(this._currentTunnelUrl);
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.OpenTunnelUrl);
            }
            else {
                vscode.window.showWarningMessage(`Unable to find the tunnel URL. Please see the task output window to find tunnel URL.`);
                this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`Open browser command was triggered despite the tunnel URL being null`));
            }
        }));
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._statusBarItem.command = openBrowserCommand;
        this.watchLanguageIdentifier(this._recognizerResult);
        // Run the start debug daemon command and forget.
        this.startDebugDaemonAsync(this._recognizerResult);
    }
    disposeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            /* During VSCode shutdown, the VSCode extension may not have enough time to fully perform all shutdown sequence. When this happens,
               the VSCode extension process is guaranteed to terminate. To resolve this issue, the VSCode will start daemon with
               'daemon --ppid <current pid>' option to facilitate a clean shutdown. The started process (the daemon process) will monitor
               the VSCode process. Once VSCode process is terminated, it will execute shutdown sequence.
            */
            this._statusBarItem.dispose();
            this._output.dispose();
            this._languageIdentifierWatcher.dispose();
            this._debugAssetsWatcher.dispose();
            this._onOutputEmittedReleasable.release();
            yield this.stopDebugDaemonAsync();
            this._logger.trace(`Dispose completed`);
        });
    }
    get watchedFilesChanged() {
        return this._watchedFilesChanged;
    }
    onDidStartDebugSessionAsync(debugSession) {
        return __awaiter(this, void 0, void 0, function* () {
            this._currentTunnelUrl = null;
            const debugData = {
                debugSessionId: debugSession.id,
                type: debugSession.type,
                language: this._recognizerResult.identifier
            };
            try {
                // Retrieve the tunnel URL and display it in the status bar.
                const azdsConfigFileUtility = new AzdsConfigFileUtility_1.AzdsConfigFileUtility(this._workspaceFolder);
                const chartConfig = yield azdsConfigFileUtility.getChartConfigAsync();
                this._currentTunnelUrl = yield this.getAccessPoint(chartConfig.name.toLowerCase());
                // Not all services have an URL exposed. Only store and display the status bar URL if the service has one.
                if (this._currentTunnelUrl) {
                    this._statusBarItem.text = this.truncateWithEllipsis(`$(globe) URL: ${this._currentTunnelUrl}`, AzdsWorkspaceFolder.StatusBarTextMaxLength);
                    this._statusBarItem.show();
                }
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.DebugStartSuccess, Object.assign({}, debugData, { hasTunnelUrl: (this._currentTunnelUrl != null).toString() }));
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.DebugStartError, error, debugData);
                vscode.window.showWarningMessage(`Invalid tunnel URL. Please see the task output window to find tunnel URL.`);
            }
        });
    }
    onDidTerminateDebugSession(debugSession) {
        this._currentTunnelUrl = null;
        this._statusBarItem.hide();
        this._logger.trace(TelemetryEvent_1.TelemetryEvent.DebugTerminate, {
            debugSessionId: debugSession.id,
            type: debugSession.type,
            language: this._recognizerResult.identifier
        });
    }
    // TODO: Consider moving this to a separate StringUtility class.
    truncateWithEllipsis(text, maxLength) {
        if (text.length <= maxLength) {
            // Text is already smaller or equal than the maximum length. Nothing to do.
            return text;
        }
        if (maxLength < 3) {
            throw new Error(`The maxLength value (${maxLength}) is smaller than the ellipsis' length (3). Impossible to truncate.`);
        }
        return `${text.substring(0, maxLength - 3)}...`;
    }
    startDebugDaemonAsync(recognizerResult) {
        return __awaiter(this, void 0, void 0, function* () {
            let importValue = null;
            if (recognizerResult.identifier != RecognizerResult_1.LanguageIdentifier.Unknown && recognizerResult.properties != null && recognizerResult.properties.hasOwnProperty('import')) {
                importValue = recognizerResult.properties.import;
            }
            yield this._azdsCliClient.startDaemonAsync(process.pid, importValue);
        });
    }
    stopDebugDaemonAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._azdsCliClient.stopDaemonAsync();
        });
    }
    getAccessPoint(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessPoints = yield this._azdsCliClient.listUrisAsync();
            // Look for an Available public access point.
            let accessPoint = accessPoints.find(accessPoint => accessPoint && accessPoint.status === "Available" && accessPoint.workloadName.toUpperCase() === name.toUpperCase());
            if (!accessPoint) {
                // Fall back to a Tunneled localhost access point.
                accessPoint = accessPoints.find(accessPoint => accessPoint && accessPoint.status === "Tunneled" && accessPoint.workloadName.toUpperCase() === name.toUpperCase());
            }
            if (!accessPoint) {
                // Still no access point: some services don't expose an URL by design.
                return null;
            }
            // Try to parse the accessPoint as an URL to ensure it is valid.
            new url_1.URL(accessPoint.uri);
            return accessPoint.uri;
        });
    }
    watchLanguageIdentifier(recognizerResult) {
        let pattern = "**/azds.yaml";
        switch (recognizerResult.identifier) {
            case RecognizerResult_1.LanguageIdentifier.Dotnetcore:
                pattern = `{${pattern},**/*.csproj}`;
                break;
            case RecognizerResult_1.LanguageIdentifier.Nodejs:
                pattern = `{${pattern},**/package.json}`;
                break;
            case RecognizerResult_1.LanguageIdentifier.JavaMaven:
                pattern = `{${pattern},**/pom.xml}`;
                break;
            default:
                break;
        }
        this._watchedFilesChanged = new Event_1.EventSource();
        this._languageIdentifierWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        const languageIdentifierChangedEvent = (e) => {
            this._logger.trace(`An azds.yaml/language identifier file has been deleted: ${e.fsPath}`);
            this._watchedFilesChanged.trigger();
        };
        this._context.subscriptions.push(this._languageIdentifierWatcher.onDidCreate(languageIdentifierChangedEvent));
        this._context.subscriptions.push(this._languageIdentifierWatcher.onDidDelete(languageIdentifierChangedEvent));
        this._context.subscriptions.push(this._languageIdentifierWatcher.onDidChange(languageIdentifierChangedEvent));
        const debugAssetsPattern = new vscode.RelativePattern(this._workspaceFolder, "{**.vscode**,.vscode/launch.json,.vscode/tasks.json}");
        this._debugAssetsWatcher = vscode.workspace.createFileSystemWatcher(debugAssetsPattern); // watch for delete events only
        this._context.subscriptions.push(this._debugAssetsWatcher.onDidDelete((e) => {
            this._logger.trace(`A debug asset file/folder has been deleted: ${e.fsPath}`);
            this._watchedFilesChanged.trigger();
        }));
    }
}
AzdsWorkspaceFolder.StatusBarTextMaxLength = 44;
exports.AzdsWorkspaceFolder = AzdsWorkspaceFolder;
//# sourceMappingURL=AzdsWorkspaceFolder.js.map