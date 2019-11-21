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
const BuildInterfaces_1 = require("vso-node-api/interfaces/BuildInterfaces");
const WebApi_1 = require("vso-node-api/WebApi");
const credentialmanager_1 = require("../helpers/credentialmanager");
const urlbuilder_1 = require("../helpers/urlbuilder");
class BuildService {
    constructor(context) {
        this._buildApi = new WebApi_1.WebApi(context.RepoInfo.CollectionUrl, credentialmanager_1.CredentialManager.GetCredentialHandler()).getBuildApi();
    }
    //Get the latest build id and badge of a build definition based on current project, repo and branch
    GetBuildBadge(project, repoType, repoId, branchName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._buildApi.getBuildBadge(project, repoType, repoId, branchName);
        });
    }
    //Get extra details of a build based on the build id
    GetBuildById(buildId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._buildApi.getBuild(buildId);
        });
    }
    ;
    //Returns the build definitions (regardless of type) for the team project
    GetBuildDefinitions(teamProject) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._buildApi.getDefinitions(teamProject);
        });
    }
    //Returns the most recent 100 completed builds
    GetBuilds(teamProject) {
        return __awaiter(this, void 0, void 0, function* () {
            /* tslint:disable:no-null-keyword */
            return yield this._buildApi.getBuilds(teamProject, null, null, null, null, null, null, null, BuildInterfaces_1.BuildStatus.Completed, null, null, null, 100, null, 1, BuildInterfaces_1.QueryDeletedOption.ExcludeDeleted, BuildInterfaces_1.BuildQueryOrder.FinishTimeDescending);
            /* tslint:enable:no-null-keyword */
        });
    }
    //Returns the "latest" build for this definition
    GetBuildsByDefinitionId(teamProject, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            /* tslint:disable:no-null-keyword */
            return yield this._buildApi.getBuilds(teamProject, [definitionId], null, null, null, null, null, null, null, null, null, null, 1, null, 1, BuildInterfaces_1.QueryDeletedOption.ExcludeDeleted, BuildInterfaces_1.BuildQueryOrder.FinishTimeDescending);
            /* tslint:enable:no-null-keyword */
        });
    }
    //Construct the url to the individual build definition (completed view)
    //https://account.visualstudio.com/DefaultCollection/project/_build#_a=completed&definitionId=34
    static GetBuildDefinitionUrl(remoteUrl, definitionId) {
        return urlbuilder_1.UrlBuilder.AddHashes(BuildService.GetBuildsUrl(remoteUrl), `_a=completed`, `definitionId=${definitionId}`);
    }
    //Construct the url to the individual build summary
    //https://account.visualstudio.com/DefaultCollection/project/_build/index?buildId=1977&_a=summary
    static GetBuildSummaryUrl(remoteUrl, buildId) {
        let summaryUrl = urlbuilder_1.UrlBuilder.Join(BuildService.GetBuildsUrl(remoteUrl), "index");
        summaryUrl = urlbuilder_1.UrlBuilder.AddQueryParams(summaryUrl, `buildId=${buildId}`, `_a=summary`);
        return summaryUrl;
    }
    //Construct the url to the build definitions page for the project
    static GetBuildDefinitionsUrl(remoteUrl) {
        //The new definitions experience is behind a feature flag
        return BuildService.GetBuildsUrl(remoteUrl); // + "/definitions";
    }
    //Construct the url to the builds page for the project
    static GetBuildsUrl(remoteUrl) {
        return urlbuilder_1.UrlBuilder.Join(remoteUrl, "_build");
    }
}
exports.BuildService = BuildService;

//# sourceMappingURL=build.js.map
