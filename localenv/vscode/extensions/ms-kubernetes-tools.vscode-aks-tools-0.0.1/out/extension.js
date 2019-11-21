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
const azcs = require("azure-arm-containerservice"); // deprecated, but @azure/arm-containerservice doesn't play nicely with AzureAccount, so...
const aks_tree_1 = require("./aks-tree");
const azure_api_utils_1 = require("./azure-api-utils");
const explorer = new aks_tree_1.AKSTreeProvider();
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const cloudExplorer = yield k8s.extension.cloudExplorer.v1;
        if (cloudExplorer.available) {
            cloudExplorer.api.registerCloudProvider({
                cloudName: "Azure",
                treeDataProvider: explorer,
                getKubeconfigYaml: getClusterKubeconfig
            });
        }
        else {
            vscode.window.showWarningMessage(cloudExplorer.reason);
        }
    });
}
exports.activate = activate;
function getClusterKubeconfig(target) {
    return __awaiter(this, void 0, void 0, function* () {
        const { resourceGroupName, name } = azure_api_utils_1.parseResource(target.armId);
        if (!resourceGroupName || !name) {
            vscode.window.showErrorMessage(`Invalid ARM id ${target.armId}`);
            return;
        }
        const client = new azcs.ContainerServiceClient(target.session.credentials, target.subscription.subscriptionId); // TODO: safely
        try {
            const accessProfile = yield client.managedClusters.getAccessProfile(resourceGroupName, name, 'clusterUser');
            const kubeconfig = accessProfile.kubeConfig.toString(); // TODO: safely
            return kubeconfig;
        }
        catch (e) {
            vscode.window.showErrorMessage(`Can't get kubeconfig: ${e}`);
            return undefined;
        }
    });
}
//# sourceMappingURL=extension.js.map