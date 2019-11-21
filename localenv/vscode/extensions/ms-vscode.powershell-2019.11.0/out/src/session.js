"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const semver = require("semver");
const vscode = require("vscode");
const process_1 = require("./process");
const Settings = require("./settings");
const utils = require("./utils");
const vscode_languageclient_1 = require("vscode-languageclient");
const UpdatePowerShell_1 = require("./features/UpdatePowerShell");
const platform_1 = require("./platform");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus[SessionStatus["NeverStarted"] = 0] = "NeverStarted";
    SessionStatus[SessionStatus["NotStarted"] = 1] = "NotStarted";
    SessionStatus[SessionStatus["Initializing"] = 2] = "Initializing";
    SessionStatus[SessionStatus["Running"] = 3] = "Running";
    SessionStatus[SessionStatus["Stopping"] = 4] = "Stopping";
    SessionStatus[SessionStatus["Failed"] = 5] = "Failed";
})(SessionStatus = exports.SessionStatus || (exports.SessionStatus = {}));
class SessionManager {
    constructor(requiredEditorServicesVersion, log, documentSelector, reporter) {
        this.requiredEditorServicesVersion = requiredEditorServicesVersion;
        this.log = log;
        this.documentSelector = documentSelector;
        this.reporter = reporter;
        this.ShowSessionMenuCommandName = "PowerShell.ShowSessionMenu";
        this.powerShellExePath = "";
        this.sessionStatus = SessionStatus.NeverStarted;
        this.extensionFeatures = [];
        this.registeredCommands = [];
        this.languageServerClient = undefined;
        this.sessionSettings = undefined;
        // When in development mode, VS Code's session ID is a fake
        // value of "someValue.machineId".  Use that to detect dev
        // mode for now until Microsoft/vscode#10272 gets implemented.
        this.inDevelopmentMode = vscode.env.sessionId === "someValue.sessionId";
        this.platformDetails = platform_1.getPlatformDetails();
        this.telemetryReporter = reporter;
        // Get the current version of this extension
        this.hostVersion =
            vscode
                .extensions
                .getExtension("ms-vscode.PowerShell")
                .packageJSON
                .version;
        const osBitness = this.platformDetails.isOS64Bit ? "64-bit" : "32-bit";
        const procBitness = this.platformDetails.isProcess64Bit ? "64-bit" : "32-bit";
        this.log.write(`Visual Studio Code v${vscode.version} ${procBitness}`, `PowerShell Extension v${this.hostVersion}`, `Operating System: ${platform_1.OperatingSystem[this.platformDetails.operatingSystem]} ${osBitness}`);
        // Fix the host version so that PowerShell can consume it.
        // This is needed when the extension uses a prerelease
        // version string like 0.9.1-insiders-1234.
        this.hostVersion = this.hostVersion.split("-")[0];
        this.registerCommands();
    }
    dispose() {
        // Stop the current session
        this.stop();
        // Dispose of all commands
        this.registeredCommands.forEach((command) => { command.dispose(); });
    }
    setExtensionFeatures(extensionFeatures) {
        this.extensionFeatures = extensionFeatures;
    }
    start() {
        this.sessionSettings = Settings.load();
        this.log.startNewLog(this.sessionSettings.developer.editorServicesLogLevel);
        this.focusConsoleOnExecute = this.sessionSettings.integratedConsole.focusConsoleOnExecute;
        this.createStatusBarItem();
        this.powerShellExePath = this.getPowerShellExePath();
        this.suppressRestartPrompt = false;
        if (this.powerShellExePath) {
            this.bundledModulesPath = path.resolve(__dirname, this.sessionSettings.bundledModulesPath);
            if (this.inDevelopmentMode) {
                const devBundledModulesPath = path.resolve(__dirname, this.sessionSettings.developer.bundledModulesPath);
                // Make sure the module's bin path exists
                if (fs.existsSync(path.join(devBundledModulesPath, "PowerShellEditorServices/bin"))) {
                    this.bundledModulesPath = devBundledModulesPath;
                }
                else {
                    this.log.write("\nWARNING: In development mode but PowerShellEditorServices dev module path cannot be " +
                        `found (or has not been built yet): ${devBundledModulesPath}\n`);
                }
            }
            this.editorServicesArgs =
                `-HostName 'Visual Studio Code Host' ` +
                    `-HostProfileId 'Microsoft.VSCode' ` +
                    `-HostVersion '${this.hostVersion}' ` +
                    `-AdditionalModules @('PowerShellEditorServices.VSCode') ` +
                    `-BundledModulesPath '${process_1.PowerShellProcess.escapeSingleQuotes(this.bundledModulesPath)}' ` +
                    `-EnableConsoleRepl `;
            if (this.sessionSettings.developer.editorServicesWaitForDebugger) {
                this.editorServicesArgs += "-WaitForDebugger ";
            }
            if (this.sessionSettings.developer.editorServicesLogLevel) {
                this.editorServicesArgs += `-LogLevel '${this.sessionSettings.developer.editorServicesLogLevel}' `;
            }
            this.startPowerShell();
        }
        else {
            this.setSessionFailure("PowerShell could not be started, click 'Show Logs' for more details.");
        }
    }
    stop() {
        // Shut down existing session if there is one
        this.log.write("Shutting down language client...");
        if (this.sessionStatus === SessionStatus.Failed) {
            // Before moving further, clear out the client and process if
            // the process is already dead (i.e. it crashed)
            this.languageServerClient = undefined;
            this.languageServerProcess = undefined;
        }
        this.sessionStatus = SessionStatus.Stopping;
        // Close the language server client
        if (this.languageServerClient !== undefined) {
            this.languageServerClient.stop();
            this.languageServerClient = undefined;
        }
        // Kill the PowerShell proceses we spawned
        if (this.debugSessionProcess) {
            this.debugSessionProcess.dispose();
        }
        if (this.languageServerProcess) {
            this.languageServerProcess.dispose();
        }
        this.sessionStatus = SessionStatus.NotStarted;
    }
    getSessionDetails() {
        return this.sessionDetails;
    }
    getSessionStatus() {
        return this.sessionStatus;
    }
    getPowerShellVersionDetails() {
        return this.versionDetails;
    }
    createDebugSessionProcess(sessionPath, sessionSettings) {
        this.debugSessionProcess =
            new process_1.PowerShellProcess(this.powerShellExePath, this.bundledModulesPath, "[TEMP] PowerShell Integrated Console", this.log, this.editorServicesArgs + "-DebugServiceOnly ", sessionPath, sessionSettings);
        return this.debugSessionProcess;
    }
    getPowerShellExePath() {
        let powerShellExePath;
        if (!this.sessionSettings.powerShellExePath &&
            this.sessionSettings.developer.powerShellExePath) {
            // Show deprecation message with fix action.
            // We don't need to wait on this to complete
            // because we can finish gathering the configured
            // PowerShell path without the fix
            vscode
                .window
                .showWarningMessage("The 'powershell.developer.powerShellExePath' setting is deprecated, use " +
                "'powershell.powerShellExePath' instead.", "Fix Automatically")
                .then((choice) => {
                if (choice) {
                    this.suppressRestartPrompt = true;
                    Settings
                        .change("powerShellExePath", this.sessionSettings.developer.powerShellExePath, true)
                        .then(() => {
                        return Settings.change("developer.powerShellExePath", undefined, true);
                    })
                        .then(() => {
                        this.suppressRestartPrompt = false;
                    });
                }
            });
        }
        // If powershell.powerShellDefaultVersion specified, attempt to find the PowerShell exe path
        // of the version specified by the setting.
        if ((this.sessionStatus === SessionStatus.NeverStarted) && this.sessionSettings.powerShellDefaultVersion) {
            const powerShellExePaths = platform_1.getAvailablePowerShellExes(this.platformDetails, this.sessionSettings);
            const powerShellDefaultVersion = powerShellExePaths.find((item) => item.versionName === this.sessionSettings.powerShellDefaultVersion);
            if (powerShellDefaultVersion) {
                powerShellExePath = powerShellDefaultVersion.exePath;
            }
            else {
                this.log.writeWarning(`Could not find powerShellDefaultVersion: '${this.sessionSettings.powerShellDefaultVersion}'`);
            }
        }
        // Is there a setting override for the PowerShell path?
        powerShellExePath =
            (powerShellExePath ||
                this.sessionSettings.powerShellExePath ||
                this.sessionSettings.developer.powerShellExePath ||
                "").trim();
        // New versions of PS Core uninstall the previous version
        // so make sure the path stored in the settings exists.
        if (!fs.existsSync(powerShellExePath)) {
            this.log.write(`Path specified by 'powerShellExePath' setting - '${powerShellExePath}' - not found, ` +
                "reverting to default PowerShell path.");
            powerShellExePath = "";
        }
        if (this.platformDetails.operatingSystem === platform_1.OperatingSystem.Windows &&
            powerShellExePath.length > 0) {
            // Check the path bitness
            const fixedPath = platform_1.fixWindowsPowerShellPath(powerShellExePath, this.platformDetails);
            if (fixedPath !== powerShellExePath) {
                const bitness = this.platformDetails.isOS64Bit ? 64 : 32;
                // Show deprecation message with fix action.
                // We don't need to wait on this to complete
                // because we can finish gathering the configured
                // PowerShell path without the fix
                vscode
                    .window
                    .showWarningMessage(`The specified PowerShell path is incorrect for ${bitness}-bit VS Code, using '${fixedPath}' ` +
                    "instead.", "Fix Setting Automatically")
                    .then((choice) => {
                    if (choice) {
                        this.suppressRestartPrompt = true;
                        Settings
                            .change("powerShellExePath", this.sessionSettings.developer.powerShellExePath, true)
                            .then(() => {
                            return Settings.change("developer.powerShellExePath", undefined, true);
                        })
                            .then(() => {
                            this.suppressRestartPrompt = false;
                        });
                    }
                });
                powerShellExePath = fixedPath;
            }
        }
        return powerShellExePath.length > 0
            ? this.resolvePowerShellPath(powerShellExePath)
            : platform_1.getDefaultPowerShellPath(this.platformDetails, this.sessionSettings.useX86Host);
    }
    // ----- LanguageClient middleware methods -----
    resolveCodeLens(codeLens, token, next) {
        const resolvedCodeLens = next(codeLens, token);
        const resolveFunc = (codeLensToFix) => {
            if (codeLensToFix.command.command === "editor.action.showReferences") {
                const oldArgs = codeLensToFix.command.arguments;
                // Our JSON objects don't get handled correctly by
                // VS Code's built in editor.action.showReferences
                // command so we need to convert them into the
                // appropriate types to send them as command
                // arguments.
                codeLensToFix.command.arguments = [
                    vscode.Uri.parse(oldArgs[0]),
                    new vscode.Position(oldArgs[1].line, oldArgs[1].character),
                    oldArgs[2].map((position) => {
                        return new vscode.Location(vscode.Uri.parse(position.uri), new vscode.Range(position.range.start.line, position.range.start.character, position.range.end.line, position.range.end.character));
                    }),
                ];
            }
            return codeLensToFix;
        };
        if (resolvedCodeLens.then) {
            return resolvedCodeLens.then(resolveFunc);
        }
        else if (resolvedCodeLens) {
            return resolveFunc(resolvedCodeLens);
        }
        return resolvedCodeLens;
    }
    onConfigurationUpdated() {
        const settings = Settings.load();
        this.focusConsoleOnExecute = settings.integratedConsole.focusConsoleOnExecute;
        // Detect any setting changes that would affect the session
        if (!this.suppressRestartPrompt &&
            (settings.useX86Host !== this.sessionSettings.useX86Host ||
                settings.powerShellExePath.toLowerCase() !== this.sessionSettings.powerShellExePath.toLowerCase() ||
                (settings.developer.powerShellExePath ? settings.developer.powerShellExePath.toLowerCase() : null) !==
                    (this.sessionSettings.developer.powerShellExePath
                        ? this.sessionSettings.developer.powerShellExePath.toLowerCase() : null) ||
                settings.developer.editorServicesLogLevel.toLowerCase() !==
                    this.sessionSettings.developer.editorServicesLogLevel.toLowerCase() ||
                settings.developer.bundledModulesPath.toLowerCase() !==
                    this.sessionSettings.developer.bundledModulesPath.toLowerCase())) {
            vscode.window.showInformationMessage("The PowerShell runtime configuration has changed, would you like to start a new session?", "Yes", "No")
                .then((response) => {
                if (response === "Yes") {
                    this.restartSession();
                }
            });
        }
    }
    setStatusBarVersionString(runspaceDetails) {
        const psVersion = runspaceDetails.powerShellVersion;
        let versionString = this.versionDetails.architecture === "x86"
            ? `${psVersion.displayVersion} (${psVersion.architecture})`
            : psVersion.displayVersion;
        if (runspaceDetails.runspaceType !== RunspaceType.Local) {
            versionString += ` [${runspaceDetails.connectionString}]`;
        }
        this.setSessionStatus(versionString, SessionStatus.Running);
    }
    registerCommands() {
        this.registeredCommands = [
            vscode.commands.registerCommand("PowerShell.RestartSession", () => { this.restartSession(); }),
            vscode.commands.registerCommand(this.ShowSessionMenuCommandName, () => { this.showSessionMenu(); }),
            vscode.workspace.onDidChangeConfiguration(() => this.onConfigurationUpdated()),
            vscode.commands.registerCommand("PowerShell.ShowSessionConsole", (isExecute) => { this.showSessionConsole(isExecute); }),
        ];
    }
    startPowerShell() {
        this.setSessionStatus("Starting PowerShell...", SessionStatus.Initializing);
        const sessionFilePath = utils.getSessionFilePath(Math.floor(100000 + Math.random() * 900000));
        this.languageServerProcess =
            new process_1.PowerShellProcess(this.powerShellExePath, this.bundledModulesPath, "PowerShell Integrated Console", this.log, this.editorServicesArgs, sessionFilePath, this.sessionSettings);
        this.languageServerProcess.onExited(() => {
            if (this.sessionStatus === SessionStatus.Running) {
                this.setSessionStatus("Session exited", SessionStatus.Failed);
                this.promptForRestart();
            }
        });
        this.languageServerProcess
            .start("EditorServices")
            .then((sessionDetails) => {
            this.sessionDetails = sessionDetails;
            if (sessionDetails.status === "started") {
                this.log.write("Language server started.");
                // Start the language service client
                this.startLanguageClient(sessionDetails);
            }
            else if (sessionDetails.status === "failed") {
                if (sessionDetails.reason === "unsupported") {
                    this.setSessionFailure("PowerShell language features are only supported on PowerShell version 3 and above.  " +
                        `The current version is ${sessionDetails.powerShellVersion}.`);
                }
                else if (sessionDetails.reason === "languageMode") {
                    this.setSessionFailure("PowerShell language features are disabled due to an unsupported LanguageMode: " +
                        `${sessionDetails.detail}`);
                }
                else {
                    this.setSessionFailure(`PowerShell could not be started for an unknown reason '${sessionDetails.reason}'`);
                }
            }
            else {
                // TODO: Handle other response cases
            }
        }, (error) => {
            this.log.write("Language server startup failed.");
            this.setSessionFailure("The language service could not be started: ", error);
        });
    }
    promptForRestart() {
        vscode.window.showErrorMessage("The PowerShell session has terminated due to an error, would you like to restart it?", "Yes", "No")
            .then((answer) => { if (answer === "Yes") {
            this.restartSession();
        } });
    }
    startLanguageClient(sessionDetails) {
        // Log the session details object
        this.log.write(JSON.stringify(sessionDetails));
        try {
            this.log.write(`Connecting to language service on pipe ${sessionDetails.languageServicePipeName}...`);
            const connectFunc = () => {
                return new Promise((resolve, reject) => {
                    const socket = net.connect(sessionDetails.languageServicePipeName);
                    socket.on("connect", () => {
                        this.log.write("Language service connected.");
                        resolve({ writer: socket, reader: socket });
                    });
                });
            };
            const clientOptions = {
                documentSelector: this.documentSelector,
                synchronize: {
                    configurationSection: utils.PowerShellLanguageId,
                },
                errorHandler: {
                    // Override the default error handler to prevent it from
                    // closing the LanguageClient incorrectly when the socket
                    // hangs up (ECONNRESET errors).
                    error: (error, message, count) => {
                        // TODO: Is there any error worth terminating on?
                        return vscode_languageclient_1.ErrorAction.Continue;
                    },
                    closed: () => {
                        // We have our own restart experience
                        return vscode_languageclient_1.CloseAction.DoNotRestart;
                    },
                },
                revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
                middleware: this,
            };
            this.languageServerClient =
                new vscode_languageclient_1.LanguageClient("PowerShell Editor Services", connectFunc, clientOptions);
            this.languageServerClient.onReady().then(() => {
                this.languageServerClient
                    .sendRequest(exports.PowerShellVersionRequestType)
                    .then((versionDetails) => __awaiter(this, void 0, void 0, function* () {
                    this.versionDetails = versionDetails;
                    if (!this.inDevelopmentMode) {
                        this.telemetryReporter.sendTelemetryEvent("powershellVersionCheck", { powershellVersion: versionDetails.version });
                    }
                    this.setSessionStatus(this.versionDetails.architecture === "x86"
                        ? `${this.versionDetails.displayVersion} (${this.versionDetails.architecture})`
                        : this.versionDetails.displayVersion, SessionStatus.Running);
                    // If the user opted to not check for updates, then don't.
                    if (!this.sessionSettings.promptToUpdatePowerShell) {
                        return;
                    }
                    try {
                        const localVersion = semver.parse(this.versionDetails.version);
                        if (semver.lt(localVersion, "6.0.0")) {
                            // Skip prompting when using Windows PowerShell for now.
                            return;
                        }
                        // Fetch the latest PowerShell releases from GitHub.
                        const isPreRelease = !!semver.prerelease(localVersion);
                        const release = yield UpdatePowerShell_1.GitHubReleaseInformation.FetchLatestRelease(isPreRelease);
                        yield UpdatePowerShell_1.InvokePowerShellUpdateCheck(this.languageServerClient, localVersion, this.versionDetails.architecture, release);
                    }
                    catch (_a) {
                        // best effort. This probably failed to fetch the data from GitHub.
                    }
                }));
                // Send the new LanguageClient to extension features
                // so that they can register their message handlers
                // before the connection is established.
                this.updateExtensionFeatures(this.languageServerClient);
                this.languageServerClient.onNotification(exports.RunspaceChangedEventType, (runspaceDetails) => { this.setStatusBarVersionString(runspaceDetails); });
            }, (reason) => {
                this.setSessionFailure("Could not start language service: ", reason);
            });
            this.languageServerClient.start();
        }
        catch (e) {
            this.setSessionFailure("The language service could not be started: ", e);
        }
    }
    updateExtensionFeatures(languageClient) {
        this.extensionFeatures.forEach((feature) => {
            feature.setLanguageClient(languageClient);
        });
    }
    restartSession() {
        this.stop();
        this.start();
    }
    createStatusBarItem() {
        if (this.statusBarItem === undefined) {
            // Create the status bar item and place it right next
            // to the language indicator
            this.statusBarItem =
                vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
            this.statusBarItem.command = this.ShowSessionMenuCommandName;
            this.statusBarItem.tooltip = "Show PowerShell Session Menu";
            this.statusBarItem.show();
            vscode.window.onDidChangeActiveTextEditor((textEditor) => {
                if (textEditor === undefined
                    || textEditor.document.languageId !== "powershell") {
                    this.statusBarItem.hide();
                }
                else {
                    this.statusBarItem.show();
                }
            });
        }
    }
    setSessionStatus(statusText, status) {
        // Set color and icon for 'Running' by default
        let statusIconText = "$(terminal) ";
        let statusColor = "#affc74";
        if (status === SessionStatus.Initializing) {
            statusIconText = "$(sync) ";
            statusColor = "#f3fc74";
        }
        else if (status === SessionStatus.Failed) {
            statusIconText = "$(alert) ";
            statusColor = "#fcc174";
        }
        this.sessionStatus = status;
        this.statusBarItem.color = statusColor;
        this.statusBarItem.text = statusIconText + statusText;
    }
    setSessionFailure(message, ...additionalMessages) {
        this.log.writeAndShowError(message, ...additionalMessages);
        this.setSessionStatus("Initialization Error", SessionStatus.Failed);
    }
    changePowerShellExePath(exePath) {
        this.suppressRestartPrompt = true;
        Settings
            .change("powerShellExePath", exePath, true)
            .then(() => this.restartSession());
    }
    resolvePowerShellPath(powerShellExePath) {
        const resolvedPath = path.resolve(__dirname, powerShellExePath);
        // If the path does not exist, show an error
        if (!utils.checkIfFileExists(resolvedPath)) {
            this.setSessionFailure("powershell.exe cannot be found or is not accessible at path " + resolvedPath);
            return null;
        }
        return resolvedPath;
    }
    getPowerShellVersionLabel() {
        if (this.powerShellExePath) {
            const powerShellCommandLine = [
                this.powerShellExePath,
                "-NoProfile",
                "-NonInteractive",
            ];
            // Only add ExecutionPolicy param on Windows
            if (utils.isWindowsOS()) {
                powerShellCommandLine.push("-ExecutionPolicy", "Bypass");
            }
            powerShellCommandLine.push("-Command", "'$PSVersionTable | ConvertTo-Json'");
            const powerShellOutput = cp.execSync(powerShellCommandLine.join(" "));
            const versionDetails = JSON.parse(powerShellOutput.toString());
            return versionDetails.PSVersion.Label;
        }
        else {
            // TODO: throw instead?
            return null;
        }
    }
    showSessionConsole(isExecute) {
        if (this.languageServerProcess) {
            this.languageServerProcess.showConsole(isExecute && !this.focusConsoleOnExecute);
        }
    }
    showSessionMenu() {
        const currentExePath = (this.powerShellExePath || "").toLowerCase();
        const availablePowerShellExes = platform_1.getAvailablePowerShellExes(this.platformDetails, this.sessionSettings);
        let sessionText;
        switch (this.sessionStatus) {
            case SessionStatus.Running:
            case SessionStatus.Initializing:
            case SessionStatus.NotStarted:
            case SessionStatus.NeverStarted:
            case SessionStatus.Stopping:
                const currentPowerShellExe = availablePowerShellExes
                    .find((item) => item.exePath.toLowerCase() === currentExePath);
                const powerShellSessionName = currentPowerShellExe ?
                    currentPowerShellExe.versionName :
                    `PowerShell ${this.versionDetails.displayVersion} ` +
                        `(${this.versionDetails.architecture}) ${this.versionDetails.edition} Edition ` +
                        `[${this.versionDetails.version}]`;
                sessionText = `Current session: ${powerShellSessionName}`;
                break;
            case SessionStatus.Failed:
                sessionText = "Session initialization failed, click here to show PowerShell extension logs";
                break;
            default:
                throw new TypeError("Not a valid value for the enum 'SessionStatus'");
        }
        const powerShellItems = availablePowerShellExes
            .filter((item) => item.exePath.toLowerCase() !== currentExePath)
            .map((item) => {
            return new SessionMenuItem(`Switch to: ${item.versionName}`, () => { this.changePowerShellExePath(item.exePath); });
        });
        const menuItems = [
            new SessionMenuItem(sessionText, () => { vscode.commands.executeCommand("PowerShell.ShowLogs"); }),
            new SessionMenuItem("Restart Current Session", () => { this.restartSession(); }),
            // Add all of the different PowerShell options
            ...powerShellItems,
            new SessionMenuItem("Open Session Logs Folder", () => { vscode.commands.executeCommand("PowerShell.OpenLogFolder"); }),
        ];
        vscode
            .window
            .showQuickPick(menuItems)
            .then((selectedItem) => { selectedItem.callback(); });
    }
}
exports.SessionManager = SessionManager;
class SessionMenuItem {
    constructor(label, 
    // tslint:disable-next-line:no-empty
    callback = () => { }) {
        this.label = label;
        this.callback = callback;
    }
}
exports.PowerShellVersionRequestType = new vscode_languageclient_1.RequestType0("powerShell/getVersion");
exports.RunspaceChangedEventType = new vscode_languageclient_1.NotificationType("powerShell/runspaceChanged");
var RunspaceType;
(function (RunspaceType) {
    RunspaceType[RunspaceType["Local"] = 0] = "Local";
    RunspaceType[RunspaceType["Process"] = 1] = "Process";
    RunspaceType[RunspaceType["Remote"] = 2] = "Remote";
})(RunspaceType = exports.RunspaceType || (exports.RunspaceType = {}));
//# sourceMappingURL=session.js.map