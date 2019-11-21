'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const github_issues_prs_1 = require("./github-issues-prs");
function activate(context) {
    vscode_1.window.registerTreeDataProvider('githubIssuesPrs', new github_issues_prs_1.GitHubIssuesPrsProvider(context));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map