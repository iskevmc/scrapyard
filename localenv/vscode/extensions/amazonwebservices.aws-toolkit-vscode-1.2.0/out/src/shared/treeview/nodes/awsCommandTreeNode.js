"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const awsTreeNodeBase_1 = require("./awsTreeNodeBase");
class AWSCommandTreeNode extends awsTreeNodeBase_1.AWSTreeNodeBase {
    constructor(parent, label, commandId, commandArguments, tooltip) {
        super(label, vscode_1.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.command = {
            title: label || '',
            command: commandId,
            arguments: commandArguments
        };
        this.tooltip = tooltip;
        this.contextValue = 'awsCommandNode';
    }
}
exports.AWSCommandTreeNode = AWSCommandTreeNode;
//# sourceMappingURL=awsCommandTreeNode.js.map