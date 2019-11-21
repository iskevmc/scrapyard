/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const strings_1 = require("../helpers/strings");
const interfaces_1 = require("./interfaces");
const tfvcoutput_1 = require("./tfvcoutput");
const path = require("path");
class UIHelper {
    static ChoosePendingChange(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (changes && changes.length > 0) {
                // First, create an array of quick pick items from the changes
                const items = [];
                for (let i = 0; i < changes.length; i++) {
                    items.push({
                        label: UIHelper.GetFileName(changes[i]),
                        description: changes[i].changeType,
                        detail: UIHelper.GetRelativePath(changes[i])
                    });
                }
                // Then, show the quick pick window and get back the one they chose
                const item = yield vscode_1.window.showQuickPick(items, { matchOnDescription: true, placeHolder: strings_1.Strings.ChooseItemQuickPickPlaceHolder });
                // Finally, find the matching pending change and return it
                if (item) {
                    for (let i = 0; i < changes.length; i++) {
                        if (UIHelper.GetRelativePath(changes[i]) === item.detail) {
                            return changes[i];
                        }
                    }
                }
            }
            else if (changes && changes.length === 0) {
                const items = [];
                items.push({
                    label: strings_1.Strings.TfNoPendingChanges,
                    description: undefined,
                    detail: undefined
                });
                yield vscode_1.window.showQuickPick(items);
            }
            return undefined;
        });
    }
    /**
     * This method displays the results of the sync command in the output window and optionally in the QuickPick window as well.
     */
    static ShowSyncResults(syncResults, showPopup, onlyShowErrors) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            if (syncResults.itemResults.length === 0) {
                tfvcoutput_1.TfvcOutput.AppendLine(strings_1.Strings.AllFilesUpToDate);
                items.push({
                    label: strings_1.Strings.AllFilesUpToDate,
                    description: undefined,
                    detail: undefined
                });
            }
            else {
                for (let i = 0; i < syncResults.itemResults.length; i++) {
                    const item = syncResults.itemResults[i];
                    if (onlyShowErrors && !UIHelper.isSyncError(item.syncType)) {
                        continue;
                    }
                    const type = this.GetDisplayTextForSyncType(item.syncType);
                    tfvcoutput_1.TfvcOutput.AppendLine(type + ": " + item.itemPath + " : " + item.message);
                    items.push({
                        label: type,
                        description: item.itemPath,
                        detail: item.message
                    });
                }
            }
            if (showPopup) {
                yield vscode_1.window.showQuickPick(items);
            }
        });
    }
    static isSyncError(type) {
        switch (type) {
            case interfaces_1.SyncType.Conflict:
            case interfaces_1.SyncType.Error:
            case interfaces_1.SyncType.Warning:
                return true;
            case interfaces_1.SyncType.Deleted:
            case interfaces_1.SyncType.New:
            case interfaces_1.SyncType.Updated:
                return false;
            default:
                return false;
        }
    }
    static GetDisplayTextForSyncType(type) {
        switch (type) {
            case interfaces_1.SyncType.Conflict: return strings_1.Strings.SyncTypeConflict;
            case interfaces_1.SyncType.Deleted: return strings_1.Strings.SyncTypeDeleted;
            case interfaces_1.SyncType.Error: return strings_1.Strings.SyncTypeError;
            case interfaces_1.SyncType.New: return strings_1.Strings.SyncTypeNew;
            case interfaces_1.SyncType.Updated: return strings_1.Strings.SyncTypeUpdated;
            case interfaces_1.SyncType.Warning: return strings_1.Strings.SyncTypeWarning;
            default: return strings_1.Strings.SyncTypeUpdated;
        }
    }
    static GetDisplayTextForAutoResolveType(type) {
        switch (type) {
            case interfaces_1.AutoResolveType.AutoMerge: return strings_1.Strings.AutoResolveTypeAutoMerge;
            case interfaces_1.AutoResolveType.DeleteConflict: return strings_1.Strings.AutoResolveTypeDeleteConflict;
            case interfaces_1.AutoResolveType.KeepYours: return strings_1.Strings.AutoResolveTypeKeepYours;
            case interfaces_1.AutoResolveType.KeepYoursRenameTheirs: return strings_1.Strings.AutoResolveTypeKeepYoursRenameTheirs;
            case interfaces_1.AutoResolveType.OverwriteLocal: return strings_1.Strings.AutoResolveTypeOverwriteLocal;
            case interfaces_1.AutoResolveType.TakeTheirs: return strings_1.Strings.AutoResolveTypeTakeTheirs;
            default: return strings_1.Strings.AutoResolveTypeAutoMerge;
        }
    }
    static GetFileName(change) {
        if (change && change.localItem) {
            const filename = path.parse(change.localItem).base;
            return filename;
        }
        return "";
    }
    static GetRelativePath(change) {
        if (change && change.localItem && vscode_1.workspace) {
            return vscode_1.workspace.asRelativePath(change.localItem);
        }
        return change.localItem;
    }
    static PromptForConfirmation(message, okButtonText) {
        return __awaiter(this, void 0, void 0, function* () {
            okButtonText = okButtonText ? okButtonText : "OK";
            //TODO: use Modal api once vscode.d.ts exposes it (currently proposed)
            const pick = yield vscode_1.window.showWarningMessage(message, /*{ modal: true },*/ okButtonText);
            return pick === okButtonText;
        });
    }
}
exports.UIHelper = UIHelper;

//# sourceMappingURL=uihelper.js.map
