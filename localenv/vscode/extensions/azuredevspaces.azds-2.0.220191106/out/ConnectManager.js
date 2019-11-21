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
const child_process = require("child_process");
const fs = require("fs");
const open_browser = require("opener");
const portfinder = require("portfinder");
const process = require("process");
const request = require("request-promise-native");
const tmp = require("tmp");
const vscode = require("vscode");
const util = require("util");
const KubectlClient_1 = require("./clients/KubectlClient");
const ConnectWizard_1 = require("./ConnectWizard");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const AzdsCliClient_1 = require("./clients/AzdsCliClient");
const CommandRunner_1 = require("./models/CommandRunner");
const existsAsync = util.promisify(fs.exists);
const readFileAsync = util.promisify(fs.readFile);
class ConnectManager {
    constructor(workspaceFolder, context, logger, commandEnvironmentVariables) {
        this._workspaceFolder = workspaceFolder;
        this._context = context;
        this._logger = logger;
        this._kubectl = new KubectlClient_1.KubectlClient(this._logger);
        this._commandRunner = new CommandRunner_1.CommandRunner(this._workspaceFolder.uri.fsPath, commandEnvironmentVariables);
        const uniqueId = guid_typescript_1.Guid.create();
        const statusCommandId = `azds.connect.statusCommand.${uniqueId}`;
        this._context.subscriptions.push(vscode.commands.registerCommand(statusCommandId, () => {
            this.connectStatusCommand();
        }));
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._statusBarItem.command = statusCommandId;
    }
    runConnectWizard(wizardType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (wizardType === WizardType.Disconnect) {
                    this.stopConnect();
                }
                else {
                    if (this._connectStatus === ConnectionStatus.Connecting || this._connectStatus === ConnectionStatus.Connected) {
                        vscode.window.showErrorMessage("A connection is already in progress. Please disconnect first.");
                        return;
                    }
                    this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_WizardStart, { type: wizardType.toString() });
                    var wizard = new ConnectWizard_1.ConnectWizard(this._kubectl, this, this._logger);
                    yield wizard.runWizard(wizardType);
                }
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.Connect_Error, error);
                vscode.window.showErrorMessage(error.toString());
            }
        });
    }
    runConnectCommandForReplaceContainer(namespace, pod, containerName, ports) {
        this.startConnectCommand(namespace, pod, containerName, ports, true, namespace);
    }
    runConnectCommandForCloneContainer(sourceNamespace, pod, containerName, ports, targetSpace) {
        this.startConnectCommand(sourceNamespace, pod, containerName, ports, false, targetSpace);
    }
    runConnectCommandForNewContainer(namespace) {
        this.startConnectCommand(namespace, null, "", [], false, namespace);
    }
    provideDebugConfiguration(debugConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            if (debugConfiguration) {
                if (!debugConfiguration.env) {
                    debugConfiguration.env = {};
                }
                if (this._connectEnvFilePath && (yield existsAsync(this._connectEnvFilePath))) {
                    var content = yield readFileAsync(this._connectEnvFilePath, 'utf8');
                    var env = JSON.parse(content.toString());
                    this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_DebugConfigApplied);
                    for (var i in env) {
                        debugConfiguration.env[i] = env[i];
                    }
                }
            }
            return debugConfiguration;
        });
    }
    launchTerminal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield existsAsync(this._cmdFilePath))) {
                vscode.window.showErrorMessage("Please connect to the cluster first.");
                return;
            }
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_TerminalLaunched);
            let options = {
                name: 'AZDS Connect - ' + this._workspaceFolder.name,
                cwd: (vscode.workspace.workspaceFolders) ? vscode.workspace.workspaceFolders[0].uri.fsPath : "."
            };
            if (process.platform === "win32") {
                options.shellPath = "cmd.exe";
                options.shellArgs = ["/K", this._cmdFilePath];
            }
            else {
                if (this._connectEnvFilePath && (yield existsAsync(this._connectEnvFilePath))) {
                    const content = yield readFileAsync(this._connectEnvFilePath, 'utf8');
                    options.env = JSON.parse(content.toString());
                }
            }
            var t = vscode.window.createTerminal(options);
            t.show();
            this._context.subscriptions.push(t);
        });
    }
    connectStatusCommand() {
        let commandItems = [];
        const urlQuickPickItemsMap = new Map();
        this._workloadAccessPoints.forEach(s => {
            // The spaceName is the namespace where the ingress lives. If you up your application in parent namesapce and then create a child namespace there is going to be an ingress child.s.blah living in the parent.
            // If after that we connect to the child namespace that ingress will now point to our workload in child but it would still live in the parent namespace making its spaceName property inaccurate.
            // During azds up scenarios the ingress get moved to the child space but for connect this doesn't happen and so I'm "fixing" it in the UI side to make things nicer.
            let accessPointSpace = this.getSpaceFromUri(s.uri);
            if (!accessPointSpace) {
                accessPointSpace = s.spaceName;
            }
            const urlQuickPickItem = {
                label: `$(globe) Go to '${s.workloadName}' (${accessPointSpace})`,
                description: `${s.uri}`
            };
            urlQuickPickItemsMap.set(urlQuickPickItem, s.uri);
            commandItems = commandItems.concat(urlQuickPickItem);
        });
        commandItems = commandItems.concat({
            label: 'Open terminal',
            description: "Open a connected terminal"
        }).concat({
            label: 'Connection status',
            description: "Display current connection status"
        }).concat({
            label: 'Disconnect current session',
            description: "Stop current connection"
        }).concat({
            label: 'Show diagnostics info',
            description: "Show services available locally."
        });
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = "";
        quickPick.items = commandItems;
        quickPick.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
            quickPick.hide();
            const urlSelected = urlQuickPickItemsMap.get(selection[0]);
            if (urlSelected != null) {
                // The item selected corresponds to an URL to open.
                open_browser(urlSelected);
                return;
            }
            var result = selection[0].label;
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_StatusLaunched, { command: result });
            if (result === "Open terminal") {
                yield this.launchTerminal();
            }
            else if (result === "Connection status") {
                if (this._connectStatus === ConnectionStatus.Connected) {
                    vscode.window.showInformationMessage("Connected to " + this._connectionTarget);
                }
                else {
                    vscode.window.showInformationMessage("Connection status: " + ConnectionStatus[this._connectStatus]);
                }
            }
            else if (result === "Disconnect current session") {
                yield this.stopConnect();
            }
            else if (result === "Show diagnostics info") {
                if (!this._connectLogChannel) {
                    vscode.window.showInformationMessage("Not connected.");
                }
                else {
                    this._connectLogChannel.show();
                    this._connectLogChannel.appendLine("Recent connection target: " + this._connectionTarget);
                    var serviceIpMap = yield this.getDnsStatus();
                    this._connectLogChannel.appendLine("");
                    this._connectLogChannel.appendLine("Local service IPs:");
                    this._connectLogChannel.appendLine(serviceIpMap);
                    this._connectLogChannel.appendLine("Environment variables:");
                    if (this._connectEnvFilePath && (yield existsAsync(this._connectEnvFilePath))) {
                        const content = yield readFileAsync(this._connectEnvFilePath, 'utf8');
                        const env = JSON.parse(content.toString());
                        for (var i in env) {
                            this._connectLogChannel.appendLine(i + "=" + env[i]);
                        }
                    }
                }
            }
        }));
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }
    startConnectCommand(sourceSpace, pod, container, ports, isReplace, targetSpace) {
        this._workloadAccessPoints = [];
        if (this._connectStatus === ConnectionStatus.Connecting || this._connectStatus === ConnectionStatus.Connected) {
            vscode.window.showErrorMessage("A connection is already in progress. Please disconnect first.");
            return;
        }
        if (this._connectProcess) {
            vscode.window.showErrorMessage("A connection is already running. Please wait for it to completely shutdown.");
            return;
        }
        this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_StartConnect, {
            space: sourceSpace.name,
            replace: isReplace.toString(),
            ports: ports.toString(),
            createNew: (pod === null).toString(),
            targetSpace: (targetSpace.name.length > 0).toString()
        });
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "AZDS Connect",
            cancellable: true
        }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
            token.onCancellationRequested(() => __awaiter(this, void 0, void 0, function* () {
                this._logger.trace("Connect command cancelled.");
                yield this.stopConnect();
            }));
            this._connectionTarget = pod ? sourceSpace.name + "/" + pod.name : sourceSpace.name;
            this._connectEnvFilePath = tmp.tmpNameSync() + ".env";
            this._cmdFilePath = this._connectEnvFilePath + ".cmd";
            var containerPart = container;
            // We are deploying to a different space than the original one
            if (sourceSpace.name != targetSpace.name) {
                containerPart = container + ":" + targetSpace.name;
            }
            let args;
            if (pod && isReplace) {
                args = ["connect", "--container", sourceSpace.name + "/" + pod.name + "/" + containerPart, "--script", this._cmdFilePath, "--env", this._connectEnvFilePath, "--ppid", process.pid.toString()];
            }
            else if (pod && !isReplace) {
                args = ["connect", "--from-container", sourceSpace.name + "/" + pod.name + "/" + containerPart, "--script", this._cmdFilePath, "--env", this._connectEnvFilePath, "--ppid", process.pid.toString()];
            }
            else {
                args = ["connect", "--new-container", sourceSpace.name, "--script", this._cmdFilePath, "--env", this._connectEnvFilePath, "--ppid", process.pid.toString()];
            }
            ports.forEach(port => {
                if (port > 0) {
                    args.push("--local-port");
                    args.push(port.toString());
                }
            });
            const basePort = Math.floor(Math.random() * 10000 + 50000); // basePort between [50000, 60000)
            this._azdsControlPort = yield portfinder.getPortPromise({ port: basePort });
            args.push("--control-port");
            args.push(this._azdsControlPort.toString());
            this._connectLogChannel = vscode.window.createOutputChannel("Dev Spaces Connect");
            this._context.subscriptions.push(this._connectLogChannel);
            this.setConnectStatus(ConnectionStatus.Connecting, "Connecting");
            return new Promise((resolve) => {
                const options = { 'detached': true, 'cwd': this._workspaceFolder.uri.fsPath };
                const p = child_process.spawn("azds", args, options);
                p.stdout.on(`data`, (data) => {
                    var message = data.toString();
                    this._connectLogChannel.appendLine(message);
                    progress.report({ increment: 5, message: message });
                });
                p.stderr.on(`data`, (data) => {
                    var message = data.toString();
                    this._connectLogChannel.appendLine(message);
                    progress.report({ increment: 0, message: message });
                });
                p.on(`error`, (error) => {
                    const errorMessage = `Fail to execute: azds ${args.join(` `)}. Error: ${error.message}. For more information please visit https://aka.ms/azds-connect."`;
                    this._connectLogChannel.appendLine(errorMessage);
                    this._connectLogChannel.show();
                    progress.report({ increment: 100, message: errorMessage });
                    this.setConnectStatus(ConnectionStatus.Failed, "Failed");
                    this._connectProcess = null;
                    resolve();
                    this._logger.error(TelemetryEvent_1.TelemetryEvent.Connect_Error, error);
                    throw new Error(errorMessage);
                });
                p.on(`exit`, (code) => {
                    const message = "azds connect terminated with exit code " + code.toString();
                    this._connectLogChannel.appendLine(message);
                    progress.report({ increment: 100, message: message });
                    this._connectEnvFilePath = "";
                    if (code !== 0) {
                        // something failed, show the output channel with diagnostics logs.
                        this._connectLogChannel.show();
                    }
                    this.setConnectStatus(ConnectionStatus.Disconnected, "Disconnected");
                    this._connectProcess = null;
                    this._workloadAccessPoints = [];
                    resolve();
                });
                this._connectProcess = p;
                var timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    // wait for the environment file being created, which indicates the connection completed.
                    if (fs.existsSync(this._connectEnvFilePath)) {
                        clearInterval(timer);
                        resolve();
                        progress.report({ increment: 100, message: "Environment started." });
                        yield this.delay(200);
                        yield this.launchTerminal();
                        vscode.window.showInformationMessage(`${this.getConnectedString(targetSpace.name, container, ports)}`);
                        this.setConnectStatus(ConnectionStatus.Connected, `${this.getConnectedString(targetSpace.name, container, ports)}`);
                        this._statusBarItem.show();
                        yield this.resolveUriInSpace(targetSpace);
                    }
                }), 100);
            });
        }));
    }
    delay(ms) {
        // tslint:disable-next-line no-string-based-set-timeout
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    setConnectStatus(status, displayMessage) {
        this._connectStatus = status;
        const isConnected = (status === ConnectionStatus.Connected);
        vscode.commands.executeCommand('setContext', 'azds.connect.connected', isConnected);
        this._statusBarItem.text = "Dev Spaces: " + displayMessage;
    }
    stopConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connectProcess === null) {
                vscode.window.showErrorMessage("Not connected!");
                return;
            }
            this._workloadAccessPoints = [];
            try {
                // send post request to http://localhost:<control-port>/api/remoting/stop
                var options = {
                    method: 'POST',
                    uri: "http://localhost:" + this._azdsControlPort.toString() + "/api/remoting/stop/",
                    body: ""
                };
                yield request.post(options);
            }
            catch (error) {
                this._logger.trace("stopConnect failed with " + error.toString());
            }
            ;
            vscode.window.showInformationMessage("Disconnected from cluster.");
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_DisconnectSuccessful);
        });
    }
    getDnsStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var options = {
                    method: 'GET',
                    uri: "http://localhost:50052/api/hosts/info/"
                }; // azds dns uses port 50052
                return yield request.get(options);
            }
            catch (_a) {
                return "Local DNS service is not running.";
            }
        });
    }
    resolveUriInSpace(space) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!space.isDevSpace) {
                return;
            }
            var azdsCliClient = new AzdsCliClient_1.AzdsCliClient(this._commandRunner, this._logger);
            var spacePoints = [];
            try {
                var accessPoints = yield azdsCliClient.listUrisAsync(true);
                var childSpaces = yield this._kubectl.getChildSpaces(space);
                if (accessPoints) {
                    accessPoints.forEach(s => {
                        if (s.status === "Available" && // it has to be a public endpoint (no port forwarding)
                            (s.spaceName === space.name || s.uri.startsWith("http://" + space.name + ".s.")) && // it has to be pointing to a service in space or start with the space name (e.g. we are in a child space but no workload currently running there)
                            childSpaces.filter(cs => s.uri.startsWith("http://" + cs.name + ".s.")).length == 0) { // filter out uris that start with a child of current space.
                            spacePoints.push(s);
                        }
                    });
                }
                this._logger.trace("resolveUriInSpace returned " + spacePoints.length.toString() + " uris.");
                if (spacePoints.length === 0) {
                    vscode.window.showInformationMessage("Please execute 'azds list-uris -a' in command line to list uris for dev space workloads.");
                }
                else {
                    this._workloadAccessPoints = spacePoints;
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(error);
            }
        });
    }
    getConnectedString(spaceName, container, ports) {
        var connectedString = `Connected to ${spaceName}`;
        if (container) {
            connectedString += `/${container}`;
        }
        if (ports.length > 1) {
            connectedString += ` on local ports ${ports.join(', ')}`;
        }
        else if (ports.length === 1) {
            connectedString += ` on local port ${ports.toString()}`;
        }
        return connectedString;
    }
    getSpaceFromUri(uri) {
        const uriParts = uri.split(".s.");
        if (uriParts.length > 1) {
            return uriParts[0].replace("http://", "");
        }
        return null;
    }
}
exports.ConnectManager = ConnectManager;
var WizardType;
(function (WizardType) {
    WizardType[WizardType["Service"] = 1] = "Service";
    WizardType[WizardType["Pod"] = 2] = "Pod";
    WizardType[WizardType["New"] = 3] = "New";
    WizardType[WizardType["Disconnect"] = 4] = "Disconnect";
})(WizardType = exports.WizardType || (exports.WizardType = {}));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus[ConnectionStatus["Disconnected"] = 1] = "Disconnected";
    ConnectionStatus[ConnectionStatus["Connecting"] = 2] = "Connecting";
    ConnectionStatus[ConnectionStatus["Connected"] = 3] = "Connected";
    ConnectionStatus[ConnectionStatus["Failed"] = 4] = "Failed";
})(ConnectionStatus = exports.ConnectionStatus || (exports.ConnectionStatus = {}));
//# sourceMappingURL=ConnectManager.js.map