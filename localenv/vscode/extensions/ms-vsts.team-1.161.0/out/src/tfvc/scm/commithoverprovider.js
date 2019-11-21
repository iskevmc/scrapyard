/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const util_1 = require("../util");
const scmInputUri = vscode_1.Uri.parse("scm:input");
function isSCMInput(uri) {
    return uri.toString() === scmInputUri.toString();
}
class CommitHoverProvider {
    constructor() {
        this.diagnostics = [];
        this.disposables = [];
        this.visibleTextEditorsDisposable = vscode_1.window.onDidChangeVisibleTextEditors(this.onVisibleTextEditors, this);
        this.onVisibleTextEditors(vscode_1.window.visibleTextEditors);
        this.decorationType = vscode_1.window.createTextEditorDecorationType({
            isWholeLine: true,
            color: "rgb(228, 157, 43)",
            dark: {
                color: "rgb(220, 211, 71)"
            }
        });
    }
    get message() {
        if (!this.editor) {
            return;
        }
        return this.editor.document.getText();
    }
    set message(message) {
        if (!this.editor || message === undefined) {
            return;
        }
        const document = this.editor.document;
        const start = document.lineAt(0).range.start;
        const end = document.lineAt(document.lineCount - 1).range.end;
        const range = new vscode_1.Range(start, end);
        const edit = new vscode_1.WorkspaceEdit();
        edit.replace(scmInputUri, range, message);
        vscode_1.workspace.applyEdit(edit);
    }
    onVisibleTextEditors(editors) {
        const [editor] = editors.filter((e) => isSCMInput(e.document.uri));
        if (!editor) {
            return;
        }
        this.visibleTextEditorsDisposable.dispose();
        this.editor = editor;
        const onDidChange = util_1.filterEvent(vscode_1.workspace.onDidChangeTextDocument, (e) => e.document && isSCMInput(e.document.uri));
        onDidChange(this.update, this, this.disposables);
        vscode_1.workspace.onDidChangeConfiguration(this.update, this, this.disposables);
        vscode_1.languages.registerHoverProvider({ scheme: "scm" }, this);
    }
    update() {
        this.diagnostics = [];
        //TODO provide any diagnostic info based on the message here (see git commitcontroller)
        this.editor.setDecorations(this.decorationType, this.diagnostics.map((d) => d.range));
    }
    /* Implement HoverProvider */
    provideHover(document, position) {
        const [decoration] = this.diagnostics.filter((d) => d.range.contains(position));
        if (!decoration || !document) {
            return;
        }
        return new vscode_1.Hover(decoration.message, decoration.range);
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.CommitHoverProvider = CommitHoverProvider;

//# sourceMappingURL=commithoverprovider.js.map
