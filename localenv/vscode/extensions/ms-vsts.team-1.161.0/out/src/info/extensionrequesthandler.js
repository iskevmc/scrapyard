/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebApi_1 = require("vso-node-api/WebApi");
const WebApi_2 = require("vso-node-api/WebApi");
const constants_1 = require("../helpers/constants");
const useragentprovider_1 = require("../helpers/useragentprovider");
// This class creates an IRequestHandler so we can send our own custom user-agent string
class ExtensionRequestHandler {
    constructor(username, password, domain, workstation) {
        if (username !== undefined && password !== undefined) {
            // NTLM (we don't support Basic auth)
            this._username = username;
            this._password = password;
            this._domain = domain;
            this._workstation = workstation;
            this._credentialHandler = WebApi_2.getNtlmHandler(this._username, this._password, this._domain, this._workstation);
        }
        else {
            // Personal Access Token
            this._username = constants_1.Constants.OAuth;
            this._password = username; //use username since it is first argument to constructor
            this._credentialHandler = WebApi_1.getBasicHandler(this._username, this._password);
        }
    }
    get Domain() {
        return this._domain;
    }
    get Username() {
        return this._username;
    }
    get Password() {
        return this._password;
    }
    get Workstation() {
        return this._workstation;
    }
    // Below are the IRequestHandler implementation/overrides
    prepareRequest(options) {
        this._credentialHandler.prepareRequest(options);
        // Get user agent string from the UserAgentProvider (Example: VSTSVSCode/1.115.1 (VSCode/10.1.0; Windows_NT/10.0.10586; Node/6.5.0))
        const userAgent = useragentprovider_1.UserAgentProvider.UserAgent;
        options.headers["User-Agent"] = userAgent;
    }
    canHandleAuthentication(res) {
        return this._credentialHandler.canHandleAuthentication(res);
    }
    handleAuthentication(httpClient, protocol, options, objs, finalCallback) {
        return this._credentialHandler.handleAuthentication(httpClient, protocol, options, objs, finalCallback);
    }
}
exports.ExtensionRequestHandler = ExtensionRequestHandler;

//# sourceMappingURL=extensionrequesthandler.js.map
