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
const utils_1 = require("../helpers/utils");
const repoutils_1 = require("../helpers/repoutils");
const repositorycontext_1 = require("./repositorycontext");
const pgc = require("parse-git-config");
const gri = require("git-repo-info");
const path = require("path");
const url = require("url");
//Gets as much information as it can regarding the Git repository without calling the server (vsts/info)
class GitContext {
    //When gitDir is provided, rootPath is the path to the Git repo
    constructor(rootPath, gitDir) {
        this._isSsh = false;
        this._isTeamServicesUrl = false;
        this._isTeamFoundationServer = false;
        if (rootPath) {
            //If gitDir, use rootPath as the .git folder
            if (gitDir) {
                this._gitFolder = rootPath;
                gri._changeGitDir(gitDir);
            }
            else {
                this._gitFolder = utils_1.Utils.FindGitFolder(rootPath);
            }
            if (this._gitFolder !== undefined) {
                // With parse-git-config, cwd is the directory containing the path, .git/config, you want to sync
                this._gitParentFolder = path.dirname(this._gitFolder);
                let syncObj = { cwd: this._gitParentFolder };
                //If gitDir, send pgc the exact path to the config file to use
                if (gitDir) {
                    syncObj = { path: path.join(this._gitFolder, "config") };
                }
                this._gitConfig = pgc.sync(syncObj);
                /* tslint:disable:quotemark */
                const remote = this._gitConfig['remote "origin"'];
                /* tslint:enable:quotemark */
                if (remote === undefined) {
                    return;
                }
                this._gitOriginalRemoteUrl = remote.url;
                if (gitDir) {
                    this._gitRepoInfo = gri(this._gitParentFolder);
                }
                else {
                    this._gitRepoInfo = gri(this._gitFolder);
                }
                this._gitCurrentBranch = this._gitRepoInfo.branch;
                this._gitCurrentRef = "refs/heads/" + this._gitCurrentBranch;
                //Check if any heuristics for TFS/VSTS URLs match
                if (repoutils_1.RepoUtils.IsTeamFoundationGitRepo(this._gitOriginalRemoteUrl)) {
                    const purl = url.parse(this._gitOriginalRemoteUrl);
                    if (purl) {
                        if (repoutils_1.RepoUtils.IsTeamFoundationServicesRepo(this._gitOriginalRemoteUrl)) {
                            this._isTeamServicesUrl = true;
                            const splitHref = purl.href.split("@");
                            if (splitHref.length === 2) {
                                this._isSsh = true;
                                //  VSTS now has three URL modes v3, _git, and _ssh.
                                if (purl.pathname.indexOf("/_git/") >= 0) {
                                    //  For Team Services, default to https:// as the protocol
                                    this._gitRemoteUrl = "https://" + purl.hostname + purl.pathname;
                                }
                                else if (repoutils_1.RepoUtils.IsTeamFoundationServicesV3SshRepo(purl.href)) {
                                    this._gitRemoteUrl = repoutils_1.RepoUtils.ConvertSshV3ToUrl(purl.href);
                                }
                                else {
                                    // Do a few substitutions to get the correct url:
                                    //  * ssh:// -> https://
                                    //  * vs-ssh -> accountname
                                    //  * _git -> _ssh
                                    // so ssh://account@vsts-ssh.visualstudio.com/DefaultCollection/_ssh/foo
                                    // becomes https://account.visualstudio.com/DefaultCollection/_git/foo
                                    const scheme = "https://";
                                    const hostname = purl.auth + ".visualstudio.com";
                                    const path = purl.pathname.replace("_ssh", "_git");
                                    this._gitRemoteUrl = scheme + hostname + path;
                                }
                            }
                            else {
                                this._gitRemoteUrl = this._gitOriginalRemoteUrl;
                            }
                        }
                        else if (repoutils_1.RepoUtils.IsTeamFoundationServerRepo(this._gitOriginalRemoteUrl)) {
                            this._isTeamFoundationServer = true;
                            this._gitRemoteUrl = this._gitOriginalRemoteUrl;
                            if (purl.protocol.toLowerCase() === "ssh:") {
                                this._isSsh = true;
                                // TODO: No support yet for SSH on-premises (no-op the extension)
                                this._isTeamFoundationServer = false;
                            }
                        }
                    }
                }
            }
        }
    }
    dispose() {
        //nothing to do
    }
    //constructor already initializes the GitContext
    Initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    //Git implementation
    get CurrentBranch() {
        return this._gitCurrentBranch;
    }
    get CurrentRef() {
        return this._gitCurrentRef;
    }
    //TFVC implementation
    //For Git, TeamProjectName is set after the call to vsts/info
    get TeamProjectName() {
        return undefined;
    }
    //IRepositoryContext implementation
    get RepoFolder() {
        return this._gitFolder;
    }
    get IsSsh() {
        return this._isSsh;
    }
    get IsTeamFoundation() {
        return this._isTeamServicesUrl || this._isTeamFoundationServer;
    }
    get IsTeamServices() {
        return this._isTeamServicesUrl;
    }
    get RemoteUrl() {
        return this._gitRemoteUrl;
    }
    get RepositoryParentFolder() {
        return this._gitParentFolder;
    }
    get Type() {
        return repositorycontext_1.RepositoryType.GIT;
    }
}
exports.GitContext = GitContext;

//# sourceMappingURL=gitcontext.js.map
