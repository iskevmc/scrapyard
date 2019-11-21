/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensionrequesthandler_1 = require("./extensionrequesthandler");
class CredentialInfo {
    constructor(username, password, domain, workstation) {
        if (username !== undefined && password !== undefined) {
            // NTLM (we don't support Basic auth)
            this._credentialHandler = new extensionrequesthandler_1.ExtensionRequestHandler(username, password, domain, workstation);
        }
        else {
            // Personal Access Token
            // Use username (really, accessToken) since it is first argument to constructor
            this._credentialHandler = new extensionrequesthandler_1.ExtensionRequestHandler(username);
        }
    }
    get CredentialHandler() {
        return this._credentialHandler;
    }
    set CredentialHandler(handler) {
        this._credentialHandler = handler;
    }
    get Domain() {
        return this._credentialHandler.Domain;
    }
    get Username() {
        return this._credentialHandler.Username;
    }
    get Password() {
        return this._credentialHandler.Password;
    }
    get Workstation() {
        return this._credentialHandler.Workstation;
    }
}
exports.CredentialInfo = CredentialInfo;

//# sourceMappingURL=credentialinfo.js.map
