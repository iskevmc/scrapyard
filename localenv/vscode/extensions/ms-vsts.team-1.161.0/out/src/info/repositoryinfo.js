/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../helpers/logger");
const repoutils_1 = require("../helpers/repoutils");
const urlbuilder_1 = require("../helpers/urlbuilder");
const url = require("url");
//When a RepositoryInfo object is created, we have already verified whether or not it
//is either a Team Services or Team Foundation Server repository.  With the introduction
//of TFVC support, we cannot determine if it is TFVC based on url alone.  Therfore,
//we have to assume that are creating a RepositoryInfo for an existing TF repo.
class RepositoryInfo {
    constructor(repositoryInfo) {
        // Indicates whether the repository is Team Services
        this._isTeamServicesUrl = false;
        // Indicates whether the repository is an on-premises server
        this._isTeamFoundationServer = false;
        if (!repositoryInfo) {
            throw new Error(`repositoryInfo is undefined`);
        }
        let repositoryUrl = undefined;
        if (typeof repositoryInfo === "object") {
            repositoryUrl = repositoryInfo.repository.remoteUrl;
        }
        else {
            repositoryUrl = repositoryInfo;
        }
        //Clean up repository URLs for repos that have "limited refs" enabled
        repositoryUrl = repositoryUrl.replace("/_git/_full/", "/_git/").replace("/_git/_optimized/", "/_git/");
        const purl = url.parse(repositoryUrl);
        if (purl) {
            this._host = purl.host;
            this._hostName = purl.hostname;
            this._path = purl.path;
            this._pathName = purl.pathname;
            this._port = purl.port;
            this._protocol = purl.protocol;
            this._query = purl.query;
            this._repositoryUrl = repositoryUrl;
            if (repoutils_1.RepoUtils.IsTeamFoundationServicesRepo(repositoryUrl)) {
                if (repoutils_1.RepoUtils.IsTeamFoundationServicesAzureRepo(this._repositoryUrl)) {
                    const splitPath = this._path.split("/");
                    if (splitPath.length >= 1) {
                        this._account = splitPath[1];
                    }
                    else {
                        throw new Error(`Could not parse account from ${this._path}`);
                    }
                }
                else {
                    const splitHost = this._host.split(".");
                    this._account = splitHost[0];
                }
                this._isTeamServicesUrl = true;
                logger_1.Logger.LogDebug("_isTeamServicesUrl: true");
            }
            else if (repoutils_1.RepoUtils.IsTeamFoundationServerRepo(repositoryUrl)) {
                this._account = purl.host;
                this._isTeamFoundationServer = true;
            }
            if (typeof repositoryInfo === "object") {
                logger_1.Logger.LogDebug("Parsing values from repositoryInfo object as any");
                //The following properties are returned from the vsts/info api
                //If you add additional properties to the server context, they need to be set here
                this._collection = repositoryInfo.collection.name;
                logger_1.Logger.LogDebug("_collection: " + this._collection);
                this._collectionId = repositoryInfo.collection.id;
                logger_1.Logger.LogDebug("_collectionId: " + this._collectionId);
                this._repositoryId = repositoryInfo.repository.id;
                logger_1.Logger.LogDebug("_repositoryId: " + this._repositoryId);
                this._repositoryName = repositoryInfo.repository.name;
                logger_1.Logger.LogDebug("_repositoryName: " + this._repositoryName);
                this._teamProject = repositoryInfo.repository.project.name;
                logger_1.Logger.LogDebug("_teamProject: " + this._teamProject);
                if (this._isTeamFoundationServer === true) {
                    logger_1.Logger.LogDebug("_isTeamFoundationServer: true");
                    //_serverUrl is only set for TeamFoundationServer repositories
                    this._serverUrl = repositoryInfo.serverUrl;
                }
            }
            else {
                logger_1.Logger.LogDebug("Parsing values from repositoryInfo as string url");
            }
        }
    }
    get Account() {
        return this._account;
    }
    get AccountUrl() {
        if (this._isTeamServicesUrl) {
            if (repoutils_1.RepoUtils.IsTeamFoundationServicesAzureRepo(this._repositoryUrl)) {
                return this._protocol + "//" + this._host + "/" + this._account;
            }
            return this._protocol + "//" + this._host;
        }
        else if (this._isTeamFoundationServer) {
            return this._serverUrl;
        }
    }
    get CollectionId() {
        return this._collectionId;
    }
    get CollectionName() {
        return this._collection;
    }
    get CollectionUrl() {
        if (this._collection === undefined) {
            return undefined;
        }
        // While leaving the actual data alone, check for 'collection in the domain'
        // If an Azure repo the "DefaultCollection" should never be part of the URL.
        if (this._account.toLowerCase() !== this._collection.toLowerCase()
            && !repoutils_1.RepoUtils.IsTeamFoundationServicesAzureRepo(this.RepositoryUrl)) {
            return urlbuilder_1.UrlBuilder.Join(this.AccountUrl, this._collection);
        }
        else {
            return this.AccountUrl;
        }
    }
    get Host() {
        return this._host;
    }
    get IsTeamFoundation() {
        return this._isTeamServicesUrl || this._isTeamFoundationServer;
    }
    get IsTeamFoundationServer() {
        return this._isTeamFoundationServer;
    }
    get IsTeamServices() {
        return this._isTeamServicesUrl;
    }
    get Protocol() {
        return this._protocol;
    }
    get RepositoryId() {
        return this._repositoryId;
    }
    get RepositoryName() {
        return this._repositoryName;
    }
    get RepositoryUrl() {
        return this._repositoryUrl;
    }
    get TeamProjectUrl() {
        if (this._teamProject === undefined) {
            return undefined;
        }
        return urlbuilder_1.UrlBuilder.Join(this.CollectionUrl, this._teamProject);
    }
    get TeamProject() {
        return this._teamProject;
    }
}
exports.RepositoryInfo = RepositoryInfo;

//# sourceMappingURL=repositoryinfo.js.map
