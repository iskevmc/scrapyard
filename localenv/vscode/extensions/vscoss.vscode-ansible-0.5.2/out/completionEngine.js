"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const completionData_1 = require("./completionData");
const vscode_1 = require("vscode");
const pattern_vars = new RegExp('(?:  vars:\\s+    )((\\S+)(: \\S+\\s+))+(?:  \\S+)');
const pattern_vars_list = new RegExp('[^]    (\\S+): \\S+\\s*?', 'gm');
class CompletionEngine {
    constructor() {
        completionData_1.parseAnsibleCompletionFile('').then((data) => {
            this.data = data;
        }).catch((err) => {
            console.log('failed to parse ansible data');
        });
    }
    getCompletionItems(prefix, line) {
        let result = [];
        if (/^with_/.test(prefix)) {
            Array.prototype.push.apply(result, completionData_1.getFuzzySuggestions(this.data.loopDirectives, prefix));
        }
        Array.prototype.push.apply(result, completionData_1.getFuzzySuggestions(this.data.directives, prefix));
        Array.prototype.push.apply(result, completionData_1.getFuzzySuggestions(this.data.modules, prefix));
        Array.prototype.push.apply(result, completionData_1.getFuzzySuggestions(this.data.codeSnippetsItem, prefix));
        return Promise.resolve(result);
    }
    getVariablesCompletionItem(document, prefix, line) {
        var items = [];
        var variables = CompletionEngine.getVaraibleList(document);
        if (variables && variables.length > 0) {
            for (let value of variables) {
                var item = {
                    label: value,
                    kind: vscode_1.CompletionItemKind.Variable,
                };
                items.push(item);
            }
        }
        return Promise.resolve(items);
    }
    static getVaraibleList(document) {
        var result = [];
        if (!document) {
            return result;
        }
        var matches = pattern_vars.exec(document.getText());
        if (matches) {
            var vars = matches[0];
            var fieldMatch = pattern_vars_list.exec(vars);
            while (fieldMatch) {
                result.push(fieldMatch[1]);
                fieldMatch = pattern_vars_list.exec(vars);
            }
        }
        return result;
    }
}
exports.CompletionEngine = CompletionEngine;
//# sourceMappingURL=completionEngine.js.map