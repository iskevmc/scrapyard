"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
process.env.CODE_TESTS_PATH = path_1.join(process.cwd(), 'out', 'src', 'integrationTest');
process.env.CODE_TESTS_WORKSPACE = path_1.join(process.cwd(), 'out', 'src', 'integrationTest-samples');
process.env.CODE_EXTENSIONS_PATH = process.cwd();
// Launch the VS Code Test Script
// tslint:disable-next-line: no-var-requires
require('../node_modules/vscode/bin/test');
//# sourceMappingURL=integrationTest.js.map