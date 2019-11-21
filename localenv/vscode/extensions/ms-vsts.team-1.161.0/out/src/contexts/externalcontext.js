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
const repositorycontext_1 = require("./repositorycontext");
const repoutils_1 = require("../helpers/repoutils");
const logger_1 = require("../helpers/logger");
class ExternalContext {
    constructor(rootPath) {
        this._isSsh = false;
        this._isTeamServicesUrl = false;
        this._isTeamFoundationServer = false;
        //The passed in path is the workspace.rootPath (which could be a sub-folder)
        this._folder = rootPath;
    }
    dispose() {
        //nothing to do
    }
    //Need to call tf.cmd to get TFVC information (and constructors can't be async)
    Initialize(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`Looking for an External Context at ${this._folder}`);
            if (!settings.RemoteUrl || !settings.TeamProject) {
                logger_1.Logger.LogDebug(`No External Context at ${this._folder}`);
                return false;
            }
            this._remoteUrl = settings.RemoteUrl;
            this._isTeamServicesUrl = repoutils_1.RepoUtils.IsTeamFoundationServicesRepo(this._remoteUrl);
            this._isTeamFoundationServer = repoutils_1.RepoUtils.IsTeamFoundationServerRepo(this._remoteUrl);
            this._teamProjectName = settings.TeamProject;
            logger_1.Logger.LogDebug(`Found an External Context at ${this._folder}`);
            return true;
        });
    }
    // Tfvc implementation
    get TeamProjectName() {
        return this._teamProjectName;
    }
    // Git implementation
    get CurrentBranch() {
        return undefined;
    }
    get CurrentRef() {
        return undefined;
    }
    // IRepositoryContext implementation
    get RepoFolder() {
        return this._folder;
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
        return this._remoteUrl;
    }
    get RepositoryParentFolder() {
        return undefined;
    }
    get Type() {
        return repositorycontext_1.RepositoryType.EXTERNAL;
    }
}
exports.ExternalContext = ExternalContext;

//# sourceMappingURL=externalcontext.js.map
