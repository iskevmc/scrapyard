"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strip_ansi_1 = require("strip-ansi");
const logger_1 = require("../logger");
function removeAnsi(text) {
    try {
        return strip_ansi_1.default(text);
    }
    catch (err) {
        logger_1.getLogger().error('Unexpected error while removing Ansi from text', err);
        // Fall back to original text so callers aren't impacted
        return text;
    }
}
exports.removeAnsi = removeAnsi;
//# sourceMappingURL=textUtilities.js.map