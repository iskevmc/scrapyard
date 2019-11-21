"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Transport = require("winston-transport");
class OutputChannelTransport extends Transport {
    constructor(options) {
        super(options);
        this.outputChannel = options.outputChannel;
    }
    log(info, next) {
        setImmediate(() => {
            this.outputChannel.appendLine(info.message);
        });
        next();
    }
}
exports.OutputChannelTransport = OutputChannelTransport;
//# sourceMappingURL=outputChannelTransport.js.map