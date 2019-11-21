"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class AWSTreeNodeBase extends vscode_1.TreeItem {
    constructor(label, collapsibleState) {
        super(label, collapsibleState);
    }
    getChildren() {
        return Promise.resolve([]);
    }
}
exports.AWSTreeNodeBase = AWSTreeNodeBase;
//# sourceMappingURL=awsTreeNodeBase.js.map