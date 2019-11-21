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
const del = require("del");
const fs = require("fs");
const filesystemUtilities_1 = require("../filesystemUtilities");
const logger_1 = require("../logger");
class DisposableFiles {
    constructor() {
        this._disposed = false;
        this._filePaths = new Set();
        this._folderPaths = new Set();
    }
    addFile(file) {
        this._filePaths.add(file);
        return this;
    }
    addFolder(file) {
        this._folderPaths.add(file);
        return this;
    }
    dispose() {
        const logger = logger_1.getLogger();
        if (!this._disposed) {
            try {
                del.sync([...this._filePaths], {
                    absolute: true,
                    force: true,
                    nobrace: false,
                    nodir: true,
                    noext: true,
                    noglobstar: true
                });
                this._folderPaths.forEach(folder => {
                    if (fs.existsSync(folder)) {
                        del.sync(folder, {
                            absolute: true,
                            force: true,
                            nobrace: false,
                            nodir: false,
                            noext: true,
                            noglobstar: true
                        });
                    }
                });
            }
            catch (err) {
                logger.error('Error during DisposableFiles dispose: ', err);
            }
            finally {
                this._disposed = true;
            }
        }
    }
}
exports.DisposableFiles = DisposableFiles;
class ExtensionDisposableFiles extends DisposableFiles {
    constructor(toolkitTempFolder) {
        super();
        this.toolkitTempFolder = toolkitTempFolder;
        this.addFolder(this.toolkitTempFolder);
    }
    static initialize(extensionContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!ExtensionDisposableFiles.INSTANCE) {
                throw new Error('ExtensionDisposableFiles already initialized');
            }
            const toolkitTempFolder = yield filesystemUtilities_1.makeTemporaryToolkitFolder();
            ExtensionDisposableFiles.INSTANCE = new ExtensionDisposableFiles(toolkitTempFolder);
            extensionContext.subscriptions.push(ExtensionDisposableFiles.INSTANCE);
        });
    }
    static getInstance() {
        if (!ExtensionDisposableFiles.INSTANCE) {
            throw new Error('ExtensionDisposableFiles not initialized');
        }
        return ExtensionDisposableFiles.INSTANCE;
    }
}
exports.ExtensionDisposableFiles = ExtensionDisposableFiles;
//# sourceMappingURL=disposableFiles.js.map