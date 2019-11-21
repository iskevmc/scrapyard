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
const coreapi_1 = require("../services/coreapi");
class CoreApiClient {
    /* tslint:disable:no-empty */
    constructor() { }
    /* tslint:enable:no-empty */
    GetTeamProject(remoteUrl, teamProjectName) {
        return __awaiter(this, void 0, void 0, function* () {
            const svc = new coreapi_1.CoreApiService(remoteUrl);
            const teamProject = yield svc.GetTeamProject(teamProjectName);
            return teamProject;
        });
    }
    GetProjectCollection(remoteUrl, collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const svc = new coreapi_1.CoreApiService(remoteUrl);
            const collection = yield svc.GetProjectCollection(collectionName);
            return collection;
        });
    }
}
exports.CoreApiClient = CoreApiClient;

//# sourceMappingURL=coreapiclient.js.map
