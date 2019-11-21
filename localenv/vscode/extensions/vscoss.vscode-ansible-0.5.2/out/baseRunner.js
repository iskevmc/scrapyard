"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utilities = require("./utilities");
var Option;
(function (Option) {
    Option["docker"] = "Docker";
    Option["local"] = "Local";
})(Option = exports.Option || (exports.Option = {}));
class BaseRunner {
    constructor(outputChannel) {
        this._outputChannel = outputChannel;
    }
    output(label, message) {
        this._outputChannel.append(`[${label}] ${message}`);
    }
    outputLine(label, message) {
        this._outputChannel.appendLine(`[${label}] ${message}`);
    }
    isWindows() {
        return process.platform === 'win32';
    }
    runPlaybook(playbook) {
        if (!playbook) {
            playbook = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName : null;
            vscode.window.showInputBox({ value: playbook, prompt: 'Please input playbook name', placeHolder: 'playbook', password: false })
                .then((input) => {
                if (input != undefined && input != '') {
                    playbook = input;
                }
                else {
                    return;
                }
                if (this.validatePlaybook(playbook)) {
                    return this.runPlaybookInternal(playbook);
                }
            });
        }
        else {
            if (this.validatePlaybook(playbook)) {
                return this.runPlaybookInternal(playbook);
            }
        }
    }
    validatePlaybook(playbook) {
        if (!utilities.validatePlaybook(playbook)) {
            return false;
        }
        return true;
    }
    getRunPlaybookCmd(playbook) {
        let cmd = ['ansible-playbook'];
        let customOption = utilities.getCodeConfiguration('ansible', 'customOptions');
        if (customOption) {
            cmd.push(customOption);
        }
        cmd.push(playbook);
        return cmd.join(" ");
    }
}
exports.BaseRunner = BaseRunner;
//# sourceMappingURL=baseRunner.js.map