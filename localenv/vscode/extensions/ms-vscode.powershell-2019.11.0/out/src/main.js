/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const CodeActions_1 = require("./features/CodeActions");
const Console_1 = require("./features/Console");
const CustomViews_1 = require("./features/CustomViews");
const DebugSession_1 = require("./features/DebugSession");
const DebugSession_2 = require("./features/DebugSession");
const DebugSession_3 = require("./features/DebugSession");
const DebugSession_4 = require("./features/DebugSession");
const DocumentFormatter_1 = require("./features/DocumentFormatter");
const Examples_1 = require("./features/Examples");
const ExpandAlias_1 = require("./features/ExpandAlias");
const ExtensionCommands_1 = require("./features/ExtensionCommands");
const FindModule_1 = require("./features/FindModule");
const GenerateBugReport_1 = require("./features/GenerateBugReport");
const GetCommands_1 = require("./features/GetCommands");
const HelpCompletion_1 = require("./features/HelpCompletion");
const NewFileOrProject_1 = require("./features/NewFileOrProject");
const OpenInISE_1 = require("./features/OpenInISE");
const PesterTests_1 = require("./features/PesterTests");
const RemoteFiles_1 = require("./features/RemoteFiles");
const SelectPSSARules_1 = require("./features/SelectPSSARules");
const ShowHelp_1 = require("./features/ShowHelp");
const logging_1 = require("./logging");
const session_1 = require("./session");
const Settings = require("./settings");
const utils_1 = require("./utils");
// The most reliable way to get the name and version of the current extension.
// tslint:disable-next-line: no-var-requires
const PackageJSON = require("../../package.json");
// NOTE: We will need to find a better way to deal with the required
//       PS Editor Services version...
const requiredEditorServicesVersion = "1.12.1";
// the application insights key (also known as instrumentation key) used for telemetry.
const AI_KEY = "AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217";
let logger;
let sessionManager;
let extensionFeatures = [];
let telemetryReporter;
const documentSelector = [
    { language: "powershell", scheme: "file" },
    { language: "powershell", scheme: "untitled" },
];
function activate(context) {
    checkForUpdatedVersion(context);
    // create telemetry reporter on extension activation
    telemetryReporter = new vscode_extension_telemetry_1.default(PackageJSON.name, PackageJSON.version, AI_KEY);
    vscode.languages.setLanguageConfiguration(utils_1.PowerShellLanguageId, {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\'\"\,\.\<\>\/\?\s]+)/g,
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/,
        },
        comments: {
            lineComment: "#",
            blockComment: ["<#", "#>"],
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: { indentAction: vscode.IndentAction.IndentOutdent, appendText: " * " },
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: { indentAction: vscode.IndentAction.None, appendText: " * " },
            },
            {
                // e.g.  * ...|
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: vscode.IndentAction.None, appendText: "* " },
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: { indentAction: vscode.IndentAction.None, removeText: 1 },
            },
            {
                // e.g.  *-----*/|
                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                action: { indentAction: vscode.IndentAction.None, removeText: 1 },
            },
        ],
    });
    // Create the logger
    logger = new logging_1.Logger();
    // Set the log level
    const extensionSettings = Settings.load();
    logger.MinimumLogLevel = logging_1.LogLevel[extensionSettings.developer.editorServicesLogLevel];
    sessionManager =
        new session_1.SessionManager(requiredEditorServicesVersion, logger, documentSelector, telemetryReporter);
    // Create features
    extensionFeatures = [
        new Console_1.ConsoleFeature(logger),
        new Examples_1.ExamplesFeature(),
        new OpenInISE_1.OpenInISEFeature(),
        new GenerateBugReport_1.GenerateBugReportFeature(sessionManager),
        new ExpandAlias_1.ExpandAliasFeature(logger),
        new GetCommands_1.GetCommandsFeature(logger),
        new ShowHelp_1.ShowHelpFeature(logger),
        new FindModule_1.FindModuleFeature(),
        new PesterTests_1.PesterTestsFeature(sessionManager),
        new ExtensionCommands_1.ExtensionCommandsFeature(logger),
        new SelectPSSARules_1.SelectPSSARulesFeature(logger),
        new CodeActions_1.CodeActionsFeature(logger),
        new NewFileOrProject_1.NewFileOrProjectFeature(),
        new DocumentFormatter_1.DocumentFormatterFeature(logger, documentSelector),
        new RemoteFiles_1.RemoteFilesFeature(),
        new DebugSession_1.DebugSessionFeature(context, sessionManager),
        new DebugSession_2.PickPSHostProcessFeature(),
        new DebugSession_4.SpecifyScriptArgsFeature(context),
        new HelpCompletion_1.HelpCompletionFeature(logger),
        new CustomViews_1.CustomViewsFeature(),
        new DebugSession_3.PickRunspaceFeature(),
    ];
    sessionManager.setExtensionFeatures(extensionFeatures);
    if (extensionSettings.startAutomatically) {
        sessionManager.start();
    }
}
exports.activate = activate;
function checkForUpdatedVersion(context) {
    const showReleaseNotes = "Show Release Notes";
    const powerShellExtensionVersionKey = "powerShellExtensionVersion";
    const storedVersion = context.globalState.get(powerShellExtensionVersionKey);
    if (!storedVersion) {
        // TODO: Prompt to show User Guide for first-time install
    }
    else if (PackageJSON.version !== storedVersion) {
        vscode
            .window
            .showInformationMessage(`The PowerShell extension has been updated to version ${PackageJSON.version}!`, showReleaseNotes)
            .then((choice) => {
            if (choice === showReleaseNotes) {
                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(path.resolve(__dirname, "../../CHANGELOG.md")));
            }
        });
    }
    context.globalState.update(powerShellExtensionVersionKey, PackageJSON.version);
}
function deactivate() {
    // Clean up all extension features
    extensionFeatures.forEach((feature) => {
        feature.dispose();
    });
    // Dispose of the current session
    sessionManager.dispose();
    // Dispose of the logger
    logger.dispose();
    // Dispose of telemetry reporter
    telemetryReporter.dispose();
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map