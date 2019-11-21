"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fsextra = require("fs-extra");
const vscode_1 = require("vscode");
const fuzzaldrin_plus_1 = require("fuzzaldrin-plus");
const path = require("path");
function parseAnsibleCompletionFile(sourcefile) {
    if (!sourcefile) {
        sourcefile = path.join(__dirname, '../snippets/ansible-data.json');
    }
    var data = JSON.parse(fsextra.readFileSync(sourcefile, 'utf8'));
    const snippetFile = path.join(__dirname, '../snippets/codesnippets.json');
    const codeSnippets = JSON.parse(fsextra.readFileSync(snippetFile, 'utf8'));
    let modules = [];
    let directives = [];
    let loopDirectives = [];
    let codeSnippetItems = [];
    if (data) {
        modules = data.modules.map((module) => {
            let item = new AnsibleCompletionItem(module.module, vscode_1.CompletionItemKind.Function);
            item.detail = 'module: \n' + `${module.short_description || ''}`;
            item.documentation = `http://docs.ansible.com/ansible/${module.module}_module.html`;
            if (module.deprecated) {
                item.detail = `(Deprecated) ${item.detail}`;
            }
            return item;
        });
        Object.keys(data.directives).forEach((key) => {
            let item = new AnsibleCompletionItem(key, vscode_1.CompletionItemKind.Keyword);
            item.detail = 'directive';
            item.documentation = `directive for ${data.directives[key].join(', ')}.`;
            directives.push(item);
        });
        loopDirectives = data.lookup_plugins.map((plugin) => {
            let item = new AnsibleCompletionItem(`with_${plugin}`, vscode_1.CompletionItemKind.Keyword);
            item.detail = 'loop directive';
            item.documentation = 'directive for loop';
            return item;
        });
    }
    const indent = '  ';
    if (codeSnippets) {
        Object.keys(codeSnippets).forEach((key) => {
            let snippet = codeSnippets[key];
            let item = new AnsibleCompletionItem(key + '_snippet', vscode_1.CompletionItemKind.Snippet);
            item.insertText = new vscode_1.SnippetString(snippet.body.join('\n' + indent));
            item.detail = snippet.description + ' (Ansible)';
            item.documentation = snippet.body.join('\n' + indent);
            item.filterText = snippet.prefix;
            codeSnippetItems.push(item);
        });
    }
    return Promise.resolve(new AnsibleCompletionData(modules, directives, loopDirectives, codeSnippetItems));
}
exports.parseAnsibleCompletionFile = parseAnsibleCompletionFile;
class AnsibleCompletionItem extends vscode_1.CompletionItem {
}
exports.AnsibleCompletionItem = AnsibleCompletionItem;
class AnsibleCompletionData {
    constructor(modules, directives, loopDirectives, codeSnippets) {
        this.modules = modules;
        this.directives = directives;
        this.loopDirectives = loopDirectives;
        this.codeSnippetsItem = codeSnippets;
    }
}
exports.AnsibleCompletionData = AnsibleCompletionData;
function getFuzzySuggestions(data, prefix) {
    return fuzzaldrin_plus_1.filter(data, prefix, { key: 'label' });
}
exports.getFuzzySuggestions = getFuzzySuggestions;
//# sourceMappingURL=completionData.js.map