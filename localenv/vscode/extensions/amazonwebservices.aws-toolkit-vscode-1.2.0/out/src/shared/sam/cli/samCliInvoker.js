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
const constants_1 = require("../../constants");
const logger_1 = require("../../logger");
const settingsConfiguration_1 = require("../../settingsConfiguration");
const childProcess_1 = require("../../utilities/childProcess");
const samCliConfiguration_1 = require("./samCliConfiguration");
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
const samCliLocator_1 = require("./samCliLocator");
class DefaultSamCliProcessInvokerContext {
    constructor() {
        this.cliConfig = new samCliConfiguration_1.DefaultSamCliConfiguration(new settingsConfiguration_1.DefaultSettingsConfiguration(constants_1.extensionSettingsPrefix), new samCliLocator_1.DefaultSamCliLocationProvider());
    }
}
exports.DefaultSamCliProcessInvokerContext = DefaultSamCliProcessInvokerContext;
function resolveSamCliProcessInvokerContext(params = {}) {
    const defaults = new DefaultSamCliProcessInvokerContext();
    return {
        cliConfig: params.cliConfig || defaults.cliConfig
    };
}
exports.resolveSamCliProcessInvokerContext = resolveSamCliProcessInvokerContext;
class DefaultSamCliProcessInvoker {
    constructor(context = resolveSamCliProcessInvokerContext()) {
        this.context = context;
    }
    invoke(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const invokeOptions = samCliInvokerUtils_1.makeRequiredSamCliProcessInvokeOptions(options);
            const childProcess = new childProcess_1.ChildProcess(this.samCliLocation, invokeOptions.spawnOptions, ...invokeOptions.arguments);
            return yield childProcess.run();
        });
    }
    // Gets SAM CLI Location, throws if not found
    get samCliLocation() {
        const samCliLocation = this.context.cliConfig.getSamCliLocation();
        if (!samCliLocation) {
            const err = new Error('SAM CLI location not configured');
            logger_1.getLogger().error(err);
            throw err;
        }
        return samCliLocation;
    }
}
exports.DefaultSamCliProcessInvoker = DefaultSamCliProcessInvoker;
//# sourceMappingURL=samCliInvoker.js.map