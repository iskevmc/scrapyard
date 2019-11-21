"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const defaultCloudFormationClient_1 = require("./defaultCloudFormationClient");
const defaultEcsClient_1 = require("./defaultEcsClient");
const defaultLambdaClient_1 = require("./defaultLambdaClient");
const defaultStsClient_1 = require("./defaultStsClient");
class DefaultToolkitClientBuilder {
    createCloudFormationClient(regionCode) {
        return new defaultCloudFormationClient_1.DefaultCloudFormationClient(regionCode);
    }
    createEcsClient(regionCode) {
        return new defaultEcsClient_1.DefaultEcsClient(regionCode);
    }
    createLambdaClient(regionCode) {
        return new defaultLambdaClient_1.DefaultLambdaClient(regionCode);
    }
    createStsClient(regionCode, credentials) {
        return new defaultStsClient_1.DefaultStsClient(regionCode, credentials);
    }
}
exports.DefaultToolkitClientBuilder = DefaultToolkitClientBuilder;
//# sourceMappingURL=defaultToolkitClientBuilder.js.map