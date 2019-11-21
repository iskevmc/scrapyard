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
// ***************************************************************************
// Note: Supplied by the AWS Javascript SDK team, from their upcoming v3 SDK.
// Once that release is GA and we switch over, we can remove this copy and use
// their version.
// ***************************************************************************
const fs_extra_1 = require("fs-extra");
const os_1 = require("os");
const path_1 = require("path");
const filesystem_1 = require("../filesystem");
const filesystemUtilities_1 = require("../filesystemUtilities");
function loadSharedConfigFiles(init = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const [configFile, credentialsFile] = yield Promise.all([
            /* tslint:disable await-promise */
            loadConfigFile(init.configFilepath),
            loadCredentialsFile(init.filepath)
            /* tslint:enable await-promise */
        ]);
        return {
            credentialsFile,
            configFile
        };
    });
}
exports.loadSharedConfigFiles = loadSharedConfigFiles;
function loadConfigFile(configFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = process.env;
        if (!configFilePath) {
            configFilePath = env.AWS_CONFIG_FILE || path_1.join(getHomeDir(), '.aws', 'config');
        }
        if (!(yield filesystemUtilities_1.fileExists(configFilePath))) {
            return {};
        }
        return normalizeConfigFile(parseIni(yield filesystemUtilities_1.readFileAsString(configFilePath)));
    });
}
function loadCredentialsFile(credentialsFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = process.env;
        if (!credentialsFilePath) {
            credentialsFilePath = env.AWS_SHARED_CREDENTIALS_FILE || path_1.join(getHomeDir(), '.aws', 'credentials');
        }
        if (!(yield filesystemUtilities_1.fileExists(credentialsFilePath))) {
            return {};
        }
        return parseIni(yield filesystemUtilities_1.readFileAsString(credentialsFilePath));
    });
}
// TODO: FOR POC-DEMOS ONLY, NOT FOR PRODUCTION USE!
// REMOVE_BEFORE_RELEASE
// This is nowhere near resilient enough :-)
function saveProfile(name, accessKey, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = process.env;
        const filepath = env.AWS_SHARED_CREDENTIALS_FILE || path_1.join(getHomeDir(), '.aws', 'credentials');
        // even though poc concept code, let's preserve the user's file!
        yield fs_extra_1.copy(filepath, `${filepath}.bak_vscode`, { overwrite: true });
        const data = `${yield filesystemUtilities_1.readFileAsString(filepath)}
[${name}]
aws_access_key_id=${accessKey}
aws_secret_access_key=${secretKey}
`;
        yield filesystem_1.writeFile(filepath, data, 'utf8');
    });
}
exports.saveProfile = saveProfile;
const profileKeyRegex = /^profile\s(["'])?([^\1]+)\1$/;
function normalizeConfigFile(data) {
    const map = {};
    for (const key of Object.keys(data)) {
        if (key === 'default') {
            map.default = data.default;
        }
        else {
            const matches = profileKeyRegex.exec(key);
            if (matches) {
                // @ts-ignore
                const [_1, _2, normalizedKey] = matches;
                if (normalizedKey) {
                    map[normalizedKey] = data[key];
                }
            }
        }
    }
    return map;
}
function parseIni(iniData) {
    const map = {};
    let currentSection;
    for (let line of iniData.split(/\r?\n/)) {
        line = line.split(/(^|\s)[;#]/)[0]; // remove comments
        const section = line.match(/^\s*\[([^\[\]]+)]\s*$/);
        if (section) {
            currentSection = section[1];
        }
        else if (currentSection) {
            const item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
            if (item) {
                map[currentSection] = map[currentSection] || {};
                map[currentSection][item[1]] = item[2];
            }
        }
    }
    return map;
}
function getHomeDir() {
    const env = process.env;
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = env;
    if (HOME) {
        return HOME;
    }
    if (USERPROFILE) {
        return USERPROFILE;
    }
    if (HOMEPATH) {
        return `${HOMEDRIVE}${HOMEPATH}`;
    }
    return os_1.homedir();
}
//# sourceMappingURL=credentialsFile.js.map