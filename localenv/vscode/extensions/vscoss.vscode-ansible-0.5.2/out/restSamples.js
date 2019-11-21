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
const vscode = require("vscode");
const swagger_1 = require("./swagger");
const playbookManager_1 = require("./playbookManager");
const utilities = require("./utilities");
var path = require("path");
var fs = require('fs');
var pm = new playbookManager_1.PlaybookManager();
class RestSamples {
    constructor(outputChannel) {
        this._outputChannel = outputChannel;
    }
    displayMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            let specLocation = yield this.getSpecificationLocation();
            let groups = this.queryDirectory(specLocation + '/specification', false, "");
            if (groups != null) {
                let selection = yield vscode.window.showQuickPick(groups);
                if (!selection)
                    return;
                this.selectOperation(specLocation + "/specification/" + selection);
            }
        });
    }
    selectOperation(path) {
        let operations = this.queryAll(path);
        let items = [];
        if (operations) {
            for (var key in operations) {
                items.push(operations[key]);
            }
        }
        if (items.length == 0) {
            vscode.window.showInformationMessage("No samples available");
            return;
        }
        vscode.window.showQuickPick(items).then(selection => {
            // the user canceled the selection
            if (!selection)
                return;
            items = [];
            for (var f in selection['files']) {
                let swagger = require(selection['files'][f]);
                if (swagger != null) {
                    let xpath = selection['files'][f].split('/').slice(0, -1).join('/');
                    let swaggerHandler = new swagger_1.Swagger(swagger);
                    let examples = swaggerHandler.getExampleNames(selection['path'], selection['method']);
                    let apiVersion = xpath.split('/').slice(-1)[0];
                    examples.forEach(function (s, i, a) {
                        items.push({
                            'label': 'API Version: ' + apiVersion + ' - ' + s.split('/').pop().split('.json')[0],
                            'file': selection['files'][f],
                            'example': require(xpath + '/' + s),
                            'path': selection['path'],
                            'method': selection['method']
                        });
                    });
                }
            }
            vscode.window.showQuickPick(items).then(selection => {
                // the user canceled the selection
                if (!selection)
                    return;
                let swagger = require(selection['file']);
                let swaggerHandler = new swagger_1.Swagger(swagger);
                let playbook = swaggerHandler.generateRestApiTasks(selection['path'], selection['method'], selection['example']);
                pm.insertTask(playbook);
            });
        });
    }
    getSpecificationLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let spec = utilities.getCodeConfiguration('ansible', 'azureRestSpec');
                if (spec != "") {
                    resolve(spec);
                }
                else {
                    this._outputChannel.show();
                    const progress = utilities.delayedInterval(() => { this._outputChannel.append('.'); }, 500);
                    this._outputChannel.append("Getting Azure REST API specifications.");
                    let clone = require('git-clone');
                    //let home: string = path.join(vscode.extensions.getExtension("vscoss.vscode-ansible").extensionPath, 'azure-rest-api-specs');
                    let home = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.vscode', 'rest');
                    clone("https://github.com/Azure/azure-rest-api-specs.git", home, null, (result) => {
                        progress.cancel();
                        if (!result) {
                            utilities.updateCodeConfiguration('ansible', 'azureRestSpec', home, true);
                            this._outputChannel.appendLine("");
                            this._outputChannel.appendLine("REST API feature ready");
                            resolve(home);
                        }
                        else {
                            this._outputChannel.appendLine("Failed to acquire REST API specifications");
                            resolve("");
                        }
                    });
                }
            });
        });
    }
    queryAll(path) {
        let operations = {};
        let dirs = this.queryApiGroup(path);
        for (var idx = 0; idx < dirs.length; idx++) {
            let dir = dirs[idx];
            let files = this.queryDirectory(dir, true, ".json");
            if (files != null) {
                files.forEach(file => {
                    let swagger = require(dir + '/' + file);
                    for (var path in swagger.paths) {
                        for (var method in swagger.paths[path]) {
                            // add only if there are examples
                            if (swagger.paths[path][method]['x-ms-examples']) {
                                let operationId = swagger.paths[path][method].operationId;
                                let description = swagger.paths[path][method].description;
                                if (!operations[operationId]) {
                                    operations[operationId] = { 'label': operationId, 'description': description, 'files': [], 'path': path, 'method': method };
                                }
                                operations[operationId]['files'].push(dir + '/' + file);
                            }
                        }
                    }
                });
            }
            ;
        }
        return operations;
    }
    queryApiGroup(path) {
        return this.queryApiGroupInternal([path], []);
    }
    queryApiGroupInternal(dirsToQuery, finalDirs) {
        // if no more dirs to query, just respond via callback
        if (dirsToQuery.length == 0) {
            return finalDirs;
        }
        // get first dir to query
        let nextDir = dirsToQuery.pop();
        let dir = this.queryDirectory(nextDir, false, "");
        if (dir == null) {
            vscode.window.showErrorMessage("Failed to query: " + nextDir);
            return null;
        }
        else {
            let depth = nextDir.split('/specification/')[1].split('/').length;
            if (depth < 4) {
                for (var i = 0; i < dir.length; i++)
                    dirsToQuery.push(nextDir + '/' + dir[i]);
            }
            else {
                for (var i = 0; i < dir.length; i++)
                    finalDirs.push(nextDir + '/' + dir[i]);
            }
            return this.queryApiGroupInternal(dirsToQuery, finalDirs);
        }
    }
    queryDirectory(path, files, ext) {
        // just use filesystem
        try {
            let dirEntries = fs.readdirSync(path);
            let directories = [];
            for (var d in dirEntries) {
                if (ext != null && ext != "" && dirEntries[d].indexOf(ext) != (dirEntries[d].length - ext.length))
                    continue;
                if (!files) {
                    if (fs.lstatSync(path + '/' + dirEntries[d]).isDirectory()) {
                        directories.push(dirEntries[d]);
                    }
                }
                else {
                    if (!fs.lstatSync(path + '/' + dirEntries[d]).isDirectory()) {
                        directories.push(dirEntries[d]);
                    }
                }
            }
            return directories;
        }
        catch (e) {
            return [];
        }
    }
}
exports.RestSamples = RestSamples;
//# sourceMappingURL=restSamples.js.map