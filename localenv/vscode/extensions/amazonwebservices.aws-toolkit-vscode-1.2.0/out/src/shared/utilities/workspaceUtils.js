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
const vscode = require("vscode");
const logger_1 = require("../logger");
/**
 * Encapsulates adding a folder to the VS Code Workspace.
 *
 * After the folder is added, this method waits until VS Code signals that the workspace has been updated.
 *
 * CALLER BEWARE: As of VS Code 1.36.00, any behavior that changes the first workspace folder causes VS Code to restart
 * in order to reopen the "workspace", which halts code and re-activates the extension. In this case, this function
 * will not return.
 *
 * Caller is responsible for validating whether or not the folder should be added to the workspace.
 *
 * @param folder - Folder to add to the VS Code Workspace
 *
 * @returns true if folder was added, false otherwise
 */
function addFolderToWorkspace(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const disposables = [];
        const logger = logger_1.getLogger();
        try {
            // Wait for the WorkspaceFolders changed notification for the folder of interest before returning to caller
            return yield new Promise(resolve => {
                vscode.workspace.onDidChangeWorkspaceFolders(workspaceFoldersChanged => {
                    if (workspaceFoldersChanged.added.some(addedFolder => addedFolder.uri.fsPath === folder.uri.fsPath)) {
                        resolve(true);
                    }
                }, undefined, disposables);
                if (!vscode.workspace.updateWorkspaceFolders(
                // Add new folder to the end of the list rather than the beginning, to avoid VS Code
                // terminating and reinitializing our extension.
                (vscode.workspace.workspaceFolders || []).length, 0, folder)) {
                    resolve(false);
                }
            });
        }
        catch (err) {
            logger.error(`Unexpected error adding folder ${folder.uri.fsPath} to workspace`, err);
            return false;
        }
        finally {
            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    });
}
exports.addFolderToWorkspace = addFolderToWorkspace;
//# sourceMappingURL=workspaceUtils.js.map