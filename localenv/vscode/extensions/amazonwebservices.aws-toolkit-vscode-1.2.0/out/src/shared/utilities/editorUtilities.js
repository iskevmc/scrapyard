"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const settingsConfiguration_1 = require("../settingsConfiguration");
const DEFAULT_TAB_SIZE = 4;
function getTabSizeSetting() {
    return new settingsConfiguration_1.DefaultSettingsConfiguration('editor').readSetting('tabSize') || DEFAULT_TAB_SIZE;
}
exports.getTabSizeSetting = getTabSizeSetting;
//# sourceMappingURL=editorUtilities.js.map