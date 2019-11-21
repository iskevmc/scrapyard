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
const constants_1 = require("./helpers/constants");
const extensionmanager_1 = require("./extensionmanager");
const interfaces_1 = require("./tfvc/interfaces");
let _extensionManager;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Construct the extension manager that handles Team and Tfvc commands
        _extensionManager = new extensionmanager_1.ExtensionManager();
        yield _extensionManager.Initialize();
        // Register the ext manager for disposal
        context.subscriptions.push(_extensionManager);
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.AssociateWorkItems, () => _extensionManager.RunCommand(() => _extensionManager.Team.AssociateWorkItems())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.GetPullRequests, () => _extensionManager.RunCommand(() => _extensionManager.Team.GetMyPullRequests())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.Signin, () => _extensionManager.RunCommand(() => _extensionManager.Team.Signin())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.Signout, () => _extensionManager.RunCommand(() => _extensionManager.Team.Signout())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenBlamePage, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenBlamePage())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenBuildSummaryPage, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenBuildSummaryPage())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenFileHistory, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenFileHistory())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenNewBug, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenNewBug())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenNewPullRequest, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenNewPullRequest())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenNewTask, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenNewTask())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenNewWorkItem, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenNewWorkItem())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.OpenTeamSite, () => _extensionManager.RunCommand(() => _extensionManager.Team.OpenTeamProjectWebSite())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.ViewWorkItems, () => _extensionManager.RunCommand(() => _extensionManager.Team.ViewMyWorkItems())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.ViewPinnedQueryWorkItems, () => _extensionManager.RunCommand(() => _extensionManager.Team.ViewPinnedQueryWorkItems())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.ViewWorkItemQueries, () => _extensionManager.RunCommand(() => _extensionManager.Team.ViewWorkItems())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.SendFeedback, () => _extensionManager.RunCommand(() => _extensionManager.SendFeedback())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.RefreshPollingStatus, () => _extensionManager.RunCommand(() => _extensionManager.Team.RefreshPollingStatus())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.CommandNames.Reinitialize, () => _extensionManager.Reinitialize()));
        // TFVC Commands
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Delete, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Delete(args ? args[0] : undefined))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.UndoAll, () => _extensionManager.RunCommand(() => _extensionManager.Tfvc.UndoAll())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Undo, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Undo(args))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Exclude, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Exclude(args))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Include, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Include(args))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Rename, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Rename(args ? args[0] : undefined))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Open, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Open(args ? args[0] : undefined))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.OpenDiff, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.OpenDiff(args ? args[0] : undefined))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.OpenFile, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.OpenFile(args ? args[0] : undefined))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.ResolveKeepYours, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Resolve(args ? args[0] : undefined, interfaces_1.AutoResolveType.KeepYours))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.ResolveTakeTheirs, (...args) => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Resolve(args ? args[0] : undefined, interfaces_1.AutoResolveType.TakeTheirs))));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Refresh, () => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Refresh())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.ShowOutput, () => _extensionManager.RunCommand(() => _extensionManager.Tfvc.ShowOutput())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Checkin, () => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Checkin())));
        context.subscriptions.push(vscode_1.commands.registerCommand(constants_1.TfvcCommandNames.Sync, () => _extensionManager.RunCommand(() => _extensionManager.Tfvc.Sync())));
    });
}
exports.activate = activate;

//# sourceMappingURL=extension.js.map
