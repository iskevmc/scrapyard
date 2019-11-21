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
const vscode = require("vscode");
const cloudformation_1 = require("../../shared/cloudformation/cloudformation");
const pathUtils_1 = require("../../shared/utilities/pathUtils");
const templates_1 = require("../config/templates");
function getParameters(templateUri, context = { loadTemplate: cloudformation_1.CloudFormation.load }) {
    return __awaiter(this, void 0, void 0, function* () {
        const template = yield context.loadTemplate(templateUri.fsPath);
        if (!template.Parameters) {
            return new Map();
        }
        const result = new Map();
        for (const name of Object.getOwnPropertyNames(template.Parameters)) {
            const parameter = template.Parameters[name];
            result.set(name, {
                // Explicitly compare with undefined, as a valid default value may be falsy.
                required: parameter.Default === undefined
            });
        }
        return result;
    });
}
exports.getParameters = getParameters;
function getParameterNames(templateUri, context = { loadTemplate: cloudformation_1.CloudFormation.load }) {
    return __awaiter(this, void 0, void 0, function* () {
        return [...(yield getParameters(templateUri, context)).keys()];
    });
}
exports.getParameterNames = getParameterNames;
class DefaultGetOverriddenParametersContext {
    constructor() {
        this.getWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
        this.loadTemplatesConfig = templates_1.load;
    }
}
exports.DefaultGetOverriddenParametersContext = DefaultGetOverriddenParametersContext;
function getOverriddenParameters(templateUri, context = new DefaultGetOverriddenParametersContext()) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = context.getWorkspaceFolder(templateUri);
        if (!workspaceFolder) {
            // This should never happen.
            throw new Error(`The template ${templateUri.fsPath} is not in the workspace`);
        }
        const relativeTemplatePath = pathUtils_1.getNormalizedRelativePath(workspaceFolder.uri.fsPath, templateUri.fsPath);
        const templatesConfig = yield context.loadTemplatesConfig(workspaceFolder.uri.fsPath);
        const templateConfig = templatesConfig.templates[relativeTemplatePath];
        if (!templateConfig || !templateConfig.parameterOverrides) {
            return undefined;
        }
        const result = new Map();
        for (const name of Object.getOwnPropertyNames(templateConfig.parameterOverrides)) {
            result.set(name, templateConfig.parameterOverrides[name]);
        }
        return result;
    });
}
exports.getOverriddenParameters = getOverriddenParameters;
//# sourceMappingURL=parameterUtils.js.map