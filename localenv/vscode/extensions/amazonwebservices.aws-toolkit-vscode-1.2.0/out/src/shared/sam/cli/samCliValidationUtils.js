"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const samCliValidationNotification_1 = require("./samCliValidationNotification");
const samCliValidator_1 = require("./samCliValidator");
function throwIfInvalid(validationResult) {
    if (!validationResult.samCliFound) {
        throw new samCliValidator_1.SamCliNotFoundError();
    }
    if (!validationResult.versionValidation) {
        // This should never happen
        throw new Error('SAM CLI detected but version validation is missing');
    }
    if (validationResult.versionValidation.validation === samCliValidator_1.SamCliVersionValidation.Valid) {
        // valid state
        return;
    }
    // Invalid version
    throw new samCliValidator_1.InvalidSamCliVersionError(validationResult.versionValidation);
}
exports.throwIfInvalid = throwIfInvalid;
function throwAndNotifyIfInvalid(validationResult) {
    try {
        throwIfInvalid(validationResult);
    }
    catch (err) {
        if (err instanceof samCliValidator_1.InvalidSamCliError) {
            // Calling code does not wait for the notification to complete
            // tslint:disable-next-line:no-floating-promises
            samCliValidationNotification_1.notifySamCliValidation(err);
        }
        throw err;
    }
}
exports.throwAndNotifyIfInvalid = throwAndNotifyIfInvalid;
//# sourceMappingURL=samCliValidationUtils.js.map