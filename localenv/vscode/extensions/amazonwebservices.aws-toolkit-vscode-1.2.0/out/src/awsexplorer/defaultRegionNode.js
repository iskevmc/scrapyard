"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cloudFormationNodes_1 = require("../lambda/explorer/cloudFormationNodes");
const lambdaNodes_1 = require("../lambda/explorer/lambdaNodes");
const awsTreeNodeBase_1 = require("../shared/treeview/nodes/awsTreeNodeBase");
const collectionUtils_1 = require("../shared/utilities/collectionUtils");
// Collects the regions the user has declared they want to work with;
// on expansion each region lists the functions and CloudFormation Stacks
// the user has available in that region.
class DefaultRegionNode extends awsTreeNodeBase_1.AWSTreeNodeBase {
    get regionCode() {
        return this.info.regionCode;
    }
    get regionName() {
        return this.info.regionName;
    }
    constructor(info) {
        super(info.regionName, vscode_1.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'awsRegionNode';
        this.info = info;
        this.update(info);
        this.cloudFormationNode = new cloudFormationNodes_1.DefaultCloudFormationNode(this);
        this.lambdaFunctionGroupNode = new lambdaNodes_1.DefaultLambdaFunctionGroupNode(this);
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return [this.cloudFormationNode, this.lambdaFunctionGroupNode];
        });
    }
    update(info) {
        this.info = info;
        this.label = info.regionName;
        this.tooltip = `${info.regionName} [${info.regionCode}]`;
    }
}
exports.DefaultRegionNode = DefaultRegionNode;
class RegionNodeCollection {
    constructor() {
        this.regionNodes = new Map();
    }
    updateChildren(regionDefinitions) {
        return __awaiter(this, void 0, void 0, function* () {
            const regionMap = collectionUtils_1.toMap(regionDefinitions, r => r.regionCode);
            collectionUtils_1.updateInPlace(this.regionNodes, regionMap.keys(), key => this.regionNodes.get(key).update(regionMap.get(key)), key => new DefaultRegionNode(regionMap.get(key)));
        });
    }
}
exports.RegionNodeCollection = RegionNodeCollection;
//# sourceMappingURL=defaultRegionNode.js.map