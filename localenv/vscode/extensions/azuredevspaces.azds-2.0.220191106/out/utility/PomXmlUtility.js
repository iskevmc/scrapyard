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
const util = require("util");
const xmldom = require("xmldom");
const xpath = require("xpath");
const readFileAsync = util.promisify(fs.readFile);
class PomXmlUtility {
    constructor(filePath) {
        this.filePath = filePath;
    }
    getArtifactIdAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadIfNeededAsync();
            let artifactId;
            let node = xpath.select("/*[local-name()='project']/*[local-name()='artifactId']", this.content);
            if (node && Array.isArray(node) && node.length > 0) {
                artifactId = node[0].firstChild.data;
            }
            return artifactId;
        });
    }
    getArtifactVersionAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadIfNeededAsync();
            let artifactVersion;
            let node = xpath.select("/*[local-name()='project']/*[local-name()='version']", this.content);
            if (node && Array.isArray(node) && node.length > 0) {
                artifactVersion = node[0].firstChild.data;
            }
            return artifactVersion;
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
exports.PomXmlUtility = PomXmlUtility;
//# sourceMappingURL=PomXmlUtility.js.map