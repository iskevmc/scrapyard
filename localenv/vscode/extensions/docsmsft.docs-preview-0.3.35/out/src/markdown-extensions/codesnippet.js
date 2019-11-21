"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const extension_1 = require("../extension");
const vscode_1 = require("vscode");
exports.CODE_RE = /\[!code-(.+?)\s*\[\s*.+?\s*]\(\s*(.+?)\s*\)\s*]/i;
const ROOTPATH_RE = /.*~/gmi;
function codeSnippets(md, options) {
    const replaceCodeSnippetWithContents = (src, rootdir) => {
        let captureGroup;
        while ((captureGroup = exports.CODE_RE.exec(src))) {
            const repoRoot = vscode_1.workspace.workspaceFolders[0].uri.fsPath;
            let filePath = path_1.resolve(rootdir, captureGroup[2].trim());
            if (filePath.includes("~")) {
                filePath = filePath.replace(ROOTPATH_RE, repoRoot);
            }
            let mdSrc = fs_1.readFileSync(filePath, "utf8");
            mdSrc = `\`\`\`${captureGroup[1].trim()}\r\n${mdSrc}\r\n\`\`\``;
            src = src.slice(0, captureGroup.index) + mdSrc + src.slice(captureGroup.index + captureGroup[0].length, src.length);
        }
        return src;
    };
    const importCodeSnippet = (state) => {
        try {
            state.src = replaceCodeSnippetWithContents(state.src, options.root);
        }
        catch (error) {
            extension_1.output.appendLine(error);
        }
    };
    md.core.ruler.before("normalize", "codesnippet", importCodeSnippet);
}
exports.codeSnippets = codeSnippets;
function custom_codeblock(md, options) {
    const CODEBLOCK_RE = /([ ]{5})/g;
    const removeCodeblockSpaces = (src) => {
        let captureGroup;
        while ((captureGroup = CODEBLOCK_RE.exec(src))) {
            src = src.slice(0, captureGroup.index) + src.slice(captureGroup.index + captureGroup[0].length, src.length);
        }
        return src;
    };
    const customCodeBlock = (state) => {
        try {
            state.src = removeCodeblockSpaces(state.src);
        }
        catch (error) {
            extension_1.output.appendLine(error);
        }
    };
    md.core.ruler.before("normalize", "custom_codeblock", customCodeBlock);
}
exports.custom_codeblock = custom_codeblock;
//# sourceMappingURL=codesnippet.js.map