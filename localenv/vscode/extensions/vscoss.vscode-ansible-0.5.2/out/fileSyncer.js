'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utilities = require("./utilities");
const path = require("path");
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const browseThePC = 'Browse the PC..';
var TargetType;
(function (TargetType) {
    TargetType["cloudshell"] = "cloudshell";
    TargetType["remotehost"] = "remotehost";
})(TargetType = exports.TargetType || (exports.TargetType = {}));
class FileSyncer {
    constructor(outputChannel) {
        this._outputChannel = outputChannel;
        this._configuration = utilities.getCodeConfiguration('ansible', constants_1.Constants.Config_fileCopyConfig);
        this._statusBar = vscode.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
    }
    onConfigurationChange(config) {
        // check if changed
        let updatedConfig = this.getChangedConfiguration(this._configuration, config);
        this.copyFiles(updatedConfig);
        this._configuration = config;
    }
    getChangedConfiguration(oldConfig, newConfig) {
        let result = [];
        if (!oldConfig || oldConfig.length === 0) {
            return newConfig;
        }
        if (!newConfig) {
            return result;
        }
        for (let newc of newConfig) {
            let exists = false;
            for (let old of oldConfig) {
                if (newc.server === old.server && newc.sourcePath === old.sourcePath && newc.targetPath === old.targetPath) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                result.push(newc);
            }
        }
        return result;
    }
    copyFiles(configuration, fileName = null) {
        let servers = utilities.getSSHConfig();
        if (!configuration) {
            if (!this._configuration) {
                return;
            }
            configuration = this._configuration;
        }
        for (let item of configuration) {
            // get server
            let server = this.getServer(servers, item.server);
            if (!server) {
                this._statusBar.text = "Invalid host " + item.server;
                this._statusBar.show();
            }
            let source = item.sourcePath;
            let target = item.targetPath;
            if (target === constants_1.Constants.NotShowThisAgain) {
                continue;
            }
            if (fileName != null) {
                // check if file under configured source path
                if ((!this.isExcluded(fileName)) && utilities.isSubPath(fileName, item.sourcePath)) {
                    source = fileName;
                    target = path.join(item.targetPath, path.relative(item.sourcePath, fileName));
                }
                else {
                    continue;
                }
            }
            this._statusBar.text = "Copying " + source + " to " + item.server;
            this._statusBar.show();
            utilities.copyFilesRemote(source, target, server)
                .then(() => {
                this._statusBar.text = "Copied " + source + " to " + item.server;
                this._statusBar.show();
            })
                .catch((err) => {
                this._statusBar.text = "Failed to copy " + source + " to " + item.server;
                this._statusBar.show();
                this._outputChannel.appendLine('\nFailed to copy ' + source + ' to ' + item.server + ': ' + err);
                this._outputChannel.show();
                throw err;
            });
        }
    }
    getServer(servers, serverName) {
        for (let s of servers) {
            if (s.host === serverName) {
                return s;
            }
        }
        return null;
    }
    isExcluded(fileName) {
        if (fileName.endsWith(path.join('.vscode', path.win32.sep, 'settings.json')) ||
            fileName.endsWith(path.join('.vscode', path.posix.sep, 'settings.json'))) {
            return true;
        }
        return false;
    }
}
exports.FileSyncer = FileSyncer;
//# sourceMappingURL=fileSyncer.js.map