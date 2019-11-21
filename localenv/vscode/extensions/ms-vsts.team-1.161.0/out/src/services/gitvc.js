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
const GitInterfaces_1 = require("vso-node-api/interfaces/GitInterfaces");
const WebApi_1 = require("vso-node-api/WebApi");
const credentialmanager_1 = require("../helpers/credentialmanager");
const urlbuilder_1 = require("../helpers/urlbuilder");
class GitVcService {
    constructor(context) {
        this._gitApi = new WebApi_1.WebApi(context.RepoInfo.CollectionUrl, credentialmanager_1.CredentialManager.GetCredentialHandler()).getGitApi();
    }
    //Returns a Promise containing an array of GitPullRequest objectss for the creator and repository
    //If creatorId is undefined, all pull requests will be returned
    GetPullRequests(repositoryId, creatorId, reviewerId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const criteria = { creatorId: creatorId, includeLinks: false, repositoryId: repositoryId, reviewerId: reviewerId,
                sourceRefName: undefined, status: status, targetRefName: undefined };
            return yield this._gitApi.getPullRequests(repositoryId, criteria);
        });
    }
    //Returns a Promise containing an array of GitRepository objects for the project
    GetRepositories(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._gitApi.getRepositories(project, false);
        });
    }
    //Construct the url to the file blame information
    //https://account.visualstudio.com/defaultcollection/project/_git/VSCode.Extension#path=%2FREADME.md&version=GBmaster&annotate=true
    static GetFileBlameUrl(remoteUrl, currentFile, currentBranch) {
        const file = encodeURIComponent(currentFile);
        const branch = encodeURIComponent(currentBranch);
        return urlbuilder_1.UrlBuilder.AddHashes(remoteUrl, `path=${file}`, `version=GB${branch}`, `annotate=true`);
    }
    //Construct the url to the individual file history
    //https://account.visualstudio.com/defaultcollection/project/_git/VSCode.Extension#path=%2FREADME.md&version=GBmaster&_a=history
    static GetFileHistoryUrl(remoteUrl, currentFile, currentBranch) {
        const file = encodeURIComponent(currentFile);
        const branch = encodeURIComponent(currentBranch);
        return urlbuilder_1.UrlBuilder.AddHashes(remoteUrl, `path=${file}`, `version=GB${branch}`, `_a=history`);
    }
    //Construct the url to the repository history (by branch)
    //https://account.visualstudio.com/project/_git/VSCode.Extension/history?itemVersion=GBmaster&_a=history
    static GetRepositoryHistoryUrl(remoteUrl, currentBranch) {
        const branch = encodeURIComponent(currentBranch);
        const repoHistoryUrl = urlbuilder_1.UrlBuilder.Join(remoteUrl, "history");
        return urlbuilder_1.UrlBuilder.AddQueryParams(repoHistoryUrl, `itemVersion=GB${branch}`, `_a=history`);
    }
    //Today, simply craft a url to the create pull request web page
    //https://account.visualstudio.com/DefaultCollection/project/_git/VSCode.Health/pullrequests#_a=createnew&sourceRef=master
    static GetCreatePullRequestUrl(remoteUrl, currentBranch) {
        const branch = encodeURIComponent(currentBranch);
        return urlbuilder_1.UrlBuilder.AddHashes(GitVcService.GetPullRequestsUrl(remoteUrl), `_a=createnew`, `sourceRef=${branch}`);
    }
    //Construct the url to the view pull request (discussion view)
    //https://account.visualstudio.com/DefaultCollection/VSOnline/project/_git/Java.VSCode/pullrequest/79184?view=discussion
    static GetPullRequestDiscussionUrl(repositoryUrl, requestId) {
        let discussionUrl = urlbuilder_1.UrlBuilder.Join(repositoryUrl, "pullrequest", requestId);
        discussionUrl = urlbuilder_1.UrlBuilder.AddQueryParams(discussionUrl, "view=discussion");
        return discussionUrl;
    }
    //Construct the url to the main pull requests page
    //https://account.visualstudio.com/DefaultCollection/_git/project/pullrequests
    static GetPullRequestsUrl(repositoryUrl) {
        return urlbuilder_1.UrlBuilder.Join(repositoryUrl, "pullrequests");
    }
    //Returns the 'score' of the pull request so the client knows if the PR failed,
    //didn't receive any reponses, succeeded or is waiting for the author.
    static GetPullRequestScore(pullRequest) {
        const mergeStatus = pullRequest.mergeStatus;
        if (mergeStatus === GitInterfaces_1.PullRequestAsyncStatus.Conflicts
            || mergeStatus === GitInterfaces_1.PullRequestAsyncStatus.Failure
            || mergeStatus === GitInterfaces_1.PullRequestAsyncStatus.RejectedByPolicy) {
            return PullRequestScore.Failed;
        }
        let lowestVote = 0;
        let highestVote = 0;
        if (pullRequest.reviewers !== undefined && pullRequest.reviewers.length > 0) {
            pullRequest.reviewers.forEach((reviewer) => {
                const vote = reviewer.vote;
                if (vote < lowestVote) {
                    lowestVote = vote;
                }
                if (vote > highestVote) {
                    highestVote = vote;
                }
            });
        }
        let finalVote = GitVcService.REVIEWER_VOTE_NO_RESPONSE;
        if (lowestVote < GitVcService.REVIEWER_VOTE_NO_RESPONSE) {
            finalVote = lowestVote;
        }
        else if (highestVote > GitVcService.REVIEWER_VOTE_NO_RESPONSE) {
            finalVote = highestVote;
        }
        if (finalVote === GitVcService.REVIEWER_VOTE_APPROVED_WITH_SUGGESTIONS
            || finalVote === GitVcService.REVIEWER_VOTE_APPROVED) {
            return PullRequestScore.Succeeded;
        }
        if (finalVote === GitVcService.REVIEWER_VOTE_WAITING_FOR_AUTHOR) {
            return PullRequestScore.Waiting;
        }
        if (finalVote === GitVcService.REVIEWER_VOTE_REJECTED) {
            return PullRequestScore.Failed;
        }
        return PullRequestScore.NoResponse;
    }
}
GitVcService.REVIEWER_VOTE_NO_RESPONSE = 0;
GitVcService.REVIEWER_VOTE_APPROVED_WITH_SUGGESTIONS = 5;
GitVcService.REVIEWER_VOTE_APPROVED = 10;
GitVcService.REVIEWER_VOTE_WAITING_FOR_AUTHOR = -5;
GitVcService.REVIEWER_VOTE_REJECTED = -10;
exports.GitVcService = GitVcService;
var PullRequestScore;
(function (PullRequestScore) {
    PullRequestScore[PullRequestScore["Failed"] = 0] = "Failed";
    PullRequestScore[PullRequestScore["NoResponse"] = 1] = "NoResponse";
    PullRequestScore[PullRequestScore["Succeeded"] = 2] = "Succeeded";
    PullRequestScore[PullRequestScore["Waiting"] = 3] = "Waiting";
})(PullRequestScore = exports.PullRequestScore || (exports.PullRequestScore = {}));

//# sourceMappingURL=gitvc.js.map
