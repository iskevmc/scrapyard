'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("vscode-languageserver/lib/main");
const path = require("path");
const fsextra = require("fs-extra");
const ansibleDataFile = path.join(__dirname, '../../../snippets/ansible-data.json');
class YAMLHover {
    constructor(promiseConstructor) {
        this.promise = promiseConstructor || Promise;
        this.enable = true;
        this.moduleNames = this.getModuleList();
    }
    configure(enable) {
        this.enable = enable;
    }
    doHover(document, position, jsonDoc) {
        if (!this.enable) {
            return this.promise.resolve(void 0);
        }
        let offset = document.offsetAt(position);
        let currentDoc = matchOffsetToDocument(offset, jsonDoc);
        if (!currentDoc) {
            return this.promise.resolve(void 0);
        }
        let node = currentDoc.getNodeFromOffset(offset);
        if (!node || (node.type === 'object' || node.type === 'array') && offset > node.start + 1 && offset < node.end - 1) {
            return this.promise.resolve(void 0);
        }
        if (node.type === 'string' && node.isKey && node.value != 'name') {
            if (node.parent && node.parent.type === 'property') {
                let parent = node.parent;
                if (parent.parent && parent.parent.type === 'object') {
                    let grandparent = parent.parent;
                    if ((grandparent.parent && grandparent.parent.type === 'array') ||
                        (grandparent.type === 'object' && grandparent.parent.type === 'array' && grandparent.parent.parent === null)) {
                        let taskNode = grandparent.parent;
                        if (taskNode.location === 'tasks' || (taskNode.type === 'array' && this.moduleNames.indexOf(node.value) > -1)) {
                            let hoverRange = main_1.Range.create(document.positionAt(node.start), document.positionAt(node.end));
                            return Promise.resolve(this.createHover(node.getValue(), hoverRange)).then();
                        }
                    }
                }
            }
        }
        return this.promise.resolve(void 0);
    }
    createHover(content, range) {
        let result = {
            contents: `module, documentation at http://docs.ansible.com/ansible/${content}_module.html`,
            range: range
        };
        return result;
    }
    getModuleList() {
        const data = JSON.parse(fsextra.readFileSync(ansibleDataFile, 'utf8'));
        let moduleNames = [];
        data.modules.forEach((module) => {
            moduleNames.push(module.module);
        });
        return moduleNames;
    }
}
exports.YAMLHover = YAMLHover;
function matchOffsetToDocument(offset, jsonDocuments) {
    for (let index in jsonDocuments.documents) {
        let doc = jsonDocuments.documents[index];
        if (doc.root && doc.root.end >= offset && doc.root.start <= offset) {
            return doc;
        }
    }
}
exports.matchOffsetToDocument = matchOffsetToDocument;
//# sourceMappingURL=yamlHover.js.map