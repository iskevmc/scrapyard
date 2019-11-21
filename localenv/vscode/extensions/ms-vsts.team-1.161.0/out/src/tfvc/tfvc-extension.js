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
const path = require("path");
const vscode_1 = require("vscode");
const repositorycontext_1 = require("../contexts/repositorycontext");
const constants_1 = require("../helpers/constants");
const strings_1 = require("../helpers/strings");
const urlbuilder_1 = require("../helpers/urlbuilder");
const utils_1 = require("../helpers/utils");
const vscodeutils_1 = require("../helpers/vscodeutils");
const telemetry_1 = require("../services/telemetry");
const status_1 = require("./scm/status");
const tfvcscmprovider_1 = require("./tfvcscmprovider");
const tfvcerror_1 = require("./tfvcerror");
const uihelper_1 = require("./uihelper");
const tfvcoutput_1 = require("./tfvcoutput");
class TfvcExtension {
    constructor(manager) {
        this._manager = manager;
    }
    Checkin() {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                // get the checkin info from the SCM viewlet
                const checkinInfo = tfvcscmprovider_1.TfvcSCMProvider.GetCheckinInfo();
                if (!checkinInfo) {
                    vscode_1.window.showInformationMessage(strings_1.Strings.NoChangesToCheckin);
                    return;
                }
                telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.CheckinExe : constants_1.TfvcTelemetryEvents.CheckinClc);
                const changeset = yield this._repo.Checkin(checkinInfo.files, checkinInfo.comment, checkinInfo.workItemIds);
                tfvcoutput_1.TfvcOutput.AppendLine(`Changeset ${changeset} checked in.`);
                tfvcscmprovider_1.TfvcSCMProvider.ClearCheckinMessage();
                tfvcscmprovider_1.TfvcSCMProvider.Refresh();
            }), "Checkin");
        });
    }
    /**
     * This command runs a delete command on the selected file.  It gets a Uri object from vscode.
     */
    Delete(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (uri) {
                    const basename = path.basename(uri.fsPath);
                    try {
                        const message = `Are you sure you want to delete '${basename}'?`;
                        if (yield uihelper_1.UIHelper.PromptForConfirmation(message, strings_1.Strings.DeleteFile)) {
                            telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.DeleteExe : constants_1.TfvcTelemetryEvents.DeleteClc);
                            yield this._repo.Delete([uri.fsPath]);
                        }
                    }
                    catch (err) {
                        //Provide a better error message if the file to be deleted isn't in the workspace (e.g., it's a new file)
                        if (err.tfvcErrorCode && err.tfvcErrorCode === tfvcerror_1.TfvcErrorCodes.FileNotInWorkspace) {
                            this._manager.DisplayErrorMessage(`Cannot delete '${basename}' as it is not in your workspace.`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
                else {
                    this._manager.DisplayWarningMessage(strings_1.Strings.CommandRequiresExplorerContext);
                }
            }), "Delete");
        });
    }
    Exclude(resources) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resources && resources.length > 0) {
                    //Keep an in-memory list of items that were explicitly excluded. The list is not persisted at this time.
                    const paths = [];
                    resources.forEach((resource) => {
                        paths.push(resource.resourceUri.fsPath);
                    });
                    yield tfvcscmprovider_1.TfvcSCMProvider.Exclude(paths);
                }
            }), "Exclude");
        });
    }
    Include(resources) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resources && resources.length > 0) {
                    const pathsToUnexclude = [];
                    const pathsToAdd = [];
                    const pathsToDelete = [];
                    resources.forEach((resource) => {
                        const path = resource.resourceUri.fsPath;
                        //Unexclude each file passed in
                        pathsToUnexclude.push(path);
                        //At this point, an unversioned file could be a candidate file, so call Add.
                        //Once it is added, it should be a Pending change.
                        if (!resource.IsVersioned) {
                            pathsToAdd.push(path);
                        }
                        //If a file is a candidate change and has been deleted (e.g., outside of
                        //the TFVC command), we need to ensure that it gets 'tf delete' run on it.
                        if (resource.PendingChange.isCandidate && resource.HasStatus(status_1.Status.DELETE)) {
                            pathsToDelete.push(path);
                        }
                    });
                    //If we need to add files, run a single Add with those files
                    if (pathsToAdd.length > 0) {
                        telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.AddExe : constants_1.TfvcTelemetryEvents.AddClc);
                        yield this._repo.Add(pathsToAdd);
                    }
                    //If we need to delete files, run a single Delete with those files
                    if (pathsToDelete.length > 0) {
                        telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.DeleteExe : constants_1.TfvcTelemetryEvents.DeleteClc);
                        yield this._repo.Delete(pathsToDelete);
                    }
                    //Otherwise, ensure its not in the explicitly excluded list (if it's already there)
                    //Unexclude doesn't explicitly INclude.  It defers to the status of the individual item.
                    yield tfvcscmprovider_1.TfvcSCMProvider.Unexclude(pathsToUnexclude);
                }
            }), "Include");
        });
    }
    /**
     * This is the default action when an resource is clicked in the viewlet.
     * For ADD, AND UNDELETE just show the local file.
     * For DELETE just show the server file.
     * For EDIT AND RENAME show the diff window (server on left, local on right).
     */
    Open(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resource) {
                    const left = tfvcscmprovider_1.TfvcSCMProvider.GetLeftResource(resource);
                    const right = tfvcscmprovider_1.TfvcSCMProvider.GetRightResource(resource);
                    const title = resource.GetTitle();
                    if (!right) {
                        // TODO
                        console.error("oh no");
                        return;
                    }
                    if (!left) {
                        return yield vscode_1.commands.executeCommand("vscode.open", right);
                    }
                    return yield vscode_1.commands.executeCommand("vscode.diff", left, right, title);
                }
            }), "Open");
        });
    }
    OpenDiff(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resource) {
                    return yield tfvcscmprovider_1.TfvcSCMProvider.OpenDiff(resource);
                }
            }), "OpenDiff");
        });
    }
    OpenFile(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resource) {
                    return yield vscode_1.commands.executeCommand("vscode.open", resource.resourceUri);
                }
            }), "OpenFile");
        });
    }
    Refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                yield tfvcscmprovider_1.TfvcSCMProvider.Refresh();
            }), "Refresh");
        });
    }
    /**
     * This command runs a rename command on the selected file.  It gets a Uri object from vscode.
     */
    Rename(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (uri) {
                    const basename = path.basename(uri.fsPath);
                    const newFilename = yield vscode_1.window.showInputBox({ value: basename, prompt: strings_1.Strings.RenamePrompt, placeHolder: undefined, password: false });
                    if (newFilename && newFilename !== basename) {
                        const dirName = path.dirname(uri.fsPath);
                        const destination = path.join(dirName, newFilename);
                        try {
                            telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.RenameExe : constants_1.TfvcTelemetryEvents.RenameClc);
                            yield this._repo.Rename(uri.fsPath, destination);
                        }
                        catch (err) {
                            //Provide a better error message if the file to be renamed isn't in the workspace (e.g., it's a new file)
                            if (err.tfvcErrorCode && err.tfvcErrorCode === tfvcerror_1.TfvcErrorCodes.FileNotInWorkspace) {
                                this._manager.DisplayErrorMessage(`Cannot rename '${basename}' as it is not in your workspace.`);
                            }
                            else {
                                throw err;
                            }
                        }
                    }
                }
                else {
                    this._manager.DisplayWarningMessage(strings_1.Strings.CommandRequiresExplorerContext);
                }
            }), "Rename");
        });
    }
    Resolve(resource, autoResolveType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resource) {
                    const localPath = resource.resourceUri.fsPath;
                    const resolveTypeString = uihelper_1.UIHelper.GetDisplayTextForAutoResolveType(autoResolveType);
                    const basename = path.basename(localPath);
                    const message = `Are you sure you want to resolve changes in '${basename}' as ${resolveTypeString}?`;
                    if (yield uihelper_1.UIHelper.PromptForConfirmation(message, resolveTypeString)) {
                        telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.ResolveConflictsExe : constants_1.TfvcTelemetryEvents.ResolveConflictsClc);
                        yield this._repo.ResolveConflicts([localPath], autoResolveType);
                        tfvcscmprovider_1.TfvcSCMProvider.Refresh();
                    }
                }
                else {
                    this._manager.DisplayWarningMessage(strings_1.Strings.CommandRequiresFileContext);
                }
            }), "Resolve");
        });
    }
    ShowOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            tfvcoutput_1.TfvcOutput.Show();
        });
    }
    /**
     * This command runs a 'tf get' command on the VSCode workspace folder and
     * displays the results to the user.
     */
    Sync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.SyncExe : constants_1.TfvcTelemetryEvents.SyncClc);
                const results = yield this._repo.Sync([this._repo.Path], true);
                yield uihelper_1.UIHelper.ShowSyncResults(results, results.hasConflicts || results.hasErrors, true);
            }), "Sync");
        });
    }
    /**
     * This command runs an undo command on the currently open file in the VSCode workspace folder and
     * editor.  If the undo command applies to the file, the pending changes will be undone.  The
     * file system watcher will update the UI soon thereafter.  No results are displayed to the user.
     */
    Undo(resources) {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (resources) {
                    const pathsToUndo = [];
                    resources.forEach((resource) => {
                        pathsToUndo.push(resource.resourceUri.fsPath);
                    });
                    //When calling from UI, we have the uri of the resource from which the command was invoked
                    if (pathsToUndo.length > 0) {
                        const basename = path.basename(pathsToUndo[0]);
                        let message = `Are you sure you want to undo changes to '${basename}'?`;
                        if (pathsToUndo.length > 1) {
                            message = `Are you sure you want to undo changes to ${pathsToUndo.length.toString()} files?`;
                        }
                        if (yield uihelper_1.UIHelper.PromptForConfirmation(message, strings_1.Strings.UndoChanges)) {
                            telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.UndoExe : constants_1.TfvcTelemetryEvents.UndoClc);
                            yield this._repo.Undo(pathsToUndo);
                        }
                    }
                }
            }), "Undo");
        });
    }
    /**
     * This command runs an undo command on all of the currently open files in the VSCode workspace folder
     * If the undo command applies to the file, the pending changes will be undone.  The
     * file system watcher will update the UI soon thereafter.  No results are displayed to the user.
     */
    UndoAll() {
        return __awaiter(this, void 0, void 0, function* () {
            this.displayErrors(() => __awaiter(this, void 0, void 0, function* () {
                if (tfvcscmprovider_1.TfvcSCMProvider.HasItems()) {
                    const message = `Are you sure you want to undo all changes?`;
                    if (yield uihelper_1.UIHelper.PromptForConfirmation(message, strings_1.Strings.UndoChanges)) {
                        telemetry_1.Telemetry.SendEvent(this._repo.IsExe ? constants_1.TfvcTelemetryEvents.UndoAllExe : constants_1.TfvcTelemetryEvents.UndoAllClc);
                        yield this._repo.Undo(["*"]);
                    }
                }
                else {
                    vscode_1.window.showInformationMessage(strings_1.Strings.NoChangesToUndo);
                    return;
                }
            }), "UndoAll");
        });
    }
    /**
     * This command runs the info command on the passed in itemPath and
     * opens a web browser to the appropriate history page.
     */
    ViewHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            //Since this command provides Team Services functionality, we need
            //to ensure it is initialized for Team Services
            if (!this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.TFVC)) {
                this._manager.DisplayErrorMessage();
                return;
            }
            try {
                let itemPath;
                const editor = vscode_1.window.activeTextEditor;
                //Get the path to the file open in the VSCode editor (if any)
                if (editor) {
                    itemPath = editor.document.fileName;
                }
                if (!itemPath) {
                    //If no file open in editor, just display the history url of the entire repo
                    this.showRepositoryHistory();
                    return;
                }
                const itemInfos = yield this._repo.GetInfo([itemPath]);
                //With a single file, show that file's history
                if (itemInfos && itemInfos.length === 1) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TfvcTelemetryEvents.OpenFileHistory);
                    const serverPath = itemInfos[0].serverItem;
                    const file = encodeURIComponent(serverPath);
                    let historyUrl = urlbuilder_1.UrlBuilder.Join(this._manager.RepoContext.RemoteUrl, "_versionControl");
                    historyUrl = urlbuilder_1.UrlBuilder.AddQueryParams(historyUrl, `path=${file}`, `_a=history`);
                    utils_1.Utils.OpenUrl(historyUrl);
                    return;
                }
                else {
                    //If the file is in the workspace folder (but not mapped), just display the history url of the entire repo
                    this.showRepositoryHistory();
                }
            }
            catch (err) {
                if (err.tfvcErrorCode && err.tfvcErrorCode === tfvcerror_1.TfvcErrorCodes.FileNotInMappings) {
                    //If file open in editor is not in the mappings, just display the history url of the entire repo
                    this.showRepositoryHistory();
                }
                else {
                    this._manager.DisplayErrorMessage(err.message);
                }
            }
        });
    }
    displayErrors(funcToTry, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._manager.EnsureInitializedForTFVC()) {
                this._manager.DisplayErrorMessage();
                return;
            }
            //This occurs in the case where we 1) sign in successfully, 2) sign out, 3) sign back in but with invalid credentials
            //Essentially, the tfvcExtension.InitializeClients call hasn't been made successfully yet.
            if (!this._repo) {
                this._manager.DisplayErrorMessage(strings_1.Strings.UserMustSignIn);
                return;
            }
            try {
                yield funcToTry(prefix);
            }
            catch (err) {
                let messageOptions = [];
                tfvcoutput_1.TfvcOutput.AppendLine(utils_1.Utils.FormatMessage(`[${prefix}] ${err.message}`));
                //If we also have text in err.stdout, provide that to the output channel
                if (err.stdout) {
                    tfvcoutput_1.TfvcOutput.AppendLine(utils_1.Utils.FormatMessage(`[${prefix}] ${err.stdout}`));
                }
                //If an exception provides its own messageOptions, use them
                if (err.messageOptions && err.messageOptions.length > 0) {
                    messageOptions = err.messageOptions;
                }
                else {
                    messageOptions.push({ title: strings_1.Strings.ShowTfvcOutput, command: constants_1.TfvcCommandNames.ShowOutput });
                }
                vscodeutils_1.VsCodeUtils.ShowErrorMessage(err.message, ...messageOptions);
            }
        });
    }
    InitializeClients(repoType) {
        return __awaiter(this, void 0, void 0, function* () {
            //We only need to initialize for Tfvc repositories
            if (repoType !== repositorycontext_1.RepositoryType.TFVC) {
                return;
            }
            const tfvcContext = this._manager.RepoContext;
            this._repo = tfvcContext.TfvcRepository;
        });
    }
    showRepositoryHistory() {
        telemetry_1.Telemetry.SendEvent(constants_1.TfvcTelemetryEvents.OpenRepositoryHistory);
        let historyUrl = urlbuilder_1.UrlBuilder.Join(this._manager.RepoContext.RemoteUrl, "_versionControl");
        historyUrl = urlbuilder_1.UrlBuilder.AddQueryParams(historyUrl, `_a=history`);
        utils_1.Utils.OpenUrl(historyUrl);
    }
    dispose() {
        // nothing to dispose
    }
}
exports.TfvcExtension = TfvcExtension;

//# sourceMappingURL=tfvc-extension.js.map
