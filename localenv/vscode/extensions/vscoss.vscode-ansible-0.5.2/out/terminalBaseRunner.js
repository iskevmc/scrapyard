"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseRunner_1 = require("./baseRunner");
const utilities = require("./utilities");
class TerminalBaseRunner extends baseRunner_1.BaseRunner {
    constructor(outputChannel) {
        super(outputChannel);
    }
    runPlaybookInternal(playbook) {
        // - parse credential files if exists
        const credentials = utilities.parseCredentialsFile(this._outputChannel);
        var terminalId = 'ansible' + Date.now();
        var cmds = this.getCmds(playbook, credentials, terminalId);
        this.runAnsibleInTerminal(playbook, cmds, terminalId);
    }
}
exports.TerminalBaseRunner = TerminalBaseRunner;
//# sourceMappingURL=terminalBaseRunner.js.map