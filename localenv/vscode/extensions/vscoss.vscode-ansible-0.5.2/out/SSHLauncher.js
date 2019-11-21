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
const ssh = require("ssh2");
const fs = require("fs-extra");
const path = require("path");
const ost = require("os");
const fsExtra = require("fs-extra");
function connectTerminal(host, port, user, password, keyfile, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempFile = path.join(ost.tmpdir(), 'vscodeansible-ssh-' + host + '.log');
        var connected = false;
        if (fsExtra.existsSync(tempFile)) {
            fsExtra.removeSync(tempFile);
        }
        console.log('Connecting host ' + host + '...');
        process.stdin.setEncoding('utf-8');
        var conn = new ssh.Client();
        conn.connect({
            host: host,
            port: port,
            username: user,
            password: password,
            privateKey: keyfile ? fs.readFileSync(keyfile) : keyfile,
            passphrase: passphrase,
            keepaliveInternal: 4000
        });
        conn.on('error', (err) => {
            process.stdout.write('ssh error: ' + err);
        });
        conn.on('end', () => {
            process.stdout.write('ssh connection end.');
        });
        conn.on('close', (hasError) => {
            process.stdout.write('ssh connection close.');
        });
        conn.on('ready', () => {
            var sshShellOption = {
                cols: 200, rows: 30
            };
            conn.shell(sshShellOption, { pty: sshShellOption }, (err, stream) => {
                if (err) {
                    process.stdout.write('ssh failed to start shell: ' + err);
                }
                if (!connected) {
                    fs.writeFileSync(tempFile, 'connected: ' + host);
                    connected = true;
                }
                stream.on('data', (data) => {
                    process.stdout.write(String(data));
                }).on('close', () => {
                    process.stdout.write('ssh stream closed');
                }).stderr.on('data', (err) => {
                    process.stdout.write('ssh stderr: ' + err);
                });
                process.stdin.pipe(stream);
            });
        });
    });
}
function runInTerminal(host, port, user, password, key, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        return connectTerminal(host, port, user, password, key, passphrase);
    });
}
exports.runInTerminal = runInTerminal;
function main() {
    const host = process.env.SSH_HOST;
    const port = process.env.SSH_PORT;
    const user = process.env.SSH_USER;
    const password = process.env.SSH_PASSWORD;
    const key = process.env.SSH_KEY;
    const passphrase = process.env.SSH_PASSPHRASE;
    return runInTerminal(host, port, user, password, key, passphrase)
        .catch(console.error);
}
exports.main = main;
//# sourceMappingURL=SSHLauncher.js.map