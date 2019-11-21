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
const logger_1 = require("../../shared/logger");
const pathUtils_1 = require("../../shared/utilities/pathUtils");
const symbolUtilities_1 = require("../../shared/utilities/symbolUtilities");
const textDocumentUtilities_1 = require("../../shared/utilities/textDocumentUtilities");
const templates_1 = require("./templates");
class DefaultConfigureParameterOverridesContext {
    constructor() {
        this.getWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
        this.showErrorMessage = vscode.window.showErrorMessage;
        this.showTextDocument = vscode.window.showTextDocument;
        this.executeCommand = vscode.commands.executeCommand;
        this.logger = logger_1.getLogger();
    }
}
function configureParameterOverrides({ templateUri, requiredParameterNames = [] }, context = new DefaultConfigureParameterOverridesContext()) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = context.getWorkspaceFolder(templateUri);
        if (!workspaceFolder) {
            throw new Error(`Template ${templateUri.fsPath} is not in the workspace`);
        }
        const configPath = templates_1.getTemplatesConfigPath(workspaceFolder.uri.fsPath);
        yield templates_1.ensureTemplatesConfigFileExists(configPath);
        const editor = yield context.showTextDocument(vscode.Uri.file(configPath));
        const relativeTemplatePath = pathUtils_1.getNormalizedRelativePath(workspaceFolder.uri.fsPath, templateUri.fsPath);
        try {
            let populator = new templates_1.TemplatesConfigPopulator(editor.document.getText(), {
                formattingOptions: {
                    insertSpaces: true,
                    tabSize: textDocumentUtilities_1.getTabSize(editor),
                    eol: editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n'
                }
            });
            for (const parameterName of requiredParameterNames) {
                populator = populator.ensureTemplateParameterOverrideExists(relativeTemplatePath, parameterName);
            }
            const { json, isDirty } = populator.getResults();
            if (isDirty) {
                yield editor.edit(eb => {
                    eb.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), json);
                });
                // We don't save the doc. The user has the option to revert changes, or make further edits.
            }
            yield context.showTextDocument(editor.document, {
                selection: yield getParameterOverridesRange({
                    editor,
                    relativeTemplatePath
                }, context)
            });
        }
        catch (err) {
            if (err instanceof templates_1.TemplatesConfigFieldTypeError) {
                templates_1.showTemplatesConfigurationError(err, context.showErrorMessage);
            }
            else {
                throw err;
            }
        }
    });
}
exports.configureParameterOverrides = configureParameterOverrides;
function getParameterOverridesRange({ editor, relativeTemplatePath }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const symbols = yield context.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri);
        const defaultRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
        if (!symbols || symbols.length < 1) {
            return defaultRange;
        }
        const templatesSymbol = symbols.find(c => c.name === 'templates');
        if (!templatesSymbol) {
            context.logger.warn(`Invalid format for document ${editor.document.uri}`);
            return defaultRange;
        }
        const templateSymbol = templatesSymbol.children.find(c => c.name === relativeTemplatePath);
        if (!templateSymbol) {
            context.logger.warn(`Unable to find template section ${relativeTemplatePath} in ${editor.document.uri}`);
            return defaultRange;
        }
        const parameterOverridesSymbol = templateSymbol.children.find(c => c.name === 'parameterOverrides');
        if (!parameterOverridesSymbol) {
            context.logger.warn(`Unable to find parameterOverrides section for ${relativeTemplatePath} in ${editor.document.uri}`);
            return defaultRange;
        }
        return symbolUtilities_1.getChildrenRange(parameterOverridesSymbol);
    });
}
//# sourceMappingURL=configureParameterOverrides.js.map