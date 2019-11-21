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
const WebApi_1 = require("vso-node-api/WebApi");
const credentialmanager_1 = require("../helpers/credentialmanager");
class CoreApiService {
    constructor(remoteUrl) {
        this._coreApi = new WebApi_1.WebApi(remoteUrl, credentialmanager_1.CredentialManager.GetCredentialHandler()).getCoreApi();
    }
    //Get the
    GetProjectCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._coreApi.getProjectCollection(collectionName);
        });
    }
    //Get the
    GetTeamProject(projectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._coreApi.getProject(projectName, false, false);
        });
    }
}
exports.CoreApiService = CoreApiService;

//# sourceMappingURL=coreapi.js.map
