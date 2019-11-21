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
const _ = require("lodash");
const path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const extensionGlobals_1 = require("../shared/extensionGlobals");
const constants_1 = require("./constants");
const filesystemUtilities_1 = require("./filesystemUtilities");
const localize = nls.loadMessageBundle();
class ExtensionUtilities {
    static getLibrariesForHtml(names) {
        const basePath = path.join(extensionGlobals_1.ext.context.extensionPath, 'media', 'libs');
        return this.resolveResourceURIs(basePath, names);
    }
    static getScriptsForHtml(names) {
        const basePath = path.join(extensionGlobals_1.ext.context.extensionPath, 'media', 'js');
        return this.resolveResourceURIs(basePath, names);
    }
    static getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    static resolveResourceURIs(basePath, names) {
        const scripts = [];
        _.forEach(names, scriptName => {
            const scriptPathOnDisk = vscode.Uri.file(path.join(basePath, scriptName));
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            const nonce = ExtensionUtilities.getNonce();
            scripts.push({ nonce: nonce, uri: scriptUri });
        });
        return scripts;
    }
}
exports.ExtensionUtilities = ExtensionUtilities;
/**
 * A utility function that takes a possibly null value and applies
 * the given function to it, returning the result of the function or null
 *
 * example usage:
 *
 * function blah(value?: SomeObject) {
 *  nullSafeGet(value, x => x.propertyOfSomeObject)
 * }
 *
 * @param obj the object to attempt the get function on
 * @param getFn the function to use to determine the mapping value
 */
function safeGet(obj, getFn) {
    if (obj) {
        try {
            return getFn(obj);
        }
        catch (error) {
            // ignore
        }
    }
    return undefined;
}
exports.safeGet = safeGet;
/**
 * Helper function to show a webview containing the quick start page
 *
 * @param context VS Code Extension Context
 */
function showQuickStartWebview(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const view = yield createQuickStartWebview(context);
            view.reveal();
        }
        catch (_a) {
            vscode.window.showErrorMessage(localize('AWS.command.quickStart.error', 'There was an error retrieving the Quick Start page'));
        }
    });
}
exports.showQuickStartWebview = showQuickStartWebview;
/**
 * Helper function to create a webview containing the quick start page
 * Returns an unfocused vscode.WebviewPanel if the quick start page is renderable.
 *
 * @param context VS Code Extension Context
 * @param page Page to load (use for testing); default: `quickStart.html`
 */
function createQuickStartWebview(context, page = 'quickStart.html') {
    return __awaiter(this, void 0, void 0, function* () {
        const html = convertExtensionRootTokensToPath(yield filesystemUtilities_1.readFileAsString(path.join(context.extensionPath, page)), context.extensionPath);
        // create hidden webview, leave it up to the caller to show
        const view = vscode.window.createWebviewPanel('html', localize('AWS.command.quickStart.title', 'AWS Toolkit - Quick Start'), { viewColumn: vscode.ViewColumn.Active, preserveFocus: true });
        view.webview.html = html;
        return view;
    });
}
exports.createQuickStartWebview = createQuickStartWebview;
/**
 * Utility function to search for tokens in a string and convert them to relative paths parseable by VS Code
 * Useful for converting HTML images to webview-usable images
 *
 * @param text Text to scan
 * @param basePath Extension path (from extension context)
 */
function convertExtensionRootTokensToPath(text, basePath) {
    return text.replace(/!!EXTENSIONROOT!!/g, `vscode-resource:${basePath}`);
}
/**
 * Utility function to determine if the extension version has changed between activations
 * False (versions are identical) if version key exists in global state and matches the current version
 * True (versions are different) if any of the above aren't true
 *
 * TODO: Change the threshold on which we display the welcome page?
 * For instance, if we start building nightlies, only show page for significant updates?
 *
 * @param context VS Code Extension Context
 * @param currVersion Current version to compare stored most recent version against (useful for tests)
 */
function isDifferentVersion(context, currVersion = constants_1.pluginVersion) {
    const mostRecentVersion = context.globalState.get(constants_1.mostRecentVersionKey);
    if (mostRecentVersion && mostRecentVersion === currVersion) {
        return false;
    }
    return true;
}
exports.isDifferentVersion = isDifferentVersion;
/**
 * Utility function to update the most recently used extension version
 * Pulls from package.json
 *
 * @param context VS Code Extension Context
 */
function setMostRecentVersion(context) {
    context.globalState.update(constants_1.mostRecentVersionKey, constants_1.pluginVersion);
}
exports.setMostRecentVersion = setMostRecentVersion;
/**
 * Publishes a toast with a link to the welcome page
 */
function promptQuickStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const view = localize('AWS.command.quickStart', 'View Quick Start');
        const prompt = yield vscode.window.showInformationMessage(localize('AWS.message.prompt.quickStart.toastMessage', 'You are now using the AWS Toolkit for Visual Studio Code, version {0}', constants_1.pluginVersion), view);
        if (prompt === view) {
            vscode.commands.executeCommand('aws.quickStart');
        }
    });
}
/**
 * Checks if a user is new to this version
 * If so, pops a toast with a link to a quick start page
 *
 * @param context VS Code Extension Context
 */
function toastNewUser(context, logger) {
    try {
        if (isDifferentVersion(context)) {
            setMostRecentVersion(context);
            // the welcome toast should be nonblocking.
            // tslint:disable-next-line: no-floating-promises
            promptQuickStart();
        }
    }
    catch (err) {
        // swallow error and don't block extension load
        logger.error(err);
    }
}
exports.toastNewUser = toastNewUser;
//# sourceMappingURL=extensionUtilities.js.map