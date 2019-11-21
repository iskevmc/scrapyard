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
const semver = require("semver");
const filesystem_1 = require("../../filesystem");
const samCliInfo_1 = require("./samCliInfo");
exports.MINIMUM_SAM_CLI_VERSION_INCLUSIVE = '0.16.0';
exports.MAXIMUM_SAM_CLI_VERSION_EXCLUSIVE = '0.40.0';
exports.SAM_CLI_VERSION_0_30 = '0.30.0';
// Errors
class InvalidSamCliError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.InvalidSamCliError = InvalidSamCliError;
class SamCliNotFoundError extends InvalidSamCliError {
    constructor() {
        super('SAM CLI was not found');
    }
}
exports.SamCliNotFoundError = SamCliNotFoundError;
class InvalidSamCliVersionError extends InvalidSamCliError {
    constructor(versionValidation) {
        super('SAM CLI has an invalid version');
        this.versionValidation = versionValidation;
    }
}
exports.InvalidSamCliVersionError = InvalidSamCliVersionError;
// Validation
var SamCliVersionValidation;
(function (SamCliVersionValidation) {
    SamCliVersionValidation["Valid"] = "Valid";
    SamCliVersionValidation["VersionTooLow"] = "VersionTooLow";
    SamCliVersionValidation["VersionTooHigh"] = "VersionTooHigh";
    SamCliVersionValidation["VersionNotParseable"] = "VersionNotParseable";
})(SamCliVersionValidation = exports.SamCliVersionValidation || (exports.SamCliVersionValidation = {}));
class DefaultSamCliValidator {
    constructor(context) {
        this.context = context;
    }
    detectValidSamCli() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
                samCliFound: false
            };
            const samCliLocation = this.context.samCliLocation;
            if (samCliLocation) {
                result.samCliFound = true;
                result.versionValidation = yield this.getVersionValidatorResult();
            }
            return result;
        });
    }
    // This method is public for testing purposes
    getVersionValidatorResult() {
        return __awaiter(this, void 0, void 0, function* () {
            const samCliId = yield this.context.getSamCliExecutableId();
            if (!this.isSamCliVersionCached(samCliId)) {
                this.cachedSamInfoResponse = yield this.context.getSamCliInfo();
                this.cachedSamCliVersionId = samCliId;
            }
            const version = this.cachedSamInfoResponse.version;
            return {
                version,
                validation: DefaultSamCliValidator.validateSamCliVersion(version)
            };
        });
    }
    isSamCliVersionCached(samCliVersionId) {
        if (!this.cachedSamInfoResponse) {
            return false;
        }
        if (!this.cachedSamCliVersionId) {
            return false;
        }
        return this.cachedSamCliVersionId === samCliVersionId;
    }
    static validateSamCliVersion(version) {
        if (!version) {
            return SamCliVersionValidation.VersionNotParseable;
        }
        if (!semver.valid(version)) {
            return SamCliVersionValidation.VersionNotParseable;
        }
        if (semver.lt(version, exports.MINIMUM_SAM_CLI_VERSION_INCLUSIVE)) {
            return SamCliVersionValidation.VersionTooLow;
        }
        if (semver.gte(version, exports.MAXIMUM_SAM_CLI_VERSION_EXCLUSIVE)) {
            return SamCliVersionValidation.VersionTooHigh;
        }
        return SamCliVersionValidation.Valid;
    }
}
exports.DefaultSamCliValidator = DefaultSamCliValidator;
class DefaultSamCliValidatorContext {
    constructor(samCliConfiguration, invoker) {
        this.samCliConfiguration = samCliConfiguration;
        this.invoker = invoker;
    }
    get samCliLocation() {
        return this.samCliConfiguration.getSamCliLocation();
    }
    getSamCliExecutableId() {
        return __awaiter(this, void 0, void 0, function* () {
            // Function should never get called if there is no SAM CLI
            if (!this.samCliLocation) {
                throw new Error('SAM CLI does not exist');
            }
            // The modification timestamp of SAM CLI is used as the "distinct executable id"
            const stats = yield filesystem_1.stat(this.samCliLocation);
            return stats.mtime.valueOf().toString();
        });
    }
    getSamCliInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const samCliInfo = new samCliInfo_1.SamCliInfoInvocation(this.invoker);
            return yield samCliInfo.execute();
        });
    }
}
exports.DefaultSamCliValidatorContext = DefaultSamCliValidatorContext;
//# sourceMappingURL=samCliValidator.js.map