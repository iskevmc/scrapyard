"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const vscode = require("vscode");
const deleteCloudFormation_1 = require("../lambda/commands/deleteCloudFormation");
const deleteLambda_1 = require("../lambda/commands/deleteLambda");
const invokeLambda_1 = require("../lambda/commands/invokeLambda");
const configureLocalLambda_1 = require("../lambda/local/configureLocalLambda");
const extensionGlobals_1 = require("../shared/extensionGlobals");
const telemetryTypes_1 = require("../shared/telemetry/telemetryTypes");
const telemetryUtils_1 = require("../shared/telemetry/telemetryUtils");
const awsCommandTreeNode_1 = require("../shared/treeview/nodes/awsCommandTreeNode");
const showErrorDetails_1 = require("../shared/treeview/webviews/showErrorDetails");
const collectionUtils_1 = require("../shared/utilities/collectionUtils");
const vsCodeUtils_1 = require("../shared/utilities/vsCodeUtils");
const defaultRegionNode_1 = require("./defaultRegionNode");
class AwsExplorer {
    constructor(awsContext, awsContextTrees, regionProvider, resourceFetcher, lambdaOutputChannel = vscode.window.createOutputChannel('AWS Lambda')) {
        this.awsContext = awsContext;
        this.awsContextTrees = awsContextTrees;
        this.regionProvider = regionProvider;
        this.resourceFetcher = resourceFetcher;
        this.lambdaOutputChannel = lambdaOutputChannel;
        this.viewProviderId = 'aws.explorer';
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.regionNodes = new Map();
    }
    initialize(context) {
        telemetryUtils_1.registerCommand({
            command: 'aws.refreshAwsExplorer',
            callback: () => __awaiter(this, void 0, void 0, function* () { return this.refresh(); })
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.deleteLambda',
            callback: (node) => __awaiter(this, void 0, void 0, function* () {
                return yield deleteLambda_1.deleteLambda({
                    deleteParams: { functionName: node.configuration.FunctionName || '' },
                    lambdaClient: extensionGlobals_1.ext.toolkitClientBuilder.createLambdaClient(node.regionCode),
                    outputChannel: this.lambdaOutputChannel,
                    onRefresh: () => this.refresh(node.parent)
                });
            }),
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Lambda,
                name: 'delete'
            }
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.deleteCloudFormation',
            callback: (node) => __awaiter(this, void 0, void 0, function* () { return yield deleteCloudFormation_1.deleteCloudFormation(() => this.refresh(node.parent), node); }),
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Cloudformation,
                name: 'delete'
            }
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.showErrorDetails',
            callback: (node) => __awaiter(this, void 0, void 0, function* () { return yield showErrorDetails_1.showErrorDetails(node); })
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.invokeLambda',
            callback: (node) => __awaiter(this, void 0, void 0, function* () {
                return yield invokeLambda_1.invokeLambda({
                    awsContext: this.awsContext,
                    functionNode: node,
                    outputChannel: this.lambdaOutputChannel,
                    resourceFetcher: this.resourceFetcher
                });
            }),
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Lambda,
                name: 'invokeremote'
            }
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.configureLambda',
            callback: configureLocalLambda_1.configureLocalLambda,
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Lambda,
                name: 'configurelocal'
            }
        });
        telemetryUtils_1.registerCommand({
            command: 'aws.refreshAwsExplorerNode',
            callback: (awsExplorer, element) => __awaiter(this, void 0, void 0, function* () {
                awsExplorer._onDidChangeTreeData.fire(element);
            })
        });
        this.awsContextTrees.addTree(this);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!element) {
                try {
                    return yield element.getChildren();
                }
                catch (error) {
                    return [
                        new awsCommandTreeNode_1.AWSCommandTreeNode(element, vsCodeUtils_1.localize('AWS.explorerNode.lambda.retry', 'Unable to load Lambda Functions, click here to retry'), 'aws.refreshAwsExplorerNode', [this, element])
                    ];
                }
            }
            const profileName = this.awsContext.getCredentialProfileName();
            if (!profileName) {
                return [
                    new awsCommandTreeNode_1.AWSCommandTreeNode(undefined, vsCodeUtils_1.localize('AWS.explorerNode.signIn', 'Connect to AWS...'), 'aws.login', undefined, vsCodeUtils_1.localize('AWS.explorerNode.signIn.tooltip', 'Connect to AWS using a credential profile'))
                ];
            }
            const explorerRegionCodes = yield this.awsContext.getExplorerRegions();
            const regionMap = collectionUtils_1.toMap(yield this.regionProvider.getRegionData(), r => r.regionCode);
            collectionUtils_1.updateInPlace(this.regionNodes, collectionUtils_1.intersection(regionMap.keys(), explorerRegionCodes), key => this.regionNodes.get(key).update(regionMap.get(key)), key => new defaultRegionNode_1.DefaultRegionNode(regionMap.get(key)));
            if (this.regionNodes.size > 0) {
                return [...this.regionNodes.values()];
            }
            else {
                return [
                    new awsCommandTreeNode_1.AWSCommandTreeNode(undefined, vsCodeUtils_1.localize('AWS.explorerNode.addRegion', 'Click to add a region to view functions...'), 'aws.showRegion', undefined, vsCodeUtils_1.localize('AWS.explorerNode.addRegion.tooltip', 'Configure a region to show available functions'))
                ];
            }
        });
    }
    refresh(node) {
        this._onDidChangeTreeData.fire(node);
    }
}
exports.AwsExplorer = AwsExplorer;
//# sourceMappingURL=awsExplorer.js.map