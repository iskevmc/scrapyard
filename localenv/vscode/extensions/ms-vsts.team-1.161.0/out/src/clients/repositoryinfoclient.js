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
const coreapiclient_1 = require("./coreapiclient");
const logger_1 = require("../helpers/logger");
const repoutils_1 = require("../helpers/repoutils");
const strings_1 = require("../helpers/strings");
const repositorycontext_1 = require("../contexts/repositorycontext");
const teamservicesclient_1 = require("./teamservicesclient");
const tfscatalogsoapclient_1 = require("./tfscatalogsoapclient");
const repositoryinfo_1 = require("../info/repositoryinfo");
const telemetry_1 = require("../services/telemetry");
const url = require("url");
class RepositoryInfoClient {
    constructor(context, handler) {
        this._repoContext = context;
        this._handler = handler;
    }
    GetRepositoryInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let repoInfo;
            let repositoryInfo;
            let repositoryClient;
            if (this._repoContext.Type === repositorycontext_1.RepositoryType.GIT) {
                logger_1.Logger.LogDebug(`Getting repository information for a Git repository at ${this._repoContext.RemoteUrl}`);
                repositoryClient = new teamservicesclient_1.TeamServicesApi(this._repoContext.RemoteUrl, [this._handler]);
                repoInfo = yield repositoryClient.getVstsInfo();
                logger_1.Logger.LogDebug(`Repository information blob:`);
                logger_1.Logger.LogObject(repoInfo);
                this.verifyRepoInfo(repoInfo, `RepoInfo was undefined for a ${repositorycontext_1.RepositoryType[this._repoContext.Type]} repo`);
                repositoryInfo = new repositoryinfo_1.RepositoryInfo(repoInfo);
                logger_1.Logger.LogDebug(`Finished getting repository information for a Git repository at ${this._repoContext.RemoteUrl}`);
                return repositoryInfo;
            }
            else if (this._repoContext.Type === repositorycontext_1.RepositoryType.TFVC || this._repoContext.Type === repositorycontext_1.RepositoryType.EXTERNAL) {
                logger_1.Logger.LogDebug(`Getting repository information for a TFVC repository at ${this._repoContext.RemoteUrl}`);
                //For TFVC, the teamProjectName is retrieved by tf.cmd and set on the context
                const teamProjectName = this._repoContext.TeamProjectName;
                this.verifyRepoInfo(this._repoContext.RemoteUrl, `RemoteUrl was undefined for a ${repositorycontext_1.RepositoryType[this._repoContext.Type]} repo`);
                repositoryInfo = new repositoryinfo_1.RepositoryInfo(this._repoContext.RemoteUrl);
                let serverUrl;
                let collectionName;
                const isTeamServices = repoutils_1.RepoUtils.IsTeamFoundationServicesRepo(this._repoContext.RemoteUrl);
                if (isTeamServices) {
                    // The Team Services collection is ALWAYS defaultCollection, and both the url with defaultcollection
                    // and the url without defaultCollection will validate just fine. However, it expects you to refer to
                    // the collection by the account name. So, we just need to grab the account name and use that to
                    // recreate the url.
                    // If validation fails, we return false.
                    collectionName = repositoryInfo.Account;
                    if (repoutils_1.RepoUtils.IsTeamFoundationServicesAzureRepo(this._repoContext.RemoteUrl)) {
                        serverUrl = `https://${repositoryInfo.Host}/${repositoryInfo.Account}/`;
                    }
                    else {
                        serverUrl = `https://${repositoryInfo.Account}.visualstudio.com/`;
                    }
                    const valid = yield this.validateTfvcCollectionUrl(serverUrl);
                    if (!valid) {
                        const errorMsg = `${strings_1.Strings.UnableToValidateTeamServicesCollection} Collection name: '${collectionName}', Url: '${serverUrl}'`;
                        logger_1.Logger.LogDebug(errorMsg);
                        throw new Error(errorMsg);
                    }
                    logger_1.Logger.LogDebug(`Successfully validated the hosted TFVC repository. Collection name: '${collectionName}', 'Url: ${serverUrl}'`);
                }
                else {
                    serverUrl = this._repoContext.RemoteUrl;
                    // A full Team Foundation Server collection url is required for the validate call to succeed.
                    // So we try the url given. If that fails, we assume it is a server Url and the collection is
                    // the defaultCollection. If that assumption fails we return false.
                    logger_1.Logger.LogDebug(`Starting the validation of the collection. Url: '${serverUrl}'`);
                    let valid = yield this.validateTfvcCollectionUrl(serverUrl);
                    if (valid) {
                        const parts = this.splitTfvcCollectionUrl(serverUrl);
                        serverUrl = parts[0];
                        collectionName = parts[1];
                        logger_1.Logger.LogDebug(`Validated the collection and splitting Url and Collection name. Collection name: '${collectionName}', Url: '${serverUrl}'`);
                    }
                    else {
                        logger_1.Logger.LogDebug(`Unable to validate the collection. Url: '${serverUrl}' Attempting validation assuming 'DefaultCollection'...`);
                        collectionName = "DefaultCollection";
                        const remoteUrl = url.resolve(serverUrl, collectionName);
                        valid = yield this.validateTfvcCollectionUrl(remoteUrl);
                        if (!valid) {
                            logger_1.Logger.LogDebug(strings_1.Strings.UnableToValidateCollectionAssumingDefaultCollection);
                            throw new Error(strings_1.Strings.UnableToValidateCollectionAssumingDefaultCollection);
                        }
                        //Since we validated with the default collection, we need to update the repo context's RemoteUrl
                        if (this._repoContext.Type === repositorycontext_1.RepositoryType.TFVC) {
                            const tfvcContext = this._repoContext;
                            tfvcContext.RemoteUrl = remoteUrl;
                        }
                        logger_1.Logger.LogDebug(`Validated the collection assuming 'DefaultCollection'.`);
                    }
                }
                const coreApiClient = new coreapiclient_1.CoreApiClient();
                let collection;
                logger_1.Logger.LogDebug(`Getting project collection...  url: '${serverUrl}', and collection name: '${collectionName}'`);
                if (isTeamServices) {
                    //The following call works for VSTS, TFS 2017 and TFS 2015U3 (multiple collections, spaces in the name), just not for non-admins on-prem (!)
                    logger_1.Logger.LogDebug(`Using REST to get the project collection information`);
                    collection = yield coreApiClient.GetProjectCollection(serverUrl, collectionName);
                }
                else {
                    logger_1.Logger.LogDebug(`Using SOAP to get the project collection information`);
                    // When called on-prem without admin privileges: Error: Failed Request: Forbidden(403) - Access Denied: Jeff Young (TFS) needs the following permission(s) to perform this action: Edit instance-level information
                    const tfsClient = new tfscatalogsoapclient_1.TfsCatalogSoapClient(serverUrl, [this._handler]);
                    collection = yield tfsClient.GetProjectCollection(collectionName);
                    if (!collection) {
                        const error = `Using SOAP, could not find a project collection object for ${collectionName} at ${serverUrl}`;
                        logger_1.Logger.LogDebug(error);
                        throw new Error(error);
                    }
                }
                logger_1.Logger.LogDebug(`Found a project collection for url: '${serverUrl}' and collection name: '${collection.name}'.`);
                logger_1.Logger.LogDebug(`Getting team project...  Url: '${serverUrl}', collection name: '${collection.name}', and project: '${teamProjectName}'`);
                //For a Team Services collection, ignore the collectionName
                const resolvedRemoteUrl = url.resolve(serverUrl, isTeamServices ? "" : collection.name);
                //Delay the check for a teamProjectName (don't fail here).  If we don't have one, that's OK for TFVC
                //functionality.  We need to disable Team Services functionality if we can't find a team project later.
                const project = yield this.getProjectFromServer(coreApiClient, resolvedRemoteUrl, teamProjectName);
                logger_1.Logger.LogDebug(`Found a team project for url: '${serverUrl}', collection name: '${collection.name}', and project id: '${project.id}'`);
                //Now, create the JSON blob to send to new RepositoryInfo(repoInfo);
                repoInfo = this.getTfvcRepoInfoBlob(serverUrl, collection.id, collection.name, collection.url, project.id, project.name, project.description, project.url);
                logger_1.Logger.LogDebug(`Repository information blob:`);
                logger_1.Logger.LogObject(repoInfo);
                this.verifyRepoInfo(repoInfo, `RepoInfo was undefined for a ${repositorycontext_1.RepositoryType[this._repoContext.Type]} repo`);
                repositoryInfo = new repositoryinfo_1.RepositoryInfo(repoInfo);
                logger_1.Logger.LogDebug(`Finished getting repository information for the repository at ${this._repoContext.RemoteUrl}`);
                return repositoryInfo;
            }
            return repositoryInfo;
        });
    }
    //Using to try and track down users in the scenario where repoInfo is undefined
    verifyRepoInfo(repoInfo, message) {
        if (!repoInfo) {
            telemetry_1.Telemetry.SendException(new Error(message));
        }
    }
    splitTfvcCollectionUrl(collectionUrl) {
        const result = [,];
        if (!collectionUrl) {
            return result;
        }
        // Now find the TRUE last separator (before the collection name)
        const trimmedUrl = this.trimTrailingSeparators(collectionUrl);
        const index = trimmedUrl.lastIndexOf("/");
        if (index >= 0) {
            // result0 is the server url without the collection name
            result[0] = trimmedUrl.substring(0, index + 1);
            // result1 is just the collection name (no separators)
            result[1] = trimmedUrl.substring(index + 1);
        }
        else {
            // We can't determine the collection name so leave it empty
            result[0] = collectionUrl;
            result[1] = "";
        }
        return result;
    }
    trimTrailingSeparators(uri) {
        if (uri) {
            let lastIndex = uri.length;
            while (lastIndex > 0 && uri.charAt(lastIndex - 1) === "/".charAt(0)) {
                lastIndex--;
            }
            if (lastIndex >= 0) {
                return uri.substring(0, lastIndex);
            }
        }
        return uri;
    }
    //RepositoryInfo uses repository.remoteUrl to set up accountUrl
    getTfvcRepoInfoBlob(serverUrl, collectionId, collectionName, collectionUrl, projectId, projectName, projectDesc, projectUrl) {
        return {
            serverUrl: serverUrl,
            collection: {
                id: collectionId,
                name: collectionName,
                url: collectionUrl
            },
            repository: {
                id: "00000000-0000-0000-0000-000000000000",
                name: "NoNameTfvcRepository",
                url: serverUrl,
                project: {
                    id: projectId,
                    name: projectName,
                    description: projectDesc,
                    url: projectUrl,
                    state: 1,
                    revision: 15
                },
                remoteUrl: serverUrl
            }
        };
    }
    getProjectFromServer(coreApiClient, remoteUrl, teamProjectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return coreApiClient.GetTeamProject(remoteUrl, teamProjectName);
        });
    }
    validateTfvcCollectionUrl(serverUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const repositoryClient = new teamservicesclient_1.TeamServicesApi(serverUrl, [this._handler]);
                yield repositoryClient.validateTfvcCollectionUrl();
                return true;
            }
            catch (err) {
                if (err.statusCode === 404) {
                    return false;
                }
                else {
                    throw err;
                }
            }
        });
    }
}
exports.RepositoryInfoClient = RepositoryInfoClient;

//# sourceMappingURL=repositoryinfoclient.js.map
