"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const docs_code_languages_1 = require("../constants/docs-code-languages");
const common_1 = require("../helper/common");
const format_logic_manager_1 = require("../helper/format-logic-manager");
const format_styles_1 = require("../helper/format-styles");
const telemetryCommand = "formatCode";
function codeFormattingCommand() {
    const commands = [
        { command: formatCode.name, callback: formatCode },
    ];
    return commands;
}
exports.codeFormattingCommand = codeFormattingCommand;
/**
 * Replaces current single or multiline selection with MD code formated selection
 */
function formatCode() {
    const editor = vscode_1.window.activeTextEditor;
    if (!editor) {
        common_1.noActiveEditorMessage();
        return;
    }
    else {
        if (!common_1.isValidEditor(editor, true, "format code")) {
            return;
        }
        if (!common_1.isMarkdownFileCheck(editor, false)) {
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        // Show code language list if the selected text spans multiple lines and is not already formatted as code block.
        // If the selected text is already in a code block, delete the fenced code wrapper.
        // Single line selections will not include a code language.
        if (!selection.isSingleLine) {
            if (!format_styles_1.isMultiLineCode(selectedText)) {
                showSupportedLanguages(selectedText, selection);
            }
            else {
                applyCodeFormatting(selectedText, selection, "");
            }
        }
        else {
            applyCodeFormatting(selectedText, selection, "");
        }
    }
    common_1.sendTelemetryData(telemetryCommand, "");
}
exports.formatCode = formatCode;
/**
 * Returns input string formatted MD Code or removed markdown code if it already exists.
 * @param {string} content - selected text
 * @param {boolean} isSingleLine - determines is code formatting is inline (isSingleLine = true)
 * @param {vscode.Range} range - If provided will get the text at the given range
 */
function format(content, codeLang, isSingleLine, range) {
    const selectedText = content.trim();
    let styleCode = "";
    // If the selection is contained in a single line treat it as inline code
    // If the selection spans muliple lines apply fenced code formatting
    if (isSingleLine) {
        // Clean up string if it is already formatted
        if (format_styles_1.isInlineCode(selectedText)) {
            styleCode = selectedText.substring(1, selectedText.length - 1);
        }
        else {
            styleCode = "`" + selectedText + "`";
        }
    }
    else {
        if (format_styles_1.isMultiLineCode(selectedText)) {
            // Determine the range if a supported language is part of the starting line.
            const getRange = selectedText.indexOf("\r\n");
            styleCode = "\r\n" + selectedText.substring(getRange, selectedText.length - 3).trim() + "\r\n";
        }
        else {
            styleCode = "\n```" + codeLang + "\n" + selectedText + "\n```\n";
        }
    }
    // Clean up string if it is already formatted
    return styleCode;
}
exports.format = format;
/**
 * Returns a list of code languages for users to choose from.  The languages will be displayed in a quick pick menu.
 */
function showSupportedLanguages(content, selectedContent) {
    let selectedCodeLang;
    const supportedLanguages = [];
    const options = { placeHolder: docs_code_languages_1.languageRequired };
    docs_code_languages_1.DocsCodeLanguages.sort().forEach((codeLang) => {
        supportedLanguages.push(codeLang);
    });
    vscode_1.window.showQuickPick(supportedLanguages, options).then((qpSelection) => {
        if (!qpSelection) {
            common_1.postWarning("No code language selected. Abandoning command.");
            return;
        }
        selectedCodeLang = qpSelection;
        applyCodeFormatting(content, selectedContent, selectedCodeLang);
        if (!qpSelection) {
            common_1.postWarning("No code language selected. Abandoning command.");
            return;
        }
    });
}
exports.showSupportedLanguages = showSupportedLanguages;
function applyCodeFormatting(content, selectedContent, codeLang) {
    const selectedText = content.trim();
    const editor = vscode_1.window.activeTextEditor;
    if (!editor) {
        common_1.noActiveEditorMessage();
        return;
    }
    else {
        const emptyRange = new vscode_1.Range(editor.selection.active, editor.selection.active);
        if (selectedText === "") {
            const cursorPosition = editor.selection.active;
            // assumes the range of code syntax
            const range = new vscode_1.Range(cursorPosition.with(cursorPosition.line, cursorPosition.character - 1
                < 0 ? 0 : cursorPosition.character - 1), cursorPosition.with(cursorPosition.line, cursorPosition.character + 1));
            const formattedText = format(selectedText, "", selectedContent.isSingleLine, range);
            format_logic_manager_1.insertUnselectedText(editor, formatCode.name, formattedText, range);
        }
        else {
            // calls formatter and returns selectedText as MD Code
            const formattedText = format(selectedText, codeLang, selectedContent.isSingleLine, emptyRange);
            common_1.insertContentToEditor(editor, formatCode.name, formattedText, true);
        }
    }
}
exports.applyCodeFormatting = applyCodeFormatting;
//# sourceMappingURL=code-controller.js.map