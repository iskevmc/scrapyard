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
const fs = require("fs");
const os = require("os");
const path = require("path");
class SystemUtilities {
    static getHomeDirectory() {
        const env = process.env;
        if (env.HOME !== undefined) {
            return env.HOME;
        }
        if (env.USERPROFILE !== undefined) {
            return env.USERPROFILE;
        }
        if (env.HOMEPATH !== undefined) {
            const homeDrive = env.HOMEDRIVE || 'C:';
            return path.join(homeDrive, env.HOMEPATH);
        }
        return os.homedir();
    }
    static fileExists(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.access(file, err => {
                    if (!!err) {
                        resolve(false);
                    }
                    resolve(true);
                });
            });
        });
    }
}
exports.SystemUtilities = SystemUtilities;
//# sourceMappingURL=systemUtilities.js.map