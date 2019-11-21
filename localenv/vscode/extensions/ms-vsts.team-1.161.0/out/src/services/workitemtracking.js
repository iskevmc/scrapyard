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
const WebApi_1 = require("vso-node-api/WebApi");
const WorkItemTrackingInterfaces_1 = require("vso-node-api/interfaces/WorkItemTrackingInterfaces");
const credentialmanager_1 = require("../helpers/credentialmanager");
const urlbuilder_1 = require("../helpers/urlbuilder");
class WorkItemTrackingService {
    constructor(context) {
        this._witApi = new WebApi_1.WebApi(context.RepoInfo.CollectionUrl, credentialmanager_1.CredentialManager.GetCredentialHandler()).getWorkItemTrackingApi();
    }
    //Returns a Promise containing the WorkItem that was created
    CreateWorkItem(context, itemType, taskTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            const newWorkItem = [{ op: "add", path: "/fields/" + WorkItemFields.Title, value: taskTitle }];
            /* tslint:disable:no-null-keyword */
            return yield this._witApi.createWorkItem(null, newWorkItem, context.RepoInfo.TeamProject, itemType, false, false);
            /* tslint:enable:no-null-keyword */
        });
    }
    //Returns a Promise containing an array of SimpleWorkItems based on the passed in wiql
    GetWorkItems(teamProject, wiql) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.execWorkItemQuery(teamProject, { query: wiql });
        });
    }
    //Returns a Promise containing an array of QueryHierarchyItems (either folders or work item queries)
    GetWorkItemHierarchyItems(teamProject) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._witApi.getQueries(teamProject, WorkItemTrackingInterfaces_1.QueryExpand.Wiql, 1, false);
        });
    }
    //Returns a Promise containing a specific query item
    GetWorkItemQuery(teamProject, queryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._witApi.getQuery(teamProject, queryPath, WorkItemTrackingInterfaces_1.QueryExpand.Wiql, 1, false);
        });
    }
    //Returns a Promise containing the array of work item types available for the team project
    GetWorkItemTypes(teamProject) {
        return __awaiter(this, void 0, void 0, function* () {
            const types = yield this._witApi.getWorkItemTypes(teamProject);
            const workItemTypes = [];
            const hiddenTypes = [];
            types.forEach((type) => {
                workItemTypes.push(type);
            });
            const category = yield this._witApi.getWorkItemTypeCategory(teamProject, "Microsoft.HiddenCategory");
            category.workItemTypes.forEach((hiddenType) => {
                hiddenTypes.push(hiddenType);
            });
            const filteredTypes = workItemTypes.filter(function (el) {
                for (let index = 0; index < hiddenTypes.length; index++) {
                    if (el.name === hiddenTypes[index].name) {
                        return false;
                    }
                }
                return true;
            });
            return filteredTypes;
        });
    }
    //Returns a Promise containing a SimpleWorkItem representing the work item specified by id
    GetWorkItemById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const workItem = yield this._witApi.getWorkItem(parseInt(id), [WorkItemFields.Id, WorkItemFields.Title]);
            const result = new SimpleWorkItem();
            result.id = workItem.id.toString();
            result.label = workItem.fields[WorkItemFields.Title];
            return result;
        });
    }
    //Returns a Promise containing an array of SimpleWorkItems that are the results of the passed in wiql
    execWorkItemQuery(teamProject, wiql) {
        return __awaiter(this, void 0, void 0, function* () {
            //Querying WIT requires a TeamContext
            const teamContext = {
                projectId: undefined,
                project: teamProject,
                teamId: undefined,
                team: undefined
            };
            // Execute the wiql and get the work item ids
            const queryResult = yield this._witApi.queryByWiql(wiql, teamContext);
            const results = [];
            let workItemIds = [];
            if (queryResult.queryResultType === WorkItemTrackingInterfaces_1.QueryResultType.WorkItem) {
                workItemIds = queryResult.workItems.map(function (w) { return w.id; });
            }
            else if (queryResult.queryResultType === WorkItemTrackingInterfaces_1.QueryResultType.WorkItemLink) {
                workItemIds = queryResult.workItemRelations.map(function (w) { return w.target.id; });
            }
            if (workItemIds.length === 0) {
                return results;
            }
            //Only request the maximum number of work items the API documents that we should
            if (workItemIds.length >= WorkItemTrackingService.MaxResults) {
                workItemIds = workItemIds.slice(0, WorkItemTrackingService.MaxResults);
            }
            /* tslint:disable:no-null-keyword */
            const workItems = yield this._witApi.getWorkItems(workItemIds, [WorkItemFields.Id, WorkItemFields.Title, WorkItemFields.WorkItemType], null, WorkItemTrackingInterfaces_1.WorkItemExpand.None);
            /* tslint:enable:no-null-keyword */
            //Keep original sort order that wiql specified
            for (let index = 0; index < workItemIds.length; index++) {
                const item = workItems.find((i) => i.id === workItemIds[index]);
                const id = item.id.toString();
                results.push({
                    id: id,
                    label: `${id} [${item.fields[WorkItemFields.WorkItemType]}]`,
                    description: item.fields[WorkItemFields.Title]
                });
            }
            return results;
        });
    }
    GetQueryResultCount(teamProject, wiql) {
        return __awaiter(this, void 0, void 0, function* () {
            //Querying WIT requires a TeamContext
            const teamContext = {
                projectId: undefined,
                project: teamProject,
                teamId: undefined,
                team: undefined
            };
            // Execute the wiql and get count of results
            const queryResult = yield this._witApi.queryByWiql({ query: wiql }, teamContext);
            //If a Promise is returned here, then() will return that Promise
            //If not, it will wrap the value within a Promise and return that
            return queryResult.workItems.length;
        });
    }
    //Construct the url to the individual work item edit page
    static GetEditWorkItemUrl(teamProjectUrl, workItemId) {
        return urlbuilder_1.UrlBuilder.Join(WorkItemTrackingService.GetWorkItemsBaseUrl(teamProjectUrl), "edit", workItemId);
    }
    //Construct the url to the creation page for new work item type
    static GetNewWorkItemUrl(teamProjectUrl, issueType, title, assignedTo) {
        //This form will redirect to the form below so let's use this one
        let url = urlbuilder_1.UrlBuilder.Join(WorkItemTrackingService.GetWorkItemsBaseUrl(teamProjectUrl), "create", issueType);
        let separator = "?";
        if (title !== undefined) {
            //title may need to be encoded (issues if first character is '#', for instance)
            url += separator + "[" + WorkItemFields.Title + "]=" + title;
            separator = "&";
        }
        if (assignedTo !== undefined) {
            url += separator + "[" + WorkItemFields.AssignedTo + "]=" + assignedTo;
            separator = "&";
        }
        return url;
    }
    //Construct the url to the particular query results page
    static GetMyQueryResultsUrl(teamProjectUrl, folderName, queryName) {
        return urlbuilder_1.UrlBuilder.AddQueryParams(WorkItemTrackingService.GetWorkItemsBaseUrl(teamProjectUrl), `path=${encodeURIComponent(folderName + "/" + queryName)}`, `_a=query`);
    }
    //Returns the base url for work items
    static GetWorkItemsBaseUrl(teamProjectUrl) {
        return urlbuilder_1.UrlBuilder.Join(teamProjectUrl, "_workitems");
    }
}
/* tslint:disable:variable-name */
WorkItemTrackingService.MaxResults = 200;
exports.WorkItemTrackingService = WorkItemTrackingService;
class SimpleWorkItem {
}
exports.SimpleWorkItem = SimpleWorkItem;
/* tslint:disable:variable-name */
class WorkItemFields {
}
WorkItemFields.AssignedTo = "System.AssignedTo";
WorkItemFields.Id = "System.Id";
WorkItemFields.Title = "System.Title";
WorkItemFields.WorkItemType = "System.WorkItemType";
exports.WorkItemFields = WorkItemFields;

//# sourceMappingURL=workitemtracking.js.map
