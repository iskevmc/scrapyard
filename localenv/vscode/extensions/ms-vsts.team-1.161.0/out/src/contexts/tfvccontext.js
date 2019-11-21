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
const tfcommandlinerunner_1 = require("../tfvc/tfcommandlinerunner");
const repoutils_1 = require("../helpers/repoutils");
const logger_1 = require("../helpers/logger");
class TfvcContext {
    constructor(rootPath) {
        this._isSsh = false;
        this._isTeamServicesUrl = false;
        this._isTeamFoundationServer = false;
        this._tfvcFolder = rootPath;
    }
    //Need to call tf.cmd to get TFVC information (and constructors can't be async)
    Initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`Looking for TFVC repository at ${this._tfvcFolder}`);
            this._repo = tfcommandlinerunner_1.TfCommandLineRunner.CreateRepository(undefined, this._tfvcFolder);
            //Ensure we have an appropriate ENU version of tf executable
            //The call will throw if we have tf configured properly but it isn't ENU
            yield this._repo.CheckVersion();
            this._tfvcWorkspace = yield this._repo.FindWorkspace(this._tfvcFolder);
            this._tfvcRemoteUrl = this._tfvcWorkspace.server;
            this._isTeamServicesUrl = repoutils_1.RepoUtils.IsTeamFoundationServicesRepo(this._tfvcRemoteUrl);
            this._isTeamFoundationServer = repoutils_1.RepoUtils.IsTeamFoundationServerRepo(this._tfvcRemoteUrl);
            this._teamProjectName = this._tfvcWorkspace.defaultTeamProject;
            logger_1.Logger.LogDebug(`Found a TFVC repository for url: '${this._tfvcRemoteUrl}' and team project: '${this._teamProjectName}'.`);
            return true;
        });
    }
    // Tfvc implementation
    get TeamProjectName() {
        return this._teamProjectName;
    }
    get TfvcRepository() {
        return this._repo;
    }
    set TfvcRepository(newRepository) {
        // Don't let the repository be undefined
        if (newRepository) {
            this._repo = newRepository;
        }
    }
    get TfvcWorkspace() {
        return this._tfvcWorkspace;
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
        return this._tfvcFolder;
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
        return this._tfvcRemoteUrl;
    }
    get RepositoryParentFolder() {
        return this._gitParentFolder;
    }
    get Type() {
        return repositorycontext_1.RepositoryType.TFVC;
    }
    //This is used if we need to update the RemoteUrl after validating the TFVC collection with the repositoryinfoclient
    set RemoteUrl(remoteUrl) {
        this._tfvcRemoteUrl = remoteUrl;
    }
}
exports.TfvcContext = TfvcContext;

//# sourceMappingURL=tfvccontext.js.map
