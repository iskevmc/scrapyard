"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const extensionGlobals_1 = require("../extensionGlobals");
/**
 * Creates a QuickInputButton with a predefined help button (dark and light theme compatible)
 * Images are only loaded after extension.ts loads; this should happen on any user-facing extension usage.
 * button will exist regardless of image loading (UI tests will still see this)
 * @param tooltip Optional tooltip for button
 */
function createHelpButton(tooltip) {
    return {
        iconPath: {
            light: vscode_1.Uri.file(extensionGlobals_1.ext.iconPaths.light.help),
            dark: vscode_1.Uri.file(extensionGlobals_1.ext.iconPaths.dark.help)
        },
        tooltip
    };
}
exports.createHelpButton = createHelpButton;
//# sourceMappingURL=buttons.js.map