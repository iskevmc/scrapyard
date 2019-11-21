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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cloudformation_1 = require("../../shared/cloudformation/cloudformation");
const filesystemUtilities_1 = require("../../shared/filesystemUtilities");
const detectLocalTemplates_1 = require("./detectLocalTemplates");
function detectLocalLambdas(workspaceFolders = vscode.workspace.workspaceFolders) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!workspaceFolders) {
            return [];
        }
        return (yield Promise.all(workspaceFolders.map(detectLambdasFromWorkspaceFolder))).reduce((accumulator, current) => {
            accumulator.push(...current);
            return accumulator;
        }, []);
    });
}
exports.detectLocalLambdas = detectLocalLambdas;
function detectLambdasFromWorkspaceFolder(workspaceFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        try {
            for (var _b = __asyncValues(detectLocalTemplates_1.detectLocalTemplates({ workspaceUris: [workspaceFolder.uri] })), _c; _c = yield _b.next(), !_c.done;) {
                const templateUri = _c.value;
                result.push(...(yield detectLambdasFromTemplate(workspaceFolder, templateUri.fsPath)));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    });
}
function detectLambdasFromTemplate(workspaceFolder, templatePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield filesystemUtilities_1.fileExists(templatePath))) {
            return [];
        }
        const template = yield cloudformation_1.CloudFormation.load(templatePath);
        const resources = template.Resources;
        if (!resources) {
            return [];
        }
        return Object.getOwnPropertyNames(resources)
            .filter(key => resources[key].Type === cloudformation_1.CloudFormation.SERVERLESS_FUNCTION_TYPE)
            .map(key => ({
            lambda: key,
            workspaceFolder,
            templatePath,
            templateGlobals: template.Globals,
            handler: getHandler(resources[key]),
            resource: resources[key]
        }));
    });
}
function getHandler(resource) {
    if (resource.Properties && resource.Properties.Handler) {
        return resource.Properties.Handler;
    }
    return undefined;
}
//# sourceMappingURL=detectLocalLambdas.js.map