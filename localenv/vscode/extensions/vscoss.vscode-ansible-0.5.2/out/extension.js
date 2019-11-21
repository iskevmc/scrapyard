'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require("path");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const utilities = require("./utilities");
const cloudShellRunner_1 = require("./cloudShellRunner");
const terminalExecutor_1 = require("./terminalExecutor");
const ansibleCompletionItemProvider_1 = require("./ansibleCompletionItemProvider");
const telemetryClient_1 = require("./telemetryClient");
const dockerRunner_1 = require("./dockerRunner");
const localAnsibleRunner_1 = require("./localAnsibleRunner");
const sshRunner_1 = require("./sshRunner");
const folderSyncer_1 = require("./folderSyncer");
const fileSyncer_1 = require("./fileSyncer");
const restSamples_1 = require("./restSamples");
const constants_1 = require("./constants");
const documentSelector = [
    { language: 'yaml', scheme: 'file' },
    { language: 'yaml', scheme: 'untitled' },
    { language: 'ansible', scheme: 'file' },
    { language: 'ansible', scheme: 'untitled' }
];
function activate(context) {
    console.log('Congratulations, your extension "vscode-ansible" is now active!');
    var outputChannel = vscode.window.createOutputChannel("VSCode extension for Ansible");
    telemetryClient_1.TelemetryClient.sendEvent('activate');
    utilities.generateCredentialsFile();
    const triggerCharacters = ' abcdefghijklmnopqrstuvwxyz'.split('');
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(documentSelector, new ansibleCompletionItemProvider_1.AnsibleCompletionItemProvider(), ...triggerCharacters));
    var dockerRunner = new dockerRunner_1.DockerRunner(outputChannel);
    var localansibleRunner = new localAnsibleRunner_1.LocalAnsibleRunner(outputChannel);
    var cloudShellRunner = new cloudShellRunner_1.CloudShellRunner(outputChannel);
    var sshRunner = new sshRunner_1.SSHRunner(outputChannel);
    var folderSyncer = new folderSyncer_1.FolderSyncer(outputChannel);
    var fileSyncer = new fileSyncer_1.FileSyncer(outputChannel);
    var restSamples = new restSamples_1.RestSamples(outputChannel);
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ansible.playbook-in-docker', (playbook) => {
        dockerRunner.runPlaybook(playbook ? playbook.fsPath : null);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ansible.playbook-in-localansible', (playbook) => {
        localansibleRunner.runPlaybook(playbook ? playbook.fsPath : null);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ansible.cloudshell', (playbook) => {
        cloudShellRunner.runPlaybook(playbook ? playbook.fsPath : null);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ansible.ssh', (playbook) => {
        sshRunner.runPlaybook(playbook ? playbook.fsPath : null);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ansible.sync-folder-ssh', () => {
        let srcFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        folderSyncer.syncFolder(srcFolder, null, true);
    }));
    let disposable = vscode.commands.registerCommand('vscode-ansible.resource-module-samples', () => {
        restSamples.displayMenu();
    });
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((configChange) => {
        if (configChange.affectsConfiguration("ansible." + constants_1.Constants.Config_fileCopyConfig)) {
            let config = vscode.workspace.getConfiguration('ansible').get('fileCopyConfig');
            fileSyncer.onConfigurationChange(config);
        }
    }));
    context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal) => {
        terminalExecutor_1.TerminalExecutor.onDidCloseTerminal(closedTerminal);
    }));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(listener => {
        fileSyncer.copyFiles(null, listener.fileName);
    }));
    // start language client
    var serverModule = path.join(context.extensionPath, 'out', 'server', 'server.js');
    var debugOptions = { execArgv: ['--nolazy', "--inspect=6003"] };
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    var clientOptions = {
        documentSelector,
        synchronize: {
            configurationSection: 'ansible',
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.?(e)y?(a)ml')
        }
    };
    var client = new vscode_languageclient_1.LanguageClient('ansible', 'Ansible Playbook Language Server', serverOptions, clientOptions);
    context.subscriptions.push(client.start());
    vscode.languages.setLanguageConfiguration('yaml', {
        wordPattern: /("(?:[^\\\"]*(?:\\.)?)*"?)|[^\s{}\[\],:]+/
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map