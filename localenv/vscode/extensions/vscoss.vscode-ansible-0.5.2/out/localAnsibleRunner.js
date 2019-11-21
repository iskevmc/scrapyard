"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseRunner_1 = require("./baseRunner");
const constants_1 = require("./constants");
const utilities = require("./utilities");
const terminalExecutor_1 = require("./terminalExecutor");
const telemetryClient_1 = require("./telemetryClient");
const terminalBaseRunner_1 = require("./terminalBaseRunner");
class LocalAnsibleRunner extends terminalBaseRunner_1.TerminalBaseRunner {
    constructor(outputChannel) {
        super(outputChannel);
    }
    getCmds(playbook, envs, terminalId) {
        var cmdsToTerminal = [];
        var envCmd = this.isWindows() ? 'set ' : 'export ';
        if (envs) {
            for (var item in envs) {
                cmdsToTerminal.push(envCmd + item + '=' + envs[item]);
            }
        }
        // add azure user agent
        if (utilities.isTelemetryEnabled()) {
            cmdsToTerminal.push(envCmd + constants_1.Constants.UserAgentName + '=' + utilities.getUserAgent());
        }
        cmdsToTerminal.push(this.getRunPlaybookCmd("\"" + playbook + "\""));
        return cmdsToTerminal;
    }
    runAnsibleInTerminal(playbook, cmds, terminalId) {
        let initCmd = cmds[0];
        let subCmds = cmds.splice(1);
        telemetryClient_1.TelemetryClient.sendEvent('localansible');
        utilities.isAnsibleInstalled(this._outputChannel, () => {
            terminalExecutor_1.TerminalExecutor.runInTerminal(initCmd, constants_1.Constants.AnsibleTerminalName + ' ' + baseRunner_1.Option.local, false, subCmds, null, true, null);
        });
    }
}
exports.LocalAnsibleRunner = LocalAnsibleRunner;
//# sourceMappingURL=localAnsibleRunner.js.map