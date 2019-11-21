"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const GitHub = require("@octokit/rest");
const git_credential_node_1 = require("git-credential-node");
const moment = require("moment");
const vscode_1 = require("vscode");
const utils_1 = require("./utils");
class Milestone extends vscode_1.TreeItem {
    constructor(label, item) {
        super(label, vscode_1.TreeItemCollapsibleState.Collapsed);
        this.item = item;
        this.issues = [];
        this.contextValue = 'milestone';
    }
}
class Issue extends vscode_1.TreeItem {
    constructor(label, query, item) {
        super(label);
        this.query = query;
        this.item = item;
    }
}
class GitHubIssuesPrsProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.fetching = false;
        const subscriptions = context.subscriptions;
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.refresh', this.refresh, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.createIssue', this.createIssue, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.openMilestone', this.openMilestone, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.openIssue', this.openIssue, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.openPullRequest', this.openIssue, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.checkoutPullRequest', this.checkoutPullRequest, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.copyNumber', this.copyNumber, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.copyText', this.copyText, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.copyMarkdown', this.copyMarkdown, this));
        subscriptions.push(vscode_1.commands.registerCommand('githubIssuesPrs.copyUrl', this.copyUrl, this));
        subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(this.poll, this));
        const config = vscode_1.workspace.getConfiguration('github');
        this.username = config.get('username');
        this.repositories = config.get('repositories') || [];
        this.host = config.get('host') || 'github.com';
        subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(() => {
            const config = vscode_1.workspace.getConfiguration('github');
            const newUsername = config.get('username');
            const newRepositories = config.get('repositories') || [];
            const newHost = config.get('host');
            if (newUsername !== this.username || JSON.stringify(newRepositories) !== JSON.stringify(this.repositories) || newHost !== this.host) {
                this.username = newUsername;
                this.repositories = newRepositories;
                this.host = newHost || 'github.com';
                this.refresh();
            }
        }));
        subscriptions.push(vscode_1.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element instanceof Milestone) {
                return element.issues;
            }
            if (!this.children) {
                try {
                    this.fetching = true;
                    this.lastFetch = Date.now();
                    yield (this.children = this.fetchChildren());
                }
                finally {
                    this.fetching = false;
                }
            }
            return this.children;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.fetching) {
                this.children = undefined;
                yield this.getChildren();
                this._onDidChangeTreeData.fire();
            }
        });
    }
    createIssue() {
        return __awaiter(this, void 0, void 0, function* () {
            const remotes = yield this.getGitHubRemotes();
            if (!remotes.length) {
                return false;
            }
            let urls = remotes.map(remote => {
                let remoteItem = {
                    label: remote.owner + '/' + remote.repo,
                    description: '',
                    remote: remote
                };
                return remoteItem;
            });
            if (!urls.length) {
                vscode_1.window.showInformationMessage('There is no remote to get data from!');
                return;
            }
            const callback = (selectedRemote) => __awaiter(this, void 0, void 0, function* () {
                if (!selectedRemote) {
                    return;
                }
                const github = new GitHub(this.getAPIOption());
                if (selectedRemote.remote.username && selectedRemote.remote.password) {
                    github.authenticate({
                        type: 'basic',
                        username: selectedRemote.remote.username,
                        password: selectedRemote.remote.password
                    });
                }
                const data = yield github.repos.get({
                    owner: selectedRemote.remote.owner,
                    repo: selectedRemote.remote.repo
                });
                // TODO: Store in cache
                yield vscode_1.env.openExternal(vscode_1.Uri.parse(data.data.html_url + '/issues/new'));
            });
            // shortcut when there is just one remote
            if (urls.length === 1) {
                callback(urls[0]);
                return;
            }
            const pick = yield vscode_1.window.showQuickPick(urls, {
                placeHolder: 'Select the remote you want to create an issue on'
            });
            callback(pick);
        });
    }
    poll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.lastFetch || this.lastFetch + 30 * 60 * 1000 < Date.now()) {
                return this.refresh();
            }
        });
    }
    fetchChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const remotes = yield this.getGitHubRemotes();
            if (!remotes.length) {
                return [new vscode_1.TreeItem('No GitHub repositories found')];
            }
            const { username, password } = remotes[0];
            const assignee = this.username || username || undefined;
            if (!assignee) {
                const configure = new vscode_1.TreeItem('Configure "github.username" in settings');
                configure.command = {
                    title: 'Open Settings',
                    command: 'workbench.action.openGlobalSettings'
                };
                return [configure];
            }
            let issues;
            try {
                issues = yield this.fetchAllIssues(remotes, assignee, username || undefined, password || undefined);
            }
            catch (err) {
                if (err.code === 401 && password) {
                    issues = yield this.fetchAllIssues(remotes, assignee, username || undefined, undefined);
                }
                else {
                    throw err;
                }
            }
            if (!issues.length) {
                return [new vscode_1.TreeItem(`No issues found for @${assignee}`)];
            }
            const milestoneIndex = {};
            const milestones = [];
            for (const issue of issues) {
                const m = issue.item.milestone;
                const milestoneLabel = m && m.title || 'No Milestone';
                let milestone = milestoneIndex[milestoneLabel];
                if (!milestone) {
                    milestone = new Milestone(milestoneLabel, m);
                    milestoneIndex[milestoneLabel] = milestone;
                    milestones.push(milestone);
                }
                else if (m && m.due_on && !(milestone.item && milestone.item.due_on)) {
                    milestone.item = m;
                }
                milestone.issues.push(issue);
            }
            for (const milestone of milestones) {
                milestone.label = `${milestone.label} (${milestone.issues.length})`;
            }
            milestones.sort((a, b) => {
                // No Milestone
                if (!a.item) {
                    return 1;
                }
                else if (!b.item) {
                    return -1;
                }
                const t1 = this.parseDueOn(a);
                const t2 = this.parseDueOn(b);
                if (t1 && t2) {
                    if (!t1.isSame(t2)) {
                        return t1.isBefore(t2) ? -1 : 1;
                    }
                }
                else if (t1) {
                    return -1;
                }
                else if (t2) {
                    return 1;
                }
                return a.item.title.localeCompare(b.item.title);
            });
            if (milestones.length) {
                milestones[0].collapsibleState = vscode_1.TreeItemCollapsibleState.Expanded;
            }
            return milestones;
        });
    }
    parseDueOn(m) {
        if (!m.item) {
            return;
        }
        if (m.item.due_on) {
            const t = moment.utc(m.item.due_on, 'YYYY-MM-DDTHH:mm:ssZ');
            if (t.isValid()) {
                return t;
            }
        }
        if (m.item.title) {
            const t = moment.utc(m.item.title, 'MMMM YYYY');
            if (t.isValid()) {
                return t.add(14, 'days'); // "best guess"
            }
        }
    }
    fetchAllIssues(remotes, assignee, username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const github = new GitHub(this.getAPIOption());
            if (username && password) {
                github.authenticate({
                    type: 'basic',
                    username,
                    password
                });
            }
            const params = {
                q: `is:open assignee:${assignee}`,
                sort: 'created',
                order: 'asc',
                per_page: 100
            };
            const items = yield utils_1.fetchAll(github, github.search.issues(params));
            return items
                .map((item) => ({
                item,
                remote: remotes.find(remote => item.repository_url.endsWith(`/${remote.owner}/${remote.repo}`))
            }))
                .filter(({ remote }) => !!remote)
                .map(({ item, remote }) => {
                const issue = new Issue(`${item.title} (#${item.number})`, { remote: remote, assignee }, item);
                const icon = item.pull_request ? 'git-pull-request.svg' : 'bug.svg';
                issue.iconPath = {
                    light: this.context.asAbsolutePath(path.join('thirdparty', 'octicons', 'light', icon)),
                    dark: this.context.asAbsolutePath(path.join('thirdparty', 'octicons', 'dark', icon))
                };
                issue.command = {
                    title: 'Open',
                    command: item.pull_request ? 'githubIssuesPrs.openPullRequest' : 'githubIssuesPrs.openIssue',
                    arguments: [issue]
                };
                issue.contextValue = item.pull_request ? 'pull_request' : 'issue';
                return issue;
            });
        });
    }
    openMilestone(milestone) {
        return __awaiter(this, void 0, void 0, function* () {
            const issue = milestone.issues[0];
            const item = issue.item;
            const assignee = issue.query.assignee;
            const url = `https://github.com/issues?utf8=%E2%9C%93&q=is%3Aopen+${item.milestone ? `milestone%3A%22${item.milestone.title}%22` : 'no%3Amilestone'}${assignee ? '+assignee%3A' + assignee : ''}`;
            return vscode_1.env.openExternal(vscode_1.Uri.parse(url));
        });
    }
    openIssue(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.env.openExternal(vscode_1.Uri.parse(issue.item.html_url));
        });
    }
    checkoutPullRequest(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            const remote = issue.query.remote;
            const folder = remote.folders[0];
            if (!folder) {
                return vscode_1.window.showInformationMessage(`The repository '${remote.owner}/${remote.repo}' is not checked out in any open workspace folder.`);
            }
            const status = yield utils_1.exec(`git status --short --porcelain`, { cwd: folder.uri.fsPath });
            if (status.stdout) {
                return vscode_1.window.showInformationMessage(`There are local changes in the workspace folder. Commit or stash them before checking out the pull request.`);
            }
            const github = new GitHub(this.getAPIOption());
            const p = vscode_1.Uri.parse(issue.item.repository_url).path;
            const repo = path.basename(p);
            const owner = path.basename(path.dirname(p));
            const pr = yield github.pullRequests.get({ owner, repo, number: issue.item.number });
            const repo_login = pr.data.head.repo.owner.login;
            const user_login = pr.data.user.login;
            const clone_url = pr.data.head.repo.clone_url;
            const remoteBranch = pr.data.head.ref;
            try {
                let remote = undefined;
                const remotes = yield utils_1.exec(`git remote -v`, { cwd: folder.uri.fsPath });
                let m;
                const r = /^([^\s]+)\s+([^\s]+)\s+\(fetch\)/gm;
                while (m = r.exec(remotes.stdout)) {
                    let fetch_url = m[2];
                    if (!fetch_url.endsWith('.git')) {
                        fetch_url += '.git';
                    }
                    if (fetch_url === clone_url) {
                        remote = m[1];
                        break;
                    }
                }
                if (!remote) {
                    remote = yield vscode_1.window.showInputBox({
                        prompt: 'Name for the remote to add',
                        value: repo_login
                    });
                    if (!remote) {
                        return;
                    }
                    yield utils_1.exec(`git remote add ${remote} ${clone_url}`, { cwd: folder.uri.fsPath });
                }
                try {
                    yield utils_1.exec(`git fetch ${remote} ${remoteBranch}`, { cwd: folder.uri.fsPath });
                }
                catch (err) {
                    console.error(err);
                    // git fetch prints to stderr, continue
                }
                const localBranch = yield vscode_1.window.showInputBox({
                    prompt: 'Name for the local branch to checkout',
                    value: remoteBranch.startsWith(`${user_login}/`) ? remoteBranch : `${user_login}/${remoteBranch}`
                });
                if (!localBranch) {
                    return;
                }
                yield utils_1.exec(`git checkout -b ${localBranch} ${remote}/${remoteBranch}`, { cwd: folder.uri.fsPath });
            }
            catch (err) {
                console.error(err);
                // git checkout prints to stderr, continue
            }
        });
    }
    copyNumber(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.env.clipboard.writeText(`#${issue.item.number}`);
        });
    }
    copyText(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.env.clipboard.writeText(issue.label);
        });
    }
    copyMarkdown(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.env.clipboard.writeText(`[#${issue.item.number}](${issue.item.html_url})`);
        });
    }
    copyUrl(issue) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.env.clipboard.writeText(issue.item.html_url);
        });
    }
    getGitHubRemotes() {
        return __awaiter(this, void 0, void 0, function* () {
            const remotes = {};
            for (const folder of vscode_1.workspace.workspaceFolders || []) {
                try {
                    const { stdout } = yield utils_1.exec('git remote -v', { cwd: folder.uri.fsPath });
                    for (const url of new Set(utils_1.allMatches(/^[^\s]+\s+([^\s]+)/gm, stdout, 1))) {
                        const m = new RegExp(`[^\\s]*${this.host.replace(/\./g, '\\.')}[/:]([^/]+)\/([^ ]+)[^\\s]*`).exec(url);
                        if (m) {
                            const [url, owner, rawRepo] = m;
                            const repo = rawRepo.replace(/\.git$/, '');
                            let remote = remotes[`${owner}/${repo}`];
                            if (!remote) {
                                const data = yield git_credential_node_1.fill(url);
                                remote = { url, owner, repo, username: data && data.username, password: data && data.password, folders: [] };
                                remotes[`${owner}/${repo}`] = remote;
                            }
                            remote.folders.push(folder);
                        }
                    }
                }
                catch (e) {
                    // ignore
                }
            }
            for (const rawRepo of this.repositories) {
                const m = /^\s*([^/\s]+)\/([^/\s]+)\s*$/.exec(rawRepo);
                if (m) {
                    const [, owner, repo] = m;
                    let remote = remotes[`${owner}/${repo}`];
                    if (!remote) {
                        const url = `https://${this.host}/${owner}/${repo}.git`;
                        const data = yield git_credential_node_1.fill(url);
                        remote = { url, owner, repo, username: data && data.username, password: data && data.password, folders: [] };
                        remotes[`${owner}/${repo}`] = remote;
                    }
                }
            }
            return Object.keys(remotes)
                .map(key => remotes[key]);
        });
    }
    getAPIOption() {
        if (this.host === 'github.com') {
            return { host: 'api.github.com' };
        }
        else {
            return { host: this.host, pathPrefix: '/api/v3' };
        }
    }
}
exports.GitHubIssuesPrsProvider = GitHubIssuesPrsProvider;
//# sourceMappingURL=github-issues-prs.js.map