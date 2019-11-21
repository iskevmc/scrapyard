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
const defaultTelemetryClient_1 = require("./defaultTelemetryClient");
class DefaultTelemetryPublisher {
    constructor(clientId, region, credentials, telemetryClient) {
        this.clientId = clientId;
        this.region = region;
        this.credentials = credentials;
        this.telemetryClient = telemetryClient;
        this._eventQueue = [];
    }
    enqueue(...events) {
        this._eventQueue.push(...events);
    }
    get queue() {
        return this._eventQueue;
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.telemetryClient === undefined) {
                yield this.init();
            }
            while (this._eventQueue.length !== 0) {
                const batch = this._eventQueue.splice(0, DefaultTelemetryPublisher.DEFAULT_MAX_BATCH_SIZE);
                if (this.telemetryClient === undefined) {
                    return;
                }
                const failedBatch = yield this.telemetryClient.postMetrics(batch);
                if (failedBatch !== undefined) {
                    this.enqueue(...failedBatch);
                    // retry next time
                    return;
                }
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.telemetryClient = yield defaultTelemetryClient_1.DefaultTelemetryClient.createDefaultClient(this.clientId, this.region, this.credentials);
        });
    }
    static fromDefaultIdentityPool(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fromIdentityPool(clientId, defaultTelemetryClient_1.DefaultTelemetryClient.DEFAULT_IDENTITY_POOL);
        });
    }
    /**
     * Create a telemetry publisher from the given clientId and identityPool
     * @return A tuple containing the new identityId and the telemetry publisher
     */
    static fromIdentityPool(clientId, identityPool) {
        return __awaiter(this, void 0, void 0, function* () {
            const region = identityPool.split(':')[0];
            try {
                const res = yield new aws_sdk_1.CognitoIdentity({
                    region: region
                })
                    .getId({
                    IdentityPoolId: identityPool
                })
                    .promise();
                const err = res.$response.error;
                if (err) {
                    return Promise.reject(`SDK error: ${err}`);
                }
                const identityId = res.IdentityId;
                if (!identityId) {
                    throw new Error('identityId returned by Cognito call was null');
                }
                return {
                    cognitoIdentityId: identityId,
                    publisher: DefaultTelemetryPublisher.fromIdentityId(clientId, identityId)
                };
            }
            catch (err) {
                return Promise.reject(`Failed to get an Cognito identity for telemetry: ${err}`);
            }
        });
    }
    static fromIdentityId(clientId, identityId) {
        const region = identityId.split(':')[0];
        const cognitoCredentials = new aws_sdk_1.CognitoIdentityCredentials({ IdentityId: identityId }, { region: region });
        return new this(clientId, region, cognitoCredentials);
    }
}
DefaultTelemetryPublisher.DEFAULT_MAX_BATCH_SIZE = 20;
exports.DefaultTelemetryPublisher = DefaultTelemetryPublisher;
//# sourceMappingURL=defaultTelemetryPublisher.js.map