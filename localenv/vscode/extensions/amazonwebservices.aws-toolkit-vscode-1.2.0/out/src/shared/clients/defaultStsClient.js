"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const extensionGlobals_1 = require("../extensionGlobals");
class DefaultStsClient {
    constructor(regionCode, credentials) {
        this.regionCode = regionCode;
        this.credentials = credentials;
    }
    getCallerIdentity() {
        return __awaiter(this, void 0, void 0, function* () {
            const sdkClient = yield this.createSdkClient();
            const response = yield sdkClient.getCallerIdentity().promise();
            return response;
        });
    }
    createSdkClient() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield extensionGlobals_1.ext.sdkClientBuilder.createAndConfigureServiceClient(options => new aws_sdk_1.STS(options), this.credentials, this.regionCode);
        });
    }
}
exports.DefaultStsClient = DefaultStsClient;
//# sourceMappingURL=defaultStsClient.js.map