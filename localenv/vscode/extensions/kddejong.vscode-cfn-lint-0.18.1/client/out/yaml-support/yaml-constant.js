"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUDFORMATION_SCHEMA_FILE = exports.VSCODE_YAML_EXTENSION_ID = exports.CLOUDFORMATION_SCHEMA_PREFIX = exports.CLOUDFORMATION_SCHEMA = void 0;
const path = require("path");
exports.CLOUDFORMATION_SCHEMA = 'cloudformation';
exports.CLOUDFORMATION_SCHEMA_PREFIX = exports.CLOUDFORMATION_SCHEMA + '://schema/';
exports.VSCODE_YAML_EXTENSION_ID = 'redhat.vscode-yaml';
exports.CLOUDFORMATION_SCHEMA_FILE = path.join(__dirname, `../../../schema/all-spec.json`);
//# sourceMappingURL=yaml-constant.js.map