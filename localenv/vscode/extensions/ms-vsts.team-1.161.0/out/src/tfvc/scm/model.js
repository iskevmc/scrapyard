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
const telemetry_1 = require("../../services/telemetry");
const constants_1 = require("../../helpers/constants");
const util_1 = require("../util");
const resource_1 = require("./resource");
const resourcegroups_1 = require("./resourcegroups");
const status_1 = require("./status");
const tfvcoutput_1 = require("../tfvcoutput");
const _ = require("underscore");
const path = require("path");
class Model {
    constructor(repositoryRoot, repository, onWorkspaceChange) {
        this._disposables = [];
        this._explicitlyExcluded = [];
        this._onDidChange = new vscode_1.EventEmitter();
        this._conflictsGroup = new resourcegroups_1.ConflictsGroup([]);
        this._includedGroup = new resourcegroups_1.IncludedGroup([]);
        this._excludedGroup = new resourcegroups_1.ExcludedGroup([]);
        this._repositoryRoot = repositoryRoot;
        this._repository = repository;
        //filterEvent should return false if an event is to be filtered
        const onNonGitChange = util_1.filterEvent(onWorkspaceChange, (uri) => {
            if (!uri || !uri.fsPath) {
                return false;
            }
            // Ignore files that aren't under this._repositoryRoot (e.g., settings.json)
            const isSubFolder = uri.fsPath.normalize().startsWith(path.normalize(this._repositoryRoot));
            // Ignore workspace changes that take place in the .tf or $tf folder (where path contains /.tf/ or \$tf\)
            const isTfFolder = !/\/\.tf\//.test(uri.fsPath) && !/\\\$tf\\/.test(uri.fsPath);
            // Attempt to ignore the team-extension.log file directly
            const isLogFile = !(path.basename(uri.fsPath) === "team-extension.log");
            return isSubFolder && isTfFolder && isLogFile;
        });
        onNonGitChange(this.onFileSystemChange, this, this._disposables);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    dispose() {
        if (this._disposables) {
            this._disposables.forEach((d) => d.dispose());
            this._disposables = [];
        }
    }
    get ConflictsGroup() { return this._conflictsGroup; }
    get IncludedGroup() { return this._includedGroup; }
    get ExcludedGroup() { return this._excludedGroup; }
    get Resources() {
        const result = [];
        if (this._conflictsGroup.resources.length > 0) {
            result.push(this._conflictsGroup);
        }
        result.push(this._includedGroup);
        result.push(this._excludedGroup);
        return result;
    }
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._statusAlreadyInProgress) {
                return;
            }
            this._statusAlreadyInProgress = true;
            try {
                yield this.run(undefined);
            }
            finally {
                this._statusAlreadyInProgress = false;
            }
        });
    }
    onFileSystemChange() {
        this.status();
    }
    run(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.SourceControl }, () => __awaiter(this, void 0, void 0, function* () {
                if (fn) {
                    yield fn();
                }
                else {
                    Promise.resolve();
                }
                yield this.update();
            }));
        });
    }
    //Add the items to the explicitly excluded list.
    Exclude(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            if (paths && paths.length > 0) {
                paths.forEach((path) => {
                    const normalizedPath = path.toLowerCase();
                    if (!_.contains(this._explicitlyExcluded, normalizedPath)) {
                        this._explicitlyExcluded.push(normalizedPath);
                    }
                });
                yield this.update();
            }
        });
    }
    //Unexclude doesn't explicitly INclude.  It defers to the status of the individual item.
    Unexclude(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            if (paths && paths.length > 0) {
                paths.forEach((path) => {
                    const normalizedPath = path.toLowerCase();
                    if (_.contains(this._explicitlyExcluded, normalizedPath)) {
                        this._explicitlyExcluded = _.without(this._explicitlyExcluded, normalizedPath);
                    }
                });
                yield this.update();
            }
        });
    }
    Refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update();
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            const changes = yield this._repository.GetStatus();
            let foundConflicts = [];
            // Without any server context we can't run delete or resolve commands
            if (this._repository.HasContext) {
                // Get the list of conflicts
                //TODO: Optimize out this call unless it is needed. This call takes over 4 times longer than the status call and is unecessary most of the time.
                foundConflicts = yield this._repository.FindConflicts();
                foundConflicts.forEach((conflict) => {
                    if (conflict.message) {
                        tfvcoutput_1.TfvcOutput.AppendLine(`[Resolve] ${conflict.message}`);
                    }
                });
            }
            const conflict = foundConflicts.find((c) => c.type === status_1.ConflictType.NAME_AND_CONTENT || c.type === status_1.ConflictType.RENAME);
            if (conflict) {
                if (conflict.type === status_1.ConflictType.RENAME) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TfvcTelemetryEvents.RenameConflict);
                }
                else {
                    telemetry_1.Telemetry.SendEvent(constants_1.TfvcTelemetryEvents.NameAndContentConflict);
                }
            }
            const included = [];
            const excluded = [];
            const conflicts = [];
            changes.forEach((raw) => {
                const conflict = foundConflicts.find((c) => this.conflictMatchesPendingChange(raw, c));
                const resource = new resource_1.Resource(raw, conflict);
                if (resource.HasStatus(status_1.Status.CONFLICT)) {
                    return conflicts.push(resource);
                }
                else {
                    //If explicitly excluded, that has highest priority
                    if (_.contains(this._explicitlyExcluded, resource.resourceUri.fsPath.toLowerCase())) {
                        return excluded.push(resource);
                    }
                    //Versioned changes should always be included (as long as they're not deletes)
                    if (resource.IsVersioned && !resource.HasStatus(status_1.Status.DELETE)) {
                        return included.push(resource);
                    }
                    //Pending changes should be included
                    if (!resource.PendingChange.isCandidate) {
                        return included.push(resource);
                    }
                    //Others:
                    //Candidate changes should be excluded
                    return excluded.push(resource);
                }
            });
            this._conflictsGroup = new resourcegroups_1.ConflictsGroup(conflicts);
            this._includedGroup = new resourcegroups_1.IncludedGroup(included);
            this._excludedGroup = new resourcegroups_1.ExcludedGroup(excluded);
            this._onDidChange.fire();
        });
    }
    conflictMatchesPendingChange(change, conflict) {
        let result = false;
        if (change && change.localItem && conflict && conflict.localPath) {
            // TODO: If resource or conflict are renames we have a lot more work to do
            //       We are postponing this work for now until we have evidence that it happens a lot
            let path2 = conflict.localPath;
            // If path2 is relative then assume it is relative to the repo root
            if (!path.isAbsolute(path2)) {
                path2 = path.join(this._repositoryRoot, path2);
            }
            // First compare the source item
            result = change.localItem.toLowerCase() === path2.toLowerCase();
        }
        return result;
    }
}
exports.Model = Model;

//# sourceMappingURL=model.js.map
