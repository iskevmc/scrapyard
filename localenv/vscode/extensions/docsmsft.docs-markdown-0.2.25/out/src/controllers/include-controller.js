"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const common_1 = require("../helper/common");
const utility_1 = require("../helper/utility");
const telemetryCommand = "insertInclude";
const markdownExtensionFilter = [".md"];
function insertIncludeCommand() {
    const commands = [
        { command: insertInclude.name, callback: insertInclude },
    ];
    return commands;
}
exports.insertIncludeCommand = insertIncludeCommand;
/**
 * transforms the current selection into an include.
 */
function insertInclude() {
    const path = require("path");
    const dir = require("node-dir");
    const os = require("os");
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        common_1.noActiveEditorMessage();
        return;
    }
    const activeFileDir = path.dirname(editor.document.fileName);
    const folderPath = vscode.workspace.rootPath;
    if (!common_1.isMarkdownFileCheck(editor, false)) {
        return;
    }
    if (!common_1.hasValidWorkSpaceRootPath(telemetryCommand)) {
        return;
    }
    if (folderPath == null) {
        return;
    }
    // recursively get all the files from the root folder
    dir.files(folderPath, (err, files) => {
        if (err) {
            throw err;
        }
        const items = [];
        files.sort();
        {
            files.filter((file) => markdownExtensionFilter.indexOf(path.extname(file.toLowerCase()))
                !== -1).forEach((file) => {
                items.push({ label: path.basename(file), description: path.dirname(file) });
            });
        }
        // show the quick pick menu
        vscode.window.showQuickPick(items).then((qpSelection) => {
            let result;
            const position = editor.selection.active;
            // replace the selected text with the properly formatted link
            if (!qpSelection) {
                return;
            }
            // Strip markdown extension from label text.
            const includeText = qpSelection.label.replace(".md", "");
            if (os.type() === "Windows_NT") {
                result = utility_1.includeBuilder((path.relative(activeFileDir, path.join(qpSelection.description, qpSelection.label).split("\\").join("\\\\"))), includeText);
            }
            if (os.type() === "Darwin") {
                result = utility_1.includeBuilder((path.relative(activeFileDir, path.join(qpSelection.description, qpSelection.label).split("//").join("//"))), includeText);
            }
            editor.edit((editBuilder) => {
                editBuilder.insert(position, result.replace(/\\/g, "/"));
            });
        });
    });
    common_1.sendTelemetryData(telemetryCommand, "");
}
exports.insertInclude = insertInclude;
//# sourceMappingURL=include-controller.js.map