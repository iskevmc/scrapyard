"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Namespace for common variables used globally in the extension.
 * All variables here must be initialized in the activate() method of extension.ts
 */
var ext;
(function (ext) {
    let iconPaths;
    (function (iconPaths) {
        iconPaths.dark = makeIconPathsObject();
        iconPaths.light = makeIconPathsObject();
    })(iconPaths = ext.iconPaths || (ext.iconPaths = {}));
})(ext = exports.ext || (exports.ext = {}));
function makeIconPathsObject() {
    return {
        help: '',
        cloudFormation: '',
        lambda: ''
    };
}
//# sourceMappingURL=extensionGlobals.js.map