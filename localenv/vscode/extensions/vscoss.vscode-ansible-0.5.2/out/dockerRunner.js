"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseRunner_1 = require("./baseRunner");
const vscode = require("vscode");
const path = require("path");
const constants_1 = require("./constants");
const utilities = require("./utilities");
const terminalExecutor_1 = require("./terminalExecutor");
const telemetryClient_1 = require("./telemetryClient");
const timers_1 = require("timers");
const terminalBaseRunner_1 = require("./terminalBaseRunner");
const fsExtra = require("fs-extra");
class DockerRunner extends terminalBaseRunner_1.TerminalBaseRunner {
    constructor(outputChannel) {
        super(outputChannel);
    }
    getCmds(playbook, envs, terminalId) {
        var cmdsToTerminal = [];
        let cmd = utilities.getCodeConfiguration(null, constants_1.Constants.Config_terminalInitCommand);
        var sourcePath = path.dirname(playbook);
        var targetPath = '/playbook';
        var targetPlaybook = targetPath + '/' + path.basename(playbook);
        if (vscode.workspace.workspaceFolders) {
            sourcePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            targetPath = '/' + vscode.workspace.name;
            targetPlaybook = path.relative(sourcePath, playbook);
            targetPlaybook = targetPlaybook.replace(/\\/g, '/');
        }
        if (cmd === "default" || cmd === '') {
            cmd = "docker run --rm -it -v \"$workspace:$targetFolder\"  --workdir \"$targetFolder\" --name $containerId";
            cmd = cmd.replace('$workspace', sourcePath);
            cmd = cmd.replace(new RegExp('\\$targetFolder', 'g'), targetPath);
            cmd = cmd.replace('$containerId', terminalId);
            // add credential envs if any
            if (envs) {
                for (var item in envs) {
                    cmd += ' -e ';
                    cmd += item + '=' + envs[item] + ' ';
                }
            }
            // add azure user agent
            if (utilities.isTelemetryEnabled()) {
                cmd += ' -e ' + constants_1.Constants.UserAgentName + '=' + utilities.getUserAgent() + ' ';
            }
            cmd += ' ' + this.getDockerImageName() + ' bash';
            cmdsToTerminal.push(cmd);
            cmdsToTerminal.push(this.getRunPlaybookCmd(targetPlaybook));
        }
        else {
            cmdsToTerminal.push(cmd);
        }
        return cmdsToTerminal;
    }
    runAnsibleInTerminal(playbook, cmds, terminalId) {
        let initCmd = cmds[0];
        let subCmds = cmds.splice(1);
        telemetryClient_1.TelemetryClient.sendEvent('docker');
        utilities.isDockerInstalled(this._outputChannel, (err) => {
            if (err) {
                return;
            }
            const msgOption = { modal: false };
            const msgItem = { title: 'Ok' };
            if (!utilities.isCredentialConfigured()) {
                const cancelItem = { title: "Not Now" };
                const promptMsg = 'Please configure cloud credentials at ' + utilities.getCredentialsFile() + ' for first time.';
                utilities.updateCodeConfiguration(null, constants_1.Constants.Config_credentialConfigured, true);
                let credentialFile = utilities.getCredentialsFile();
                vscode.window.showWarningMessage(promptMsg, msgOption, msgItem, cancelItem).then(response => {
                    if (response === msgItem) {
                        if (fsExtra.existsSync(credentialFile)) {
                            vscode.workspace.openTextDocument().then(doc => {
                                vscode.window.showTextDocument(doc);
                            });
                        }
                        else {
                            this._outputChannel.appendLine("Please configure cloud credentials by following https://marketplace.visualstudio.com/items?itemName=vscoss.vscode-ansible");
                            this._outputChannel.show();
                        }
                    }
                    else {
                        this.startTerminal(terminalId, initCmd, constants_1.Constants.AnsibleTerminalName + ' ' + baseRunner_1.Option.docker, true, subCmds, 180, false);
                    }
                });
            }
            else {
                this.startTerminal(terminalId, initCmd, constants_1.Constants.AnsibleTerminalName + ' ' + baseRunner_1.Option.docker, true, subCmds, 180, false);
            }
        });
    }
    startTerminal(terminalId, initCmd, terminalName, waitAfterInit, subCmds, interval, reuse) {
        terminalExecutor_1.TerminalExecutor.runInTerminal(initCmd, terminalName, waitAfterInit, subCmds, interval, reuse, function (terminal, interval) {
            if (terminal) {
                require('child_process').exec('docker ps --filter name=' + terminalId, (err, stdout, stderr) => {
                    if (err || stderr) {
                        console.log('err: ' + err + ' ' + stderr);
                        return;
                    }
                    if (stdout) {
                        // check if docker container is up
                        if (stdout && stdout.indexOf('Up ') > -1) {
                            // then send other commands to terminal
                            for (let text of subCmds) {
                                terminal.sendText(text);
                            }
                            terminal.show();
                            if (interval) {
                                timers_1.clearInterval(interval);
                            }
                        }
                    }
                });
            }
        });
    }
    getDockerImageName() {
        let customDocker = utilities.getCodeConfiguration('ansible', constants_1.Constants.Config_dockerImage);
        if (!customDocker) {
            customDocker = constants_1.Constants.DockerImageName;
        }
        return customDocker;
    }
}
exports.DockerRunner = DockerRunner;
//# sourceMappingURL=dockerRunner.js.map