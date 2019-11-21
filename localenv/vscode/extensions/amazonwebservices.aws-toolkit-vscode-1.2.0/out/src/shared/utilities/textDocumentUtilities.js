"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _path = require("path");
const vscode = require("vscode");
const editorUtilities_1 = require("./editorUtilities");
/**
 * If the specified document is currently open, and marked as dirty, it is saved.
 */
function saveDocumentIfDirty(documentPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = _path.normalize(vscode.Uri.file(documentPath).fsPath);
        const document = vscode.workspace.textDocuments.find(doc => {
            if (!doc.isDirty) {
                return false;
            }
            if (_path.normalize(doc.uri.fsPath) !== path) {
                return false;
            }
            return true;
        });
        if (document) {
            yield document.save();
        }
    });
}
exports.saveDocumentIfDirty = saveDocumentIfDirty;
/**
 * Determine the tab width used by the editor.
 *
 * @param editor The editor for which to determine the tab width.
 */
function getTabSize(editor) {
    const tabSize = !editor ? undefined : editor.options.tabSize;
    switch (typeof tabSize) {
        case 'number':
            return tabSize;
        case 'string':
            return Number.parseInt(tabSize, 10);
        default:
            return editorUtilities_1.getTabSizeSetting();
    }
}
exports.getTabSize = getTabSize;
//# sourceMappingURL=textDocumentUtilities.js.map