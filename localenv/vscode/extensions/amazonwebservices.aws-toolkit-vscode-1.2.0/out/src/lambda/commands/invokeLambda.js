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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const vscode = require("vscode");
const xml2js = require("xml2js");
const extensionGlobals_1 = require("../../shared/extensionGlobals");
const extensionUtilities_1 = require("../../shared/extensionUtilities");
const logger_1 = require("../../shared/logger");
const resourceLocation_1 = require("../../shared/resourceLocation");
const baseTemplates_1 = require("../../shared/templates/baseTemplates");
const constants_1 = require("../constants");
const lambdaTemplates_1 = require("../templates/lambdaTemplates");
function invokeLambda(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        try {
            const functionNode = params.functionNode;
            const view = vscode.window.createWebviewPanel('html', `Invoked ${functionNode.configuration.FunctionName}`, vscode.ViewColumn.One, {
                // Enable scripts in the webview
                enableScripts: true
            });
            const baseTemplateFn = _.template(baseTemplates_1.BaseTemplates.SIMPLE_HTML);
            view.webview.html = baseTemplateFn({
                content: '<h1>Loading...</h1>'
            });
            // ideally need to get the client from the explorer, but the context will do for now
            logger.info('building template...');
            const invokeTemplateFn = _.template(lambdaTemplates_1.LambdaTemplates.INVOKE_TEMPLATE);
            const resourcePath = path.join(extensionGlobals_1.ext.context.extensionPath, 'resources', 'vs-lambda-sample-request-manifest.xml');
            logger.info(constants_1.sampleRequestManifestPath);
            logger.info(resourcePath);
            try {
                const sampleInput = yield params.resourceFetcher.getResource([
                    new resourceLocation_1.WebResourceLocation(constants_1.sampleRequestManifestPath),
                    new resourceLocation_1.FileResourceLocation(resourcePath)
                ]);
                const inputs = [];
                logger.info('querying manifest url');
                xml2js.parseString(sampleInput, { explicitArray: false }, (err, result) => {
                    logger.info(result.toString());
                    if (err) {
                        return;
                    }
                    _.forEach(result.requests.request, r => {
                        inputs.push({ name: r.name, filename: r.filename });
                    });
                });
                const loadScripts = extensionUtilities_1.ExtensionUtilities.getScriptsForHtml(['invokeLambdaVue.js']);
                const loadLibs = extensionUtilities_1.ExtensionUtilities.getLibrariesForHtml(['vue.min.js']);
                logger.info(loadLibs.toString());
                view.webview.html = baseTemplateFn({
                    content: invokeTemplateFn({
                        FunctionName: functionNode.configuration.FunctionName,
                        InputSamples: inputs,
                        Scripts: loadScripts,
                        Libraries: loadLibs
                    })
                });
                view.webview.onDidReceiveMessage(createMessageReceivedFunc({
                    fn: functionNode,
                    outputChannel: params.outputChannel,
                    resourceFetcher: params.resourceFetcher,
                    resourcePath: resourcePath,
                    onPostMessage: message => view.webview.postMessage(message)
                }), undefined, extensionGlobals_1.ext.context.subscriptions);
            }
            catch (err) {
                logger.error('Error getting manifest data..', err);
            }
        }
        catch (err) {
            const error = err;
            logger.error(error);
        }
    });
}
exports.invokeLambda = invokeLambda;
function createMessageReceivedFunc(_a) {
    var { fn, outputChannel } = _a, restParams = __rest(_a, ["fn", "outputChannel"]);
    const logger = logger_1.getLogger();
    return (message) => __awaiter(this, void 0, void 0, function* () {
        switch (message.command) {
            case 'sampleRequestSelected':
                logger.info('selected the following sample:');
                logger.info(String(message.value));
                const sample = yield restParams.resourceFetcher.getResource([
                    new resourceLocation_1.WebResourceLocation(`${constants_1.sampleRequestPath}${message.value}`),
                    new resourceLocation_1.FileResourceLocation(restParams.resourcePath)
                ]);
                logger.info(sample);
                restParams.onPostMessage({ command: 'loadedSample', sample: sample });
                return;
            case 'invokeLambda':
                logger.info('invoking lambda function with the following payload:');
                logger.info(String(message.value));
                outputChannel.show();
                outputChannel.appendLine('Loading response...');
                try {
                    if (!fn.configuration.FunctionArn) {
                        throw new Error(`Could not determine ARN for function ${fn.configuration.FunctionName}`);
                    }
                    const client = extensionGlobals_1.ext.toolkitClientBuilder.createLambdaClient(fn.regionCode);
                    const funcResponse = yield client.invoke(fn.configuration.FunctionArn, message.value);
                    const logs = funcResponse.LogResult ? Buffer.from(funcResponse.LogResult, 'base64').toString() : '';
                    const payload = funcResponse.Payload ? funcResponse.Payload : JSON.stringify({});
                    outputChannel.appendLine(`Invocation result for ${fn.configuration.FunctionArn}`);
                    outputChannel.appendLine('Logs:');
                    outputChannel.appendLine(logs);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('Payload:');
                    outputChannel.appendLine(payload.toString());
                    outputChannel.appendLine('');
                }
                catch (e) {
                    const error = e;
                    outputChannel.appendLine(`There was an error invoking ${fn.configuration.FunctionArn}`);
                    outputChannel.appendLine(error.toString());
                    outputChannel.appendLine('');
                }
                return;
        }
    });
}
//# sourceMappingURL=invokeLambda.js.map