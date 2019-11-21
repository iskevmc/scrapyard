"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const fs = require("fs-extra");
// tslint:disable-next-line: no-implicit-dependencies
const marked = require("marked");
const path = require("path");
/**
 * replaces relative paths with an `!!EXTENSIONROOT!!` token.
 * This makes it easier to swap in relative links when the extension loads.
 */
function translateReadmeToHtml(root) {
    const fileText = fs.readFileSync(path.join(root, 'extension-readme.md')).toString();
    const relativePathRegex = /]\(\.\//g;
    const transformedText = fileText.replace(relativePathRegex, '](!!EXTENSIONROOT!!/');
    marked(transformedText, (err, result) => {
        fs.writeFileSync(path.join(root, './quickStart.html'), result);
    });
}
/**
 * Do a best effort job of generating a git hash and putting it into the package
 */
function generateFileHash(root) {
    try {
        const response = child_process.execSync('git rev-parse HEAD');
        fs.outputFileSync(path.join(root, '.gitcommit'), response);
    }
    catch (e) {
        console.log(`Getting commit hash failed ${e}`);
    }
}
const repoRoot = path.dirname(__dirname);
translateReadmeToHtml(repoRoot);
generateFileHash(repoRoot);
//# sourceMappingURL=generateNonCodeFiles.js.map