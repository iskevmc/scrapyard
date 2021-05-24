"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJson = exports.getYamlMappingNode = exports.getYamlMappingValue = exports.equalIgnoreCase = exports.StringComparison = void 0;
const fs = require("fs");
const _ = require("lodash");
var StringComparison;
(function (StringComparison) {
    StringComparison[StringComparison["Ordinal"] = 0] = "Ordinal";
    StringComparison[StringComparison["OrdinalIgnoreCase"] = 1] = "OrdinalIgnoreCase";
})(StringComparison = exports.StringComparison || (exports.StringComparison = {}));
// test whether two strings are equal ignore case
function equalIgnoreCase(a, b) {
    return _.isString(a) && _.isString(b) && a.toLowerCase() === b.toLowerCase();
}
exports.equalIgnoreCase = equalIgnoreCase;
// Get the string value of key in a yaml mapping node(parsed by node-yaml-parser)
// eg: on the following yaml, this method will return 'value1' for key 'key1'
//
//      key1: value1
//      key2: value2
//
function getYamlMappingValue(mapRootNode, key, ignoreCase = StringComparison.Ordinal) {
    // TODO, unwrap quotes
    if (!key) {
        return undefined;
    }
    const keyValueItem = mapRootNode.mappings.find((mapping) => mapping.key &&
        (ignoreCase === StringComparison.OrdinalIgnoreCase ? key === mapping.key.raw : equalIgnoreCase(key, mapping.key.raw)));
    return keyValueItem ? keyValueItem.value.raw : undefined;
}
exports.getYamlMappingValue = getYamlMappingValue;
// Get the string value of key in a yaml mapping node(parsed by node-yaml-parser)
// eg: on the following yaml, this method will return 'value1' for key 'key1'
//
//      key1: value1
//      key2: value2
//
function getYamlMappingNode(mapRootNode, key, ignoreCase = StringComparison.Ordinal) {
    // TODO, unwrap quotes
    if (!key) {
        return undefined;
    }
    const keyValueItem = mapRootNode.mappings.find((mapping) => mapping.key &&
        (ignoreCase === StringComparison.OrdinalIgnoreCase ? key === mapping.key.raw : equalIgnoreCase(key, mapping.key.raw)));
    return keyValueItem ? keyValueItem.value : undefined;
}
exports.getYamlMappingNode = getYamlMappingNode;
/**
 * Load json data from a json file.
 * @param {string} file
 * @returns the parsed data if no error occurs, otherwise undefined is returned
 */
function loadJson(file) {
    if (fs.existsSync(file)) {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
        catch (err) {
            // ignore
        }
    }
    return undefined;
}
exports.loadJson = loadJson;
//# sourceMappingURL=yaml-util.js.map