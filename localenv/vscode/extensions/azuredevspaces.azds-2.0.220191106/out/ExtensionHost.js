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
const guid_typescript_1 = require("guid-typescript");
const telaug_1 = require("telaug");
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const FileLogWriter_1 = require("./logger/FileLogWriter");
const KubernetesPanelViewModel_1 = require("./viewModels/KubernetesPanelViewModel");
const Logger_1 = require("./logger/Logger");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const PackageReader_1 = require("./utility/PackageReader");
const WorkspaceFolderManager_1 = require("./WorkspaceFolderManager");
const ConnectManager_1 = require("./ConnectManager");
let _workspaceFolderManager;
let _reporter;
let _fileLogWriter;
let _logger;
let _kubernetesPanelViewModel;
// TODO: Move all the logic in a specific class, so that we only keep here the public interface we have to surface for our extension.
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspacesCommonId = guid_typescript_1.Guid.create();
        const packageReader = new PackageReader_1.PackageReader(context.asAbsolutePath(`./package.json`), _logger);
        _fileLogWriter = new FileLogWriter_1.FileLogWriter(context);
        yield _fileLogWriter.initializeAsync();
        // Initialize telemetry.
        _reporter = new vscode_extension_telemetry_1.default(packageReader.getProperty(`name`), packageReader.getProperty(`version`), packageReader.getProperty(`aiKey`));
        telaug_1.Telemetry.init(_reporter, /*featureName*/ null, () => _fileLogWriter.getLastLogs(), /*errorToString*/ null);
        _logger = new Logger_1.Logger(_fileLogWriter, `Ext. Host`);
        _logger.trace(TelemetryEvent_1.TelemetryEvent.Activation, {
            workspacesCommonId: workspacesCommonId.toString(),
            workspaceFoldersCount: (vscode.workspace.workspaceFolders != null ? vscode.workspace.workspaceFolders.length : 0).toString()
        });
        _workspaceFolderManager = new WorkspaceFolderManager_1.WorkspaceFolderManager(context, vscode.workspace.workspaceFolders, workspacesCommonId, packageReader, _fileLogWriter, _logger);
        _kubernetesPanelViewModel = new KubernetesPanelViewModel_1.KubernetesPanelViewModel(context, _logger);
        // TODO: Move prep command registration and workspace events handling to the WorkspaceFolderManager class.
        context.subscriptions.push(vscode.commands.registerCommand('azds.prep', () => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.runPrepCommandAsync(vscode.workspace.workspaceFolders);
        })));
        // handle the newly added folders to the workspace.
        context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((workspaceChangeEvent) => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.onDidChangeWorkspaceFoldersAsync(workspaceChangeEvent);
        })));
        // Debug event handlers
        context.subscriptions.push(vscode.debug.onDidStartDebugSession(e => {
            _workspaceFolderManager.onDidStartDebugSession(e);
        }));
        // AZDS connect open terminal
        context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(e => {
            _workspaceFolderManager.onDidTerminateDebugSession(e);
        }));
        // Register DebugConfigurationProvider. Under azds-connect, add environment variables to launched process
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("*", {
            resolveDebugConfiguration(workspaceFolder, debugConfiguration) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (workspaceFolder != null) {
                        return yield _workspaceFolderManager.provideDebugConfigurationAsync(workspaceFolder, debugConfiguration);
                    }
                });
            }
        }));
        // Register AZDS-Connect commands.
        context.subscriptions.push(vscode.commands.registerCommand('azds.connect.service', () => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.runConnectCommandAsync(vscode.workspace.workspaceFolders, ConnectManager_1.WizardType.Service);
        })));
        context.subscriptions.push(vscode.commands.registerCommand('azds.connect.pod', () => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.runConnectCommandAsync(vscode.workspace.workspaceFolders, ConnectManager_1.WizardType.Pod);
        })));
        context.subscriptions.push(vscode.commands.registerCommand('azds.connect.new', () => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.runConnectCommandAsync(vscode.workspace.workspaceFolders, ConnectManager_1.WizardType.New);
        })));
        context.subscriptions.push(vscode.commands.registerCommand('azds.connect.disconnect', () => __awaiter(this, void 0, void 0, function* () {
            yield _workspaceFolderManager.runConnectCommandAsync(vscode.workspace.workspaceFolders, ConnectManager_1.WizardType.Disconnect);
        })));
        _logger.trace(`Extension activated successfully`);
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        _logger.trace(`Extension deactivation`);
        _workspaceFolderManager.dispose();
        yield telaug_1.Telemetry.endAllPendingEvents();
        yield _reporter.dispose();
        yield _logger.closeAsync();
    });
}
exports.deactivate = deactivate;
//# sourceMappingURL=ExtensionHost.js.map