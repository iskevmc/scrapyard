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
const AsyncLock = require("async-lock");
const AWS = require("aws-sdk");
const vscode = require("vscode");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
/**
 * @description Encapsulates the setup and caching of credentials profiles
 */
class CredentialsManager {
    constructor() {
        this._credentialsCache = {};
        this._asyncLock = new AsyncLock();
    }
    /**
     * @description Retrieves the requested credentials profile, creating it if necessary.
     * An exception is thrown if the profile name is not found or if there is an issue setting up the profile
     * @param profileName Profile to retrieve
     */
    getCredentials(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentials = yield this._asyncLock.acquire(`credentials.lock.${profileName}`, () => __awaiter(this, void 0, void 0, function* () {
                if (!this._credentialsCache[profileName]) {
                    this._credentialsCache[profileName] = yield this.createCredentials(profileName);
                }
                return this._credentialsCache[profileName];
            }));
            return credentials;
        });
    }
    /**
     * Instantiates credentials for the specified profile
     *
     * @param profileName Profile to set up
     */
    createCredentials(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new AWS.CredentialProviderChain([
                () => new AWS.ProcessCredentials({ profile: profileName }),
                () => new AWS.SharedIniFileCredentials({
                    profile: profileName,
                    tokenCodeFn: (mfaSerial, callback) => __awaiter(this, void 0, void 0, function* () { return yield CredentialsManager.getMfaTokenFromUser(mfaSerial, profileName, callback); })
                })
            ]);
            return provider.resolvePromise();
        });
    }
    /**
     * @description Prompts user for MFA token
     *
     * Entered token is passed to the callback.
     * If user cancels out, the callback is passed an error with a fixed message string.
     *
     * @param mfaSerial Serial arn of MFA device
     * @param profileName Name of Credentials profile we are asking an MFA Token for
     * @param callback tokens/errors are passed through here
     */
    static getMfaTokenFromUser(mfaSerial, profileName, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = yield vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: localize('AWS.prompt.mfa.enterCode.placeholder', 'Enter Authentication Code Here'),
                    prompt: localize('AWS.prompt.mfa.enterCode.prompt', 'Enter authentication code for profile {0}', profileName)
                });
                // Distinguish user cancel vs code entry issues
                if (!token) {
                    throw new Error(CredentialsManager.userCancelledMfaError);
                }
                callback(undefined, token);
            }
            catch (err) {
                const error = err;
                callback(error);
            }
        });
    }
}
CredentialsManager.userCancelledMfaError = localize('AWS.error.mfa.userCancelled', 'User cancelled entering authentication code');
exports.CredentialsManager = CredentialsManager;
//# sourceMappingURL=credentialsManager.js.map