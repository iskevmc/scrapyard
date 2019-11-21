"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
class WebResourceLocation {
    constructor(uri) {
        this._uri = uri;
    }
    getLocationUri() {
        return this._uri;
    }
}
exports.WebResourceLocation = WebResourceLocation;
class FileResourceLocation {
    constructor(filename) {
        this._filename = filename;
    }
    getLocationUri() {
        return this._filename;
    }
}
exports.FileResourceLocation = FileResourceLocation;
//# sourceMappingURL=resourceLocation.js.map