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
const logger_1 = require("../helpers/logger");
const workitemtracking_1 = require("../services/workitemtracking");
const telemetry_1 = require("../services/telemetry");
const vscodeutils_1 = require("../helpers/vscodeutils");
const constants_1 = require("../helpers/constants");
const strings_1 = require("../helpers/strings");
const utils_1 = require("../helpers/utils");
const baseclient_1 = require("./baseclient");
class WitClient extends baseclient_1.BaseClient {
    constructor(context, pinnedQuery, statusBarItem) {
        super(context, statusBarItem);
        this._pinnedQuery = pinnedQuery;
    }
    //Opens a browser to a new work item given the item type, title and assigned to
    CreateNewItem(itemType, taskTitle) {
        this.logTelemetryForWorkItem(itemType);
        logger_1.Logger.LogInfo("Work item type is " + itemType);
        const newItemUrl = workitemtracking_1.WorkItemTrackingService.GetNewWorkItemUrl(this._serverContext.RepoInfo.TeamProjectUrl, itemType, taskTitle, this.getUserName(this._serverContext));
        logger_1.Logger.LogInfo("New Work Item Url: " + newItemUrl);
        utils_1.Utils.OpenUrl(newItemUrl);
    }
    //Creates a new work item based on a single line of selected text
    CreateNewWorkItem(taskTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenNewWorkItem);
                const selectedType = yield vscode_1.window.showQuickPick(this.getWorkItemTypes(), { matchOnDescription: true, placeHolder: strings_1.Strings.ChooseWorkItemType });
                if (selectedType) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenNewWorkItem);
                    logger_1.Logger.LogInfo("Selected work item type is " + selectedType.label);
                    const newItemUrl = workitemtracking_1.WorkItemTrackingService.GetNewWorkItemUrl(this._serverContext.RepoInfo.TeamProjectUrl, selectedType.label, taskTitle, this.getUserName(this._serverContext));
                    logger_1.Logger.LogInfo("New Work Item Url: " + newItemUrl);
                    utils_1.Utils.OpenUrl(newItemUrl);
                }
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error creating new work item");
            }
        });
    }
    //Navigates to a work item chosen from the results of a user-selected "My Queries" work item query
    //This method first displays the queries under "My Queries" and, when one is chosen, displays the associated work items.
    //If a work item is chosen, it is opened in the web browser.
    ShowMyWorkItemQueries() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ShowMyWorkItemQueries);
                const query = yield vscode_1.window.showQuickPick(this.getMyWorkItemQueries(), { matchOnDescription: false, placeHolder: strings_1.Strings.ChooseWorkItemQuery });
                if (query) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewWorkItems);
                    logger_1.Logger.LogInfo("Selected query is " + query.label);
                    logger_1.Logger.LogInfo("Getting work items for query...");
                    const workItem = yield vscode_1.window.showQuickPick(this.getMyWorkItems(this._serverContext.RepoInfo.TeamProject, query.wiql), { matchOnDescription: true, placeHolder: strings_1.Strings.ChooseWorkItem });
                    if (workItem) {
                        let url = undefined;
                        if (workItem.id === undefined) {
                            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenAdditionalQueryResults);
                            url = workitemtracking_1.WorkItemTrackingService.GetMyQueryResultsUrl(this._serverContext.RepoInfo.TeamProjectUrl, this._myQueriesFolder, query.label);
                        }
                        else {
                            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewWorkItem);
                            url = workitemtracking_1.WorkItemTrackingService.GetEditWorkItemUrl(this._serverContext.RepoInfo.TeamProjectUrl, workItem.id);
                        }
                        logger_1.Logger.LogInfo("Work Item Url: " + url);
                        utils_1.Utils.OpenUrl(url);
                    }
                }
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error showing work item queries");
            }
        });
    }
    ShowPinnedQueryWorkItems() {
        return __awaiter(this, void 0, void 0, function* () {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewPinnedQueryWorkItems);
            try {
                const queryText = yield this.getPinnedQueryText();
                yield this.showWorkItems(queryText);
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error showing pinned query work items");
            }
        });
    }
    ShowMyWorkItems() {
        return __awaiter(this, void 0, void 0, function* () {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewMyWorkItems);
            try {
                yield this.showWorkItems(constants_1.WitQueries.MyWorkItems);
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error showing my work items");
            }
        });
    }
    ChooseWorkItems() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogInfo("Getting work items to choose from...");
            try {
                const query = yield this.getPinnedQueryText(); //gets either MyWorkItems, queryText or wiql of queryPath of PinnedQuery
                // TODO: There isn't a way to do a multi select pick list right now, but when there is we should change this to use it.
                const workItem = yield vscode_1.window.showQuickPick(this.getMyWorkItems(this._serverContext.RepoInfo.TeamProject, query), { matchOnDescription: true, placeHolder: strings_1.Strings.ChooseWorkItem });
                if (workItem) {
                    return ["#" + workItem.id + " - " + workItem.description];
                }
                else {
                    return [];
                }
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error showing my work items in order to choose (associate)");
                return [];
            }
        });
    }
    showWorkItems(wiql) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogInfo("Getting work items...");
            const workItem = yield vscode_1.window.showQuickPick(this.getMyWorkItems(this._serverContext.RepoInfo.TeamProject, wiql), { matchOnDescription: true, placeHolder: strings_1.Strings.ChooseWorkItem });
            if (workItem) {
                let url = undefined;
                if (workItem.id === undefined) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenAdditionalQueryResults);
                    url = workitemtracking_1.WorkItemTrackingService.GetWorkItemsBaseUrl(this._serverContext.RepoInfo.TeamProjectUrl);
                }
                else {
                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewWorkItem);
                    url = workitemtracking_1.WorkItemTrackingService.GetEditWorkItemUrl(this._serverContext.RepoInfo.TeamProjectUrl, workItem.id);
                }
                logger_1.Logger.LogInfo("Work Item Url: " + url);
                utils_1.Utils.OpenUrl(url);
            }
        });
    }
    GetPinnedQueryResultCount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.LogInfo("Running pinned work item query to get count (" + this._serverContext.RepoInfo.TeamProject + ")...");
                const queryText = yield this.getPinnedQueryText();
                const svc = new workitemtracking_1.WorkItemTrackingService(this._serverContext);
                return svc.GetQueryResultCount(this._serverContext.RepoInfo.TeamProject, queryText);
            }
            catch (err) {
                this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), false, "Error getting pinned query result count");
            }
        });
    }
    getPinnedQueryText() {
        return __awaiter(this, void 0, void 0, function* () {
            const promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._pinnedQuery.queryText && this._pinnedQuery.queryText.length > 0) {
                        resolve(this._pinnedQuery.queryText);
                    }
                    else if (this._pinnedQuery.queryPath && this._pinnedQuery.queryPath.length > 0) {
                        logger_1.Logger.LogInfo("Getting my work item query (" + this._serverContext.RepoInfo.TeamProject + ")...");
                        logger_1.Logger.LogInfo("QueryPath: " + this._pinnedQuery.queryPath);
                        const svc = new workitemtracking_1.WorkItemTrackingService(this._serverContext);
                        const queryItem = yield svc.GetWorkItemQuery(this._serverContext.RepoInfo.TeamProject, this._pinnedQuery.queryPath);
                        resolve(queryItem.wiql);
                    }
                }
                catch (err) {
                    reject(err);
                }
            }));
            return promise;
        });
    }
    getMyWorkItemQueries() {
        return __awaiter(this, void 0, void 0, function* () {
            const queries = [];
            const svc = new workitemtracking_1.WorkItemTrackingService(this._serverContext);
            logger_1.Logger.LogInfo("Getting my work item queries (" + this._serverContext.RepoInfo.TeamProject + ")...");
            const hierarchyItems = yield svc.GetWorkItemHierarchyItems(this._serverContext.RepoInfo.TeamProject);
            logger_1.Logger.LogInfo("Retrieved " + hierarchyItems.length + " hierarchyItems");
            hierarchyItems.forEach((folder) => {
                if (folder && folder.isFolder === true && folder.isPublic === false) {
                    // Because "My Queries" is localized and there is no API to get the name of the localized
                    // folder, we need to save off the localized name when constructing URLs.
                    this._myQueriesFolder = folder.name;
                    if (folder.hasChildren === true) {
                        //Gets all of the queries under "My Queries" and gets their name and wiql
                        for (let index = 0; index < folder.children.length; index++) {
                            queries.push({
                                id: folder.children[index].id,
                                label: folder.children[index].name,
                                description: "",
                                wiql: folder.children[index].wiql
                            });
                        }
                    }
                }
            });
            return queries;
        });
    }
    getMyWorkItems(teamProject, wiql) {
        return __awaiter(this, void 0, void 0, function* () {
            const workItems = [];
            const svc = new workitemtracking_1.WorkItemTrackingService(this._serverContext);
            logger_1.Logger.LogInfo("Getting my work items (" + this._serverContext.RepoInfo.TeamProject + ")...");
            const simpleWorkItems = yield svc.GetWorkItems(teamProject, wiql);
            logger_1.Logger.LogInfo("Retrieved " + simpleWorkItems.length + " work items");
            simpleWorkItems.forEach((wi) => {
                workItems.push({ label: wi.label, description: wi.description, id: wi.id });
            });
            if (simpleWorkItems.length === workitemtracking_1.WorkItemTrackingService.MaxResults) {
                workItems.push({
                    id: undefined,
                    label: strings_1.Strings.BrowseAdditionalWorkItems,
                    description: strings_1.Strings.BrowseAdditionalWorkItemsDescription
                });
            }
            return workItems;
        });
    }
    getUserName(context) {
        let userName = undefined;
        logger_1.Logger.LogDebug("UserCustomDisplayName: " + context.UserInfo.CustomDisplayName);
        logger_1.Logger.LogDebug("UserProviderDisplayName: " + context.UserInfo.ProviderDisplayName);
        if (context.UserInfo.CustomDisplayName !== undefined) {
            userName = context.UserInfo.CustomDisplayName;
        }
        else {
            userName = context.UserInfo.ProviderDisplayName;
        }
        logger_1.Logger.LogDebug("User is " + userName);
        return userName;
    }
    getWorkItemTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const svc = new workitemtracking_1.WorkItemTrackingService(this._serverContext);
            const types = yield svc.GetWorkItemTypes(this._serverContext.RepoInfo.TeamProject);
            const workItemTypes = [];
            types.forEach((type) => {
                workItemTypes.push({ label: type.name, description: type.description, id: undefined });
            });
            workItemTypes.sort((t1, t2) => {
                return (t1.label.localeCompare(t2.label));
            });
            return workItemTypes;
        });
    }
    handleWitError(err, offlineText, polling, infoMessage) {
        if (err.message.includes("Failed to find api location for area: wit id:")) {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.UnsupportedWitServerVersion);
            const msg = strings_1.Strings.UnsupportedWitServerVersion;
            logger_1.Logger.LogError(msg);
            if (this._statusBarItem !== undefined) {
                this._statusBarItem.text = `$(bug) $(x)`;
                this._statusBarItem.tooltip = msg;
                this._statusBarItem.command = undefined; //Clear the existing command
            }
            if (!polling) {
                vscodeutils_1.VsCodeUtils.ShowErrorMessage(msg);
            }
        }
        else {
            this.handleError(err, offlineText, polling, infoMessage);
        }
    }
    logTelemetryForWorkItem(wit) {
        switch (wit) {
            case constants_1.WitTypes.Bug:
                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenNewBug);
                break;
            case constants_1.WitTypes.Task:
                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenNewTask);
                break;
            default:
                break;
        }
    }
    PollPinnedQuery() {
        this.GetPinnedQueryResultCount().then((numberOfItems) => {
            this._statusBarItem.tooltip = strings_1.Strings.ViewYourPinnedQuery;
            this._statusBarItem.text = WitClient.GetPinnedQueryStatusText(numberOfItems.toString());
        }).catch((err) => {
            this.handleWitError(err, WitClient.GetOfflinePinnedQueryStatusText(), true, "Failed to get pinned query count during polling");
        });
    }
    static GetOfflinePinnedQueryStatusText() {
        return `$(bug) ???`;
    }
    static GetPinnedQueryStatusText(total) {
        if (!total) {
            return `$(bug) $(dash)`;
        }
        return `$(bug) ${total.toString()}`;
    }
}
exports.WitClient = WitClient;

//# sourceMappingURL=witclient.js.map
