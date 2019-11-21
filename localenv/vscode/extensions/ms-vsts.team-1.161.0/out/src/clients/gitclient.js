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
const GitInterfaces_1 = require("vso-node-api/interfaces/GitInterfaces");
const vscodeutils_1 = require("../helpers/vscodeutils");
const constants_1 = require("../helpers/constants");
const logger_1 = require("../helpers/logger");
const strings_1 = require("../helpers/strings");
const utils_1 = require("../helpers/utils");
const repositorycontext_1 = require("../contexts/repositorycontext");
const gitvc_1 = require("../services/gitvc");
const telemetry_1 = require("../services/telemetry");
const baseclient_1 = require("./baseclient");
const path = require("path");
class GitClient extends baseclient_1.BaseClient {
    constructor(context, statusBarItem) {
        super(context, statusBarItem);
    }
    //Initial method to display, select and navigate to my pull requests
    GetMyPullRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewPullRequests);
            try {
                const request = yield vscode_1.window.showQuickPick(this.getMyPullRequests(), { matchOnDescription: true, placeHolder: strings_1.Strings.ChoosePullRequest });
                if (request) {
                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ViewPullRequest);
                    let discUrl = undefined;
                    if (request.id !== undefined) {
                        discUrl = gitvc_1.GitVcService.GetPullRequestDiscussionUrl(this._serverContext.RepoInfo.RepositoryUrl, request.id);
                    }
                    else {
                        discUrl = gitvc_1.GitVcService.GetPullRequestsUrl(this._serverContext.RepoInfo.RepositoryUrl);
                    }
                    logger_1.Logger.LogInfo("Pull Request Url: " + discUrl);
                    utils_1.Utils.OpenUrl(discUrl);
                }
            }
            catch (err) {
                this.handleError(err, GitClient.GetOfflinePullRequestStatusText(), false, "Error selecting pull request from QuickPick");
            }
        });
    }
    //Opens the blame page for the currently active file
    OpenBlamePage(context) {
        this.ensureGitContext(context);
        let url = undefined;
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenBlamePage);
            //Get the relative file path we can use to create the url
            let relativePath = "\\" + path.relative(context.RepositoryParentFolder, editor.document.fileName);
            relativePath = relativePath.split("\\").join("/"); //Replace all
            url = gitvc_1.GitVcService.GetFileBlameUrl(context.RemoteUrl, relativePath, context.CurrentBranch);
            //Note: if file hasn't been pushed yet, blame link we generate won't point to anything valid (basically a 404)
            logger_1.Logger.LogInfo("OpenBlame: " + url);
            utils_1.Utils.OpenUrl(url);
        }
        else {
            const msg = utils_1.Utils.GetMessageForStatusCode(0, strings_1.Strings.NoSourceFileForBlame);
            logger_1.Logger.LogError(msg);
            vscodeutils_1.VsCodeUtils.ShowErrorMessage(msg);
        }
    }
    //Opens the file history page for the currently active file
    OpenFileHistory(context) {
        this.ensureGitContext(context);
        let historyUrl = undefined;
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenRepositoryHistory);
            historyUrl = gitvc_1.GitVcService.GetRepositoryHistoryUrl(context.RemoteUrl, context.CurrentBranch);
            logger_1.Logger.LogInfo("OpenRepoHistory: " + historyUrl);
        }
        else {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenFileHistory);
            //Get the relative file path we can use to create the history url
            let relativePath = "\\" + path.relative(context.RepositoryParentFolder, editor.document.fileName);
            relativePath = relativePath.split("\\").join("/"); //Replace all
            historyUrl = gitvc_1.GitVcService.GetFileHistoryUrl(context.RemoteUrl, relativePath, context.CurrentBranch);
            //Note: if file hasn't been pushed yet, history link we generate won't point to anything valid (basically a 404)
            logger_1.Logger.LogInfo("OpenFileHistory: " + historyUrl);
        }
        utils_1.Utils.OpenUrl(historyUrl);
    }
    OpenNewPullRequest(remoteUrl, currentBranch) {
        telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenNewPullRequest);
        const url = gitvc_1.GitVcService.GetCreatePullRequestUrl(remoteUrl, currentBranch);
        logger_1.Logger.LogInfo("CreatePullRequestPage: " + url);
        utils_1.Utils.OpenUrl(url);
    }
    PollMyPullRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requests = yield this.getMyPullRequests();
                this._statusBarItem.tooltip = strings_1.Strings.BrowseYourPullRequests;
                //Remove the default Strings.BrowseYourPullRequests item from the calculation
                this._statusBarItem.text = GitClient.GetPullRequestStatusText((requests.length - 1).toString());
            }
            catch (err) {
                this.handleError(err, GitClient.GetOfflinePullRequestStatusText(), true, "Attempting to poll my pull requests");
            }
        });
    }
    getMyPullRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            const requestItems = [];
            const requestIds = [];
            logger_1.Logger.LogInfo("Getting pull requests that I requested...");
            const svc = new gitvc_1.GitVcService(this._serverContext);
            const myPullRequests = yield svc.GetPullRequests(this._serverContext.RepoInfo.RepositoryId, this._serverContext.UserInfo.Id, undefined, GitInterfaces_1.PullRequestStatus.Active);
            const icon = "search";
            const label = `$(${icon}) `;
            requestItems.push({ label: label + strings_1.Strings.BrowseYourPullRequests, description: undefined, id: undefined });
            myPullRequests.forEach((pr) => {
                const score = gitvc_1.GitVcService.GetPullRequestScore(pr);
                requestItems.push(this.getPullRequestLabel(pr.createdBy.displayName, pr.title, pr.description, pr.pullRequestId.toString(), score));
                requestIds.push(pr.pullRequestId);
            });
            logger_1.Logger.LogInfo("Retrieved " + myPullRequests.length + " pull requests that I requested");
            logger_1.Logger.LogInfo("Getting pull requests for which I'm a reviewer...");
            //Go get the active pull requests that I'm a reviewer for
            const myReviewPullRequests = yield svc.GetPullRequests(this._serverContext.RepoInfo.RepositoryId, undefined, this._serverContext.UserInfo.Id, GitInterfaces_1.PullRequestStatus.Active);
            myReviewPullRequests.forEach((pr) => {
                const score = gitvc_1.GitVcService.GetPullRequestScore(pr);
                if (requestIds.indexOf(pr.pullRequestId) < 0) {
                    requestItems.push(this.getPullRequestLabel(pr.createdBy.displayName, pr.title, pr.description, pr.pullRequestId.toString(), score));
                }
            });
            logger_1.Logger.LogInfo("Retrieved " + myReviewPullRequests.length + " pull requests that I'm the reviewer");
            //Remove the default Strings.BrowseYourPullRequests item from the calculation
            this._statusBarItem.text = GitClient.GetPullRequestStatusText((requestItems.length - 1).toString());
            this._statusBarItem.tooltip = strings_1.Strings.BrowseYourPullRequests;
            this._statusBarItem.command = constants_1.CommandNames.GetPullRequests;
            return requestItems;
        });
    }
    getPullRequestLabel(displayName, title, description, id, score) {
        let scoreIcon = "";
        if (score === gitvc_1.PullRequestScore.Succeeded) {
            scoreIcon = "check";
        }
        else if (score === gitvc_1.PullRequestScore.Failed) {
            scoreIcon = "stop";
        }
        else if (score === gitvc_1.PullRequestScore.Waiting) {
            scoreIcon = "watch";
        }
        else if (score === gitvc_1.PullRequestScore.NoResponse) {
            scoreIcon = "git-pull-request";
        }
        const scoreLabel = `$(${scoreIcon}) `;
        return { label: scoreLabel + " (" + displayName + ") " + title, description: description, id: id };
    }
    static GetOfflinePullRequestStatusText() {
        return `$(git-pull-request) ???`;
    }
    //Sets the text on the pull request status bar
    static GetPullRequestStatusText(total) {
        if (!total) {
            return `$(git-pull-request) $(dash)`;
        }
        return `$(git-pull-request) ${total.toString()}`;
    }
    //Ensure that we don't accidentally send non-Git (e.g., TFVC) contexts to the Git client
    ensureGitContext(context) {
        if (context.Type !== repositorycontext_1.RepositoryType.GIT) {
            throw new Error("context sent to GitClient is not a Git context object.");
        }
    }
}
exports.GitClient = GitClient;

//# sourceMappingURL=gitclient.js.map
