"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
let toolkitLogger;
/**
 * Gets the logger if it has been initialized
 */
function getLogger() {
    if (!toolkitLogger) {
        throw new Error('Logger not initialized. Extension code should call initialize() from shared/logger/activation, test code should call setLogger().');
    }
    return toolkitLogger;
}
exports.getLogger = getLogger;
/**
 * Sets (or clears) the logger that is accessible to code.
 * The Extension is expected to call this only once.
 * Tests should call this to set up a logger prior to executing code that accesses a logger.
 */
function setLogger(logger) {
    toolkitLogger = logger;
}
exports.setLogger = setLogger;
//# sourceMappingURL=logger.js.map