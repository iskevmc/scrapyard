/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../helpers/constants");
const os = require("os");
class UserAgentProvider {
    static get UserAgent() {
        // Example: VSTSVSCode/1.115.1 (VSCode/10.1.0; Windows_NT/10.0.10586; Node/6.5.0)
        const userAgent = `${constants_1.Constants.ExtensionUserAgentName}/${constants_1.Constants.ExtensionVersion} (VSCode ${UserAgentProvider._vsCodeVersion}; ${os.type()} ${os.release()}; Node ${process.versions["node"]})`;
        return userAgent;
    }
    //Allow the VS Code version to be set (but only retrieved via UserAgent string)
    static set VSCodeVersion(vsCodeVersion) {
        UserAgentProvider._vsCodeVersion = vsCodeVersion;
    }
}
UserAgentProvider._vsCodeVersion = "0.0.0";
exports.UserAgentProvider = UserAgentProvider;

//# sourceMappingURL=useragentprovider.js.map
