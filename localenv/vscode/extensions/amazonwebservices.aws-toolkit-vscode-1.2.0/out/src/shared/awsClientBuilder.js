"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const vscode_1 = require("vscode");
const constants = require("./constants");
class DefaultAWSClientBuilder {
    constructor(awsContext) {
        this._awsContext = awsContext;
    }
    // centralized construction of transient AWS service clients, allowing us
    // to customize requests and/or user agent
    createAndConfigureServiceClient(awsServiceFactory, awsServiceOpts, region) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!awsServiceOpts) {
                awsServiceOpts = {};
            }
            if (!awsServiceOpts.credentials) {
                awsServiceOpts.credentials = yield this._awsContext.getCredentials();
            }
            if (!awsServiceOpts.region && region) {
                awsServiceOpts.region = region;
            }
            if (!awsServiceOpts.customUserAgent) {
                const platformName = vscode_1.env.appName.replace(/\s/g, '-');
                const pluginVersion = constants.pluginVersion;
                awsServiceOpts.customUserAgent = `AWS-Toolkit-For-VSCode/${pluginVersion} ${platformName}/${vscode_1.version}`;
            }
            return awsServiceFactory(awsServiceOpts);
        });
    }
}
exports.DefaultAWSClientBuilder = DefaultAWSClientBuilder;
//# sourceMappingURL=awsClientBuilder.js.map