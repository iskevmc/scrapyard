/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
const vscode_1 = require("vscode");
const tfvcscmprovider_1 = require("../tfvcscmprovider");
const constants_1 = require("../../helpers/constants");
const telemetry_1 = require("../../services/telemetry");
class TfvcContentProvider {
    constructor(repository, rootPath, onTfvcChange) {
        this._disposables = [];
        this._onDidChangeEmitter = new vscode_1.EventEmitter();
        this._tfvcRepository = repository;
        this._rootPath = rootPath;
        this._disposables.push(onTfvcChange(this.fireChangeEvents, this), vscode_1.workspace.registerTextDocumentContentProvider(tfvcscmprovider_1.TfvcSCMProvider.scmScheme, this));
    }
    get onDidChange() { return this._onDidChangeEmitter.event; }
    fireChangeEvents() {
        //TODO need to understand why these events are needed and how the list of uris should be purged
        //     Currently firing these events creates an infinite loop
        //for (let uri of this.uris) {
        //    this.onDidChangeEmitter.fire(uri);
        //}
    }
    provideTextDocumentContent(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = uri.fsPath;
            const versionSpec = uri.query;
            if (versionSpec.toLowerCase() === "c0") {
                // Changeset 0 does not exist. This is most likely an Add, so just return empty contents
                return "";
            }
            // If path is a server path, we need to fix the format
            // First option is Windows, second is Mac
            if (path && (path.startsWith("\\$\\") || path.startsWith("/$/"))) {
                // convert "/$/proj/folder/file" to "$/proj/folder/file";
                path = uri.path.slice(1);
            }
            try {
                telemetry_1.Telemetry.SendEvent(this._tfvcRepository.IsExe ? constants_1.TfvcTelemetryEvents.GetFileContentExe : constants_1.TfvcTelemetryEvents.GetFileContentClc);
                const contents = yield this._tfvcRepository.GetFileContent(path, versionSpec);
                return contents;
            }
            catch (err) {
                return "";
            }
        });
    }
    dispose() {
        if (this._disposables) {
            this._disposables.forEach((d) => d.dispose());
            this._disposables = [];
        }
    }
}
exports.TfvcContentProvider = TfvcContentProvider;

//# sourceMappingURL=tfvccontentprovider.js.map
