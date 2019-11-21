"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const vscode = require("vscode");
const extensionGlobals_1 = require("../../shared/extensionGlobals");
const logger_1 = require("../../shared/logger");
function deleteCloudFormation(refresh, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        if (!node) {
            vscode.window.showErrorMessage(localize('AWS.message.error.cloudFormation.unsupported', 'Unable to delete a CloudFormation Stack. No stack provided.'));
            return;
        }
        const stackName = node.stackName;
        const responseYes = localize('AWS.generic.response.yes', 'Yes');
        const responseNo = localize('AWS.generic.response.no', 'No');
        try {
            const userResponse = yield vscode.window.showInformationMessage(localize('AWS.message.prompt.deleteCloudFormation', 'Are you sure you want to delete {0}?', stackName), responseYes, responseNo);
            if (userResponse === responseYes) {
                const client = extensionGlobals_1.ext.toolkitClientBuilder.createCloudFormationClient(node.regionCode);
                yield client.deleteStack(stackName);
                vscode.window.showInformationMessage(localize('AWS.message.info.cloudFormation.delete', 'Deleted CloudFormation Stack {0}', stackName));
                refresh();
            }
        }
        catch (err) {
            const error = err;
            vscode.window.showInformationMessage(localize('AWS.message.error.cloudFormation.delete', 'An error occurred while deleting {0}. Please check the stack events on the AWS Console', stackName));
            logger.error(error);
        }
    });
}
exports.deleteCloudFormation = deleteCloudFormation;
//# sourceMappingURL=deleteCloudFormation.js.map