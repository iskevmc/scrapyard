"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const awsTreeNodeBase_1 = require("./awsTreeNodeBase");
// Used as a child node when an exception occurs while querying AWS resources
class ErrorNode extends awsTreeNodeBase_1.AWSTreeNodeBase {
    constructor(parent, error, label) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.error = error;
        this.tooltip = `${error.name}:${error.message}`;
        this.contextValue = 'awsErrorNode';
    }
}
exports.ErrorNode = ErrorNode;
//# sourceMappingURL=errorNode.js.map