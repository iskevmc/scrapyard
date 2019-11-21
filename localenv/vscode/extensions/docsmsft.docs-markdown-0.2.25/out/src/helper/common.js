"use strict";
"use-strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const extension_1 = require("../extension");
const log = require("./log");
const telemetry_1 = require("./telemetry");
/**
 * Provide current os platform
 */
function getOSPlatform() {
    if (this.osPlatform == null) {
        this.osPlatform = os.platform();
        this.osPlatform = this.osPlatform;
    }
    return this.osPlatform;
}
exports.getOSPlatform = getOSPlatform;
/**
 * Create a posted warning message and applies the message to the log
 * @param {string} message - the message to post to the editor as an warning.
 */
function postWarning(message) {
    log.debug(message);
    vscode.window.showWarningMessage(message);
}
exports.postWarning = postWarning;
/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
function postInformation(message) {
    log.debug(message);
    vscode.window.showInformationMessage(message);
}
exports.postInformation = postInformation;
/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
function postError(message) {
    log.debug(message);
    vscode.window.showErrorMessage(message);
}
exports.postError = postError;
/**
 * Checks that there is a document open, and the document has selected text.
 * Displays warning to users if error is caught.
 * @param {vscode.TextEditor} editor - the activeTextEditor in the vscode window
 * @param {boolean} testSelection - test to see if the selection includes text in addition to testing a editor is open.
 * @param {string} senderName - the name of the command running the test.
 */
function isValidEditor(editor, testSelection, senderName) {
    if (editor === undefined) {
        log.error("Please open a document to apply " + senderName + " to.");
        return false;
    }
    if (testSelection && editor.selection.isEmpty) {
        if (senderName === "format bold" || senderName === "format italic" || senderName === "format code") {
            log.debug("VS Code active editor has valid configuration to apply " + senderName + " to.");
            return true;
        }
        log.error("No text selected, cannot apply " + senderName + ".");
        return false;
    }
    log.debug("VS Code active editor has valid configuration to apply " + senderName + " to.");
    return true;
}
exports.isValidEditor = isValidEditor;
function noActiveEditorMessage() {
    postWarning("No active editor. Abandoning command.");
}
exports.noActiveEditorMessage = noActiveEditorMessage;
function GetEditorText(editor, senderName) {
    let content = "";
    const emptyString = "";
    if (isValidEditor(editor, false, senderName)) {
        if (content !== undefined && content.trim() !== "") {
            content = editor.document.getText();
            return content;
        }
        else {
            return emptyString;
        }
    }
    return emptyString;
}
exports.GetEditorText = GetEditorText;
function GetEditorFileName(editor, senderName) {
    const emptyString = "";
    if (editor !== undefined && editor.document !== undefined) {
        const fileName = editor.document.fileName;
        return fileName;
    }
    else {
        return emptyString;
    }
}
exports.GetEditorFileName = GetEditorFileName;
/** Tests to see if there is content on the page.
 * @param {vscode.TextEditor} editor - the current active editor
 */
function hasContentAlready(editor) {
    let content = editor.document.getText();
    content = content.trim();
    if (content !== "") {
        return false;
    }
    return true;
}
exports.hasContentAlready = hasContentAlready;
function hasValidWorkSpaceRootPath(senderName) {
    const folderPath = vscode.workspace.rootPath;
    if (folderPath == null) {
        postWarning("The " + senderName + " command requires an active workspace. Please open VS Code from the root of your clone to continue.");
        return false;
    }
    return true;
}
exports.hasValidWorkSpaceRootPath = hasValidWorkSpaceRootPath;
/**
 * Inserts or Replaces text at the current selection in the editor.
 * If overwrite is set the content will replace current selection.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 * @param {string} senderName - the name of the function that is calling this function
 * which is used to provide tracibility in logging.
 * @param {string} string - the content to insert.
 * @param {boolean} overwrite - if true replaces current selection.
 * @param {vscode.Range} selection - if null uses the current selection for the insert or update.
 * If provided will insert or update at the given range.
 */
function insertContentToEditor(editor, senderName, content, overwrite = false, selection = null) {
    log.debug("Adding content to the active editor: " + content);
    if (selection == null) {
        selection = editor.selection;
    }
    try {
        if (overwrite) {
            editor.edit((update) => {
                update.replace(selection, content);
            });
            log.debug(senderName + " applied content overwritten current selection: " + content);
        }
        else {
            // Gets the cursor position
            const position = editor.selection.active;
            editor.edit((selected) => {
                selected.insert(position, content);
            });
            log.debug(senderName + " applied at current cursor: " + content);
        }
    }
    catch (error) {
        log.error("Could not write content to active editor window: " + error);
    }
}
exports.insertContentToEditor = insertContentToEditor;
/**
 * Remove the selected content from the active editor in the vs code window.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 * @param {string} senderName - the name of the the function that called the removal
 * @param {string} content - the content that is being removed.
 */
function removeContentFromEditor(editor, senderName, content) {
    try {
        editor.edit((update) => {
            update.delete(editor.selection);
        });
        log.debug(senderName + " removed the content: " + content);
    }
    catch (error) {
        log.error("Could not remove content from active editor window:" + error);
    }
}
exports.removeContentFromEditor = removeContentFromEditor;
/**
 * Set the cursor to a new position, based on X and Y coordinates.
 * @param {vscode.TextEditor} editor -
 * @param {number} yPosition -
 * @param {number} xPosition -
 */
function setCursorPosition(editor, yPosition, xPosition) {
    const cursorPosition = editor.selection.active;
    const newPosition = cursorPosition.with(yPosition, xPosition);
    const newSelection = new vscode.Selection(newPosition, newPosition);
    editor.selection = newSelection;
}
exports.setCursorPosition = setCursorPosition;
function setSelectorPosition(editor, fromLine, fromCharacter, toLine, toCharacter) {
    const cursorPosition = editor.selection.active;
    const fromPosition = cursorPosition.with(fromLine, fromCharacter);
    const toPosition = cursorPosition.with(toLine, toCharacter);
    const newSelection = new vscode.Selection(fromPosition, toPosition);
    editor.selection = newSelection;
}
exports.setSelectorPosition = setSelectorPosition;
function setNewPosition(editor, offset, startLine, endLine) {
    const selection = editor.selection;
    let newCursorPosition = selection.active.character + offset;
    newCursorPosition = newCursorPosition < 0 ? 0 : newCursorPosition;
    if (selection.start.character === selection.end.character && selection.start.line === selection.end.line) {
        setCursorPosition(editor, selection.active.line, newCursorPosition);
    }
    else {
        let newStartCharacter = 0;
        let newEndCharacter = 0;
        if (selection.active.character === selection.start.character) {
            newStartCharacter = selection.end.character + offset;
            newEndCharacter = selection.start.character + offset;
        }
        else {
            newStartCharacter = selection.start.character + offset;
            newEndCharacter = selection.end.character + offset;
        }
        newStartCharacter = newStartCharacter < 0 ? 0 : newStartCharacter;
        newEndCharacter = newEndCharacter < 0 ? 0 : newEndCharacter;
        let newStartLine = 0;
        let newEndLine = 0;
        if (selection.start.line === selection.end.line || startLine === endLine) {
            newStartLine = newEndLine = selection.active.line;
        }
        else if (selection.active.line === startLine) {
            newStartLine = endLine;
            newEndLine = startLine;
        }
        else {
            newStartLine = startLine;
            newEndLine = endLine;
        }
        setSelectorPosition(editor, newStartLine, newStartCharacter, newEndLine, newEndCharacter);
    }
}
exports.setNewPosition = setNewPosition;
/**
 *  Function does trim from the right on the the string. It removes specified characters.
 *  @param {string} str - string to trim.
 *  @param {string} chr - searched characters to trim.
 */
function rtrim(str, chr) {
    const rgxtrim = (!chr) ? new RegExp("\\s+$") : new RegExp(chr + "+$");
    return str.replace(rgxtrim, "");
}
exports.rtrim = rtrim;
/**
 * Checks to see if the active file is markdown.
 * Commands should only run on markdown files.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 */
function isMarkdownFileCheck(editor, languageId) {
    if (editor.document.languageId !== "markdown") {
        if (editor.document.languageId !== "yaml") {
            postInformation("The docs-markdown extension only works on Markdown files.");
        }
        return false;
    }
    else {
        return true;
    }
}
exports.isMarkdownFileCheck = isMarkdownFileCheck;
/**
 * Telemetry or Trace Log Type
 */
var LogType;
(function (LogType) {
    LogType[LogType["Telemetry"] = 0] = "Telemetry";
    LogType[LogType["Trace"] = 1] = "Trace";
})(LogType = exports.LogType || (exports.LogType = {}));
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
 * Check for active extensions
 */
function checkExtension(extensionName, notInstalledMessage) {
    const extensionValue = vscode.extensions.getExtension(extensionName);
    if (!extensionValue) {
        if (notInstalledMessage) {
            extension_1.output.appendLine(notInstalledMessage);
        }
        return false;
    }
    return extensionValue.isActive;
}
exports.checkExtension = checkExtension;
/**
 * Output message with timestamp
 * @param message
 */
function showStatusMessage(message) {
    const { msTimeValue } = generateTimestamp();
    extension_1.output.appendLine(`[${msTimeValue}] - ` + message);
}
exports.showStatusMessage = showStatusMessage;
/**
 * Return repo name
 * @param Uri
 */
function getRepoName(workspacePath) {
    // let repoName;
    const repo = vscode.workspace.getWorkspaceFolder(workspacePath);
    if (repo) {
        const repoName = repo.name;
        return repoName;
    }
}
exports.getRepoName = getRepoName;
function sendTelemetryData(telemetryCommand, commandOption) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const workspaceUri = editor.document.uri;
        const activeRepo = getRepoName(workspaceUri);
        const telemetryProperties = activeRepo ? { command_option: commandOption, repo_name: activeRepo } : { command_option: commandOption, repo_name: "" };
        telemetry_1.reporter.sendTelemetryEvent(telemetryCommand, telemetryProperties);
    }
}
exports.sendTelemetryData = sendTelemetryData;
function detectFileExtension(filePath) {
    const fileExtension = path.extname(filePath);
    return fileExtension;
}
exports.detectFileExtension = detectFileExtension;
/**
 * Create a posted error message and applies the message to the log
 * @param {string} message - the message to post to the editor as an error.
 */
function showWarningMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.window.showWarningMessage(message);
    });
}
exports.showWarningMessage = showWarningMessage;
//# sourceMappingURL=common.js.map