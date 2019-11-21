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
const systemUtilities_1 = require("../systemUtilities");
const credentialsFile_1 = require("./credentialsFile");
const userCredentialsUtils_1 = require("./userCredentialsUtils");
class DefaultCredentialsFileReaderWriter {
    getProfileNames() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: cache the file and attach a watcher to it
            const sharedCredentials = yield credentialsFile_1.loadSharedConfigFiles();
            const credentialsProfileNames = Object.keys(sharedCredentials.credentialsFile);
            const configProfileNames = this.getCanUseConfigFile() ? Object.keys(sharedCredentials.configFile) : [];
            const profileNames = new Set(credentialsProfileNames.concat(configProfileNames));
            return Promise.resolve(Array.from(profileNames));
        });
    }
    addProfileToFile(profileName, accessKey, secretKey) {
        return __awaiter(this, void 0, void 0, function* () {
            yield credentialsFile_1.saveProfile(profileName, accessKey, secretKey);
        });
    }
    /**
     * Gets the default region for a credentials profile
     *
     * @param profileName Profile to get the default region from
     * @returns Default region, undefined if region is not set
     */
    getDefaultRegion(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield this.getProfile(profileName);
            return Promise.resolve(profile.region);
        });
    }
    /**
     * Indicates if credentials information can be retrieved from
     * the config file in addition to the credentials file.
     */
    getCanUseConfigFile() {
        const env = process.env;
        return !!env.AWS_SDK_LOAD_CONFIG;
    }
    /**
     * Specifies whether or not credentials information can be retrieved from
     * the config file in addition to the credentials file.
     *
     * @param allow - true: load from credentials and config, false: load from credentials only
     */
    setCanUseConfigFile(allow) {
        const env = process.env;
        env.AWS_SDK_LOAD_CONFIG = allow ? true : '';
    }
    /**
     * @description Calls setCanUseConfigFile , setting it to true if the config file exists, false otherwise
     */
    setCanUseConfigFileIfExists() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setCanUseConfigFile(yield systemUtilities_1.SystemUtilities.fileExists(userCredentialsUtils_1.UserCredentialsUtils.getConfigFilename()));
        });
    }
    /**
     * Returns a credentials profile, combined from the config and credentials file where applicable.
     *
     * @param profileName Credentials Profile to load
     * @returns Profile data. Nonexistent Profiles will return an empty mapping.
     */
    getProfile(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentialFiles = yield credentialsFile_1.loadSharedConfigFiles();
            let profile = {};
            if (this.getCanUseConfigFile()) {
                if (credentialFiles.configFile && credentialFiles.configFile[profileName]) {
                    profile = credentialFiles.configFile[profileName];
                }
            }
            if (credentialFiles.credentialsFile && credentialFiles.credentialsFile[profileName]) {
                const credentialsProfile = credentialFiles.credentialsFile[profileName];
                for (const index of Object.keys(credentialsProfile)) {
                    profile[index] = credentialsProfile[index];
                }
            }
            return Promise.resolve(profile);
        });
    }
}
exports.DefaultCredentialsFileReaderWriter = DefaultCredentialsFileReaderWriter;
//# sourceMappingURL=defaultCredentialsFileReaderWriter.js.map