'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("vscode-languageserver/lib/main");
class YamlDocumentSymbols {
    findDocumentSymbols(document, doc) {
        if (!doc || doc['documents'].length === 0) {
            return null;
        }
        let results = [];
        for (let yamlDoc in doc['documents']) {
            let currentYamlDoc = doc['documents'][yamlDoc];
            if (currentYamlDoc.root) {
                results = results.concat(this.parseSymbols(document, currentYamlDoc.root, void 0));
            }
        }
        return results;
    }
    parseSymbols(document, node, containerName) {
        var results = [];
        if (node.type === 'array') {
            node.items.forEach((node) => {
                results = results.concat(this.parseSymbols(document, node, containerName));
            });
        }
        else if (node.type === 'object') {
            let objectNode = node;
            objectNode.properties.forEach((property) => {
                let location = main_1.Location.create(document.uri, main_1.Range.create(document.positionAt(property.start), document.positionAt(property.end)));
                let valueNode = property.value;
                if (valueNode) {
                    results.push({ name: property.key.getValue(), kind: main_1.SymbolKind.Variable, location: location, containerName: containerName });
                    let childContainerName = containerName ? containerName + '.' + property.key.value : property.key.value;
                    results = results.concat(this.parseSymbols(document, valueNode, childContainerName));
                }
            });
        }
        return results;
    }
}
exports.YamlDocumentSymbols = YamlDocumentSymbols;
//# sourceMappingURL=yamlDocumentSymbol.js.map