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
const samCliConfiguration_1 = require("./samCliConfiguration");
const samCliInvoker_1 = require("./samCliInvoker");
const samCliLocator_1 = require("./samCliLocator");
const samCliValidationUtils_1 = require("./samCliValidationUtils");
const samCliValidator_1 = require("./samCliValidator");
// Sam Cli Context is lazy loaded on first request to reduce the
// amount of work done during extension activation.
let samCliContext;
let samCliContextInitialized = false;
// Components required to load Sam Cli Context
let settingsConfiguration;
function initialize(params) {
    settingsConfiguration = params.settingsConfiguration;
    samCliContext = undefined;
    samCliContextInitialized = true;
}
exports.initialize = initialize;
/**
 * Sam Cli Context is lazy loaded on first request
 */
function getSamCliContext() {
    if (!samCliContextInitialized) {
        throw new Error('SamCliContext not initialized! initialize() must be called prior to use.');
    }
    if (!samCliContext) {
        samCliContext = makeSamCliContext();
    }
    return samCliContext;
}
exports.getSamCliContext = getSamCliContext;
function getSamCliVersion(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield context.validator.detectValidSamCli();
        samCliValidationUtils_1.throwAndNotifyIfInvalid(result);
        return result.versionValidation.version;
    });
}
exports.getSamCliVersion = getSamCliVersion;
function makeSamCliContext() {
    const samCliConfiguration = new samCliConfiguration_1.DefaultSamCliConfiguration(settingsConfiguration, new samCliLocator_1.DefaultSamCliLocationProvider());
    const invokerContext = {
        cliConfig: samCliConfiguration
    };
    const invoker = new samCliInvoker_1.DefaultSamCliProcessInvoker(invokerContext);
    const validatorContext = new samCliValidator_1.DefaultSamCliValidatorContext(samCliConfiguration, invoker);
    const validator = new samCliValidator_1.DefaultSamCliValidator(validatorContext);
    const context = {
        invoker,
        validator
    };
    return context;
}
//# sourceMappingURL=samCliContext.js.map