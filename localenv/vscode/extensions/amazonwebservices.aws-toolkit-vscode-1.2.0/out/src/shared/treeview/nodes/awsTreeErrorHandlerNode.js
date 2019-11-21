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
const logger_1 = require("../../logger");
const awsTreeNodeBase_1 = require("./awsTreeNodeBase");
const errorNode_1 = require("./errorNode");
class AWSTreeErrorHandlerNode extends awsTreeNodeBase_1.AWSTreeNodeBase {
    constructor(label, collapsibleState) {
        super(label, collapsibleState);
    }
    handleErrorProneOperation(operation, errorLabel) {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = logger_1.getLogger();
            this.errorNode = undefined;
            try {
                yield operation();
            }
            catch (err) {
                const error = err;
                this.errorNode = new errorNode_1.ErrorNode(this, error, errorLabel);
                // TODO: Make the possibility to ErrorNode attempt to retry the operation
                logger.error(error);
            }
        });
    }
}
exports.AWSTreeErrorHandlerNode = AWSTreeErrorHandlerNode;
//# sourceMappingURL=awsTreeErrorHandlerNode.js.map