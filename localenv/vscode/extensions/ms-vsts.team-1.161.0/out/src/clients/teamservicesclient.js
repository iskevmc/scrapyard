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
const basem = require("vso-node-api/ClientApiBases");
class TeamServicesApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers) {
        super(baseUrl, handlers, "node-vsts-vscode-api");
    }
    //This calls the vsts/info endpoint (which only exists for Git)
    getVstsInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            //Create an instance of Promise since we're calling a function with the callback pattern but want to return a Promise
            const promise = new Promise((resolve, reject) => {
                /* tslint:disable:no-null-keyword */
                this.restClient.getJson(this.vsoClient.resolveUrl("/vsts/info"), "", null, null, (err, statusCode, obj) => {
                    /* tslint:enable:no-null-keyword */
                    if (err) {
                        err.statusCode = statusCode;
                        reject(err);
                    }
                    else {
                        resolve(obj);
                    }
                });
            });
            return promise;
        });
    }
    //Used to determine if the baseUrl points to a valid TFVC repository
    validateTfvcCollectionUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            //Create an instance of Promise since we're calling a function with the callback pattern but want to return a Promise
            const promise = new Promise((resolve, reject) => {
                /* tslint:disable:no-null-keyword */
                this.restClient.getJson(this.vsoClient.resolveUrl("_apis/tfvc/branches"), "", null, null, (err, statusCode, obj) => {
                    /* tslint:enable:no-null-keyword */
                    if (err) {
                        err.statusCode = statusCode;
                        reject(err);
                    }
                    else {
                        resolve(obj);
                    }
                });
            });
            return promise;
        });
    }
}
exports.TeamServicesApi = TeamServicesApi;

//# sourceMappingURL=teamservicesclient.js.map
