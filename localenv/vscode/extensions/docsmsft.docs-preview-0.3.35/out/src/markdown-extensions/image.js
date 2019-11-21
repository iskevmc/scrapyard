"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extension_1 = require("../extension");
exports.imageOptions = {
    marker: ":",
    validate(params) {
        return params.trim().match(/image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?((type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?)?:::/g)
            || params.trim().match(/image-end:::/g);
    },
    render(tokens, idx) {
        const RE = /image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?((type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?)?:::/gm;
        const start = RE.exec(tokens[idx].info.trim());
        if (start) {
            const source = start[start.indexOf("source") + 1];
            // opening tag
            return `<img src=${source}>`;
        }
        else {
            // closing tag
            return "";
        }
    },
};
// Sets the type complex to each of the positions type can be in. For example, type, source, alt-text vs source, type, alt-text
exports.IMAGE_END_RE = /(?<=:::image(\s)?(type|source|alt-text)="complex"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?:::)[^]+?:::image-end:::|(?<=:::image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?(type|source|alt-text)="complex"(\s)?:::)[^]+?:::image-end:::|(?<=:::image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)"\s(type|source|alt-text)="complex"(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?:::)[^]+?:::image-end:::/gm;
exports.IMAGE_ALL_RE = /:::image(\s)?(type|source|alt-text)="complex"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?:::[^]+?:::image-end:::|:::image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)"\s(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?(type|source|alt-text)="complex"(\s)?:::[^]+?:::image-end:::|:::image(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)"\s(type|source|alt-text)="complex"(\s)?(type|source|alt-text)="([a-zA-Z0-9_.\/ -]+)?"(\s)?:::[^]+?:::image-end:::|((.:*)(.\s*)(image)(.\s*)(.*)(.:*))/gm;
function image_end(md) {
    const replaceImageEnd = (src) => {
        let captureGroup;
        while ((captureGroup = exports.IMAGE_END_RE.exec(src))) {
            src = src.slice(0, captureGroup.index) + src.slice(captureGroup.index + captureGroup[0].length, src.length);
        }
        return src;
    };
    const importImageEnd = (state) => {
        try {
            state.src = replaceImageEnd(state.src);
        }
        catch (error) {
            extension_1.output.appendLine(error);
        }
    };
    md.core.ruler.before("normalize", "imageclose", importImageEnd);
}
exports.image_end = image_end;
//# sourceMappingURL=image.js.map