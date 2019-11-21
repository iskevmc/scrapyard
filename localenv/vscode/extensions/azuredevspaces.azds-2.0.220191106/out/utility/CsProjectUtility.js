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
const xmldom = require("xmldom");
const xpath = require("xpath");
const readFileAsync = util.promisify(fs.readFile);
class CsProjectUtility {
    constructor(filePath) {
        this.filePath = filePath;
    }
    getTargetFrameworkOrDefaultAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getPropertyValueAsync("Project/PropertyGroup/TargetFramework", "netcoreapp2.0");
        });
    }
    /*
        Tries to parse the .csproj file to get the assembly name similar to 'prep' command logic.
        There can be cases where conditional's or complicated token replacements can be present in
        a csproj file. In that case the user should update the vscode's json files to set the right
        assembly name.
    */
    getAssemblyNameAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getPropertyValueAsync("Project/PropertyGroup/AssemblyName", path.parse(this.filePath).name);
        });
    }
    getPropertyValueAsync(property, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadIfNeededAsync();
            if (!property) {
                return defaultValue;
            }
            let node = xpath.select(property, this.content);
            if (node && node.length > 0 && Array.isArray(node)) {
                let element = node[0];
                if (element.firstChild && element.firstChild.data) {
                    defaultValue = element.firstChild.data;
                }
            }
            return defaultValue;
        });
    }
    loadIfNeededAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.content) {
                let raw = yield readFileAsync(this.filePath, 'utf8');
                this.content = new xmldom.DOMParser().parseFromString(raw);
            }
        });
    }
}
exports.CsProjectUtility = CsProjectUtility;
//# sourceMappingURL=CsProjectUtility.js.map