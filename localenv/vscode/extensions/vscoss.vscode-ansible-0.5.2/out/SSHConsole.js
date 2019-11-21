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
const path = require("path");
function openSSHConsole(outputChannel, server) {
    const progress = delayedInterval(() => { outputChannel.append('.'); }, 500);
    return (function retry() {
        return __awaiter(this, void 0, void 0, function* () {
            outputChannel.appendLine('\nConnecting to host ' + server.host + '..');
            outputChannel.show();
            const isWindows = process.platform === 'win32';
            let shellPath = path.join(__dirname, `../bin/node.${isWindows ? 'bat' : 'sh'}`);
            let modulePath = path.join(__dirname, 'SSHLauncher');
            if (isWindows) {
                modulePath = modulePath.replace(/\\/g, '\\\\');
            }
            const shellArgs = [
                process.argv0,
                '-e',
                `require('${modulePath}').main()`,
            ];
            if (isWindows) {
                // Work around https://github.com/electron/electron/issues/4218 https://github.com/nodejs/node/issues/11656
                shellPath = 'node.exe';
                shellArgs.shift();
            }
            var envs = {
                SSH_HOST: server.host,
                SSH_PORT: String(server.port),
                SSH_USER: server.user,
                NODE_TLS_REJECT_UNAUTHORIZED: "0",
                SSH_PASSWORD: server.password,
                SSH_KEY: server.key,
                SSH_PASSPHRASE: server.passphrase
            };
            const terminal = vscode.window.createTerminal({
                name: 'SSH ' + server.host,
                shellPath,
                shellArgs,
                env: envs
            });
            progress.cancel();
            terminal.show();
            return terminal;
        });
    })().catch(err => {
        progress.cancel();
        outputChannel.appendLine('\nConnecting to SSH failed with error: \n' + err);
        outputChannel.show();
        throw err;
    });
    function delayedInterval(func, interval) {
        const handle = setInterval(func, interval);
        return {
            cancel: () => clearInterval(handle)
        };
    }
}
exports.openSSHConsole = openSSHConsole;
//# sourceMappingURL=SSHConsole.js.map