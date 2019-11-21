"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const vscode_1 = require("vscode");
const common_1 = require("./helper/common");
const telemetry_1 = require("./helper/telemetry");
const includes_1 = require("./markdown-extensions/includes");
const codesnippet_1 = require("./markdown-extensions/codesnippet");
const column_1 = require("./markdown-extensions/column");
const container_1 = require("./markdown-extensions/container");
const row_1 = require("./markdown-extensions/row");
const xref_1 = require("./xref/xref");
const div_1 = require("./markdown-extensions/div");
const image_1 = require("./markdown-extensions/image");
exports.output = vscode_1.window.createOutputChannel("docs-preview");
const telemetryCommand = "preview";
function activate(context) {
    const filePath = vscode_1.window.visibleTextEditors[0].document.fileName;
    const workingPath = filePath.replace(path_1.basename(filePath), "");
    exports.extensionPath = context.extensionPath;
    context.subscriptions.push(new telemetry_1.Reporter(context));
    const disposableSidePreview = vscode_1.commands.registerCommand("docs.showPreviewToSide", (uri) => {
        vscode_1.commands.executeCommand("markdown.showPreviewToSide");
        const commandOption = "show-preview-to-side";
        common_1.sendTelemetryData(telemetryCommand, commandOption);
    });
    const disposableStandalonePreview = vscode_1.commands.registerCommand("docs.showPreview", (uri) => {
        vscode_1.commands.executeCommand("markdown.showPreview");
        const commandOption = "show-preview-tab";
        common_1.sendTelemetryData(telemetryCommand, commandOption);
    });
    context.subscriptions.push(disposableSidePreview, disposableStandalonePreview);
    return {
        extendMarkdownIt(md) {
            return md.use(includes_1.include, { root: workingPath })
                .use(codesnippet_1.codeSnippets, { root: workingPath })
                .use(xref_1.xref)
                .use(codesnippet_1.custom_codeblock)
                .use(column_1.column_end)
                .use(container_1.container_plugin, "row", row_1.rowOptions)
                .use(container_1.container_plugin, "column", column_1.columnOptions)
                .use(div_1.div_plugin, "div", div_1.divOptions)
                .use(container_1.container_plugin, "image", image_1.imageOptions)
                .use(image_1.image_end);
        },
    };
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    exports.output.appendLine("Deactivating extension.");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map