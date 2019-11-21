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
const vscode = require("vscode");
const ConnectManager = require("./ConnectManager");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
class ConnectWizard {
    constructor(kubectlUtility, connectManager, logger) {
        this._mode = IsolationMode.None;
        this._ports = [];
        this._kubectl = kubectlUtility;
        this._connectManager = connectManager;
        this._logger = logger;
    }
    runWizard(wizardType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (wizardType === ConnectManager.WizardType.Service) {
                return yield this.runServiceWizard();
            }
            else if (wizardType === ConnectManager.WizardType.Pod) {
                return yield this.runPodWizard();
            }
            else if (wizardType === ConnectManager.WizardType.New) {
                return yield this.runNewWizard();
            }
            else {
                throw new Error("Unknown wizard type " + wizardType);
            }
        });
    }
    runServiceWizard() {
        return __awaiter(this, void 0, void 0, function* () {
            this._services = yield this._kubectl.getServices();
            this._namespaces = yield this._kubectl.getNamespaces();
            yield this.showServiceList();
        });
    }
    runPodWizard() {
        return __awaiter(this, void 0, void 0, function* () {
            this._namespaces = yield this._kubectl.getNamespaces();
            this._pods = yield this._kubectl.getPods("");
            yield this.showPodList();
        });
    }
    runNewWizard() {
        return __awaiter(this, void 0, void 0, function* () {
            this._namespaces = yield this._kubectl.getNamespaces();
            yield this.showNamespaceList();
        });
    }
    showServiceList() {
        return __awaiter(this, void 0, void 0, function* () {
            const picker = vscode.window.createQuickPick();
            picker.placeholder = "Choose a service to redirect to your machine";
            var serviceItems = this._services.map(s => ({
                label: s.name,
                description: this.getNamespacePath(s.namespace),
                detailObject: s
            }));
            serviceItems = serviceItems.sort((s1, s2) => s1.label + " " + s1.description < s2.label + " " + s2.description ? -1 : 1);
            picker.items = serviceItems;
            picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                this._service = selection[0].detailObject;
                yield this.showServiceModeList();
            }));
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_ServiceList, { count: serviceItems.length.toString() });
            picker.onDidHide(() => picker.dispose());
            picker.show();
        });
    }
    showPodList() {
        return __awaiter(this, void 0, void 0, function* () {
            const picker = vscode.window.createQuickPick();
            picker.placeholder = "Choose a pod to redirect to your machine";
            var podItems = this._pods.map(p => ({
                label: p.name,
                description: this.getPodDescription(p),
                detailObject: p
            }));
            picker.items = podItems.sort((p1, p2) => {
                var pod1 = p1.detailObject;
                var pod2 = p2.detailObject;
                if (pod1.status === pod2.status) {
                    return p1.label + " " + p1.description < p2.label + " " + p2.description ? -1 : 1;
                }
                else {
                    return pod1.status === "running" ? -1 : 1;
                }
            });
            picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                this._pod = selection[0].detailObject;
                yield this.showPodModeList();
            }));
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_PodList, { count: podItems.length.toString() });
            picker.onDidHide(() => picker.dispose());
            picker.show();
        });
    }
    showServiceModeList() {
        return __awaiter(this, void 0, void 0, function* () {
            var ns = this.getNamespaceByName(this._service.namespace);
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_ServiceModeList, { isDevSpace: ns.isDevSpace.toString(), depth: ns.depth.toString() });
            const picker = vscode.window.createQuickPick();
            picker.placeholder = "Select a mode";
            picker.items = [{ label: 'Replace: Redirect all traffic to my machine by replacing service "' + this._service.name + '"' },
                { label: 'Clone: Create an isolated copy of service "' + this._service.name + '" in a child dev space' }];
            picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                this._pod = yield this.resolvePodFromService(this._service);
                if (!this._pod) {
                    return;
                }
                var m = selection[0].label;
                if (m && m.startsWith("Replace:")) {
                    this._mode = IsolationMode.Replace;
                    yield this.showContainerNameList();
                }
                else {
                    if (!ns.isDevSpace) {
                        this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_ServiceModeListCloneNoDevSpace);
                        this.reportError('Namespace "' + ns.name + '" is not a Dev Space. Please enable Dev Space and restart your workload here first.');
                        picker.hide();
                        return;
                    }
                    else if (ns.depth > 2) {
                        this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_ServiceModeListCloneGrandChildSpace);
                        this.reportError('Namespace "' + ns.name + '" is already 2 levels deep, clone is not supported.');
                        picker.hide();
                        return;
                    }
                    this._mode = IsolationMode.Clone;
                    yield this.showCloneNamespaceList(false);
                }
            }));
            picker.onDidHide(() => picker.dispose());
            picker.show();
        });
    }
    showPodModeList() {
        return __awaiter(this, void 0, void 0, function* () {
            const picker = vscode.window.createQuickPick();
            picker.placeholder = "Select a mode";
            var displayPodName = this._pod.name.length > 24 ? this._pod.name.substring(0, 24) + "..." : this._pod.name;
            picker.items = [{ label: 'Replace: Redirect all traffic to my machine by replacing pod "' + displayPodName + '"' },
                { label: 'Clone: Create an isolated copy of pod "' + displayPodName + '"' }];
            picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                var mode = selection[0].label;
                if (mode && mode.startsWith("Replace:")) {
                    this._mode = IsolationMode.Replace;
                    yield this.showContainerNameList();
                }
                else {
                    this._mode = IsolationMode.Clone;
                    yield this.showCloneNamespaceList(true);
                }
            }));
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_PodModeList);
            picker.onDidHide(() => picker.dispose());
            picker.show();
        });
    }
    showCloneNamespaceList(showCurrent) {
        return __awaiter(this, void 0, void 0, function* () {
            var currentSpace = this._pod != null ? this._pod.namespace : this._service.namespace;
            var ns = this._namespaces.find(ns => ns.name === currentSpace);
            if (!ns) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.Connect_Error, new Error("No space selected"));
                this.reportError("No space selected!");
                return;
            }
            if (!ns.isDevSpace && !showCurrent) {
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_CloneNoDevSpace);
                this.reportError("The current namespace '" + currentSpace + "' is not a Dev Space. Please enable Dev Spaces on this namespace and restart your pods.");
                return;
            }
            let spaceItems = [];
            spaceItems.push({ label: 'Create new child spaces under "' + currentSpace + '"...', detail: "" });
            if (showCurrent) {
                spaceItems.push({ label: ns.path });
            }
            this._namespaces.forEach(s => {
                if (s.isDevSpace && s.path.startsWith(ns.path + '/')) {
                    if (s.depth == ns.depth + 1) {
                        // TODO: only support one level child space clone right now. Should be able to support 
                        // any levels.
                        spaceItems.push({ label: s.path });
                    }
                }
            });
            if (spaceItems.length === 1) {
                yield this.createNewSpace(ns);
            }
            else {
                const picker = vscode.window.createQuickPick();
                picker.placeholder = showCurrent ? "Select a dev space to clone into" : "Select a child dev space to clone into";
                picker.items = spaceItems;
                picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                    var cloneSpace = selection[0].label;
                    if (cloneSpace.startsWith("Create new")) {
                        if (!ns.isDevSpace) {
                            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_CloneNoDevSpace);
                            this.reportError("The current namespace '" + currentSpace + "' is not a Dev Space. Please enable Dev Spaces on this namespace and restart your pods.");
                            picker.hide();
                            return;
                        }
                        yield this.createNewSpace(ns);
                    }
                    else {
                        this._cloneSpace = this._namespaces.find(s => s.path === cloneSpace);
                        yield this.showContainerNameList();
                    }
                }));
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_NamespaceList, { count: spaceItems.length.toString() });
                picker.onDidHide(() => picker.dispose());
                picker.show();
            }
        });
    }
    createNewSpace(currentSpace) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showInputBox({
                value: "Enter the name of your child dev space",
                prompt: 'Press Enter to confirm your input or Escape to cancel',
                valueSelection: [0, 100],
                validateInput: text => {
                    return this.validateSpaceName(text);
                }
            });
            if (!result) {
                return;
            }
            try {
                vscode.window.showInformationMessage("Creating child dev space... ");
                yield this._kubectl.createSpace(result, currentSpace);
                this._logger.trace("DevSpace namespace created.");
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.Connect_Error, error);
                this.reportError(error.toString());
                return;
            }
            this._cloneSpace = {
                name: result,
                isDevSpace: true,
                path: currentSpace.path + '/' + result,
                depth: currentSpace.depth + 1,
                parentSpace: currentSpace.name
            };
            yield this.showContainerNameList();
        });
    }
    validateSpaceName(name) {
        var s = this._namespaces.find(n => n.name === name);
        if (s) {
            return "Space already exists";
        }
        // Check a name against the naming rules for spaces. Space names must be between 3 and 63 characters long, consist of lowercase alphanumeric characters
        // and hyphens only, begin and end with a lowercase alphanumeric character, and contain at least one lowercase alphabetic character.  A regex corresponding to an
        // invalid space name filter would be: ^(?=.*[a-zA-Z])(^[a-zA-Z0-9])([a-zA-Z0-9-]*)([a-zA-Z0-9]$)
        if (!name || name.length < 3 || name.length > 63) {
            return "Space name must be between 3 and 63 characters long";
        }
        if (!name.match("^([a-z0-9-]*)$")) {
            return "Space names must consist of lowercase alphanumeric characters and hyphens only";
        }
        if (!name.match("^[a-z0-9].*[a-z0-9]$")) {
            return "Space name must begin and end with a lowercase alphanumeric character";
        }
        if (!name.match("(?=.*[a-z])")) {
            return "Space name must contain at least one lowercase alphabetic character";
        }
        return;
    }
    showContainerNameList() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pod.containers.length > 1) {
                const quickPick = vscode.window.createQuickPick();
                quickPick.placeholder = "Select a container";
                quickPick.items = this._pod.containers.map(c => ({
                    label: c,
                    detailObject: c
                }));
                quickPick.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                    let container = selection[0].detailObject;
                    if (container) {
                        this._containerName = container;
                        yield this.showPortSelection();
                    }
                }));
                quickPick.onDidHide(() => quickPick.dispose());
                quickPick.show();
            }
            else {
                this._containerName = this._pod.containers[0];
                yield this.showPortSelection();
            }
        });
    }
    showNamespaceList() {
        return __awaiter(this, void 0, void 0, function* () {
            const picker = vscode.window.createQuickPick();
            picker.placeholder = "Select a namespace to work in";
            picker.items = this._namespaces.map(ns => ({
                label: ns.isDevSpace ? ns.path : ns.name,
                detailObject: ns
            })).sort((ns1, ns2) => ns1.label < ns2.label ? -1 : 1);
            picker.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                this._addToNamespace = selection[0].detailObject;
                this.startConnectCommand();
            }));
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.Connect_ContainerNameList, { count: picker.items.length.toString() });
            picker.onDidHide(() => picker.dispose());
            picker.show();
        });
    }
    showPortSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showInputBox({
                prompt: 'Press Enter to confirm your input or Escape to cancel',
                placeHolder: this._service ? "Enter your local service port such as 80" : "Enter your local port such as 80, or 0 if traffic redirection is not needed",
                validateInput: text => {
                    if (!text || text.length === 0) {
                        return "";
                    }
                    let valid = true;
                    let portParts = text.split(/,| /);
                    portParts.forEach(p => {
                        const n = Number(p);
                        if (isNaN(n) || n < 0 || n >= 65536) {
                            valid = false;
                        }
                    });
                    if (!valid) {
                        return "must be valid port numbers";
                    }
                    return null;
                }
            });
            if (!result) {
                return;
            }
            this._ports = [];
            let portParts = result.split(/,| /);
            portParts.forEach(p => {
                const n = Number(p);
                if (!isNaN(n) && n >= 0 && n < 65536) {
                    this._ports.push(n);
                }
            });
            this.startConnectCommand();
        });
    }
    resolvePodFromService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!service.selector || service.selector.size === 0) {
                this._logger.warning("Service has no selector.");
                this.reportError("Service '" + service.name + "' does not have any selector defined.");
                return;
            }
            if (!this._pods) {
                this._pods = yield this._kubectl.getPods(service.namespace);
            }
            var pod = this._pods.find((p) => {
                if (p.namespace !== service.namespace || !p.labels) {
                    return false;
                }
                var matches = true;
                for (let key in service.selector) {
                    let value = service.selector[key];
                    if (!this.isPodMatchSelector(p, key, value)) {
                        matches = false;
                        break;
                    }
                }
                return matches;
            });
            if (!pod) {
                this._logger.warning("Service is not connected to a running pod.");
                this.reportError("Service '" + service.name + "' is not connected to a running pod.");
                return;
            }
            return pod;
        });
    }
    isPodMatchSelector(p, key, value) {
        if (!p.labels) {
            return false;
        }
        return p.labels[key] === value;
    }
    getNamespaceByName(name) {
        return this._namespaces.find(n => n.name == name);
    }
    getNamespacePath(name) {
        var ns = this.getNamespaceByName(name);
        if (ns) {
            return ns.path;
        }
        else {
            return name;
        }
    }
    getPodDescription(pod) {
        var namespacePath = this.getNamespacePath(pod.namespace);
        if (pod.status === "terminated") {
            return namespacePath + "  (terminated)";
        }
        else {
            return namespacePath;
        }
    }
    startConnectCommand() {
        if (this._addToNamespace) {
            this._connectManager.runConnectCommandForNewContainer(this._addToNamespace);
        }
        else if (this._pod) {
            if (this._mode === IsolationMode.Replace) {
                this._connectManager.runConnectCommandForReplaceContainer(this.getNamespaceByName(this._pod.namespace), this._pod, this._containerName, this._ports);
            }
            else if (this._mode === IsolationMode.Clone) {
                this._connectManager.runConnectCommandForCloneContainer(this.getNamespaceByName(this._pod.namespace), this._pod, this._containerName, this._ports, this._cloneSpace);
            }
        }
        else {
            this.reportError("Invalid selection");
        }
    }
    reportError(message) {
        vscode.window.showErrorMessage(message);
    }
}
exports.ConnectWizard = ConnectWizard;
var IsolationMode;
(function (IsolationMode) {
    IsolationMode[IsolationMode["None"] = 0] = "None";
    IsolationMode[IsolationMode["Replace"] = 1] = "Replace";
    IsolationMode[IsolationMode["Clone"] = 2] = "Clone";
})(IsolationMode || (IsolationMode = {}));
//# sourceMappingURL=ConnectWizard.js.map