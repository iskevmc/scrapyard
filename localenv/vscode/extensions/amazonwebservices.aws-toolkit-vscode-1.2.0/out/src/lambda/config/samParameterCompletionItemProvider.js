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
const path = require("path");
const vscode = require("vscode");
const cloudformation_1 = require("../../shared/cloudformation/cloudformation");
const logger_1 = require("../../shared/logger");
const symbolUtilities_1 = require("../../shared/utilities/symbolUtilities");
const parameterUtils_1 = require("../utilities/parameterUtils");
/**
 * Provides completion items (i.e. intellisense) for parameter names when editting `.aws/templates.json`,
 * by reading the list of parameters from the associated SAM template.
 *
 * This class may be modified in the future to also provide suggestions for parameter values, etc.
 */
class SamParameterCompletionItemProvider {
    constructor(context = {
        executeCommand: vscode.commands.executeCommand,
        logger: logger_1.getLogger(),
        getWorkspaceFolder: vscode.workspace.getWorkspaceFolder,
        loadTemplate: cloudformation_1.CloudFormation.load
    }) {
        this.context = context;
    }
    provideCompletionItems(document, position, token, completionContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolder = this.context.getWorkspaceFolder(document.uri);
            if (!workspaceFolder) {
                // This should never happen.
                this.context.logger.warn(`Cannot provide completion items for '${document.uri.fsPath}' beacuse it is not in the workspace.`);
                return [];
            }
            const symbols = yield symbolUtilities_1.loadSymbols({
                uri: document.uri,
                context: this.context,
                maxRetries: 0
            });
            if (!symbols) {
                return [];
            }
            const templateUri = yield getTemplateUri({
                workspaceUri: workspaceFolder.uri,
                symbols,
                position
            });
            if (!templateUri) {
                return [];
            }
            const prefix = this.getWordAt(document, position);
            const templateParameterNames = yield parameterUtils_1.getParameterNames(templateUri, this.context);
            return templateParameterNames
                .filter(name => !prefix || name.startsWith(prefix))
                .map(name => {
                const completionItem = {
                    kind: vscode.CompletionItemKind.Reference,
                    label: name,
                    insertText: name,
                    range: new vscode.Range(position, position)
                };
                return completionItem;
            });
        });
    }
    getWordAt(document, position) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        // The JSON spec requires the use of double-quotes rather than single-quotes.
        return document
            .getText(wordRange)
            .replace(/^\"/, '') // strip leading quote character
            .replace(/\"$/, ''); // strip trailing quote character
    }
}
exports.SamParameterCompletionItemProvider = SamParameterCompletionItemProvider;
function getTemplateUri({ workspaceUri, symbols, position }) {
    return __awaiter(this, void 0, void 0, function* () {
        const templates = symbols.find(symbol => symbol.name === 'templates');
        if (!templates) {
            return undefined;
        }
        const template = templates.children.find(child => child.range.contains(position));
        if (!template) {
            return undefined;
        }
        // Only offer suggestions inside the 'parameterOverrides' property.
        const parameterOverrides = template.children.find(child => child.name === 'parameterOverrides');
        if (!parameterOverrides) {
            return undefined;
        }
        const childrenRange = yield symbolUtilities_1.getChildrenRange(parameterOverrides);
        if (!childrenRange.contains(position)) {
            return undefined;
        }
        // Ensure that position is at a parameter name, not a value.
        if (parameterOverrides.children) {
            const override = parameterOverrides.children.find(child => child.range.contains(position));
            if (override) {
                if (!override.selectionRange.contains(position)) {
                    return undefined;
                }
            }
        }
        return vscode.Uri.file(path.join(workspaceUri.fsPath, template.name));
    });
}
//# sourceMappingURL=samParameterCompletionItemProvider.js.map