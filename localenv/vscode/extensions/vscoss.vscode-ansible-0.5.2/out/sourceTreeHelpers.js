'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("./constants");
var fs = require('fs');
var request = require('request');
const GithubApiUri = 'https://' + constants_1.Constants.GitHubApiHost;
const GithubRawContentUri = 'https://' + constants_1.Constants.GitHubRawContentHost;
class SourceTreeHelpers {
    constructor() { }
    queryDirectory(path, files, cb) {
        if (path.startsWith(GithubApiUri)) {
            // get list of directories from here:
            // https://api.github.com/Azure/azure-rest-api-specs/contents/
            // we will use fixed repo in our first release
            var http = require('https');
            let __this = this;
            http.get({
                host: constants_1.Constants.GitHubApiHost,
                path: path.substr(GithubApiUri.length),
                headers: { 'User-Agent': 'VSC Ansible Extension' }
            }, function (response) {
                // Continuously update stream with data
                var body = '';
                response.on('data', function (d) {
                    body += d;
                });
                if (response.statusMessage == "OK") {
                    response.on('end', function () {
                        var parsed = JSON.parse(body);
                        let items = [];
                        let groups = [];
                        for (var i in parsed) {
                            // list only directories and skip known directories that don't contain templates
                            if (parsed[i].type == "dir" && !parsed[i].name.startsWith('.')) {
                                groups.push(parsed[i].name);
                            }
                        }
                        cb(groups);
                    });
                }
                else {
                    vscode.window.showErrorMessage("Failed to fetch Azure REST API groups: " + response.statusCode + " " + response.statusMessage);
                    cb(null);
                }
            }).on('error', function (e) {
                vscode.window.showErrorMessage("Failed to fetch Azure REST API groups: " + e);
                cb(null);
            });
        }
        else {
            // just use filesystem
            try {
                let dirEntries = fs.readdirSync(path);
                let directories = [];
                for (var d in dirEntries) {
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
                cb(directories);
            }
            catch (e) {
                cb(null);
            }
        }
    }
    getJson(path, cb) {
        var http = require('https');
        let __this = this;
        if (path.startsWith('https://raw.githubusercontent.com')) {
            http.get({
                // XXX fix it for github
                host: constants_1.Constants.GitHubRawContentHost,
                path: path.split(constants_1.Constants.GitHubRawContentHost)[1],
                headers: { 'User-Agent': 'VSC Ansible Extension' }
            }, function (response) {
                if (response.statusMessage == "OK") {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        try {
                            var parsed = JSON.parse(body);
                            cb(parsed);
                        }
                        catch (e) {
                            vscode.window.showErrorMessage("Failed to parse 'azuredeploy.json'");
                            cb(null);
                        }
                    });
                }
                else if (response.statusCode == 404) {
                    vscode.window.showErrorMessage("Template file 'azuredeploy.json' not found.");
                    cb(null);
                }
                else {
                    vscode.window.showErrorMessage("Failed to fetch 'azuredeploy.json': " + response.statusCode + " " + response.statusMessage);
                    cb(null);
                }
            }).on('error', function (e) {
                vscode.window.showErrorMessage("Failed to fetch 'azuredeploy.json': " + e);
                cb(null);
            });
        }
        else {
            try {
                let content = require(path);
                cb(content);
            }
            catch (e) {
                cb(null);
            }
        }
    }
}
exports.SourceTreeHelpers = SourceTreeHelpers;
//# sourceMappingURL=sourceTreeHelpers.js.map