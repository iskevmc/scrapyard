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
const logger_1 = require("../../logger");
const collectionUtils_1 = require("../../utilities/collectionUtils");
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
function runSamCliDeploy(deployArguments, invoker, logger = logger_1.getLogger()) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = [
            'deploy',
            '--template-file',
            deployArguments.templateFile,
            '--stack-name',
            deployArguments.stackName,
            '--capabilities',
            'CAPABILITY_IAM',
            '--region',
            deployArguments.region,
            '--profile',
            deployArguments.profile
        ];
        if (deployArguments.parameterOverrides.size > 0) {
            const overrides = [...collectionUtils_1.map(deployArguments.parameterOverrides.entries(), ([key, value]) => `${key}=${value}`)];
            args.push('--parameter-overrides', ...overrides);
        }
        const childProcessResult = yield invoker.invoke({ arguments: args });
        samCliInvokerUtils_1.logAndThrowIfUnexpectedExitCode(childProcessResult, 0, logger);
    });
}
exports.runSamCliDeploy = runSamCliDeploy;
//# sourceMappingURL=samCliDeploy.js.map