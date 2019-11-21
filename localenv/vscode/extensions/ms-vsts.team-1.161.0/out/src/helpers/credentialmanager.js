/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const credentialinfo_1 = require("../info/credentialinfo");
const credentialstore_1 = require("../credentialstore/credentialstore");
const repoutils_1 = require("./repoutils");
const Q = require("q");
class CredentialManager {
    constructor() {
        // Specify the prefix for use on Windows and Mac.
        // On Linux, create a custom folder and file.
        this._credentialStore = new credentialstore_1.CredentialStore("team:", ".team", "team-secrets.json");
    }
    static GetCredentialHandler() {
        return CredentialManager._credentialHandler;
    }
    GetCredentials(context) {
        const deferred = Q.defer();
        this.getCredentials(context).then((credInfo) => {
            if (credInfo !== undefined) {
                CredentialManager._credentialHandler = credInfo.CredentialHandler;
                deferred.resolve(credInfo);
            }
            else {
                deferred.resolve(undefined);
            }
        }).catch((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    RemoveCredentials(context) {
        const deferred = Q.defer();
        this._credentialStore.RemoveCredential(CredentialManager.getKeyFromContext(context)).then(() => {
            deferred.resolve(undefined);
        }).catch((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    StoreCredentials(context, username, password) {
        const deferred = Q.defer();
        this._credentialStore.SetCredential(CredentialManager.getKeyFromContext(context), username, password).then(() => {
            deferred.resolve(undefined);
        }).catch((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    getCredentials(context) {
        const deferred = Q.defer();
        this._credentialStore.GetCredential(CredentialManager.getKeyFromContext(context)).then((cred) => {
            if (cred !== undefined) {
                if (context.RepoInfo.IsTeamServices) {
                    deferred.resolve(new credentialinfo_1.CredentialInfo(cred.Password));
                }
                else if (context.RepoInfo.IsTeamFoundationServer) {
                    let domain;
                    let user = cred.Username;
                    const pair = user.split("\\");
                    if (pair.length > 1) {
                        domain = pair[0];
                        user = pair[pair.length - 1];
                    }
                    deferred.resolve(new credentialinfo_1.CredentialInfo(user, cred.Password, domain, /*workstation*/ undefined));
                }
            }
            else {
                deferred.resolve(undefined);
            }
        }).catch((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    static getKeyFromContext(context) {
        if (repoutils_1.RepoUtils.IsTeamFoundationServicesAzureRepo(context.RepoInfo.AccountUrl)) {
            return context.RepoInfo.Host + "/" + context.RepoInfo.Account;
        }
        return context.RepoInfo.Host;
    }
}
exports.CredentialManager = CredentialManager;

//# sourceMappingURL=credentialmanager.js.map
