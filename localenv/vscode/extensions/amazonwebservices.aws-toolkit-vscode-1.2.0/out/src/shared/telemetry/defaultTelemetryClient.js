"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const os = require("os");
const vscode = require("vscode");
const constants = require("../constants");
const extensionGlobals_1 = require("../extensionGlobals");
const apiConfig = require("./service-2.json");
const telemetryEvent_1 = require("./telemetryEvent");
class DefaultTelemetryClient {
    constructor(clientId, client) {
        this.clientId = clientId;
        this.client = client;
    }
    /**
     * Returns failed events
     * @param batch batch of events
     */
    postMetrics(batch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client
                    .postMetrics({
                    AWSProduct: DefaultTelemetryClient.PRODUCT_NAME,
                    AWSProductVersion: constants.pluginVersion,
                    ClientID: this.clientId,
                    OS: os.platform(),
                    OSVersion: os.release(),
                    ParentProduct: vscode.env.appName,
                    ParentProductVersion: vscode.version,
                    MetricData: telemetryEvent_1.toMetricData(batch)
                })
                    .promise();
                console.info(`Successfully sent a telemetry batch of ${batch.length}`);
            }
            catch (err) {
                console.error(`Batch error: ${err}`);
                return batch;
            }
        });
    }
    static createDefaultClient(clientId, region, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            yield credentials.getPromise();
            return new DefaultTelemetryClient(clientId, yield extensionGlobals_1.ext.sdkClientBuilder.createAndConfigureServiceClient(opts => new aws_sdk_1.Service(opts), {
                // @ts-ignore: apiConfig is internal and not in the TS declaration file
                apiConfig: apiConfig,
                region: region,
                credentials: credentials,
                correctClockSkew: true,
                endpoint: DefaultTelemetryClient.DEFAULT_TELEMETRY_ENDPOINT
            }));
        });
    }
}
DefaultTelemetryClient.DEFAULT_IDENTITY_POOL = 'us-east-1:820fd6d1-95c0-4ca4-bffb-3f01d32da842';
DefaultTelemetryClient.DEFAULT_TELEMETRY_ENDPOINT = 'https://client-telemetry.us-east-1.amazonaws.com';
DefaultTelemetryClient.PRODUCT_NAME = 'AWS Toolkit For VS Code';
exports.DefaultTelemetryClient = DefaultTelemetryClient;
//# sourceMappingURL=defaultTelemetryClient.js.map