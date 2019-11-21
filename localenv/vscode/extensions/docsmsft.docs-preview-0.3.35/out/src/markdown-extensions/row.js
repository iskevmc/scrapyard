"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowOptions = {
    marker: ":",
    validate(params) {
        return params.trim().match(/row:::/g) || params.trim().match(/row-end:::/g);
    },
    render(tokens, idx) {
        if (tokens[idx].info.trim().match(/row:::/g)) {
            // opening tag
            return "<div class='row'>";
        }
        else {
            // closing tag
            return "</div>";
        }
    },
};
//# sourceMappingURL=row.js.map