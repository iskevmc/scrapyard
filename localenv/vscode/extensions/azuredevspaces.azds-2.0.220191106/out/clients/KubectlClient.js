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
const fs = require("fs");
const child_process_1 = require("child_process");
const path = require("path");
const os = require("os");
const vscode = require("vscode");
const util = require("util");
const TelemetryEvent_1 = require("../logger/TelemetryEvent");
const existsAsync = util.promisify(fs.exists);
class KubectlClient {
    constructor(logger) {
        this._logger = logger;
    }
    getNamespaces() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            const kubectlOutput = yield this.runKubectlCommandAsync(["get", "namespaces", "-o", "json"]);
            JSON.parse(kubectlOutput).items.forEach((ns) => {
                if (!this.isSystemNamespace(ns.metadata.name)) {
                    result.push({
                        name: ns.metadata.name,
                        isDevSpace: this.isDevSpaceNamespace(ns),
                        parentSpace: this.getParentDevSpace(ns),
                        path: ns.metadata.name,
                        depth: 0
                    });
                }
            });
            result.forEach((ns) => {
                let path = ns.path;
                let depth = 1;
                let parent = ns.parentSpace;
                const recursionGuard = [];
                recursionGuard.push(ns);
                while (parent.length > 0) {
                    var p = result.find((s) => s.name === parent);
                    if (recursionGuard.indexOf(p) >= 0) {
                        break; // parent chain is currupted?
                    }
                    if (p) {
                        path = parent + '/' + path;
                        parent = p.parentSpace;
                        depth++;
                        recursionGuard.push(p);
                    }
                    else {
                        break;
                    }
                }
                ns.path = path;
                ns.depth = depth;
            });
            return result;
        });
    }
    getServices(space = null) {
        return __awaiter(this, void 0, void 0, function* () {
            let output;
            if (space && space.length > 0) {
                output = yield this.runKubectlCommandAsync(["get", "services", "-n", space, "-o", "json"]);
            }
            else {
                output = yield this.runKubectlCommandAsync(["get", "services", "--all-namespaces", "-o", "json"]);
            }
            let result = [];
            JSON.parse(output).items.forEach((s) => {
                if (!this.isSystemNamespace(s.metadata.namespace) && s.spec.selector) {
                    if (s.metadata.labels && s.metadata.labels["azds.io/connect-clone"] === "true") {
                        // skip any azds-connect cloned service.
                        return;
                    }
                    result.push({
                        name: s.metadata.name,
                        namespace: s.metadata.namespace,
                        selector: s.spec.selector
                    });
                }
            });
            return result;
        });
    }
    getPods(space) {
        return __awaiter(this, void 0, void 0, function* () {
            let output;
            if (space && space.length > 0) {
                output = yield this.runKubectlCommandAsync(["get", "pods", "-n", space, "-o", "json"]);
            }
            else {
                output = yield this.runKubectlCommandAsync(["get", "pods", "--all-namespaces", "-o", "json"]);
            }
            let result = [];
            JSON.parse(output).items.forEach((p) => {
                if (!this.isSystemNamespace(p.metadata.namespace)) {
                    if (p.metadata.labels && p.metadata.labels["azds.io/connect-clone"] === "true") {
                        // skip any azds-connect cloned pod.
                        return;
                    }
                    if (!p.status || p.status.phase === "Pending" || p.status.phase === "Unknown") {
                        // skip pending / unknown pods
                        return;
                    }
                    if (p.spec.containers.length > 0) {
                        var status = "running";
                        if (p.status.phase === "Succeeded" || p.status.phase === "Failed") {
                            status = "terminated";
                        }
                        let pod = {
                            namespace: p.metadata.namespace,
                            name: p.metadata.name,
                            containers: [],
                            labels: p.metadata.labels,
                            status: status
                        };
                        for (var c of p.spec.containers) {
                            if (c.name !== 'devspaces-proxy' && c.name !== 'istio-proxy') {
                                pod.containers.push(c.name);
                            }
                        }
                        if (pod.containers.length > 0) {
                            result.push(pod);
                        }
                    }
                }
            });
            return result;
        });
    }
    createSpace(spaceName, parentSpace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!parentSpace.isDevSpace) {
                throw new Error("Parent space must be a dev space!");
            }
            if (parentSpace.depth > 2) {
                throw new Error("Max space depth reached!");
            }
            yield this.runKubectlCommandAsync(["create", "namespace", spaceName]);
            yield this.runKubectlCommandAsync(["label", "namespace", spaceName, "azds.io/space=true", "azds.io/parent-space=" + parentSpace.name]);
        });
    }
    // This gets all the childs and grandchilds of a space
    getChildSpaces(space) {
        return __awaiter(this, void 0, void 0, function* () {
            let childSpaces = [];
            if (!space.isDevSpace) {
                return childSpaces;
            }
            var namespaces = yield this.getNamespaces();
            namespaces.forEach(ns => {
                if (ns.path.startsWith(space.name + "/")) {
                    childSpaces.push(ns);
                }
            });
            return childSpaces;
        });
    }
    isSystemNamespace(name) {
        return name === "azds" || name === "kube-public" || name === "kube-system";
    }
    isDevSpaceNamespace(ns) {
        if (ns.metadata.labels && ns.metadata.labels['azds.io/space']) {
            var v = ns.metadata.labels['azds.io/space'];
            if (v === "true") {
                return true;
            }
        }
        return false;
    }
    getParentDevSpace(ns) {
        if (ns.metadata.labels && ns.metadata.labels['azds.io/parent-space']) {
            var p = ns.metadata.labels['azds.io/parent-space'];
            if (p !== undefined) {
                return p;
            }
        }
        return "";
    }
    reportError(errorMessage) {
        vscode.window.showErrorMessage(errorMessage);
    }
    runKubectlCommandAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var kubectlPath = "kubectl";
            if (process.platform === "win32") {
                const winPath = path.join(process.env.ProgramFiles, "Microsoft SDKs\\Azure\\Azure Dev Spaces CLI\\kubectl\\win\\kubectl.exe");
                if (yield existsAsync(winPath)) {
                    kubectlPath = winPath;
                }
            }
            else if (process.platform === "darwin") {
                const osxPath = `${os.homedir()}/lib/azds-cli/kubectl/osx/kubectl`;
                if (yield existsAsync(osxPath)) {
                    kubectlPath = osxPath;
                }
            }
            return yield this.runCommandAsync(kubectlPath, args);
        });
    }
    runCommandAsync(command, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.KubectlClient_Command, { command: command });
            return new Promise((resolve, reject) => {
                const options = { detached: false };
                const process = child_process_1.spawn(command, args, options);
                let outputData = ``;
                process.stdout.on(`data`, (data) => {
                    outputData += data.toString();
                });
                let errorData = ``;
                process.stderr.on(`data`, (data) => {
                    errorData += data.toString();
                });
                process.on(`error`, (error) => {
                    const errorMessage = `Failed to execute: ${command} ${args.join(` `)}. Please ensure 'kubectl' is installed and in your PATH. Error: ${error.message}`;
                    errorData += errorMessage;
                    this._logger.trace(TelemetryEvent_1.TelemetryEvent.KubectlClient_Command_Error, { command: command, error: errorMessage });
                    this.reportError(errorData);
                    reject(new Error(errorData));
                });
                process.on(`exit`, (code) => {
                    if (code !== 0) {
                        const errorMessage = `Running ${command} ${args.join(` `)} failed with exit code ${code}. ${errorData}`;
                        this._logger.trace(TelemetryEvent_1.TelemetryEvent.KubectlClient_Command_Error, { command: command, exitCode: code.toString(), error: errorMessage });
                        this.reportError(errorMessage);
                        reject(new Error(errorData));
                    }
                    else {
                        resolve(outputData);
                    }
                });
            });
        });
    }
}
exports.KubectlClient = KubectlClient;
//# sourceMappingURL=KubectlClient.js.map