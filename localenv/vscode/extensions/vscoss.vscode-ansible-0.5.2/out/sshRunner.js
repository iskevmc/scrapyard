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
const terminalBaseRunner_1 = require("./terminalBaseRunner");
const vscode = require("vscode");
const utilities = require("./utilities");
const constants_1 = require("./constants");
const telemetryClient_1 = require("./telemetryClient");
const path = require("path");
const fs = require("fs-extra");
const SSHConsole_1 = require("./SSHConsole");
const os = require("os");
const timers_1 = require("timers");
const folderSyncer_1 = require("./folderSyncer");
const addNewHost = 'Add New Host';
const browseThePC = 'Browse the PC..';
class SSHRunner extends terminalBaseRunner_1.TerminalBaseRunner {
    constructor(outputChannel) {
        super(outputChannel);
        this.terminalList = {};
        this.folderSyncer = new folderSyncer_1.FolderSyncer(outputChannel);
        vscode.window.onDidCloseTerminal((terminal) => {
            var terminalNames = Object.keys(this.terminalList);
            for (let name of terminalNames) {
                if (name === terminal.name) {
                    this.terminalList[name].dispose();
                    delete this.terminalList[name];
                    break;
                }
            }
        });
    }
    getCmds(playbook, envs, terminalId) {
        var cmdsToTerminal = [];
        if (envs) {
            for (var item in envs) {
                cmdsToTerminal.push('export ' + item + '=' + envs[item]);
            }
        }
        // add azure user agent
        if (utilities.isTelemetryEnabled()) {
            cmdsToTerminal.push('export ' + constants_1.Constants.UserAgentName + '=' + utilities.getUserAgent());
        }
        return cmdsToTerminal;
    }
    runAnsibleInTerminal(playbook, cmds, terminalId) {
        return __awaiter(this, void 0, void 0, function* () {
            telemetryClient_1.TelemetryClient.sendEvent('ssh');
            // check node is installed
            if (!(yield utilities.IsNodeInstalled())) {
                return;
            }
            // get ssh server
            let targetServer = yield getSSHServer();
            if (!targetServer) {
                return;
            }
            // set default source file/folder, destination file/folder, destination playbook name
            let source = playbook;
            let target = path.join('\./', path.basename(playbook));
            let targetPlaybook = target;
            // check configuration
            let fileConfig = this.getWorkSpaceFileCopyConfig(playbook, targetServer.host);
            if (fileConfig) {
                if (fileConfig.targetPath != constants_1.Constants.NotShowThisAgain) {
                    targetPlaybook = utilities.posixPath(path.join(fileConfig.targetPath, path.relative(fileConfig.sourcePath, playbook)));
                    // if not saved on copy, copy playbook to remote
                    if (!fileConfig.copyOnSave) {
                        yield utilities.copyFilesRemote(source, targetPlaybook, targetServer);
                    }
                }
            }
            else {
                // if no config in settings.json, ask for promote whether to copy workspace, thend do copy, then run it.
                const okItem = { title: "always" };
                const cancelItem = { title: "no, not show this again" };
                let response = yield vscode.window.showWarningMessage('Copy workspace to remote host?', okItem, cancelItem);
                let existingConfig = utilities.getCodeConfiguration('ansible', 'fileCopyConfig');
                if (!existingConfig) {
                    existingConfig = [];
                }
                let fileConfig = {
                    server: targetServer.host,
                    sourcePath: utilities.getWorkspaceRoot(playbook) + '/',
                    targetPath: path.join('\./', path.basename(utilities.getWorkspaceRoot(playbook))) + '/',
                    copyOnSave: true
                };
                if (response && response === okItem) {
                    targetPlaybook = utilities.posixPath(['\./' + path.basename(fileConfig.sourcePath), path.relative(fileConfig.sourcePath, playbook)]
                        .join(path.posix.sep));
                    // do workspace copy
                    this._outputChannel.append("\nCopy " + fileConfig.sourcePath + " to " + fileConfig.server);
                    const progress = this.delayedInterval(() => { this._outputChannel.append('.'); }, 800);
                    try {
                        yield utilities.copyFilesRemote(fileConfig.sourcePath, fileConfig.targetPath, targetServer);
                        progress.cancel();
                    }
                    catch (err) {
                        progress.cancel();
                        if (err) {
                            this._outputChannel.appendLine('\nFailed to copy ' + fileConfig.sourcePath + ' to ' + targetServer.host + ': ' + err);
                            this._outputChannel.show();
                        }
                        return;
                    }
                }
                else {
                    fileConfig.targetPath = constants_1.Constants.NotShowThisAgain;
                    // if cancel, copy playbook only
                    yield utilities.copyFilesRemote(source, target, targetServer);
                }
                // update config
                existingConfig.push(fileConfig);
                utilities.updateCodeConfiguration('ansible', 'fileCopyConfig', existingConfig);
            }
            // run playbook
            this.OpenTerminal(targetServer, targetPlaybook, cmds);
        });
    }
    OpenTerminal(server, targetPlaybook, cmds) {
        let terminal = undefined;
        let runPlaybookCmd = this.getRunPlaybookCmd(targetPlaybook);
        cmds.push(runPlaybookCmd);
        let reuse = utilities.getCodeConfiguration('ansible', 'reuseSSHTerminal');
        if (reuse) {
            // if reuse, directly return
            let terminalNames = Object.keys(this.terminalList);
            for (let t of terminalNames) {
                if (t === this.getTerminalName(server.host)) {
                    terminal = this.terminalList[t];
                    break;
                }
            }
        }
        if (terminal) {
            terminal.show();
            this.sendCommandsToTerminal(terminal, cmds);
        }
        else {
            SSHConsole_1.openSSHConsole(this._outputChannel, server)
                .then((term) => {
                if (!term) {
                    this._outputChannel.appendLine('\nSSH connection failed.');
                    this._outputChannel.show();
                    return;
                }
                this.terminalList[this.getTerminalName(server.host)] = term;
                var count = 60;
                var _localthis = this;
                const tempFile = path.join(os.tmpdir(), 'vscodeansible-ssh-' + server.host + '.log');
                var interval = timers_1.setInterval(function () {
                    count--;
                    if (count > 0) {
                        if (fs.existsSync(tempFile)) {
                            count = 0;
                            fs.removeSync(tempFile);
                            _localthis.sendCommandsToTerminal(term, cmds);
                            term.show();
                            timers_1.clearInterval(interval);
                        }
                    }
                    else {
                        timers_1.clearInterval(interval);
                        _localthis._outputChannel.appendLine('\nFailed to connect to ' + server.host + ' after 30 seconds');
                    }
                }, 500);
            });
        }
    }
    getTerminalName(host) {
        return 'SSH ' + host;
    }
    sendCommandsToTerminal(terminal, cmds) {
        for (let cmd of cmds) {
            terminal.sendText(cmd);
        }
    }
    getTargetFolder(workspaceRoot, playbook) {
        return '\./' + path.relative(workspaceRoot, path.dirname(playbook));
    }
    delayedInterval(func, interval) {
        const handle = timers_1.setInterval(func, interval);
        return {
            cancel: () => timers_1.clearInterval(handle)
        };
    }
    getWorkSpaceFileCopyConfig(playbook, host) {
        let fileSyncConfig = utilities.getCodeConfiguration('ansible', 'fileCopyConfig');
        if (fileSyncConfig) {
            for (let config of fileSyncConfig) {
                if (config.server === host && utilities.isSubPath(playbook, config.sourcePath)) {
                    return config;
                }
            }
        }
        return null;
    }
}
exports.SSHRunner = SSHRunner;
function addSSHServer() {
    return __awaiter(this, void 0, void 0, function* () {
        let server = {};
        var host = yield vscode.window.showInputBox({ value: 'host', prompt: 'SSH host', placeHolder: 'host', password: false });
        if (host) {
            var port = yield vscode.window.showInputBox({ value: '22', prompt: 'SSH port', placeHolder: 'port', password: false });
            if (port) {
                var user = yield vscode.window.showInputBox({ value: '', prompt: 'SSH username', placeHolder: 'username', password: false });
                if (user && user != '') {
                    var password = yield vscode.window.showInputBox({ value: '', prompt: 'SSH password', placeHolder: 'password', password: true });
                    server.host = host;
                    server.port = +port;
                    server.user = user;
                    if (password && password != '') {
                        server.password = password;
                        utilities.updateSSHConfig(server);
                        return server;
                    }
                    else {
                        var defaultPath = path.join(os.homedir(), '.ssh', 'id_rsa');
                        var items = [defaultPath, browseThePC];
                        var pick = yield vscode.window.showQuickPick(items);
                        if (pick) {
                            var keyfile = pick;
                            if (pick === browseThePC) {
                                var result = yield vscode.window.showOpenDialog({
                                    canSelectFiles: true,
                                    canSelectFolders: false, canSelectMany: false
                                });
                                if (result && result.length === 1) {
                                    keyfile = result[0].fsPath;
                                }
                            }
                            if (!fs.existsSync(keyfile)) {
                                this._outputChannel.appendLine('Invalid key file: ' + keyfile);
                                return null;
                            }
                            server.key = keyfile;
                            if (keyfile) {
                                var passphrase = yield vscode.window.showInputBox({ value: '', prompt: 'key passphrase', placeHolder: 'passphrase', password: true });
                                if (passphrase) {
                                    server.passphrase = passphrase;
                                }
                                utilities.updateSSHConfig(server);
                                return server;
                            }
                        }
                    }
                }
            }
        }
        return null;
    });
}
exports.addSSHServer = addSSHServer;
function getSSHServer() {
    return __awaiter(this, void 0, void 0, function* () {
        let servers = utilities.getSSHConfig();
        let server = {};
        if (servers) {
            let hosts = {};
            for (let host of servers) {
                hosts[host.host] = host;
            }
            var quickPickList = Object.keys(hosts);
            quickPickList.push(addNewHost);
            let choice = yield vscode.window.showQuickPick(quickPickList);
            if (choice === addNewHost) {
                let server = yield addSSHServer();
                return server;
            }
            else {
                return hosts[choice];
            }
        }
        else {
            return yield addSSHServer();
        }
    });
}
exports.getSSHServer = getSSHServer;
//# sourceMappingURL=sshRunner.js.map