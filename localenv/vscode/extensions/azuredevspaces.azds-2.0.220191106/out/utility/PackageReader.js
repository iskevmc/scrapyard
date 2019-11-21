// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
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
const path = require("path");
const util = require("util");
const readdirAsync = util.promisify(fs.readdir);
class PackageReader {
    constructor(packageFilePath, logger) {
        this._packageFilePath = packageFilePath;
        this._logger = logger;
        this._package = require(packageFilePath);
        if (this._package == null) {
            throw new Error(`Impossible to retrieve the package at path ${packageFilePath}`);
        }
    }
    getProperty(key) {
        return this._package[key];
    }
    devDependenciesContains(packageName) {
        return this._package.devDependencies != null && this._package.devDependencies[packageName] != null;
    }
    detectOrDefaultMainJsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            // If the main script has already been defined explicitly, let's use it.
            const mainJs = this.getProperty(`main`);
            if (mainJs != null) {
                return mainJs;
            }
            // Check for one of potential candidates if exists on disk - case sensitive.
            const candidates = [`server.js`, `Server.js`, `app.js`, `App.js`, `index.js`, `Index.js`];
            const directory = path.dirname(this._packageFilePath);
            const files = yield readdirAsync(directory);
            for (const candidate of candidates) {
                if (files.indexOf(candidate) !== -1) {
                    return candidate;
                }
            }
            // TODO: Consider throwing and handling the exception in the caller rather than arbitrarily making an assumption.
            this._logger.warning(`Unable to detect the main JS file to use. Defaulting to ${candidates[0]}`);
            return candidates[0];
        });
    }
}
exports.PackageReader = PackageReader;
//# sourceMappingURL=PackageReader.js.map