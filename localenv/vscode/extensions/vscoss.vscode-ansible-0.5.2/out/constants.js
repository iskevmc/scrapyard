"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Constants {
}
Constants.ExtensionId = 'vscoss.vscode-ansible';
Constants.LineSeperator = Array(50).join('=');
Constants.AzureAccountExtensionId = 'ms-vscode.azure-account';
Constants.DockerImageName = 'microsoft/ansible:latest';
Constants.AnsibleTerminalName = 'Ansible';
Constants.UserAgentName = 'VSCODEEXT_USER_AGENT';
Constants.Config_cloudShellConfirmed = 'cloudShellConfirmed';
Constants.Config_credentialConfigured = 'credentialsConfigured';
Constants.Config_credentialsFile = 'credentialsFile';
Constants.Config_dockerImage = 'dockerImage';
Constants.Config_terminalInitCommand = 'terminalInitCommand';
Constants.Config_fileCopyConfig = 'fileCopyConfig';
Constants.GitHubApiHost = 'api.github.com';
Constants.GitHubRawContentHost = 'raw.githubusercontent.com';
Constants.AzureQuickStartTemplates = 'Azure/azure-quickstart-templates';
Constants.AzureManagementApiHost = 'management.azure.com';
Constants.NotShowThisAgain = "NotShowThisAgain";
exports.Constants = Constants;
var CloudShellErrors;
(function (CloudShellErrors) {
    CloudShellErrors["AzureAccountNotInstalled"] = "azure account not installed";
    CloudShellErrors["NodeJSNotInstalled"] = "nodeJS not installed";
    CloudShellErrors["AzureNotSignedIn"] = "azure not signed in";
    CloudShellErrors["NotSetupFirstLaunch"] = "cloud shell not setup for first launch";
    CloudShellErrors["ProvisionFailed"] = "cloud shell provision failed";
})(CloudShellErrors = exports.CloudShellErrors || (exports.CloudShellErrors = {}));
var CloudShellConnectionStatus;
(function (CloudShellConnectionStatus) {
    CloudShellConnectionStatus["Init"] = "init";
    CloudShellConnectionStatus["Succeeded"] = "succeeded";
    CloudShellConnectionStatus["Failed"] = "failed";
})(CloudShellConnectionStatus = exports.CloudShellConnectionStatus || (exports.CloudShellConnectionStatus = {}));
//# sourceMappingURL=constants.js.map