"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const vscode_1 = require("vscode");
const extensionGlobals_1 = require("../../shared/extensionGlobals");
const awsTreeNodeBase_1 = require("../../shared/treeview/nodes/awsTreeNodeBase");
class FunctionNodeBase extends awsTreeNodeBase_1.AWSTreeNodeBase {
    constructor(configuration) {
        super('');
        this.configuration = configuration;
        this.update(configuration);
        this.iconPath = {
            dark: vscode_1.Uri.file(extensionGlobals_1.ext.iconPaths.dark.lambda),
            light: vscode_1.Uri.file(extensionGlobals_1.ext.iconPaths.light.lambda)
        };
    }
    update(configuration) {
        this.configuration = configuration;
        this.label = this.configuration.FunctionName || '';
        this.tooltip = `${this.configuration.FunctionName}${os.EOL}${this.configuration.FunctionArn}`;
    }
    get functionName() {
        return this.configuration.FunctionName || '';
    }
}
exports.FunctionNodeBase = FunctionNodeBase;
//# sourceMappingURL=functionNode.js.map