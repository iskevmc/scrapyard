"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const extension_1 = require("../extension");
const vscode_1 = require("vscode");
const INCLUDE_RE = /\[!include\s*\[\s*.+?\s*]\(\s*(.+?)\s*\)\s*]/i;
const FRONTMATTER_RE = /^---[\s\S]+?---/gmi;
const ROOTPATH_RE = /.*~/gmi;
function include(md, options) {
    const replaceIncludeWithContents = (src, rootdir) => {
        let captureGroup;
        while ((captureGroup = INCLUDE_RE.exec(src))) {
            const repoRoot = vscode_1.workspace.workspaceFolders[0].uri.fsPath;
            let filePath = path_1.resolve(rootdir, captureGroup[1].trim());
            if (filePath.includes("~")) {
                filePath = filePath.replace(ROOTPATH_RE, repoRoot);
            }
            let mdSrc = fs_1.readFileSync(filePath, "utf8");
            mdSrc = mdSrc.replace(FRONTMATTER_RE, "");
            src = src.slice(0, captureGroup.index) + mdSrc + src.slice(captureGroup.index + captureGroup[0].length, src.length);
        }
        return src;
    };
    const importInclude = (state) => {
        try {
            state.src = replaceIncludeWithContents(state.src, options.root);
        }
        catch (error) {
            extension_1.output.appendLine(error);
        }
    };
    md.core.ruler.before("normalize", "include", importInclude);
}
exports.include = include;
//# sourceMappingURL=includes.js.map