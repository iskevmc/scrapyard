"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const extensionGlobals_1 = require("./extensionGlobals");
const ACTIVATION_LAUNCH_PATH_KEY = 'ACTIVATION_LAUNCH_PATH_KEY';
/**
 * Manages a setting to represent what path should be opened on extension activation.
 */
class ActivationLaunchPath {
    getLaunchPath() {
        return this.extensionContext.globalState.get(ACTIVATION_LAUNCH_PATH_KEY);
    }
    setLaunchPath(path) {
        this.extensionContext.globalState.update(ACTIVATION_LAUNCH_PATH_KEY, path);
    }
    clearLaunchPath() {
        this.extensionContext.globalState.update(ACTIVATION_LAUNCH_PATH_KEY, undefined);
    }
    get extensionContext() {
        return extensionGlobals_1.ext.context;
    }
}
exports.ActivationLaunchPath = ActivationLaunchPath;
//# sourceMappingURL=activationLaunchPath.js.map