// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const opener = require("opener");
const vscode = require("vscode");
const k8s = require("vscode-kubernetes-tools-api");
const TelemetryEvent_1 = require("../logger/TelemetryEvent");
class KubernetesPanelViewModel {
    constructor(context, _logger) {
        this._logger = _logger;
        context.subscriptions.push(vscode.commands.registerCommand(`azds.toggleDevSpacesEnablement`, (target) => __awaiter(this, void 0, void 0, function* () {
            yield this.onToggleDevSpacesEnablementAsync(target);
        })));
    }
    onToggleDevSpacesEnablementAsync(target) {
        return __awaiter(this, void 0, void 0, function* () {
            const cloudExplorer = yield k8s.extension.cloudExplorer.v1;
            if (!cloudExplorer.available) {
                return;
            }
            const commandTarget = cloudExplorer.api.resolveCommandTarget(target);
            if (commandTarget == null) {
                this._logger.warning(`The toggleDevSpacesEnablement command has been triggered from outside of the Cloud Explorer`);
                vscode.window.showWarningMessage(`This command can only be invoked through the AKS Clouds view. Open the Kubernetes panel and select an AKS cluster in the Clouds view to enable/disable Dev Spaces on it.`);
                return;
            }
            if (commandTarget.cloudName != `Azure` || commandTarget.nodeType != `resource`) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`The toggleDevSpacesEnablement command has been triggered in UI from an unexpected node`), /*properties*/ {
                    cloudName: commandTarget.cloudName,
                    nodeType: commandTarget.nodeType
                });
                return;
            }
            const clusterTreeNode = commandTarget.cloudResource;
            if (clusterTreeNode.nodeType != `cluster`) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.UnexpectedError, new Error(`The toggleDevSpacesEnablement command has been triggered in UI for an unexpected cloudResource`), /*properties*/ {
                    nodeType: clusterTreeNode.nodeType
                });
                return;
            }
            const clusterDevSpacesBladeUrl = `${clusterTreeNode.session.environment.portalUrl}/#@${clusterTreeNode.session.tenantId}/resource${clusterTreeNode.armId}/aksDevSpaces`;
            opener(clusterDevSpacesBladeUrl);
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzurePortal_DevSpacesBladeRedirection);
        });
    }
}
exports.KubernetesPanelViewModel = KubernetesPanelViewModel;
//# sourceMappingURL=KubernetesPanelViewModel.js.map