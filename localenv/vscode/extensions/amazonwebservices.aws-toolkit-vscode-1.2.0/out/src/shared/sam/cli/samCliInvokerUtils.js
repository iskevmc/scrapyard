"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../logger");
function makeRequiredSamCliProcessInvokeOptions(options) {
    options = options || {};
    return {
        spawnOptions: options.spawnOptions || {},
        arguments: options.arguments || []
    };
}
exports.makeRequiredSamCliProcessInvokeOptions = makeRequiredSamCliProcessInvokeOptions;
function logAndThrowIfUnexpectedExitCode(processResult, expectedExitCode, logger = logger_1.getLogger()) {
    if (processResult.exitCode === expectedExitCode) {
        return;
    }
    logger.error(`Unexpected exitcode (${processResult.exitCode}), expecting (${expectedExitCode})`);
    logger.error(`Error: ${processResult.error}`);
    logger.error(`stderr: ${processResult.stderr}`);
    logger.error(`stdout: ${processResult.stdout}`);
    let message;
    if (processResult.error instanceof Error) {
        if (processResult.error.message) {
            message = processResult.error.message;
        }
    }
    if (!message) {
        message = processResult.stderr || processResult.stdout || 'No message available';
    }
    throw new Error(`Error with child process: ${message}`);
}
exports.logAndThrowIfUnexpectedExitCode = logAndThrowIfUnexpectedExitCode;
//# sourceMappingURL=samCliInvokerUtils.js.map