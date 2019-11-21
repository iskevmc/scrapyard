"use strict";
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
const k8s = require("vscode-kubernetes-tools-api");
const azure_arm_resource_1 = require("azure-arm-resource");
const azure_api_utils_1 = require("./azure-api-utils");
class AKSTreeProvider {
    constructor() {
        this.onDidChangeTreeData = undefined;
    }
    getTreeItem(element) {
        if (element.nodeType === 'error') {
            return new vscode.TreeItem(element.message, vscode.TreeItemCollapsibleState.None);
        }
        else if (element.nodeType === 'subscription') {
            return new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.Collapsed);
        }
        else {
            const treeItem = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
            treeItem.contextValue = `aks.cluster ${k8s.CloudExplorerV1.SHOW_KUBECONFIG_COMMANDS_CONTEXT}`;
            return treeItem;
        }
    }
    getChildren(element) {
        if (!element) {
            return subscriptions();
        }
        else if (element.nodeType === 'subscription') {
            return clusters(element.session, element.subscription);
        }
        else {
            return [];
        }
    }
}
exports.AKSTreeProvider = AKSTreeProvider;
function subscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const azureAccount = vscode.extensions.getExtension('ms-vscode.azure-account').exports;
        if (azureAccount.status === 'LoggedIn') {
            yield azureAccount.waitForFilters();
            const subscriptionItems = Array.of();
            for (const session of azureAccount.sessions) {
                const subscriptionClient = new azure_arm_resource_1.SubscriptionClient.SubscriptionClient(session.credentials);
                const subscriptions = yield azure_api_utils_1.listAll(subscriptionClient.subscriptions, subscriptionClient.subscriptions.list());
                const matchesFilters = (azureAccount.filters && azureAccount.filters.length > 0) ?
                    (s) => azureAccount.filters.some((f) => f.subscription.subscriptionId === s.subscriptionId) :
                    (_) => true;
                subscriptionItems.push(...subscriptions
                    .filter((s) => matchesFilters(s))
                    .map((s) => asSubscriptionTreeNode(session, s)));
            }
            return subscriptionItems;
        }
        return [{ nodeType: 'error', message: 'Please log in' }];
    });
}
function asSubscriptionTreeNode(session, sub) {
    return {
        nodeType: 'subscription',
        name: sub.displayName || '',
        session,
        subscription: sub
    };
}
function clusters(session, subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const azureAccount = vscode.extensions.getExtension('ms-vscode.azure-account').exports;
        if (azureAccount.status === 'LoggedIn') {
            const client = new azure_arm_resource_1.ResourceManagementClient.ResourceManagementClient(session.credentials, subscription.subscriptionId);
            const aksClusters = yield azure_api_utils_1.listAll(client.resources, client.resources.list({ filter: "resourceType eq 'Microsoft.ContainerService/managedClusters'" }));
            return aksClusters.map((c) => toClusterTreeNode(session, subscription, c));
        }
        return [{ nodeType: 'error', message: 'Please log in' }];
    });
}
function toClusterTreeNode(session, subscription, c) {
    return {
        nodeType: 'cluster',
        name: c.name || '',
        armId: c.id || '',
        session,
        subscription
    };
}
//# sourceMappingURL=aks-tree.js.map