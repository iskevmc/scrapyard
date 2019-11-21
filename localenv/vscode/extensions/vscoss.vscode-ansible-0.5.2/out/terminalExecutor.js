'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const timers_1 = require("timers");
const MAX_TERMINAL_COUNT = 20;
var terminalCount = {};
class TerminalExecutor {
    static onDidCloseTerminal(closedTerminal) {
        if (terminalCount[closedTerminal.name]) {
            terminalCount[closedTerminal.name] = terminalCount[closedTerminal.name]--;
        }
        if (this.terminals[closedTerminal.name]) {
            closedTerminal.processId.then((id) => {
                this.terminals[closedTerminal.name].processId.then((localid) => {
                    if (id === localid) {
                        delete this.terminals[closedTerminal.name];
                    }
                });
            });
        }
    }
    static runInTerminal(initCommand, terminalName, waitAfterInitCmd, commands, retryTime, reuseTerminal, cb) {
        if (!reuseTerminal || (this.terminals === undefined || this.terminals[terminalName] === undefined)) {
            if (!terminalCount[terminalName]) {
                terminalCount[terminalName] = 0;
            }
            if (terminalCount[terminalName] >= MAX_TERMINAL_COUNT) {
                vscode.window.showErrorMessage('Reached max limit of active terminals: ' + terminalName + ', please delete unused terminals.');
                return cb(null, null);
            }
            var newterminal = vscode.window.createTerminal(terminalName);
            this.terminals[terminalName] = newterminal;
            terminalCount[terminalName]++;
        }
        let terminal = this.terminals[terminalName];
        terminal.sendText(initCommand);
        terminal.show();
        if (waitAfterInitCmd) {
            var count = retryTime;
            var interval = timers_1.setInterval(function () {
                count--;
                if (count > 0) {
                    cb(terminal, interval);
                }
                else {
                    timers_1.clearInterval(interval);
                }
            }, 1000);
        }
        else {
            for (var cmd in commands) {
                terminal.sendText(commands[cmd]);
            }
        }
    }
}
TerminalExecutor.terminals = {};
exports.TerminalExecutor = TerminalExecutor;
//# sourceMappingURL=terminalExecutor.js.map