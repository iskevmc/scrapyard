"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const fs = require("fs-extra");
const path_1 = require("path");
// tslint:disable-next-line:no-implicit-dependencies
const readlineSync = require("readline-sync");
const uuid_1 = require("uuid");
const directory = '.changes/next-release';
const changeTypes = ['Breaking Change', 'Feature', 'Bug Fix', 'Deprecation', 'Removal', 'Test'];
function promptForType() {
    while (true) {
        const response = readlineSync.keyInSelect(changeTypes, 'Please enter the type of change');
        if (response === -1) {
            console.log('Cancelling change');
            process.exit(0);
        }
        if (response >= 0 && response < changeTypes.length) {
            return changeTypes[response];
        }
        console.log('Invalid change type, change type must be between 0 and 5');
    }
}
function promptForChange() {
    while (true) {
        const response = readlineSync.question('Change message: ').trim();
        if (response) {
            return response;
        }
    }
}
fs.mkdirpSync(directory);
const type = promptForType();
const description = promptForChange();
const contents = {
    type: type,
    description: description
};
const fileName = `${type}-${uuid_1.v4()}.json`;
const path = path_1.join(directory, fileName);
fs.writeFileSync(path, JSON.stringify(contents, undefined, '\t'));
console.log(`Change log written to ${path}`);
child_process.execSync(`git add ${directory}`);
console.log('Change log added to git working directory');
//# sourceMappingURL=newChange.js.map