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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const extensionGlobals_1 = require("../extensionGlobals");
require("../utilities/asyncIteratorShim");
class DefaultCloudFormationClient {
    constructor(regionCode) {
        this.regionCode = regionCode;
    }
    deleteStack(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.createSdkClient();
            yield client
                .deleteStack({
                StackName: name
            })
                .promise();
        });
    }
    listStacks(statusFilter = ['CREATE_COMPLETE', 'UPDATE_COMPLETE']) {
        return __asyncGenerator(this, arguments, function* listStacks_1() {
            const client = yield __await(this.createSdkClient());
            const request = {
                StackStatusFilter: statusFilter
            };
            do {
                const response = yield __await(client.listStacks(request).promise());
                if (!!response.StackSummaries) {
                    yield __await(yield* __asyncDelegator(__asyncValues(response.StackSummaries)));
                }
                request.NextToken = response.NextToken;
            } while (!!request.NextToken);
        });
    }
    describeStackResources(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.createSdkClient();
            return yield client
                .describeStackResources({
                StackName: name
            })
                .promise();
        });
    }
    createSdkClient() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield extensionGlobals_1.ext.sdkClientBuilder.createAndConfigureServiceClient(options => new aws_sdk_1.CloudFormation(options), undefined, this.regionCode);
        });
    }
}
exports.DefaultCloudFormationClient = DefaultCloudFormationClient;
//# sourceMappingURL=defaultCloudFormationClient.js.map