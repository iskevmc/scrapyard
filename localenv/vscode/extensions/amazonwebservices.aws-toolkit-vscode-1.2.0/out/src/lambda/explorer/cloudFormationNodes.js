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
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const os = require("os");
const vscode = require("vscode");
const extensionGlobals_1 = require("../../shared/extensionGlobals");
const awsTreeErrorHandlerNode_1 = require("../../shared/treeview/nodes/awsTreeErrorHandlerNode");
const placeholderNode_1 = require("../../shared/treeview/nodes/placeholderNode");
const collectionUtils_1 = require("../../shared/utilities/collectionUtils");
const utils_1 = require("../utils");
const functionNode_1 = require("./functionNode");
class DefaultCloudFormationNode extends awsTreeErrorHandlerNode_1.AWSTreeErrorHandlerNode {
    constructor(parent) {
        super('CloudFormation', vscode.TreeItemCollapsibleState.Collapsed);
        this.parent = parent;
        this.stackNodes = new Map();
    }
    get regionCode() {
        return this.parent.regionCode;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleErrorProneOperation(() => __awaiter(this, void 0, void 0, function* () { return this.updateChildren(); }), localize('AWS.explorerNode.cloudFormation.error', 'Error loading CloudFormation resources'));
            return !!this.errorNode
                ? [this.errorNode]
                : [...this.stackNodes.values()].sort((nodeA, nodeB) => nodeA.stackName.localeCompare(nodeB.stackName));
        });
    }
    updateChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = extensionGlobals_1.ext.toolkitClientBuilder.createCloudFormationClient(this.regionCode);
            const stacks = yield collectionUtils_1.toMapAsync(utils_1.listCloudFormationStacks(client), stack => stack.StackId);
            collectionUtils_1.updateInPlace(this.stackNodes, stacks.keys(), key => this.stackNodes.get(key).update(stacks.get(key)), key => new DefaultCloudFormationStackNode(this, stacks.get(key)));
        });
    }
}
exports.DefaultCloudFormationNode = DefaultCloudFormationNode;
class DefaultCloudFormationStackNode extends awsTreeErrorHandlerNode_1.AWSTreeErrorHandlerNode {
    constructor(parent, stackSummary) {
        super('', vscode.TreeItemCollapsibleState.Collapsed);
        this.parent = parent;
        this.stackSummary = stackSummary;
        this.update(stackSummary);
        this.contextValue = 'awsCloudFormationNode';
        this.functionNodes = new Map();
        this.iconPath = {
            dark: vscode.Uri.file(extensionGlobals_1.ext.iconPaths.dark.cloudFormation),
            light: vscode.Uri.file(extensionGlobals_1.ext.iconPaths.light.cloudFormation)
        };
    }
    get regionCode() {
        return this.parent.regionCode;
    }
    get stackId() {
        return this.stackSummary.StackId;
    }
    get stackName() {
        return this.stackSummary.StackName;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleErrorProneOperation(() => __awaiter(this, void 0, void 0, function* () { return this.updateChildren(); }), localize('AWS.explorerNode.cloudFormation.error', 'Error loading CloudFormation resources'));
            if (!!this.errorNode) {
                return [this.errorNode];
            }
            if (this.functionNodes.size > 0) {
                return [...this.functionNodes.values()];
            }
            return [
                new placeholderNode_1.PlaceholderNode(this, localize('AWS.explorerNode.cloudFormation.noFunctions', '[no functions in this CloudFormation]'))
            ];
        });
    }
    update(stackSummary) {
        this.stackSummary = stackSummary;
        this.label = `${this.stackName} [${stackSummary.StackStatus}]`;
        this.tooltip = `${this.stackName}${os.EOL}${this.stackId}`;
    }
    updateChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const resources = yield this.resolveLambdaResources();
            const client = extensionGlobals_1.ext.toolkitClientBuilder.createLambdaClient(this.regionCode);
            const functions = collectionUtils_1.toMap(yield collectionUtils_1.toArrayAsync(utils_1.listLambdaFunctions(client)), functionInfo => functionInfo.FunctionName);
            collectionUtils_1.updateInPlace(this.functionNodes, collectionUtils_1.intersection(resources, functions.keys()), key => this.functionNodes.get(key).update(functions.get(key)), key => new DefaultCloudFormationFunctionNode(this, functions.get(key)));
        });
    }
    resolveLambdaResources() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = extensionGlobals_1.ext.toolkitClientBuilder.createCloudFormationClient(this.regionCode);
            const response = yield client.describeStackResources(this.stackSummary.StackName);
            if (response.StackResources) {
                return response.StackResources.filter(it => it.ResourceType.includes('Lambda::Function')).map(it => it.PhysicalResourceId || 'none');
            }
            return [];
        });
    }
}
exports.DefaultCloudFormationStackNode = DefaultCloudFormationStackNode;
class DefaultCloudFormationFunctionNode extends functionNode_1.FunctionNodeBase {
    constructor(parent, configuration) {
        super(configuration);
        this.parent = parent;
        this.contextValue = 'awsCloudFormationFunctionNode';
    }
    get regionCode() {
        return this.parent.regionCode;
    }
}
exports.DefaultCloudFormationFunctionNode = DefaultCloudFormationFunctionNode;
//# sourceMappingURL=cloudFormationNodes.js.map