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
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars = require("handlebars");
const path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const constants_1 = require("../constants");
const extensionGlobals_1 = require("../extensionGlobals");
const filesystem_1 = require("../filesystem");
const filesystemUtilities_1 = require("../filesystemUtilities");
const logger_1 = require("../logger");
const systemUtilities_1 = require("../systemUtilities");
const localize = nls.loadMessageBundle();
class UserCredentialsUtils {
    /**
     * @description Determines which credentials related files
     * exist, and returns their filenames.
     *
     * @returns array of filenames for files found.
     */
    static findExistingCredentialsFilenames() {
        return __awaiter(this, void 0, void 0, function* () {
            const candidateFiles = [this.getCredentialsFilename(), this.getConfigFilename()];
            const existsResults = yield Promise.all(candidateFiles.map((filename) => __awaiter(this, void 0, void 0, function* () { return yield systemUtilities_1.SystemUtilities.fileExists(filename); })));
            return candidateFiles.filter((filename, index) => existsResults[index]);
        });
    }
    /**
     * @returns Filename for the credentials file
     */
    static getCredentialsFilename() {
        const env = process.env;
        return env.AWS_SHARED_CREDENTIALS_FILE || path.join(systemUtilities_1.SystemUtilities.getHomeDirectory(), '.aws', 'credentials');
    }
    /**
     * @returns Filename for the config file
     */
    static getConfigFilename() {
        const env = process.env;
        return env.AWS_CONFIG_FILE || path.join(systemUtilities_1.SystemUtilities.getHomeDirectory(), '.aws', 'config');
    }
    /**
     * @description Determines if credentials directory exists
     * If it doesn't, creates credentials directory
     * at directory from this.getCredentialsFilename()
     */
    static generateCredentialDirectoryIfNonexistent() {
        return __awaiter(this, void 0, void 0, function* () {
            const filepath = path.dirname(this.getCredentialsFilename());
            if (!(yield filesystemUtilities_1.fileExists(filepath))) {
                yield filesystem_1.mkdir(filepath, { recursive: true });
            }
        });
    }
    /**
     * @description Produces a credentials file from a template
     * containing a single profile based on the given information
     *
     * @param credentialsContext the profile to create in the file
     */
    static generateCredentialsFile(extensionPath, credentialsContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = path.join(extensionPath, 'resources', 'newUserCredentialsFile');
            const credentialsTemplate = yield filesystemUtilities_1.readFileAsString(templatePath);
            const handlebarTemplate = handlebars.compile(credentialsTemplate);
            const credentialsFileContents = handlebarTemplate(credentialsContext);
            // Make a final check
            if (yield systemUtilities_1.SystemUtilities.fileExists(this.getCredentialsFilename())) {
                throw new Error('Credentials file exists. Not overwriting it.');
            }
            yield filesystem_1.writeFile(this.getCredentialsFilename(), credentialsFileContents, {
                encoding: 'utf8',
                mode: 0o100600 // basic file (type 100) with 600 permissions
            });
        });
    }
    /**
     * @description Tests if the given credentials are valid by making a request to AWS
     *
     * @param accessKey access key of credentials to validate
     * @param secretKey secret key of credentials to validate
     * @param sts (Optional) STS Service Client
     *
     * @returns a validation result, indicating whether or not credentials are valid
     *      if valid: result includes active account
     *      if invalid: result includes message with reason
     */
    static validateCredentials(credentials, sts) {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = logger_1.getLogger();
            if (!sts) {
                const transformedCredentials = {
                    credentials: {
                        accessKeyId: credentials.accessKeyId,
                        secretAccessKey: credentials.secretAccessKey,
                        sessionToken: credentials.sessionToken
                    }
                };
                try {
                    // Past iteration did not include a set region. Should we change this?
                    // We can also use the set region if/when we migrate to a single-region experience:
                    // https://github.com/aws/aws-toolkit-vscode/issues/549
                    sts = extensionGlobals_1.ext.toolkitClientBuilder.createStsClient('us-east-1', transformedCredentials);
                }
                catch (err) {
                    const error = err;
                    logger.error(error);
                    throw error;
                }
            }
            try {
                const response = yield sts.getCallerIdentity();
                return { isValid: !!response.Account, account: response.Account };
            }
            catch (err) {
                let reason;
                if (err instanceof Error) {
                    const error = err;
                    reason = error.message;
                    logger.error(error);
                }
                else {
                    reason = err;
                }
                return { isValid: false, invalidMessage: reason };
            }
        });
    }
    /**
     * Adds valid profiles to the AWS context and settings.
     *
     * @param profileName Profile name to add to AWS Context/AWS settings
     * @param awsContext Current AWS Context
     * @param sts (Optional) STS Service Client
     *
     * @returns true if the profile was valid and added to the context
     *          false if the profile was not valid and thus not added.
     */
    static addUserDataToContext(profileName, awsContext, sts) {
        return __awaiter(this, void 0, void 0, function* () {
            let credentials;
            try {
                credentials = yield awsContext.getCredentials(profileName);
                const account = credentials ? yield this.validateCredentials(credentials, sts) : undefined;
                if (account && account.isValid) {
                    yield awsContext.setCredentialProfileName(profileName);
                    yield awsContext.setCredentialAccountId(account.account);
                    return true;
                }
            }
            catch (err) {
                // swallow any errors--anything that isn't a success should be handled as a failure by the caller
            }
            return false;
        });
    }
    /**
     * Removes user's profile and account from AWS context
     *
     * @param awsContext Current AWS Context
     */
    static removeUserDataFromContext(awsContext) {
        return __awaiter(this, void 0, void 0, function* () {
            yield awsContext.setCredentialProfileName();
            yield awsContext.setCredentialAccountId();
        });
    }
    static notifyUserCredentialsAreBad(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const getHelp = localize('AWS.message.credentials.invalidProfile.help', 'Get Help...');
            const selection = yield vscode.window.showErrorMessage(localize('AWS.message.credentials.invalidProfile', 'Credentials profile {0} is invalid', profileName), getHelp);
            if (selection === getHelp) {
                vscode.env.openExternal(vscode.Uri.parse(constants_1.credentialHelpUrl));
            }
        });
    }
}
exports.UserCredentialsUtils = UserCredentialsUtils;
//# sourceMappingURL=userCredentialsUtils.js.map