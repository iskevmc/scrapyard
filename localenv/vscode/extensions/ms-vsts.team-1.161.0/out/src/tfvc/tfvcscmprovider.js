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
const logger_1 = require("../helpers/logger");
const constants_1 = require("../helpers/constants");
const vscode_1 = require("vscode");
const commithoverprovider_1 = require("./scm/commithoverprovider");
const model_1 = require("./scm/model");
const status_1 = require("./scm/status");
const util_1 = require("./util");
const repositorycontext_1 = require("../contexts/repositorycontext");
const tfvcoutput_1 = require("./tfvcoutput");
const tfvccontentprovider_1 = require("./scm/tfvccontentprovider");
const tfvcerror_1 = require("./tfvcerror");
/**
 * This class provides the SCM implementation for TFVC.
 * Note: to switch SCM providers you must do the following:
 *      F1 -> SCM: Enable SCM Preview
 *      F1 -> SCM: Switch SCM Provider -> Choose TFVC from the pick list
 */
class TfvcSCMProvider {
    constructor(extensionManager) {
        this._disposables = [];
        this._tempDisposables = [];
        this._extensionManager = extensionManager;
    }
    /* Static helper methods */
    static ClearCheckinMessage() {
        vscode_1.scm.inputBox.value = "";
    }
    static GetCheckinInfo() {
        const tfvcProvider = TfvcSCMProvider.getProviderInstance();
        try {
            const files = [];
            const commitMessage = vscode_1.scm.inputBox.value;
            const workItemIds = TfvcSCMProvider.getWorkItemIdsFromMessage(commitMessage);
            const resources = tfvcProvider._model.IncludedGroup.resources;
            if (!resources || resources.length === 0) {
                return undefined;
            }
            for (let i = 0; i < resources.length; i++) {
                files.push(resources[i].PendingChange.localItem);
            }
            return {
                files: files,
                comment: commitMessage,
                workItemIds: workItemIds
            };
        }
        catch (err) {
            logger_1.Logger.LogDebug("Failed to GetCheckinInfo. Details: " + err.message);
            throw tfvcerror_1.TfvcError.CreateUnknownError(err);
        }
    }
    static getWorkItemIdsFromMessage(message) {
        const ids = [];
        try {
            // Find all the work item mentions in the string.
            // This returns an array like: ["#1", "#12", "#33"]
            const matches = message ? message.match(/#(\d+)/gm) : [];
            if (matches) {
                for (let i = 0; i < matches.length; i++) {
                    const id = parseInt(matches[i].slice(1));
                    if (!isNaN(id)) {
                        ids.push(id);
                    }
                }
            }
        }
        catch (err) {
            logger_1.Logger.LogDebug("Failed to get all workitems from message: " + message);
        }
        return ids;
    }
    static Exclude(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            const tfvcProvider = TfvcSCMProvider.getProviderInstance();
            yield tfvcProvider._model.Exclude(paths);
        });
    }
    ;
    static Refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const tfvcProvider = TfvcSCMProvider.getProviderInstance();
            yield tfvcProvider._model.Refresh();
        });
    }
    ;
    static Unexclude(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            const tfvcProvider = TfvcSCMProvider.getProviderInstance();
            yield tfvcProvider._model.Unexclude(paths);
        });
    }
    ;
    Initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield tfvcoutput_1.TfvcOutput.CreateChannel(this._disposables);
            yield this.setup();
            // Now that everything is setup, we can register the provider and set up our singleton instance
            // This registration can only happen once
            TfvcSCMProvider.instance = this;
            this._sourceControl = vscode_1.scm.createSourceControl(TfvcSCMProvider.scmScheme, "TFVC");
            this._disposables.push(this._sourceControl);
            this.conflictsGroup = this._sourceControl.createResourceGroup(this._model.ConflictsGroup.id, this._model.ConflictsGroup.label);
            this.includedGroup = this._sourceControl.createResourceGroup(this._model.IncludedGroup.id, this._model.IncludedGroup.label);
            this.excludedGroup = this._sourceControl.createResourceGroup(this._model.ExcludedGroup.id, this._model.ExcludedGroup.label);
            this.conflictsGroup.hideWhenEmpty = true;
            //Set the command to run when user accepts changes via Ctrl+Enter in input box.
            this._sourceControl.acceptInputCommand = { command: constants_1.TfvcCommandNames.Checkin, title: "Checkin" };
            this._disposables.push(this.conflictsGroup);
            this._disposables.push(this.includedGroup);
            this._disposables.push(this.excludedGroup);
        });
    }
    onDidModelChange() {
        if (!this.conflictsGroup) {
            return;
        }
        this.conflictsGroup.resourceStates = this._model.ConflictsGroup.resources;
        this.includedGroup.resourceStates = this._model.IncludedGroup.resources;
        this.excludedGroup.resourceStates = this._model.ExcludedGroup.resources;
        this._sourceControl.count = this.count;
    }
    Reinitialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cleanup();
            yield this.setup();
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const rootPath = vscode_1.workspace.rootPath;
            if (!rootPath) {
                // no root means no need for an scm provider
                return;
            }
            // Check if this is a TFVC repository
            if (!this._extensionManager.RepoContext
                || this._extensionManager.RepoContext.Type !== repositorycontext_1.RepositoryType.TFVC
                || this._extensionManager.RepoContext.IsTeamFoundation === false) {
                // We don't have a TFVC context, so don't load the provider
                return;
            }
            const repoContext = this._extensionManager.RepoContext;
            const fsWatcher = vscode_1.workspace.createFileSystemWatcher("**");
            const onWorkspaceChange = util_1.anyEvent(fsWatcher.onDidChange, fsWatcher.onDidCreate, fsWatcher.onDidDelete);
            const onTfvcChange = util_1.filterEvent(onWorkspaceChange, (uri) => /^\$tf\//.test(vscode_1.workspace.asRelativePath(uri)));
            this._model = new model_1.Model(repoContext.RepoFolder, repoContext.TfvcRepository, onWorkspaceChange);
            // Hook up the model change event to trigger our own event
            this._disposables.push(this._model.onDidChange(this.onDidModelChange, this));
            let version = "unknown";
            try {
                version = yield repoContext.TfvcRepository.CheckVersion();
            }
            catch (err) {
                this._extensionManager.DisplayWarningMessage(err.message);
            }
            tfvcoutput_1.TfvcOutput.AppendLine("Using TFVC command line: " + repoContext.TfvcRepository.TfvcLocation + " (" + version + ")");
            const commitHoverProvider = new commithoverprovider_1.CommitHoverProvider();
            const contentProvider = new tfvccontentprovider_1.TfvcContentProvider(repoContext.TfvcRepository, rootPath, onTfvcChange);
            //const checkoutStatusBar = new CheckoutStatusBar(model);
            //const syncStatusBar = new SyncStatusBar(model);
            //const autoFetcher = new AutoFetcher(model);
            //const mergeDecorator = new MergeDecorator(model);
            this._tempDisposables.push(commitHoverProvider, contentProvider, fsWatcher
            //checkoutStatusBar,
            //syncStatusBar,
            //autoFetcher,
            //mergeDecorator
            );
            // Refresh the model now that we are done setting up
            yield this._model.Refresh();
        });
    }
    cleanup() {
        // dispose all the temporary items
        if (this._tempDisposables) {
            this._tempDisposables.forEach((d) => d.dispose());
            this._tempDisposables = [];
        }
        // dispose of the model
        if (this._model) {
            this._model.dispose();
            this._model = undefined;
        }
    }
    get onDidChange() {
        return util_1.mapEvent(this._model.onDidChange, () => this);
    }
    get count() {
        // TODO is this too simple? The Git provider does more
        return this._model.Resources.reduce((r, g) => r + g.resources.length, 0);
    }
    dispose() {
        TfvcSCMProvider.instance = undefined;
        this.cleanup();
        if (this._disposables) {
            this._disposables.forEach((d) => d.dispose());
            this._disposables = [];
        }
    }
    /**
     * If Tfvc is the active provider, returns the number of items it is tracking.
     */
    static HasItems() {
        const tfvcProvider = TfvcSCMProvider.instance;
        if (tfvcProvider) {
            if (tfvcProvider.count > 0) {
                return true;
            }
        }
        return false;
    }
    /**
     * Gets the uri for the previous version of the file.
     */
    static GetLeftResource(resource) {
        if (resource.HasStatus(status_1.Status.CONFLICT) ||
            resource.HasStatus(status_1.Status.EDIT) ||
            resource.HasStatus(status_1.Status.RENAME)) {
            return resource.GetServerUri();
        }
        else {
            return undefined;
        }
    }
    /**
     * Gets the uri for the current version of the file (except for deleted files).
     */
    static GetRightResource(resource) {
        if (resource.HasStatus(status_1.Status.DELETE)) {
            return resource.GetServerUri();
        }
        else {
            // Adding the version spec query, because this eventually gets passed to getOriginalResource
            return resource.resourceUri.with({ query: `C${resource.PendingChange.version}` });
        }
    }
    static getProviderInstance() {
        const tfvcProvider = TfvcSCMProvider.instance;
        if (!tfvcProvider) {
            // We are not the active provider
            logger_1.Logger.LogDebug("TFVC is not the active provider.");
            throw tfvcerror_1.TfvcError.CreateInvalidStateError();
        }
        return tfvcProvider;
    }
    static OpenDiff(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield vscode_1.commands.executeCommand(constants_1.TfvcCommandNames.Open, resource);
        });
    }
}
TfvcSCMProvider.scmScheme = "tfvc";
TfvcSCMProvider.instance = undefined;
exports.TfvcSCMProvider = TfvcSCMProvider;

//# sourceMappingURL=tfvcscmprovider.js.map
