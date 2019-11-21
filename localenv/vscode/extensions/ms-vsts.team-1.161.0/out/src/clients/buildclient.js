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
const logger_1 = require("../helpers/logger");
const build_1 = require("../services/build");
const telemetry_1 = require("../services/telemetry");
const constants_1 = require("../helpers/constants");
const strings_1 = require("../helpers/strings");
const utils_1 = require("../helpers/utils");
const repositorycontext_1 = require("../contexts/repositorycontext");
const baseclient_1 = require("./baseclient");
class BuildClient extends baseclient_1.BaseClient {
    constructor(context, statusBarItem) {
        super(context, statusBarItem);
    }
    //Gets any available build status information and adds it to the status bar
    DisplayCurrentBuildStatus(context, polling, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const svc = new build_1.BuildService(this._serverContext);
                logger_1.Logger.LogInfo("Getting current build from badge...");
                let buildBadge;
                if (context.Type === repositorycontext_1.RepositoryType.GIT) {
                    buildBadge = yield svc.GetBuildBadge(this._serverContext.RepoInfo.TeamProject, constants_1.WellKnownRepositoryTypes.TfsGit, this._serverContext.RepoInfo.RepositoryId, context.CurrentRef);
                }
                else if (context.Type === repositorycontext_1.RepositoryType.TFVC || context.Type === repositorycontext_1.RepositoryType.EXTERNAL && !definitionId) {
                    //If either TFVC or External and no definition Id, show default builds page
                    buildBadge = yield this.getTfvcBuildBadge(svc, this._serverContext.RepoInfo.TeamProject);
                }
                else if (definitionId) {
                    //TODO: Allow definitionId to override Git and TFVC defaults (above)?
                    const builds = yield svc.GetBuildsByDefinitionId(this._serverContext.RepoInfo.TeamProject, definitionId);
                    if (builds.length > 0) {
                        buildBadge = { buildId: builds[0].id, imageUrl: undefined };
                    }
                    else {
                        logger_1.Logger.LogInfo(`Found zero builds for definition id ${definitionId}`);
                    }
                }
                if (buildBadge && buildBadge.buildId !== undefined) {
                    logger_1.Logger.LogInfo("Found build id " + buildBadge.buildId.toString() + ". Getting build details...");
                    const build = yield svc.GetBuildById(buildBadge.buildId);
                    this._buildSummaryUrl = build_1.BuildService.GetBuildSummaryUrl(this._serverContext.RepoInfo.TeamProjectUrl, build.id.toString());
                    logger_1.Logger.LogInfo("Build summary info: " + build.id.toString() + " " + BuildInterfaces_1.BuildStatus[build.status] +
                        " " + BuildInterfaces_1.BuildResult[build.result] + " " + this._buildSummaryUrl);
                    if (this._statusBarItem !== undefined) {
                        const icon = utils_1.Utils.GetBuildResultIcon(build.result);
                        this._statusBarItem.command = constants_1.CommandNames.OpenBuildSummaryPage;
                        this._statusBarItem.text = `$(package) ` + `$(${icon})`;
                        this._statusBarItem.tooltip = "(" + BuildInterfaces_1.BuildResult[build.result] + ") " + strings_1.Strings.NavigateToBuildSummary + " " + build.buildNumber;
                    }
                }
                else {
                    logger_1.Logger.LogInfo("No builds were found for team " + this._serverContext.RepoInfo.TeamProject.toString() +
                        ", repo id " + this._serverContext.RepoInfo.RepositoryId.toString() + ", + branch " + (!context.CurrentBranch ? "UNKNOWN" : context.CurrentBranch.toString()));
                    if (this._statusBarItem !== undefined) {
                        this._statusBarItem.command = constants_1.CommandNames.OpenBuildSummaryPage;
                        this._statusBarItem.text = `$(package) ` + `$(dash)`;
                        this._statusBarItem.tooltip = context.Type === repositorycontext_1.RepositoryType.GIT ? strings_1.Strings.NoBuildsFound : strings_1.Strings.NoTfvcBuildsFound;
                    }
                }
            }
            catch (err) {
                this.handleError(err, BuildClient.GetOfflineBuildStatusText(), polling, "Failed to get current build status");
            }
        });
    }
    //Gets the appropriate build for TFVC repositories and returns a 'BuildBadge' for it
    getTfvcBuildBadge(svc, teamProjectId) {
        return __awaiter(this, void 0, void 0, function* () {
            //Create an build that doesn't exist and use as the default
            const emptyBuild = { buildId: undefined, imageUrl: undefined };
            const builds = yield svc.GetBuilds(teamProjectId);
            if (builds.length === 0) {
                return emptyBuild;
            }
            let matchingBuild;
            for (let idx = 0; idx < builds.length; idx++) {
                const b = builds[idx];
                // Ignore canceled builds
                if (b.result === BuildInterfaces_1.BuildResult.Canceled) {
                    continue;
                }
                if (b.repository &&
                    b.repository.type.toLowerCase() === "tfsversioncontrol") {
                    matchingBuild = b;
                    break;
                }
            }
            if (matchingBuild) {
                //We dont' use imageUrl (which is a SVG) since we don't actually render the badge.
                return { buildId: matchingBuild.id, imageUrl: undefined };
            }
            return emptyBuild;
        });
    }
    OpenBuildSummaryPage() {
        telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenBuildSummaryPage);
        let url = this._buildSummaryUrl;
        if (url === undefined) {
            logger_1.Logger.LogInfo("No build summary available, using build definitions url.");
            url = build_1.BuildService.GetBuildDefinitionsUrl(this._serverContext.RepoInfo.TeamProjectUrl);
        }
        logger_1.Logger.LogInfo("OpenBuildSummaryPage: " + url);
        utils_1.Utils.OpenUrl(url);
    }
    static GetOfflineBuildStatusText() {
        return `$(package) ` + `???`;
    }
}
exports.BuildClient = BuildClient;

//# sourceMappingURL=buildclient.js.map
