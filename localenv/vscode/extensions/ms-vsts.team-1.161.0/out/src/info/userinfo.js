/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserInfo {
    constructor(id, providerDisplayName, customDisplayName) {
        this._id = id;
        this._providerDisplayName = providerDisplayName;
        this._customDisplayName = customDisplayName;
    }
    get Id() {
        return this._id;
    }
    get ProviderDisplayName() {
        return this._providerDisplayName;
    }
    get CustomDisplayName() {
        return this._customDisplayName;
    }
}
exports.UserInfo = UserInfo;

//# sourceMappingURL=userinfo.js.map
