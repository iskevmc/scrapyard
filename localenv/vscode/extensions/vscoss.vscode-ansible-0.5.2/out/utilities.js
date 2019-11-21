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
const child_process = require("child_process");
const path = require("path");
const fsExtra = require("fs-extra");
const yamljs = require("yamljs");
const os = require("os");
const constants_1 = require("./constants");
const opn = require("opn");
const scp = require("scp2");
const timers_1 = require("timers");
const ssh = require("ssh2");
const sshConfigFile = path.join(os.homedir(), '.ssh', 'servers.json');
function localExecCmd(cmd, args, outputChannel, cb) {
    try {
        var cp = require('child_process').spawn(cmd, args);
        cp.stdout.on('data', function (data) {
            if (outputChannel) {
                outputChannel.appendLine('\n' + String(data));
                outputChannel.show();
            }
        });
        cp.stderr.on('data', function (data) {
            if (outputChannel)
                outputChannel.appendLine('\n' + String(data));
        });
        cp.on('close', function (code) {
            if (cb) {
                if (0 == code) {
                    cb();
                }
                else {
                    var e = new Error("External command failed");
                    e.stack = "exit code: " + code;
                    cb(e);
                }
            }
        });
        cp.on('error', function (code) {
            if (cb) {
                cb(code);
            }
        });
    }
    catch (e) {
        e.stack = "ERROR: " + e;
        if (cb)
            cb(e);
    }
}
exports.localExecCmd = localExecCmd;
function isDockerInstalled(outputChannel, cb) {
    var cmd = 'cmd.exe';
    var args = ['/c', 'docker', '-v'];
    if (process.platform === 'linux' || process.platform === 'darwin') {
        cmd = 'docker';
        args = ['--version'];
    }
    localExecCmd(cmd, args, outputChannel, function (err) {
        if (err) {
            vscode.window.showErrorMessage('Docker isn\'t installed, please install Docker first!');
        }
        cb(err);
    });
}
exports.isDockerInstalled = isDockerInstalled;
function isAnsibleInstalled(outputChannel, cb) {
    var cmd = process.platform === 'win32' ? 'ansible --version' : 'type ansible';
    child_process.exec(cmd).on('exit', function (code) {
        if (!code) {
            cb();
        }
        else {
            outputChannel.appendLine('\nPlease go to below link and install Ansible first.');
            outputChannel.appendLine('http://docs.ansible.com/ansible/latest/intro_installation.html');
            outputChannel.show();
            const open = { title: "View" };
            vscode.window.showErrorMessage('Please go to below link and install Ansible first.', open)
                .then(response => {
                if (response === open) {
                    opn('http://docs.ansible.com/ansible/latest/intro_installation.html');
                }
            });
        }
    });
}
exports.isAnsibleInstalled = isAnsibleInstalled;
function IsNodeInstalled() {
    var cmd = 'node --version';
    return new Promise((resolve, reject) => {
        child_process.exec(cmd).on('exit', function (code) {
            if (!code) {
                return resolve(true);
            }
            else {
                const open = { title: "View" };
                vscode.window.showErrorMessage('Please install Node.js 6 or later version.', open)
                    .then(response => {
                    if (response === open) {
                        opn('https://nodejs.org');
                    }
                    return resolve(false);
                });
            }
        });
    });
}
exports.IsNodeInstalled = IsNodeInstalled;
function validatePlaybook(playbook) {
    if (!fsExtra.existsSync(playbook)) {
        vscode.window.showErrorMessage('No such file or directory: ' + playbook);
        return false;
    }
    if (path.parse(playbook).ext != '.yml' && path.parse(playbook).ext != '.yaml') {
        vscode.window.showErrorMessage('Playbook is not yaml file: ' + playbook);
        return false;
    }
    return true;
}
exports.validatePlaybook = validatePlaybook;
// return array of credential items
// eg. azure_subs_id xxxxx
function parseCredentialsFile(outputChannel) {
    var configValue = getCredentialsFile();
    if (outputChannel != null) {
        outputChannel.appendLine('\nCredential file: ' + configValue);
        outputChannel.show();
    }
    var credentials = [];
    if (fsExtra.pathExistsSync(configValue)) {
        var creds = yamljs.load(configValue);
        for (var cloudprovider in creds) {
            for (var configItem in creds[cloudprovider]) {
                if (!creds[cloudprovider][configItem].startsWith('your_')) {
                    credentials[configItem] = creds[cloudprovider][configItem];
                }
            }
        }
    }
    return credentials;
}
exports.parseCredentialsFile = parseCredentialsFile;
function getCredentialsFile() {
    var configValue = getCodeConfiguration('ansible', constants_1.Constants.Config_credentialsFile);
    if (configValue === undefined || configValue === '') {
        configValue = path.join(os.homedir(), '.vscode', 'ansible-credentials.yml');
    }
    return configValue;
}
exports.getCredentialsFile = getCredentialsFile;
function generateCredentialsFile() {
    const credentialFilePath = path.join(os.homedir(), '.vscode', 'ansible-credentials.yml');
    if (!fsExtra.existsSync(credentialFilePath)) {
        fsExtra.copySync(path.join(__dirname, '..', 'config', 'credentials.yml'), credentialFilePath);
    }
}
exports.generateCredentialsFile = generateCredentialsFile;
function getUserAgent() {
    return constants_1.Constants.ExtensionId + '-' + vscode.extensions.getExtension(constants_1.Constants.ExtensionId).packageJSON.version;
}
exports.getUserAgent = getUserAgent;
function isCredentialConfigured() {
    return getCodeConfiguration(null, constants_1.Constants.Config_credentialConfigured);
}
exports.isCredentialConfigured = isCredentialConfigured;
function isTelemetryEnabled() {
    return getCodeConfiguration('telemetry', 'enableTelemetry');
}
exports.isTelemetryEnabled = isTelemetryEnabled;
function getCodeConfiguration(section, configName) {
    if (!section) {
        section = 'ansible';
    }
    if (vscode.workspace.getConfiguration(section).has(configName)) {
        return vscode.workspace.getConfiguration(section).get(configName);
    }
    else {
        return null;
    }
}
exports.getCodeConfiguration = getCodeConfiguration;
function updateCodeConfiguration(section, configName, configValue, global = false) {
    if (!section) {
        section = 'ansible';
    }
    return vscode.workspace.getConfiguration(section).update(configName, configValue, global);
}
exports.updateCodeConfiguration = updateCodeConfiguration;
function copyFilesRemote(source, dest, sshServer) {
    return new Promise((resolve, reject) => {
        if (!sshServer) {
            reject('Invalid ssh server!');
        }
        if (!source || !fsExtra.existsSync(source)) {
            reject('No such file or directory: ' + source);
        }
        var client;
        if (sshServer.password) {
            client = {
                host: sshServer.host,
                port: sshServer.port,
                username: sshServer.user,
                password: sshServer.password,
                path: dest
            };
        }
        else if (sshServer.key) {
            if (!fsExtra.existsSync(sshServer.key)) {
                vscode.window.showErrorMessage('File does not exist: ' + sshServer.key);
                reject('File does not exist: ' + sshServer.key);
            }
            client = {
                host: sshServer.host,
                port: sshServer.port,
                username: sshServer.user,
                privateKey: String(fsExtra.readFileSync(sshServer.key)),
                passphrase: sshServer.passphrase,
                path: dest
            };
        }
        try {
            var conn = new ssh.Client();
            conn.connect({
                host: sshServer.host,
                port: sshServer.port,
                username: sshServer.user,
                password: sshServer.password,
                passphrase: sshServer.passphrase,
                privateKey: sshServer.key ? fsExtra.readFileSync(sshServer.key) : sshServer.key
            });
            conn.on('error', (err) => {
                reject(err);
            });
            conn.end();
            scp.scp(source, client, (err) => {
                if (err) {
                    vscode.window.showErrorMessage('Failed to copy ' + source + ' to ' + sshServer.host + ': ' + err);
                    return reject(err);
                }
                else {
                    return resolve();
                }
            });
        }
        catch (err) {
            reject('scp error: ' + err);
        }
    });
}
exports.copyFilesRemote = copyFilesRemote;
function scpCopy(source, client, host, reject, resolve) {
    scp.scp(source, client, (err) => {
        if (err) {
            vscode.window.showErrorMessage('Failed to copy ' + source + ' to ' + host + ': ' + err);
            reject(err);
        }
        resolve();
    });
}
function getSSHConfig() {
    if (fsExtra.existsSync(sshConfigFile)) {
        try {
            return JSON.parse(fsExtra.readFileSync(sshConfigFile));
        }
        catch (err) {
            return null;
        }
    }
    return null;
}
exports.getSSHConfig = getSSHConfig;
function getSSHServer(hostname) {
    let servers = getSSHConfig();
    for (let server of servers) {
        if (server.host === hostname) {
            return server;
        }
    }
    return null;
}
exports.getSSHServer = getSSHServer;
function updateSSHConfig(server) {
    var servers = [];
    if (!server) {
        return;
    }
    if (fsExtra.existsSync(sshConfigFile)) {
        try {
            servers = JSON.parse(fsExtra.readFileSync(sshConfigFile));
        }
        catch (err) {
        }
    }
    else {
        fsExtra.ensureDirSync(path.dirname(sshConfigFile));
    }
    for (let i = 0; i < servers.length; i++) {
        if (servers[i].host.trim() === server.host.trim()) {
            servers.splice(i, 1);
            break;
        }
    }
    servers.push(server);
    fsExtra.writeJsonSync(sshConfigFile, servers, { spaces: '  ' });
}
exports.updateSSHConfig = updateSSHConfig;
function stop(interval) {
    timers_1.clearInterval(interval);
}
exports.stop = stop;
function getWorkspaceRoot(playbook) {
    let rootWorkspace = vscode.workspace.workspaceFolders;
    if (rootWorkspace && rootWorkspace.length > 0) {
        return rootWorkspace[0].uri.fsPath;
    }
    else {
        return path.dirname(playbook);
    }
}
exports.getWorkspaceRoot = getWorkspaceRoot;
function delayedInterval(func, interval) {
    const handle = setInterval(func, interval);
    return {
        cancel: () => timers_1.clearInterval(handle)
    };
}
exports.delayedInterval = delayedInterval;
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
exports.delay = delay;
function isSubPath(child, parent) {
    if (child === parent)
        return false;
    let parentTokens = [];
    parent.split(/\\/).forEach((s) => parentTokens = parentTokens.concat(s.split(/\//).filter(i => i.length)));
    let childTokens = [];
    child.split(/\\/).forEach((s) => childTokens = childTokens.concat(s.split(/\//).filter(i => i.length)));
    return parentTokens.every((t, i) => childTokens[i] === t);
}
exports.isSubPath = isSubPath;
function posixPath(path) {
    if (path) {
        return path.replace(/\\/g, '/');
    }
    return path;
}
exports.posixPath = posixPath;
//# sourceMappingURL=utilities.js.map