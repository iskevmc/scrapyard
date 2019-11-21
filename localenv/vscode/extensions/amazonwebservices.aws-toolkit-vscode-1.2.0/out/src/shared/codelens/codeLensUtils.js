"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const detectLocalTemplates_1 = require("../../lambda/local/detectLocalTemplates");
const cloudformation_1 = require("../cloudformation/cloudformation");
const logger_1 = require("../logger");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
exports.DRIVE_LETTER_REGEX = /^\w\:/;
function makeCodeLenses({ document, token, handlers, language }) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            throw new Error(`Source file ${document.uri} is external to the current workspace.`);
        }
        const lenses = [];
        for (const handler of handlers) {
            // handler.range is a RangeOrCharOffset union type. Extract vscode.Range.
            const range = handler.range instanceof vscode.Range
                ? handler.range
                : new vscode.Range(document.positionAt(handler.range.positionStart), document.positionAt(handler.range.positionEnd));
            try {
                const associatedTemplate = yield getAssociatedSamTemplate(document.uri, workspaceFolder.uri, handler.handlerName);
                const baseParams = {
                    document,
                    handlerName: handler.handlerName,
                    range,
                    workspaceFolder,
                    samTemplate: associatedTemplate,
                    language
                };
                lenses.push(makeLocalInvokeCodeLens(Object.assign({}, baseParams, { isDebug: false })));
                lenses.push(makeLocalInvokeCodeLens(Object.assign({}, baseParams, { isDebug: true })));
                lenses.push(makeConfigureCodeLens(baseParams));
            }
            catch (err) {
                logger_1.getLogger().error(`Could not generate 'configure' code lens for handler '${handler.handlerName}'`, err);
            }
        }
        return lenses;
    });
}
exports.makeCodeLenses = makeCodeLenses;
function getInvokeCmdKey(language) {
    return `aws.lambda.local.invoke.${language}`;
}
exports.getInvokeCmdKey = getInvokeCmdKey;
function makeLocalInvokeCodeLens(params) {
    const title = params.isDebug
        ? vsCodeUtils_1.localize('AWS.codelens.lambda.invoke.debug', 'Debug Locally')
        : vsCodeUtils_1.localize('AWS.codelens.lambda.invoke', 'Run Locally');
    const command = {
        arguments: [params],
        command: getInvokeCmdKey(params.language),
        title
    };
    return new vscode.CodeLens(params.range, command);
}
function makeConfigureCodeLens({ document, handlerName, range, workspaceFolder, samTemplate }) {
    // Handler will be the fully-qualified name, so we also allow '.' & ':' & '/' despite it being forbidden in handler names.
    if (/[^\w\-\.\:\/]/.test(handlerName)) {
        throw new Error(`Invalid handler name: '${handlerName}'`);
    }
    const command = {
        arguments: [workspaceFolder, handlerName, samTemplate],
        command: 'aws.configureLambda',
        title: vsCodeUtils_1.localize('AWS.command.configureLambda', 'Configure')
    };
    return new vscode.CodeLens(range, command);
}
function getMetricDatum({ isDebug, runtime }) {
    return {
        datum: Object.assign({}, telemetryUtils_1.defaultMetricDatum('invokelocal'), { metadata: new Map([['runtime', runtime], ['debug', `${isDebug}`]]) })
    };
}
exports.getMetricDatum = getMetricDatum;
function getAssociatedSamTemplate(documentUri, workspaceFolderUri, handlerName) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const templates = detectLocalTemplates_1.detectLocalTemplates({
            workspaceUris: [workspaceFolderUri]
        });
        try {
            for (var templates_1 = __asyncValues(templates), templates_1_1; templates_1_1 = yield templates_1.next(), !templates_1_1.done;) {
                const template = templates_1_1.value;
                try {
                    // Throws if template does not contain a resource for this handler.
                    yield cloudformation_1.CloudFormation.getResourceFromTemplate({
                        templatePath: template.fsPath,
                        handlerName
                    });
                }
                catch (_b) {
                    continue;
                }
                // If there are multiple matching templates, use the first one.
                return template;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (templates_1_1 && !templates_1_1.done && (_a = templates_1.return)) yield _a.call(templates_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        throw new Error(`Unable to find a sam template associated with handler '${handlerName}' in ${documentUri.fsPath}.`);
    });
}
//# sourceMappingURL=codeLensUtils.js.map