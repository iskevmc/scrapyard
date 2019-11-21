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
const fs = require("fs");
const os = require("os");
const path = require("path");
const util_1 = require("util");
const filesystem_1 = require("./filesystem");
const DEFAULT_ENCODING = 'utf8';
exports.tempDirPath = path.join(
// https://github.com/aws/aws-toolkit-vscode/issues/240
os.type() === 'Darwin' ? '/tmp' : os.tmpdir(), 'aws-toolkit-vscode');
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield filesystem_1.access(filePath);
        }
        catch (err) {
            return false;
        }
        return true;
    });
}
exports.fileExists = fileExists;
exports.readDirAsString = (pathLike, options = { encoding: DEFAULT_ENCODING }) => __awaiter(this, void 0, void 0, function* () {
    return filesystem_1.readdir(pathLike, options);
});
/**
 * @description Wraps readFileAsync and resolves the Buffer to a string for convenience
 *
 * @param filePath filename to read
 * @param encoding Optional - file encoding
 *
 * @returns the contents of the file as a string
 */
exports.readFileAsString = (pathLike, options = { encoding: DEFAULT_ENCODING }) => __awaiter(this, void 0, void 0, function* () {
    return filesystem_1.readFile(pathLike, options);
});
/**
 * Searches for fileToFind, starting in searchFolder and working up the parent folder chain.
 * If file is not found, undefined is returned.
 */
function findFileInParentPaths(searchFolder, fileToFind) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetFilePath = path.join(searchFolder, fileToFind);
        if (yield fileExists(targetFilePath)) {
            return targetFilePath;
        }
        const parentPath = path.dirname(searchFolder);
        if (!parentPath || parentPath === searchFolder) {
            return undefined;
        }
        return findFileInParentPaths(parentPath, fileToFind);
    });
}
exports.findFileInParentPaths = findFileInParentPaths;
const mkdtemp = util_1.promisify(fs.mkdtemp);
exports.makeTemporaryToolkitFolder = (...relativePathParts) => __awaiter(this, void 0, void 0, function* () {
    const _relativePathParts = relativePathParts || [];
    if (_relativePathParts.length === 0) {
        _relativePathParts.push('vsctk');
    }
    const tmpPath = path.join(exports.tempDirPath, ..._relativePathParts);
    const tmpPathParent = path.dirname(tmpPath);
    // fs.makeTemporaryToolkitFolder fails on OSX if prefix contains path separator
    // so we must create intermediate dirs if needed
    if (!(yield fileExists(tmpPathParent))) {
        yield filesystem_1.mkdir(tmpPathParent, { recursive: true });
    }
    return mkdtemp(tmpPath);
});
//# sourceMappingURL=filesystemUtilities.js.map