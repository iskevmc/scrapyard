"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const filesystem_1 = require("../../shared/filesystem");
const filesystemUtilities_1 = require("../../shared/filesystemUtilities");
class DefaultDetectLocalTemplatesContext {
    constructor() {
        this.access = filesystem_1.access;
        this.readDir = filesystemUtilities_1.readDirAsString;
        this.stat = filesystem_1.stat;
    }
}
function detectLocalTemplates({ workspaceUris, context = new DefaultDetectLocalTemplatesContext() }) {
    return __asyncGenerator(this, arguments, function* detectLocalTemplates_1() {
        var e_1, _a;
        for (const workspaceFolder of workspaceUris) {
            try {
                for (var _b = __asyncValues(getFolderCandidates(context, workspaceFolder)), _c; _c = yield __await(_b.next()), !_c.done;) {
                    const folder = _c.value;
                    yield __await(yield* __asyncDelegator(__asyncValues(detectTemplatesInFolder(context, folder))));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    });
}
exports.detectLocalTemplates = detectLocalTemplates;
function getFolderCandidates(context, uri) {
    return __asyncGenerator(this, arguments, function* getFolderCandidates_1() {
        // Search the root and first level of children only.
        yield yield __await(uri.fsPath);
        const entries = yield __await(context.readDir(uri.fsPath));
        for (const entry of entries.map(p => path.join(uri.fsPath, p))) {
            const stats = yield __await(context.stat(entry));
            if (stats.isDirectory()) {
                yield yield __await(entry);
            }
        }
    });
}
function detectTemplatesInFolder(context, folder) {
    return __asyncGenerator(this, arguments, function* detectTemplatesInFolder_1() {
        for (const templatePath of [path.join(folder, 'template.yaml'), path.join(folder, 'template.yml')]) {
            try {
                yield __await(context.access(templatePath));
                yield yield __await(vscode.Uri.file(templatePath));
            }
            catch (err) {
                // This is usually because the file doesn't exist, but could also be a permissions issue.
                // TODO: Log at most verbose (i.e. 'silly') logging level.
            }
        }
    });
}
//# sourceMappingURL=detectLocalTemplates.js.map