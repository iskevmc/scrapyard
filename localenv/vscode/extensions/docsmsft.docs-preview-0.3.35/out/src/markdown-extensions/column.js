"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extension_1 = require("../extension");
exports.columnOptions = {
    marker: ":",
    validate(params) {
        return params.trim().match(/column(\s+span="([1-9]+)?")?:::/g) || params.trim().match(/column-end:::/g);
    },
    render(tokens, idx) {
        const RE = /column((\s+)span="([1-9]+)?")?:::/g;
        const start = RE.exec(tokens[idx].info.trim());
        if (start) {
            if (start[3]) {
                return `<div class='column span${start[3]}'>`;
            }
            else {
                // opening tag
                return "<div class='column'>";
            }
        }
        else {
            // closing tag
            return "</div>";
        }
    },
};
function column_end(md, options) {
    const CODEBLOCK_RE = /(:::column-end:::)/g;
    const removeCodeblockSpaces = (src) => {
        let captureGroup;
        while ((captureGroup = CODEBLOCK_RE.exec(src))) {
            src = src.slice(0, captureGroup.index) + "\r\n:::column-end:::" + src.slice(captureGroup.index + captureGroup[0].length, src.length);
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
exports.column_end = column_end;
//# sourceMappingURL=column.js.map