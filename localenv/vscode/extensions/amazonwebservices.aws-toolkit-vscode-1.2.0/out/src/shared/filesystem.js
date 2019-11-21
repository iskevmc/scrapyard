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
const _path = require("path");
const util_1 = require("util");
// functions
exports.access = util_1.promisify(fs.access);
const _mkdir = util_1.promisify(fs.mkdir);
function mkdir(path, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield _mkdir(path, options);
        }
        catch (err) {
            // mkdir calls with recurse do not work as expected when called through electron.
            // See: https://github.com/nodejs/node/issues/24698#issuecomment-486405542 for info.
            // TODO : When VS Code uses Electron 5+, remove this custom mkdir implementation.
            const error = err;
            if (error.code && error.code === 'ENOENT') {
                if (options && typeof options === 'object' && options.recursive && typeof path === 'string') {
                    yield mkdirRecursive(path, options);
                    return;
                }
            }
            throw err;
        }
    });
}
exports.mkdir = mkdir;
function mkdirRecursive(path, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const parent = _path.dirname(path);
        if (parent !== path) {
            yield mkdir(parent, options);
        }
        yield mkdir(path, options);
    });
}
exports.mkdtemp = util_1.promisify(fs.mkdtemp);
exports.readFile = util_1.promisify(fs.readFile);
exports.readdir = util_1.promisify(fs.readdir);
exports.rename = util_1.promisify(fs.rename);
exports.stat = util_1.promisify(fs.stat);
exports.unlink = util_1.promisify(fs.unlink);
exports.writeFile = util_1.promisify(fs.writeFile);
//# sourceMappingURL=filesystem.js.map