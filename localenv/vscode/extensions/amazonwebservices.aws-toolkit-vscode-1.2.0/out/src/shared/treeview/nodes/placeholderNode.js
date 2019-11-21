"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const awsTreeNodeBase_1 = require("./awsTreeNodeBase");
// Can be used to add a child node in an explorer when a region has no resources
// relevant to the explorer type.
class PlaceholderNode extends awsTreeNodeBase_1.AWSTreeNodeBase {
    constructor(parent, label, tooltip) {
        super(label);
        this.parent = parent;
        this.tooltip = tooltip;
    }
}
exports.PlaceholderNode = PlaceholderNode;
//# sourceMappingURL=placeholderNode.js.map