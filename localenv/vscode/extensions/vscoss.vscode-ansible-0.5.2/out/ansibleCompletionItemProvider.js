"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const completionEngine_1 = require("./completionEngine");
const utilities = require("./utilities");
const pattern_variable = new RegExp('\\S+: \".*{{\\s*(}}.)*\"*\\s*#*.*$');
const pattern_firstLine = new RegExp('^#\\s*ansible-configured$', 'gm');
class AnsibleCompletionItemProvider {
    constructor() {
        this.completionEngine = new completionEngine_1.CompletionEngine();
    }
    provideCompletionItems(document, position, token) {
        if (!this.enableAutoCompletion(document)) {
            return;
        }
        let range = document.getWordRangeAtPosition(position);
        let prefix = range ? document.getText(range) : '';
        let lineText = document.lineAt(position.line).text;
        // provide auto completion for property name only, not on value
        if (!range) {
            return;
        }
        var index = lineText.indexOf(':');
        if (index != -1 && index < range.end.character) {
            return;
        }
        if (pattern_variable.exec(lineText)) {
            return this.completionEngine.getVariablesCompletionItem(document, prefix, lineText);
        }
        else {
            return this.completionEngine.getCompletionItems(prefix, lineText);
        }
    }
    enableAutoCompletion(document) {
        if (document.languageId == 'yaml' && !utilities.getCodeConfiguration('ansible', 'autocompletion')) {
            if (document.getText().indexOf('# ansible-configured') === -1) {
                return false;
            }
        }
        return true;
    }
}
exports.AnsibleCompletionItemProvider = AnsibleCompletionItemProvider;
//# sourceMappingURL=ansibleCompletionItemProvider.js.map