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
const yaml = require("js-yaml");
const path = require("path");
const util = require("util");
const accessAsync = util.promisify(fs.access);
const readFileAsync = util.promisify(fs.readFile);
class AzdsConfigFileUtility {
    constructor(workspaceFolder) {
        this.MinSupportedConfigApiVersion = 1.1;
        this._workspaceFolder = workspaceFolder;
        this._configFilePath = path.join(this._workspaceFolder.uri.fsPath, `azds.yaml`);
    }
    isFilePresentAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield accessAsync(this._configFilePath);
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    isFileOutdatedAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadConfigFileIfNeededAsync();
            return this._config.apiVersion < this.MinSupportedConfigApiVersion;
        });
    }
    getChartConfigAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadConfigFileIfNeededAsync();
            let chartSubPath;
            if (this._config.install != null && this._config.install.chart != null) {
                chartSubPath = this._config.install.chart;
            }
            else {
                chartSubPath = `charts/${path.basename(this._workspaceFolder.uri.fsPath)}`;
            }
            const chartFilePath = path.join(this._workspaceFolder.uri.fsPath, chartSubPath, `Chart.yaml`);
            const chartFileContent = yield readFileAsync(chartFilePath, `utf8`);
            return yaml.safeLoad(chartFileContent);
        });
    }
    getBuildContextAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadConfigFileIfNeededAsync();
            if (!this._config.build || !this._config.build.context) {
                throw new Error(`Couldn't determine the build context`);
            }
            return this._config.build.context.replace(/\\/g, `/`);
        });
    }
    loadConfigFileIfNeededAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._config != null) {
                return;
            }
            const configFileContent = yield readFileAsync(this._configFilePath, `utf8`);
            this._config = yaml.safeLoad(configFileContent);
        });
    }
}
exports.AzdsConfigFileUtility = AzdsConfigFileUtility;
//# sourceMappingURL=AzdsConfigFileUtility.js.map