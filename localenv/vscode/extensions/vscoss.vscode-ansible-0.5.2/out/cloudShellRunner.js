"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseRunner_1 = require("./baseRunner");
const vscode = require("vscode");
const constants_1 = require("./constants");
const utilities = require("./utilities");
const path = require("path");
const opn = require("opn");
const ost = require("os");
const telemetryClient_1 = require("./telemetryClient");
const cloudConsoleLauncher_1 = require("./cloudConsoleLauncher");
const azureStorageHelper_1 = require("./azureStorageHelper");
const semver = require("semver");
const tempFile = path.join(ost.tmpdir(), 'cloudshell' + vscode.env.sessionId + '.log');
class CloudShellRunner extends baseRunner_1.BaseRunner {
    constructor(outputChannel) {
        super(outputChannel);
        vscode.window.onDidCloseTerminal((terminal) => {
            if (terminal === this.terminal) {
                this.cleanUpTerminal();
            }
        });
    }
    runPlaybookInternal(playbook) {
        // to workaround tls error: https://github.com/VSChina/vscode-ansible/pull/44
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = "0";
        const installedExtension = vscode.extensions.all;
        telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'status': constants_1.CloudShellConnectionStatus.Init });
        let azureAccount;
        for (var i = 0; i < installedExtension.length; i++) {
            const ext = installedExtension[i];
            if (ext.id === constants_1.Constants.AzureAccountExtensionId && this.isAzureAccountVersionValid(ext)) {
                azureAccount = ext.activate().then((azureAccount) => {
                    if (azureAccount) {
                        this.connectToCloudShell(playbook).then((response) => {
                            if (!response)
                                return;
                            var terminal = response[0];
                            var remotePlaybookPath = response[1];
                            if (!terminal) {
                                return;
                            }
                            terminal.show();
                            terminal.sendText(this.getRunPlaybookCmd(remotePlaybookPath));
                        });
                    }
                    ;
                    return;
                });
                return;
            }
        }
        telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'error': constants_1.CloudShellErrors.AzureAccountNotInstalled });
        const open = { title: "View in Marketplace" };
        vscode.window.showErrorMessage('Please install the Azure Account extension before running Cloud Shell', open)
            .then(response => {
            if (response === open) {
                opn('https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account');
            }
        });
    }
    connectToCloudShell(playbook) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountApi = vscode.extensions.getExtension("ms-vscode.azure-account").exports;
            if (!(yield accountApi.waitForLogin())) {
                yield vscode.commands.executeCommand('azure-account.askForLogin');
                if (!(yield accountApi.waitForLogin())) {
                    telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'error': constants_1.CloudShellErrors.AzureNotSignedIn });
                    return;
                }
            }
            try {
                yield this.showPrompt();
            }
            catch (err) {
                return;
            }
            if (!this.terminal) {
                this._outputChannel.append('\nConnecting to Cloud Shell.');
                this._outputChannel.show();
                const progress = utilities.delayedInterval(() => { this._outputChannel.append('.'); }, 500);
                try {
                    this.cloudShellSession = accountApi.createCloudShell("Linux");
                    if (!this.cloudShellSession) {
                        progress.cancel();
                        this._outputChannel.appendLine("Failed to connect to Cloud Shell, please retry later.");
                        this._outputChannel.show();
                        return;
                    }
                    this.terminal = yield this.cloudShellSession.terminal;
                    this.terminal.show();
                    let count = 60;
                    while (count > 0) {
                        if (this.cloudShellSession.status === "Connected") {
                            break;
                        }
                        count--;
                        yield utilities.delay(500);
                    }
                    progress.cancel();
                    if (count === 0) {
                        this.cleanUpTerminal();
                        this._outputChannel.appendLine("Failed to connect to Cloud Shell after 30 seconds,  please retry later.");
                        this._outputChannel.show();
                        telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'error': constants_1.CloudShellErrors.ProvisionFailed });
                        return;
                    }
                    telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'status': constants_1.CloudShellConnectionStatus.Succeeded });
                    this.cloudShellFileShare = yield cloudConsoleLauncher_1.getStorageAccountforCloudShell(this.cloudShellSession);
                    if (!this.cloudShellFileShare) {
                        this._outputChannel.appendLine("Failed to get Storage Account for Cloud Shell, please retry later.");
                        this._outputChannel.show();
                        telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'error': constants_1.CloudShellErrors.ProvisionFailed });
                        return;
                    }
                }
                catch (err) {
                    progress.cancel();
                    this.cleanUpTerminal();
                    this._outputChannel.appendLine('Connecting to Cloud Shell failed with error: \n' + err);
                    this._outputChannel.show();
                    return;
                }
            }
            try {
                yield azureStorageHelper_1.uploadFilesToAzureStorage(playbook, this.cloudShellFileShare.storageAccountName, this.cloudShellFileShare.storageAccountKey, this.cloudShellFileShare.fileShareName);
                return [this.terminal, azureStorageHelper_1.getCloudShellPlaybookPath(this.cloudShellFileShare.fileShareName, playbook)];
            }
            catch (err) {
                if (err) {
                    telemetryClient_1.TelemetryClient.sendEvent('cloudshell', { 'error': constants_1.CloudShellErrors.ProvisionFailed });
                    this._outputChannel.appendLine('\nFailed to upload playbook to Cloud Shell: ' + err);
                    this._outputChannel.show();
                    return;
                }
            }
        });
    }
    showPrompt() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = utilities.getCodeConfiguration(null, constants_1.Constants.Config_cloudShellConfirmed);
            if (!config) {
                const msgOption = { modal: false };
                const msgItem = { title: 'Confirm & Don\'t show this again' };
                const cancelItem = { title: "View detail" };
                const promptMsg = 'Running your Ansible playbook in Cloud Shell will generate a small charge for Azure usage as the playbook needs to be uploaded to Cloud Shell';
                let response = yield vscode.window.showWarningMessage(promptMsg, msgOption, msgItem, cancelItem);
                if (response === msgItem) {
                    utilities.updateCodeConfiguration(null, constants_1.Constants.Config_cloudShellConfirmed, true);
                    return;
                }
                else if (response === cancelItem) {
                    opn('https://docs.microsoft.com/en-us/azure/cloud-shell/pricing');
                }
                return Promise.reject('');
            }
            return;
        });
    }
    cleanUpTerminal() {
        this.terminal = null;
        this.cloudShellFileShare = null;
        this.cloudShellSession = null;
    }
    isAzureAccountVersionValid(extension) {
        if (!extension || !extension.packageJSON) {
            return false;
        }
        let version = extension.packageJSON.version;
        if (version && semver.valid(version) && semver.gte(version, '0.3.2')) {
            return true;
        }
        return false;
    }
}
exports.CloudShellRunner = CloudShellRunner;
//# sourceMappingURL=cloudShellRunner.js.map