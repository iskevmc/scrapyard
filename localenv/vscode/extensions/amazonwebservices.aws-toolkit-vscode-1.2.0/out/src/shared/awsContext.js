"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Carries the current context data on events
class ContextChangeEventsArgs {
    constructor(profileName, accountId, regions) {
        this.profileName = profileName;
        this.accountId = accountId;
        this.regions = regions;
    }
}
exports.ContextChangeEventsArgs = ContextChangeEventsArgs;
class NoActiveCredentialError extends Error {
    constructor() {
        super(...arguments);
        this.message = 'No AWS profile selected';
    }
}
exports.NoActiveCredentialError = NoActiveCredentialError;
//# sourceMappingURL=awsContext.js.map