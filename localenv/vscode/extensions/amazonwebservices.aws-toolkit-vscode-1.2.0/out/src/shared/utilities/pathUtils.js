"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _path = require("path");
function getNormalizedRelativePath(from, to) {
    return normalizeSeparator(_path.relative(from, to));
}
exports.getNormalizedRelativePath = getNormalizedRelativePath;
function normalizeSeparator(path) {
    return path.split(_path.sep).join(_path.posix.sep);
}
exports.normalizeSeparator = normalizeSeparator;
function dirnameWithTrailingSlash(path) {
    let dirname = _path.dirname(path);
    if (!dirname.endsWith(_path.sep)) {
        dirname += _path.sep;
    }
    return dirname;
}
exports.dirnameWithTrailingSlash = dirnameWithTrailingSlash;
//# sourceMappingURL=pathUtils.js.map