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
const fs = require("fs");
const path = require("path");
const uuidv4 = require("uuid/v4");
const filesystem = require("../filesystem");
const defaultTelemetryClient_1 = require("./defaultTelemetryClient");
const defaultTelemetryPublisher_1 = require("./defaultTelemetryPublisher");
const telemetryTypes_1 = require("./telemetryTypes");
class DefaultTelemetryService {
    constructor(context, awsContext, publisher) {
        this.context = context;
        this.awsContext = awsContext;
        // start off disabled
        // this flag will only ever be true if the user has made a decision
        this._telemetryEnabled = false;
        this._telemetryOptionExplicitlyStated = false;
        const persistPath = context.globalStoragePath;
        this.persistFilePath = path.join(persistPath, 'telemetryCache');
        if (!fs.existsSync(persistPath)) {
            fs.mkdirSync(persistPath);
        }
        this.startTime = new Date();
        this._eventQueue = DefaultTelemetryService.readEventsFromCache(this.persistFilePath);
        this._flushPeriod = DefaultTelemetryService.DEFAULT_FLUSH_PERIOD_MILLIS;
        if (publisher !== undefined) {
            this.publisher = publisher;
        }
    }
    notifyOptOutOptionMade() {
        this._telemetryOptionExplicitlyStated = true;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.record({
                namespace: telemetryTypes_1.TelemetryNamespace.Session,
                createTime: this.startTime,
                data: [
                    {
                        name: 'start',
                        value: 0,
                        unit: 'None'
                    }
                ]
            }, this.awsContext);
            yield this.startTimer();
        });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._timer !== undefined) {
                clearTimeout(this._timer);
                this._timer = undefined;
            }
            const currTime = new Date();
            this.record({
                namespace: telemetryTypes_1.TelemetryNamespace.Session,
                createTime: currTime,
                data: [
                    {
                        name: 'end',
                        value: currTime.getTime() - this.startTime.getTime(),
                        unit: 'Milliseconds'
                    }
                ]
            }, this.awsContext);
            // only write events to disk if telemetry is enabled at shutdown time
            if (this.telemetryEnabled) {
                try {
                    yield filesystem.writeFile(this.persistFilePath, JSON.stringify(this._eventQueue));
                }
                catch (_a) { }
            }
        });
    }
    get telemetryEnabled() {
        return this._telemetryEnabled;
    }
    set telemetryEnabled(value) {
        // clear the queue on explicit disable
        if (!value) {
            this.clearRecords();
        }
        this._telemetryEnabled = value;
    }
    get timer() {
        return this._timer;
    }
    set flushPeriod(period) {
        this._flushPeriod = period;
    }
    record(event, awsContext) {
        // record events only if telemetry is enabled or the user hasn't expressed a preference
        // events should only be flushed if the user has consented
        const actualAwsContext = awsContext || this.awsContext;
        const eventWithAccountMetadata = this.injectAccountMetadata(event, actualAwsContext);
        if (this.telemetryEnabled || !this._telemetryOptionExplicitlyStated) {
            this._eventQueue.push(eventWithAccountMetadata);
        }
    }
    get records() {
        return this._eventQueue;
    }
    clearRecords() {
        this._eventQueue.length = 0;
    }
    flushRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.telemetryEnabled) {
                if (this.publisher === undefined) {
                    yield this.createDefaultPublisherAndClient();
                }
                if (this.publisher !== undefined) {
                    this.publisher.enqueue(...this._eventQueue);
                    yield this.publisher.flush();
                    this.clearRecords();
                }
            }
            else if (this._telemetryOptionExplicitlyStated) {
                // explicitly clear the queue if user has disabled telemetry
                this.clearRecords();
            }
        });
    }
    startTimer() {
        return __awaiter(this, void 0, void 0, function* () {
            this._timer = setTimeout(
            // this is async so that we don't have pseudo-concurrent invocations of the callback
            () => __awaiter(this, void 0, void 0, function* () {
                yield this.flushRecords();
                this._timer.refresh();
            }), this._flushPeriod);
        });
    }
    createDefaultPublisher() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // grab our clientId and generate one if it doesn't exist
                let clientId = this.context.globalState.get(DefaultTelemetryService.TELEMETRY_CLIENT_ID_KEY);
                if (!clientId) {
                    clientId = uuidv4();
                    yield this.context.globalState.update(DefaultTelemetryService.TELEMETRY_CLIENT_ID_KEY, clientId);
                }
                // grab our Cognito identityId
                const poolId = defaultTelemetryClient_1.DefaultTelemetryClient.DEFAULT_IDENTITY_POOL;
                const identityMapJson = this.context.globalState.get(DefaultTelemetryService.TELEMETRY_COGNITO_ID_KEY, '[]');
                // Maps don't cleanly de/serialize with JSON.parse/stringify so we need to do it ourselves
                const identityMap = new Map(JSON.parse(identityMapJson));
                // convert the value to a map
                const identity = identityMap.get(poolId);
                // if we don't have an identity, get one
                if (!identity) {
                    const identityPublisherTuple = yield defaultTelemetryPublisher_1.DefaultTelemetryPublisher.fromDefaultIdentityPool(clientId);
                    // save it
                    identityMap.set(poolId, identityPublisherTuple.cognitoIdentityId);
                    yield this.context.globalState.update(DefaultTelemetryService.TELEMETRY_COGNITO_ID_KEY, JSON.stringify(Array.from(identityMap.entries())));
                    // return the publisher
                    return identityPublisherTuple.publisher;
                }
                else {
                    return defaultTelemetryPublisher_1.DefaultTelemetryPublisher.fromIdentityId(clientId, identity);
                }
            }
            catch (err) {
                console.error(`Got ${err} while initializing telemetry publisher`);
            }
        });
    }
    createDefaultPublisherAndClient() {
        return __awaiter(this, void 0, void 0, function* () {
            this.publisher = yield this.createDefaultPublisher();
            if (this.publisher !== undefined) {
                yield this.publisher.init();
            }
        });
    }
    injectAccountMetadata(event, awsContext) {
        let accountValue;
        if (event.namespace === telemetryTypes_1.TelemetryNamespace.Session) {
            // this matches JetBrains' functionality: the AWS account ID is not set on session start.
            accountValue = telemetryTypes_1.AccountStatus.NotApplicable;
        }
        else {
            const account = awsContext.getCredentialAccountId();
            if (account) {
                const accountIdRegex = /[0-9]{12}/;
                if (accountIdRegex.test(account)) {
                    // account is valid
                    accountValue = account;
                }
                else {
                    // account is not valid, we can use any non-12-digit string as our stored value to trigger this.
                    // JetBrains uses this value if you're running a sam local invoke with an invalid profile.
                    // no direct calls to production AWS should ever have this value.
                    accountValue = telemetryTypes_1.AccountStatus.Invalid;
                }
            }
            else {
                // user isn't logged in
                accountValue = telemetryTypes_1.AccountStatus.NotSet;
            }
        }
        // event has data
        if (event.data) {
            for (const datum of event.data) {
                if (datum.metadata) {
                    datum.metadata.set(telemetryTypes_1.ACCOUNT_METADATA_KEY, accountValue);
                }
                else {
                    datum.metadata = new Map([[telemetryTypes_1.ACCOUNT_METADATA_KEY, accountValue]]);
                }
            }
        }
        else {
            // event doesn't have data, give it dummy data with the account info
            // this shouldn't happen
            const data = [
                {
                    name: 'noData',
                    value: 0,
                    metadata: new Map([[telemetryTypes_1.ACCOUNT_METADATA_KEY, accountValue]])
                }
            ];
            event.data = data;
        }
        return event;
    }
    static readEventsFromCache(cachePath) {
        try {
            const events = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
            events.forEach((element) => {
                element.createTime = new Date(element.createTime);
            });
            return events;
        }
        catch (_a) {
            return [];
        }
    }
}
DefaultTelemetryService.TELEMETRY_COGNITO_ID_KEY = 'telemetryId';
DefaultTelemetryService.TELEMETRY_CLIENT_ID_KEY = 'telemetryClientId';
DefaultTelemetryService.DEFAULT_FLUSH_PERIOD_MILLIS = 1000 * 60 * 5; // 5 minutes in milliseconds
exports.DefaultTelemetryService = DefaultTelemetryService;
//# sourceMappingURL=defaultTelemetryService.js.map