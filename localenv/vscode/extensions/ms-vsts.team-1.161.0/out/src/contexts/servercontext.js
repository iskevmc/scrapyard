/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repositoryinfo_1 = require("../info/repositoryinfo");
class TeamServerContext {
    //The constructor simply parses the remoteUrl to determine if we're Team Services or Team Foundation Server.
    //Any additional information we can get from the url is also parsed.  Once we call the vsts/info api, we can
    //get the rest of the information that we need.
    constructor(remoteUrl) {
        if (remoteUrl === undefined) {
            return;
        }
        this._repositoryInfo = new repositoryinfo_1.RepositoryInfo(remoteUrl);
    }
    get CredentialHandler() {
        return this._credentialHandler;
    }
    set CredentialHandler(handler) {
        this._credentialHandler = handler;
    }
    get RepoInfo() {
        return this._repositoryInfo;
    }
    set RepoInfo(info) {
        this._repositoryInfo = info;
    }
    get UserInfo() {
        return this._userInfo;
    }
    set UserInfo(info) {
        this._userInfo = info;
    }
    get CredentialInfo() {
        return this._credentialInfo;
    }
    set CredentialInfo(info) {
        this._credentialInfo = info;
    }
}
exports.TeamServerContext = TeamServerContext;

//# sourceMappingURL=servercontext.js.map
