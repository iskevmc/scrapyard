'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const LocalizedConstants = require("../constants/localizedConstants");
const connection_1 = require("./contracts/connection");
const interfaces_1 = require("./interfaces");
const utils = require("./utils");
const question_1 = require("../prompts/question");
// Concrete implementation of the IConnectionCredentials interface
class ConnectionCredentials {
    /**
     * Create a connection details contract from connection credentials.
     */
    static createConnectionDetails(credentials) {
        let details = new connection_1.ConnectionDetails();
        details.options['host'] = credentials.host;
        if (credentials.port && details.options['host'].indexOf(',') === -1) {
            details.options['port'] = credentials.port;
        }
        details.options['dbname'] = credentials.dbname;
        details.options['user'] = credentials.user;
        details.options['password'] = credentials.password;
        details.options['hostaddr'] = credentials.hostaddr;
        details.options['connectTimeout'] = credentials.connectTimeout;
        details.options['clientEncoding'] = credentials.clientEncoding;
        details.options['options'] = credentials.options;
        details.options['applicationName'] = credentials.applicationName;
        details.options['sslmode'] = credentials.sslmode;
        details.options['sslcompression'] = credentials.sslcompression;
        details.options['sslcert'] = credentials.sslcert;
        details.options['sslkey'] = credentials.sslkey;
        details.options['sslrootcert'] = credentials.sslrootcert;
        details.options['sslcrl'] = credentials.sslcrl;
        details.options['requirepeer'] = credentials.requirepeer;
        details.options['service'] = credentials.service;
        return details;
    }
    static ensureRequiredPropertiesSet(credentials, isProfile, isPasswordRequired, wasPasswordEmptyInConfigFile, prompter, connectionStore, defaultProfileValues) {
        let questions = ConnectionCredentials.getRequiredCredentialValuesQuestions(credentials, false, isPasswordRequired, defaultProfileValues);
        let unprocessedCredentials = Object.assign({}, credentials);
        return prompter.prompt(questions).then(answers => {
            if (answers) {
                if (isProfile) {
                    let profile = credentials;
                    // If this is a profile, and the user has set save password to true and either
                    // stored the password in the config file or purposefully set an empty password,
                    // then transfer the password to the credential store
                    if (profile.savePassword && (!wasPasswordEmptyInConfigFile || profile.emptyPasswordInput)) {
                        // Remove profile, then save profile without plain text password
                        connectionStore.removeProfile(profile).then(() => {
                            connectionStore.saveProfile(profile);
                        });
                        // Or, if the user answered any additional questions for the profile, be sure to save it
                    }
                    else if (profile.authenticationType !== unprocessedCredentials.authenticationType ||
                        profile.savePassword !== unprocessedCredentials.savePassword ||
                        profile.password !== unprocessedCredentials.password) {
                        connectionStore.removeProfile(profile).then(() => {
                            connectionStore.saveProfile(profile);
                        });
                    }
                }
                return credentials;
            }
            else {
                return undefined;
            }
        });
    }
    // gets a set of questions that ensure all required and core values are set
    static getRequiredCredentialValuesQuestions(credentials, promptForDbName, isPasswordRequired, defaultProfileValues) {
        let connectionStringSet = () => Boolean(credentials.connectionString);
        let questions = [
            // Server or connection string must be present
            {
                type: question_1.QuestionTypes.input,
                name: LocalizedConstants.serverPrompt,
                message: LocalizedConstants.serverPrompt,
                placeHolder: LocalizedConstants.serverPlaceholder,
                default: defaultProfileValues ? defaultProfileValues.host : undefined,
                shouldPrompt: (answers) => utils.isEmpty(credentials.host),
                validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.serverPrompt, value),
                onAnswered: (value) => ConnectionCredentials.processServerOrConnectionString(value, credentials)
            },
            // Database name is not required, prompt is optional
            {
                type: question_1.QuestionTypes.input,
                name: LocalizedConstants.databasePrompt,
                message: LocalizedConstants.databasePrompt,
                placeHolder: LocalizedConstants.databasePlaceholder,
                default: defaultProfileValues ? defaultProfileValues.dbname : undefined,
                shouldPrompt: (answers) => !connectionStringSet() && promptForDbName,
                onAnswered: (value) => credentials.dbname = value
            },
            // Username must be present
            {
                type: question_1.QuestionTypes.input,
                name: LocalizedConstants.usernamePrompt,
                message: LocalizedConstants.usernamePrompt,
                placeHolder: LocalizedConstants.usernamePlaceholder,
                default: defaultProfileValues ? defaultProfileValues.user : undefined,
                shouldPrompt: (answers) => !connectionStringSet() && ConnectionCredentials.shouldPromptForUser(credentials),
                validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.usernamePrompt, value),
                onAnswered: (value) => credentials.user = value
            },
            // Password may or may not be necessary
            {
                type: question_1.QuestionTypes.password,
                name: LocalizedConstants.passwordPrompt,
                message: LocalizedConstants.passwordPrompt,
                placeHolder: LocalizedConstants.passwordPlaceholder,
                shouldPrompt: (answers) => !connectionStringSet() && ConnectionCredentials.shouldPromptForPassword(credentials),
                validate: (value) => {
                    if (isPasswordRequired) {
                        return ConnectionCredentials.validateRequiredString(LocalizedConstants.passwordPrompt, value);
                    }
                    return undefined;
                },
                onAnswered: (value) => {
                    credentials.password = value;
                    if (typeof (credentials) !== 'undefined') {
                        credentials.emptyPasswordInput = utils.isEmpty(credentials.password);
                    }
                }
            },
            // Port
            {
                type: question_1.QuestionTypes.input,
                name: LocalizedConstants.portPrompt,
                message: LocalizedConstants.portPrompt,
                placeHolder: LocalizedConstants.portPlaceHolder,
                default: '5432',
                shouldPrompt: (answers) => !connectionStringSet() && ConnectionCredentials.shouldPromptForPort(credentials),
                onAnswered: (value) => credentials.port = value
            }
        ];
        return questions;
    }
    static shouldPromptForUser(credentials) {
        return utils.isEmpty(credentials.user) && ConnectionCredentials.isPasswordBasedCredential(credentials);
    }
    static shouldPromptForPort(credentials) {
        return utils.isEmpty(credentials.port);
    }
    // Detect if a given value is a server name or a connection string, and assign the result accordingly
    static processServerOrConnectionString(value, credentials) {
        // If the value contains a connection string server name key, assume it is a connection string
        const dataSourceKeys = ['data source=', 'server=', 'address=', 'addr=', 'network address='];
        let isConnectionString = dataSourceKeys.some(key => value.toLowerCase().indexOf(key) !== -1);
        if (isConnectionString) {
            credentials.connectionString = value;
        }
        else {
            credentials.host = value;
        }
    }
    // Prompt for password if this is a password based credential and the password for the profile was empty
    // and not explicitly set as empty. If it was explicitly set as empty, only prompt if pw not saved
    static shouldPromptForPassword(credentials) {
        let isSavedEmptyPassword = credentials.emptyPasswordInput
            && credentials.savePassword;
        return utils.isEmpty(credentials.password)
            && ConnectionCredentials.isPasswordBasedCredential(credentials)
            && !isSavedEmptyPassword;
    }
    static isPasswordBasedCredential(credentials) {
        // TODO consider enum based verification and handling of AD auth here in the future
        let authenticationType = credentials.authenticationType;
        if (typeof credentials.authenticationType === 'undefined') {
            authenticationType = utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
        }
        return authenticationType === utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
    }
    // Validates a string is not empty, returning undefined if true and an error message if not
    static validateRequiredString(property, value) {
        if (utils.isEmpty(value)) {
            return property + LocalizedConstants.msgIsRequired;
        }
        return undefined;
    }
    static getAuthenticationTypesChoice() {
        let choices = [
            { name: LocalizedConstants.authTypeSql, value: utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin) },
            { name: LocalizedConstants.authTypeIntegrated, value: utils.authTypeToString(interfaces_1.AuthenticationTypes.Integrated) }
        ]; // TODO When Azure Active Directory is supported, add this here
        return choices;
    }
}
exports.ConnectionCredentials = ConnectionCredentials;

//# sourceMappingURL=connectionCredentials.js.map
