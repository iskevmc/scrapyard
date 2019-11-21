/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const status_1 = require("./status");
const path = require("path");
class DecorationProvider {
    static getDecorations(statuses, conflictType) {
        const status = this.getDominantStatus(statuses);
        const light = { iconPath: DecorationProvider.getIconPath(status, "light") };
        const dark = { iconPath: DecorationProvider.getIconPath(status, "dark") };
        return { strikeThrough: DecorationProvider.useStrikeThrough(status, conflictType), light, dark };
    }
    static getDominantStatus(statuses) {
        if (!statuses || statuses.length === 0) {
            return undefined;
        }
        // if there's only one just return it
        if (statuses.length === 1) {
            return statuses[0];
        }
        // The most dominant types are ADD, EDIT, and DELETE
        let index = statuses.findIndex((s) => s === status_1.Status.ADD || s === status_1.Status.EDIT || s === status_1.Status.DELETE);
        if (index >= 0) {
            return statuses[index];
        }
        // The next dominant type is RENAME
        index = statuses.findIndex((s) => s === status_1.Status.RENAME);
        if (index >= 0) {
            return statuses[index];
        }
        // After that, just return the first one
        return statuses[0];
    }
    static getIconUri(iconName, theme) {
        return vscode_1.Uri.file(path.join(DecorationProvider._iconsRootPath, theme, `${iconName}.svg`));
    }
    static getIconPath(status, theme) {
        switch (status) {
            case status_1.Status.ADD: return DecorationProvider.getIconUri("status-add", theme);
            case status_1.Status.BRANCH: return DecorationProvider.getIconUri("status-branch", theme);
            case status_1.Status.DELETE: return DecorationProvider.getIconUri("status-delete", theme);
            case status_1.Status.EDIT: return DecorationProvider.getIconUri("status-edit", theme);
            case status_1.Status.LOCK: return DecorationProvider.getIconUri("status-lock", theme);
            case status_1.Status.MERGE: return DecorationProvider.getIconUri("status-merge", theme);
            case status_1.Status.RENAME: return DecorationProvider.getIconUri("status-rename", theme);
            case status_1.Status.UNDELETE: return DecorationProvider.getIconUri("status-undelete", theme);
            default: return void 0;
        }
    }
    static useStrikeThrough(status, conflictType) {
        return (status === status_1.Status.DELETE) ||
            (status === status_1.Status.MERGE &&
                (conflictType === status_1.ConflictType.DELETE || conflictType === status_1.ConflictType.DELETE_TARGET));
    }
}
DecorationProvider._iconsRootPath = path.join(path.dirname(__dirname), "..", "..", "resources", "icons");
exports.DecorationProvider = DecorationProvider;

//# sourceMappingURL=decorationprovider.js.map
