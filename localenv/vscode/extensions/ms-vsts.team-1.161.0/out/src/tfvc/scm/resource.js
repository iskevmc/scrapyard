/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const tfvcscmprovider_1 = require("../tfvcscmprovider");
const status_1 = require("./status");
const decorationprovider_1 = require("./decorationprovider");
const strings_1 = require("../../helpers/strings");
const constants_1 = require("../../helpers/constants");
class Resource {
    constructor(change, conflict) {
        this._change = change;
        this._uri = vscode_1.Uri.file(change.localItem);
        this._statuses = status_1.GetStatuses(change.changeType);
        this._version = change.version;
        if (conflict) {
            this._statuses.push(status_1.Status.CONFLICT);
            this._conflictType = conflict.type;
        }
    }
    get PendingChange() { return this._change; }
    get Statuses() { return this._statuses; }
    get ConflictType() { return this._conflictType; }
    HasStatus(status) {
        return this._statuses.findIndex((s) => s === status) >= 0;
    }
    get IsVersioned() { return this._version !== "0"; }
    /**
     * This method gets a vscode file uri that represents the server path and version that the local item is based on.
     */
    GetServerUri() {
        const serverItem = this._change.sourceItem ? this._change.sourceItem : this._change.serverItem;
        // For conflicts set the version to "T"ip so that we will compare against the latest version
        const versionSpec = this.HasStatus(status_1.Status.CONFLICT) ? "T" : "C" + this._change.version;
        return vscode_1.Uri.file(serverItem).with({ scheme: tfvcscmprovider_1.TfvcSCMProvider.scmScheme, query: versionSpec });
    }
    GetTitle() {
        const basename = path.basename(this._change.localItem);
        const sourceBasename = this._change.sourceItem ? path.basename(this._change.sourceItem) : "";
        if (this.HasStatus(status_1.Status.CONFLICT)) {
            switch (this._conflictType) {
                case status_1.ConflictType.CONTENT:
                case status_1.ConflictType.MERGE:
                case status_1.ConflictType.RENAME:
                case status_1.ConflictType.NAME_AND_CONTENT:
                    if (this.HasStatus(status_1.Status.ADD)) {
                        return `${basename} (${strings_1.Strings.ConflictAlreadyExists})`;
                    }
                    // Use the default title for all other cases
                    break;
                case status_1.ConflictType.DELETE:
                    return `${basename} (${strings_1.Strings.ConflictAlreadyDeleted})`;
                case status_1.ConflictType.DELETE_TARGET:
                    return `${basename} (${strings_1.Strings.ConflictDeletedLocally})`;
            }
        }
        if (this.HasStatus(status_1.Status.RENAME)) {
            return sourceBasename ? `${basename} <- ${sourceBasename}` : `${basename}`;
        }
        else if (this.HasStatus(status_1.Status.EDIT)) {
            return `${basename}`;
        }
        return "";
    }
    /* Implement SourceControlResourceState */
    get resourceUri() { return this._uri; }
    get decorations() {
        // TODO Add conflict type to the resource constructor and pass it here
        return decorationprovider_1.DecorationProvider.getDecorations(this._statuses);
    }
    //Set the command to invoke when a Resource is selected in the viewlet
    get command() {
        return { command: constants_1.TfvcCommandNames.Open, title: "Open", arguments: [this] };
    }
}
exports.Resource = Resource;

//# sourceMappingURL=resource.js.map
