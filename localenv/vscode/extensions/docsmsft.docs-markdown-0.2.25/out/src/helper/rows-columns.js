"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const common_1 = require("../helper/common");
const common_2 = require("../helper/common");
const indentSpacing = "    ";
const columnCursorSpacing = indentSpacing.repeat(2);
const columnOpenSyntax = ":::column:::";
const columnEndSyntax = ":::column-end:::";
const columnSpanSyntax = `:::column span="":::`;
const rowOpenSyntax = ":::row:::";
const rowEndSyntax = ":::row-end:::";
const columnRangeMessage = "The number of columns must be between 1 and 4.";
const insertRowStructureMessage = "Column structures can’t be inserted within rows or columns.";
const columnErrorMessage = "A column can’t be inserted within another column.";
const columnRow = `
${indentSpacing}${columnOpenSyntax}
${columnCursorSpacing}
${indentSpacing}${columnEndSyntax}`;
const columnAdd = `${indentSpacing}${columnOpenSyntax}
${columnCursorSpacing}
${indentSpacing}${columnEndSyntax}`;
const columnSpan = `${indentSpacing}${columnSpanSyntax}
${columnCursorSpacing}
${indentSpacing}${columnEndSyntax}`;
// range should be between 1 and 4
function checkColumnRange(columnNumber) {
    if (columnNumber >= 1 && columnNumber <= 4) {
        createRow(columnNumber);
    }
    else {
        common_1.showWarningMessage(columnRangeMessage);
        return;
    }
}
exports.checkColumnRange = checkColumnRange;
// row structure
function buildRow(columnNumber) {
    const columns = columnRow.repeat(columnNumber);
    const rowStructure = `${rowOpenSyntax}${columns}
${rowEndSyntax}
`;
    return rowStructure;
}
exports.buildRow = buildRow;
// insert row
function createRow(columnNumber) {
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        const startPosition = editor.selection.active.line;
        const totalLines = editor.document.lineCount;
        let i;
        let rowStartLineNumber;
        let rowEndLineNumber;
        const rowStartRegex = /^:{3}row:{3}/gm;
        const rowEndRegex = /^:{3}row-end:{3}/gm;
        try {
            for (i = startPosition; i < totalLines; i--) {
                var lineData = editor.document.lineAt(i);
                var lineText = lineData.text;
                if (lineText.match(rowStartRegex)) {
                    rowStartLineNumber = lineData.lineNumber;
                    break;
                }
                if (lineText.match(rowEndRegex)) {
                    rowEndLineNumber = lineData.lineNumber;
                }
            }
        }
        catch (error) {
            // no rows found before cursor
            // to-do: create promise
        }
        // found row start but no row end so assume that the cursor is at the beginning of the first/only row
        // throw error
        if (rowStartLineNumber && !rowEndLineNumber) {
            common_1.showWarningMessage(insertRowStructureMessage);
            common_2.showStatusMessage(insertRowStructureMessage);
        }
        // found a complete row
        // create row
        if (rowStartLineNumber && rowEndLineNumber) {
            if (rowStartLineNumber < startPosition && rowEndLineNumber < startPosition) {
                const newRow = buildRow(columnNumber);
                common_1.insertContentToEditor(editor, createRow.name, newRow);
                const newPosition = new vscode_1.Position(startPosition + 2, 8);
                const newSelection = new vscode_1.Selection(newPosition, newPosition);
                editor.selection = newSelection;
            }
        }
        // no previous rows
        // create row
        if (!rowStartLineNumber) {
            const newRow = buildRow(columnNumber);
            common_1.insertContentToEditor(editor, createRow.name, newRow);
            const newPosition = new vscode_1.Position(startPosition + 2, 8);
            const newSelection = new vscode_1.Selection(newPosition, newPosition);
            editor.selection = newSelection;
        }
    }
}
exports.createRow = createRow;
// add a new column to existing row
function addNewColumn() {
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        validatePosition();
    }
}
exports.addNewColumn = addNewColumn;
// add a new column with span to existing row
function addNewColumnWithSpan() {
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        validatePosition(true);
    }
}
exports.addNewColumnWithSpan = addNewColumnWithSpan;
// determine if cursor position is within a row by looking up for either row open or column-end
// if no row or column-end is found, assume that cursor is not in a row
function validatePosition(span) {
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        const startPosition = editor.selection.active.line;
        const cursorPosition = editor.selection.active.character;
        const totalLines = editor.document.lineCount;
        let i;
        let columnStartLineNumber;
        let columnEndLineNumber;
        let newPosition;
        let newSelection;
        const columnStartRegex = /^\s+:{3}(column|column\sspan=".*"):{3}/gm;
        const columnEndRegex = /^\s+:{3}column-end:{3}/gm;
        const rowStartRegex = /^:{3}row:{3}/gm;
        try {
            for (i = startPosition; i < totalLines; i--) {
                var lineData = editor.document.lineAt(i);
                var lineText = lineData.text;
                if (lineText.match(columnStartRegex)) {
                    columnStartLineNumber = lineData.lineNumber;
                    break;
                }
                if (lineText.match(columnEndRegex)) {
                    columnEndLineNumber = lineData.lineNumber;
                }
                if (lineText.match(rowStartRegex)) {
                }
            }
        }
        catch (error) {
            // no columns found before cursor
            // to-do: create promise for this
        }
        // found column start but no column end so assume that the cursor is at the beginning of the first/only column
        // throw error
        if (columnStartLineNumber && !columnEndLineNumber) {
            common_1.showWarningMessage(columnErrorMessage);
            common_2.showStatusMessage(columnErrorMessage);
        }
        // found a complete column
        // create column
        if (columnStartLineNumber && columnEndLineNumber) {
            if (columnStartLineNumber < startPosition && columnEndLineNumber < startPosition) {
                if (span && cursorPosition === 0) {
                    common_1.insertContentToEditor(editor, createRow.name, columnSpan);
                    newPosition = new vscode_1.Position(editor.selection.active.line, 20);
                    newSelection = new vscode_1.Selection(newPosition, newPosition);
                    editor.selection = newSelection;
                }
                if (!span && cursorPosition === 0) {
                    common_1.insertContentToEditor(editor, createRow.name, columnAdd);
                    newPosition = new vscode_1.Position(editor.selection.active.line + 1, 7);
                    newSelection = new vscode_1.Selection(newPosition, newPosition);
                    editor.selection = newSelection;
                }
                if (!span && cursorPosition === 8) {
                    insertIndentedColumn(columnAdd, 0);
                    newPosition = new vscode_1.Position(editor.selection.active.line + 1, 20);
                    newSelection = new vscode_1.Selection(newPosition, newPosition);
                    editor.selection = newSelection;
                }
                if (span && cursorPosition === 8) {
                    insertIndentedColumn(columnSpan, 0);
                    newPosition = new vscode_1.Position(editor.selection.active.line, 20);
                    newSelection = new vscode_1.Selection(newPosition, newPosition);
                    editor.selection = newSelection;
                }
            }
        }
    }
}
exports.validatePosition = validatePosition;
function insertIndentedColumn(content, position) {
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        const activeLine = editor.selection.active.line;
        editor.edit(editBuilder => {
            editBuilder.insert(new vscode_1.Position(activeLine, position), content);
        });
    }
}
exports.insertIndentedColumn = insertIndentedColumn;
//# sourceMappingURL=rows-columns.js.map