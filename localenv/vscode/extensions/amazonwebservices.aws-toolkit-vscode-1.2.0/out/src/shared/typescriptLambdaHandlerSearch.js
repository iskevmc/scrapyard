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
const ts = require("typescript");
const filesystemUtilities_1 = require("./filesystemUtilities");
const getRange = (node) => ({
    positionStart: node.getStart(),
    positionEnd: node.end
});
/**
 * Detects functions that could possibly be used as Lambda Function Handlers from a Typescript file.
 */
class TypescriptLambdaHandlerSearch {
    constructor(uri) {
        // _candidateDeclaredFunctionNames - names of functions that could be lambda handlers
        this._candidateDeclaredFunctionNames = new Set();
        // _candidateModuleExportsExpressions - all statements like "exports.handler = ..."
        this._candidateModuleExportsExpressions = [];
        // _candidateExportDeclarations - all "export { xyz }"
        this._candidateExportDeclarations = [];
        // _candidateExportNodes - all "export function Xyz()" / "export const Xyz = () => {}"
        this._candidateExportNodes = [];
        this._uri = uri;
        this._filename = this._uri.fsPath;
        this._baseFilename = path.parse(this._filename).name;
    }
    /**
     * @description Looks for functions that appear to be valid Lambda Function Handlers.
     * @returns A collection of information for each detected candidate.
     */
    findCandidateLambdaHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            this._candidateDeclaredFunctionNames.clear();
            this._candidateModuleExportsExpressions = [];
            this._candidateExportDeclarations = [];
            this._candidateExportNodes = [];
            return yield this.getCandidateHandlers();
        });
    }
    getCandidateHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileContents = yield filesystemUtilities_1.readFileAsString(this._filename);
            const sourceFile = ts.createSourceFile(this._filename, fileContents, ts.ScriptTarget.Latest, true);
            const handlers = this.processSourceFile(sourceFile);
            return handlers;
        });
    }
    /**
     * @description looks for Lambda Handler candidates in the given source file
     * Lambda Handler candidates are top level exported methods/functions.
     *
     * @param sourceFile SourceFile child node to process
     * @returns Collection of candidate Lambda handler information, empty array otherwise
     */
    processSourceFile(sourceFile) {
        this.scanSourceFile(sourceFile);
        const handlers = [];
        handlers.push(...this.findCandidateHandlersInModuleExports());
        handlers.push(...this.findCandidateHandlersInExportedFunctions());
        handlers.push(...this.findCandidateHandlersInExportDeclarations());
        return handlers;
    }
    /**
     * @description looks through a file's nodes, looking for data to support finding handler candidates
     */
    scanSourceFile(sourceFile) {
        sourceFile.forEachChild((node) => {
            // Function declarations
            if (ts.isFunctionLike(node)) {
                if (TypescriptLambdaHandlerSearch.isFunctionLambdaHandlerCandidate(node)) {
                    this._candidateDeclaredFunctionNames.add(node.name.getText());
                }
            }
            // Arrow Function declarations "const foo = (arg) => { }"
            if (ts.isVariableStatement(node)) {
                node.declarationList.forEachChild(declaration => {
                    if (ts.isVariableDeclaration(declaration)) {
                        const declarationName = declaration.name.getText();
                        if (declarationName.length > 0 &&
                            declaration.initializer &&
                            ts.isFunctionLike(declaration.initializer) &&
                            TypescriptLambdaHandlerSearch.isFunctionLambdaHandlerCandidate(declaration.initializer, false // initializers do not have a name value, it is up in declaration.name
                            )) {
                            this._candidateDeclaredFunctionNames.add(declarationName);
                        }
                    }
                });
            }
            // export function xxx / "export const xxx = () => {}"
            // We grab all of these and filter them later on in order to better deal with the VariableStatement entries
            if (TypescriptLambdaHandlerSearch.isNodeExported(node)) {
                this._candidateExportNodes.push(node);
            }
            // Things like "exports.handler = ..."
            // Grab all, cull after we've found all valid functions that can be referenced on rhs
            if (ts.isExpressionStatement(node)) {
                if (TypescriptLambdaHandlerSearch.isModuleExportsAssignment(node)) {
                    this._candidateModuleExportsExpressions.push(node);
                }
            }
            // Things like "export { xxx }"
            // Grab all, cull after we've found all valid functions that can be referenced in brackets
            if (ts.isExportDeclaration(node)) {
                this._candidateExportDeclarations.push(node);
            }
        });
    }
    /**
     * @description Looks at module.exports assignments to find candidate Lamdba handlers
     */
    findCandidateHandlersInModuleExports() {
        return this._candidateModuleExportsExpressions
            .filter(expression => {
            return TypescriptLambdaHandlerSearch.isEligibleLambdaHandlerAssignment(expression, this._candidateDeclaredFunctionNames);
        })
            .map(candidate => {
            // 'module.exports.xyz' => ['module', 'exports', 'xyz']
            const lhsComponents = candidate.expression.left
                .getText()
                .split('.')
                .map(x => x.trim());
            const exportsTarget = lhsComponents[0] === 'exports' ? lhsComponents[1] : lhsComponents[2];
            return {
                filename: this._filename,
                handlerName: `${this._baseFilename}.${exportsTarget}`,
                range: getRange(candidate)
            };
        });
    }
    /**
     * @description Looks at "export { xyz }" statements to find candidate Lambda handlers
     */
    findCandidateHandlersInExportDeclarations() {
        const handlers = [];
        this._candidateExportDeclarations.forEach(exportDeclaration => {
            if (exportDeclaration.exportClause) {
                exportDeclaration.exportClause.forEachChild(clause => {
                    if (ts.isExportSpecifier(clause)) {
                        const exportedFunction = clause.name.getText();
                        if (this._candidateDeclaredFunctionNames.has(exportedFunction)) {
                            handlers.push({
                                filename: this._filename,
                                handlerName: `${this._baseFilename}.${exportedFunction}`,
                                range: getRange(clause)
                            });
                        }
                    }
                });
            }
        });
        return handlers;
    }
    /**
     * @description Looks at export function declarations to find candidate Lamdba handlers
     */
    findCandidateHandlersInExportedFunctions() {
        const handlers = [];
        this._candidateExportNodes.forEach(exportNode => {
            if (ts.isFunctionLike(exportNode) &&
                TypescriptLambdaHandlerSearch.isFunctionLambdaHandlerCandidate(exportNode) &&
                !!exportNode.name) {
                handlers.push({
                    filename: this._filename,
                    handlerName: `${this._baseFilename}.${exportNode.name.getText()}`,
                    range: getRange(exportNode)
                });
            }
            else if (ts.isVariableStatement(exportNode)) {
                exportNode.declarationList.forEachChild(declaration => {
                    if (ts.isVariableDeclaration(declaration) &&
                        !!declaration.initializer &&
                        ts.isFunctionLike(declaration.initializer) &&
                        TypescriptLambdaHandlerSearch.isFunctionLambdaHandlerCandidate(declaration.initializer, false)) {
                        handlers.push({
                            filename: this._filename,
                            handlerName: `${this._baseFilename}.${declaration.name.getText()}`,
                            range: getRange(declaration)
                        });
                    }
                });
            }
        });
        return handlers;
    }
    /**
     * @description Whether or not the given expression is attempting to assign to '[module.]exports.foo'
     * @param expressionStatement Expression node to evaluate
     */
    static isModuleExportsAssignment(expressionStatement) {
        if (ts.isBinaryExpression(expressionStatement.expression)) {
            const lhsComponents = expressionStatement.expression.left
                .getText()
                .split('.')
                .map(x => x.trim());
            return ((lhsComponents.length === 3 && lhsComponents[0] === 'module' && lhsComponents[1] === 'exports') ||
                (lhsComponents.length === 2 && lhsComponents[0] === 'exports'));
        }
        return false;
    }
    /**
     * @description Whether or not the given expression appears to be assigning a candidate Lambda Handler
     * Expression could be one of:
     *      [module.]exports.foo = alreadyDeclaredFunction
     *      [module.]exports.foo = (event, context) => { ... }
     * @param expressionStatement Expression node to evaluate
     * @param functionHandlerNames Names of declared functions considered to be Handler Candidates
     */
    static isEligibleLambdaHandlerAssignment(expressionStatement, functionHandlerNames) {
        if (ts.isBinaryExpression(expressionStatement.expression)) {
            return (this.isTargetFunctionReference(expressionStatement.expression.right, functionHandlerNames) ||
                this.isValidFunctionAssignment(expressionStatement.expression.right));
        }
        return false;
    }
    /**
     * @description Whether or not the given expression appears to contain a function of interest on the right hand side
     *
     * Example expression:
     *      something = alreadyDeclaredFunction
     * @param expression Expression node to evaluate
     * @param targetFunctionNames Names of functions of interest
     */
    static isTargetFunctionReference(expression, targetFunctionNames) {
        if (ts.isIdentifier(expression)) {
            return targetFunctionNames.has(expression.text);
        }
        return false;
    }
    /**
     * @description Whether or not the given expression appears to have a function that could be a valid Lambda handler
     * on the right hand side.
     *
     * Example expression:
     *      something = (event, context) => { }
     * @param expression Expression node to evaluate
     * @param targetFunctionNames Names of functions of interest
     */
    static isValidFunctionAssignment(expression) {
        if (ts.isFunctionLike(expression)) {
            return expression.parameters.length <= TypescriptLambdaHandlerSearch.MAXIMUM_FUNCTION_PARAMETERS;
        }
        return false;
    }
    /**
     * @description Indicates whether or not a node is marked as visible outside this file
     * @param node Node to check
     * @returns true if node is exported, false otherwise
     */
    static isNodeExported(node) {
        const flags = ts.getCombinedModifierFlags(node);
        // tslint:disable-next-line:no-bitwise
        return (flags & ts.ModifierFlags.Export) === ts.ModifierFlags.Export;
    }
    /**
     * @description Indicates whether or not a function/method could be a Lambda Handler
     * @param node Signature Declaration Node to check
     * @param validateName whether or not to check the name property
     */
    static isFunctionLambdaHandlerCandidate(node, validateName = true) {
        const nameIsValid = !validateName || !!node.name;
        return node.parameters.length <= TypescriptLambdaHandlerSearch.MAXIMUM_FUNCTION_PARAMETERS && nameIsValid;
    }
}
TypescriptLambdaHandlerSearch.MAXIMUM_FUNCTION_PARAMETERS = 3;
exports.TypescriptLambdaHandlerSearch = TypescriptLambdaHandlerSearch;
//# sourceMappingURL=typescriptLambdaHandlerSearch.js.map