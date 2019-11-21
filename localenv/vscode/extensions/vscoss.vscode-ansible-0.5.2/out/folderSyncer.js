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
const utilities = require("./utilities");
const fs = require("fs-extra");
const path = require("path");
const sshHelper = require("./sshRunner");
const constants_1 = require("./constants");
const browseThePC = 'Browse the PC..';
var TargetType;
(function (TargetType) {
    TargetType["cloudshell"] = "cloudshell";
    TargetType["remotehost"] = "remotehost";
})(TargetType = exports.TargetType || (exports.TargetType = {}));
class FolderSyncer {
    constructor(outputChannel) {
        this._outputChannel = outputChannel;
    }
    syncFolder(defaultPath, sshServer, allowFolderBrowse) {
        return __awaiter(this, void 0, void 0, function* () {
            let sourceFolder = defaultPath;
            if (allowFolderBrowse) {
                let pickItems = [defaultPath, browseThePC];
                let pick = yield vscode.window.showQuickPick(pickItems);
                if (!pick) {
                    return;
                }
                // browse PC to get source folder
                if (pick === browseThePC) {
                    var result = yield vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false
                    });
                    if (result && result.length === 1) {
                        sourceFolder = result[0].fsPath;
                    }
                    else {
                        return;
                    }
                }
            }
            if (!sourceFolder) {
                return;
            }
            if (!fs.existsSync(sourceFolder)) {
                this._outputChannel.appendLine('No such file or directory ' + sourceFolder);
                this._outputChannel.show();
                return;
            }
            // if server not specified, let user pick one
            let targetServer = sshServer;
            if (!targetServer) {
                targetServer = yield sshHelper.getSSHServer();
                if (!targetServer) {
                    return;
                }
            }
            let targetPath = yield this.getTargetFolder(sourceFolder, targetServer.host);
            if (!targetPath) {
                return;
            }
            // copy
            this._outputChannel.append('Copying folder ' + sourceFolder + ' to ' + targetServer.host);
            this._outputChannel.show();
            const progress = utilities.delayedInterval(() => { this._outputChannel.append('.'); }, 800);
            return utilities.copyFilesRemote(sourceFolder, targetPath, targetServer)
                .then(() => {
                progress.cancel();
                this._outputChannel.appendLine('Done!');
                this._outputChannel.show();
            })
                .catch((err) => {
                progress.cancel();
                this._outputChannel.appendLine('\nFailed to copy ' + sourceFolder + ' to ' + targetServer.host + ': ' + err);
                this._outputChannel.show();
                throw err;
            });
        });
    }
    getTargetFolder(srcFolder, targetHostName) {
        return __awaiter(this, void 0, void 0, function* () {
            let existingConfig = utilities.getCodeConfiguration('ansible', constants_1.Constants.Config_fileCopyConfig);
            let configuredTargetPath = "";
            if (existingConfig) {
                for (let config of existingConfig) {
                    if (!config.server || !config.sourcePath || !config.targetPath) {
                        break;
                    }
                    if (config.server.toLowerCase() == targetHostName.toLowerCase() && path.relative(config.sourcePath, srcFolder) == "") {
                        configuredTargetPath = config.targetPath;
                        continue;
                    }
                }
            }
            let targetPath = yield vscode.window.showInputBox({
                value: configuredTargetPath,
                prompt: 'target path on remote host',
                placeHolder: configuredTargetPath,
                password: false
            });
            return targetPath;
        });
    }
}
exports.FolderSyncer = FolderSyncer;
//# sourceMappingURL=folderSyncer.js.map