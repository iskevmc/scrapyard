"use-strict";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const telemetry_1 = require("./telemetry");
/**
 * Create a posted warning message and applies the message to the log
 * @param {string} message - the message to post to the editor as an warning.
 */
function postWarning(message) {
    vscode_1.window.showWarningMessage(message);
}
exports.postWarning = postWarning;
/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
function postInformation(message) {
    vscode_1.window.showInformationMessage(message);
}
exports.postInformation = postInformation;
/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
function postError(message) {
    vscode_1.window.showErrorMessage(message);
}
exports.postError = postError;
function hasValidWorkSpaceRootPath(senderName) {
    const folderPath = vscode_1.workspace.rootPath;
    if (folderPath == null) {
        postWarning(`The ${senderName} command requires an active workspace. Please open VS Code from the root of your clone to continue.`);
        return false;
    }
    return true;
}
exports.hasValidWorkSpaceRootPath = hasValidWorkSpaceRootPath;
/**
 * Create timestamp
 */
function generateTimestamp() {
    const date = new Date(Date.now());
    return {
        msDateValue: date.toLocaleDateString("en-us"),
        msTimeValue: date.toLocaleTimeString([], { hour12: false }),
    };
}
exports.generateTimestamp = generateTimestamp;
/**
 * Return repo name
 * @param Uri
 */
function getRepoName(workspacePath) {
    const repo = vscode_1.workspace.getWorkspaceFolder(workspacePath);
    if (repo) {
        const repoName = repo.name;
        return repoName;
    }
}
exports.getRepoName = getRepoName;
function sendTelemetryData(telemetryCommand, commandOption) {
    const editor = vscode_1.window.activeTextEditor;
    const workspaceUri = editor.document.uri;
    const activeRepo = getRepoName(workspaceUri);
    const telemetryProperties = activeRepo ? { command_option: commandOption, repo_name: activeRepo } : { command_option: commandOption, repo_name: "" };
    telemetry_1.reporter.sendTelemetryEvent(telemetryCommand, telemetryProperties);
}
exports.sendTelemetryData = sendTelemetryData;
function isMarkdownFile(document) {
    return document.languageId === "markdown"; // prevent processing of own documents
}
exports.isMarkdownFile = isMarkdownFile;
//# sourceMappingURL=common.js.map