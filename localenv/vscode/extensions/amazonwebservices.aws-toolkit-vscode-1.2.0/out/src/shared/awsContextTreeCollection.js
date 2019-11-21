"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
class AwsContextTreeCollection {
    constructor() {
        this._trees = [];
    }
    addTree(tree) {
        this._trees.push(tree);
    }
    refreshTrees() {
        this._trees.forEach(t => {
            t.refresh();
        });
    }
}
exports.AwsContextTreeCollection = AwsContextTreeCollection;
//# sourceMappingURL=awsContextTreeCollection.js.map