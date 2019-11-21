"use strict";
"use-strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const common = require("./common");
const log = require("./log");
/**
 * Checks the user input for table creation.
 * Format - C:R.
 * Columns and Rows cannot be 0 or negative.
 * 4 Columns maximum.
 * @param {number} size - the number of array size after split user input with ':'
 * @param {string} colStr - the string of requested columns
 * @param {string} rowStr - the string of requested rows
 */
function validateTableRowAndColumnCount(size, colStr, rowStr) {
    const tableTextRegex = /^-?\d*$/;
    const col = tableTextRegex.test(colStr) ? Number.parseInt(colStr) : undefined;
    const row = tableTextRegex.test(rowStr) ? Number.parseInt(rowStr) : undefined;
    log.debug("Trying to create a table of: " + col + " columns and " + row + " rows.");
    if (col === undefined || row === undefined) {
        return undefined;
    }
    if (size !== 2 || isNaN(col) || isNaN(row)) {
        const errorMsg = "Please input the number of columns and rows as C:R e.g. 3:4";
        common.postWarning(errorMsg);
        return false;
    }
    else if (col <= 0 || row <= 0) {
        const errorMsg = "The number of rows or columns can't be zero or negative.";
        common.postWarning(errorMsg);
        return false;
    }
    else if (col > 4) {
        const errorMsg = "You can only insert up to four columns via Docs Markdown.";
        common.postWarning(errorMsg);
        return false;
    }
    else if (row > 50) {
        const errorMsg = "You can only insert up to 50 rows via Docs Markdown.";
        common.postWarning(errorMsg);
        return false;
    }
    else {
        return true;
    }
}
exports.validateTableRowAndColumnCount = validateTableRowAndColumnCount;
/**
 * Creates a string that represents a MarkDown table
 * @param {number} col - the number of columns in the table
 * @param {number} row - the number of rows in the table
 */
function tableBuilder(col, row) {
    let str = "\n";
    /// create header
    // DCR update: 893410 [Add leading pipe]
    // tslint:disable-next-line:no-shadowed-variable
    for (let c = 1; c <= col; c++) {
        str += "|" + "Column" + c + "  |";
        // tslint:disable-next-line:no-shadowed-variable
        for (c = 2; c <= col; c++) {
            str += "Column" + c + "  |";
        }
        str += "\n";
    }
    // DCR update: 893410 [Add leading pipe]
    // tslint:disable-next-line:no-shadowed-variable
    for (let c = 1; c <= col; c++) {
        str += "|" + "---------" + "|";
        // tslint:disable-next-line:no-shadowed-variable
        for (c = 2; c <= col; c++) {
            str += "---------" + "|";
        }
        str += "\n";
    }
    /// create each row
    for (let r = 1; r <= row; r++) {
        str += "|" + "Row" + r + "     |";
        for (let c = 2; c <= col; c++) {
            str += "         |";
        }
        str += "\n";
    }
    log.debug("Table created: \r\n" + str);
    return str;
}
exports.tableBuilder = tableBuilder;
/**
 * Finds the files, then lets user pick from match list, if more than 1 match.
 * @param {string} searchTerm - the keyword to search directories for
 * @param {string} fullPath - optional, the folder to start the search under.
 */
function search(editor, selection, searchTerm, folderPath, fullPath) {
    const dir = require("node-dir");
    const path = require("path");
    if (fullPath == null) {
        fullPath = folderPath;
    }
    // searches for all files at the given directory path.
    dir.files(fullPath, (err, files) => {
        if (err) {
            throw err;
        }
        const fileOptions = [];
        for (const file in files) {
            if (files.hasOwnProperty(file)) {
                const baseName = (path.parse(files[file]).base);
                const fileName = files[file];
                if (fileName.includes(searchTerm)) {
                    fileOptions.push({ label: baseName, description: fileName });
                }
            }
        }
        // select from all files found that match search term.
        vscode.window.showQuickPick(fileOptions).then(function searchType(selected) {
            const activeFilePath = (path.parse(editor.document.fileName).dir);
            if (!selected) {
                return;
            }
            const target = path.parse(selected.description);
            const relativePath = path.relative(activeFilePath, target.dir);
            const ext = target.ext;
            // change path separator syntax for commonmark
            const snippetLink = path.join(relativePath, target.base).replace(/\\/g, "/");
            const snippet = snippetBuilder(ext.substr(1), target.name, snippetLink);
            const range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            common.insertContentToEditor(editor, search.name, snippet, true, range);
        });
    });
}
exports.search = search;
function internalLinkBuilder(isArt, pathSelection, selectedText = "") {
    const os = require("os");
    let link = "";
    let startBrace = "";
    if (isArt) {
        startBrace = "![";
    }
    else {
        startBrace = "[";
    }
    // replace the selected text with the properly formatted link
    if (pathSelection === "") {
        link = startBrace + selectedText + "]()";
    }
    else {
        link = startBrace + selectedText + "](" + pathSelection + ")";
    }
    // The relative path comparison creates an additional level that is not needed and breaks linking.
    // The path module adds an additional level so we'll need to handle this in our code.
    // Update slashes bug 944097.
    if (os.type() === "Windows_NT") {
        link = link.replace(/\\/g, "/");
    }
    if (isArt) {
        // Art links need backslashes to preview and publish correctly.
        link = link.replace(/\\/g, "/");
    }
    return link;
}
exports.internalLinkBuilder = internalLinkBuilder;
function externalLinkBuilder(link, title = "") {
    if (title === "") {
        title = link;
    }
    const externalLink = "[" + title + "]" + "(" + link + ")";
    return externalLink;
}
exports.externalLinkBuilder = externalLinkBuilder;
function videoLinkBuilder(link) {
    const videoLink = "> [!VIDEO " + link + "]";
    return videoLink;
}
exports.videoLinkBuilder = videoLinkBuilder;
function includeBuilder(link, title) {
    // Include link syntax for reference: [!INCLUDE[sampleinclude](./includes/sampleinclude.md)]
    const include = "[!INCLUDE [" + title + "](" + link + ")]";
    return include;
}
exports.includeBuilder = includeBuilder;
function snippetBuilder(codeFileExtension, targetName, relativePath) {
    const snippet = "[!code-" + codeFileExtension + "[" + targetName + "](" + relativePath + ")]";
    return snippet;
}
exports.snippetBuilder = snippetBuilder;
/**
 * Strip out BOM from a string if presented, to prevent exception from JSON.parse function.
 * In Javascript, \uFEFF represents the Byte Order Mark (BOM).
 * @param originalText - the original string of text
 */
function stripBOMFromString(originalText) {
    if (originalText === undefined) {
        return undefined;
    }
    return originalText.replace(/^\uFEFF/, "");
}
exports.stripBOMFromString = stripBOMFromString;
/**
 * Create child process.
 */
function createChildProcess(path, args, options) {
    const spawn = require("child-process-promise").spawn;
    const promise = spawn(path, args, options);
    const childProcess = promise.childProcess;
    return childProcess;
}
exports.createChildProcess = createChildProcess;
//# sourceMappingURL=utility.js.map