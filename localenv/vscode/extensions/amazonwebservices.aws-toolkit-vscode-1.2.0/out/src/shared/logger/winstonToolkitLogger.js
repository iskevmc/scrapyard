"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const winston = require("winston");
const outputChannelTransport_1 = require("./outputChannelTransport");
function formatMessage(level, message) {
    // TODO : Look into winston custom formats - https://github.com/winstonjs/winston#creating-custom-formats
    let final = `${makeLogTimestamp()} [${level.toUpperCase()}]:`;
    for (const chunk of message) {
        if (chunk instanceof Error) {
            final = `${final} ${chunk.stack}`;
        }
        else {
            final = `${final} ${chunk}`;
        }
    }
    return final;
}
function makeLogTimestamp() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}
class WinstonToolkitLogger {
    constructor(logLevel) {
        this.disposed = false;
        this.logger = winston.createLogger({
            format: winston.format.combine(WinstonToolkitLogger.LOG_FORMAT),
            level: logLevel
        });
    }
    logToFile(logPath) {
        this.logger.add(new winston.transports.File({ filename: logPath }));
    }
    logToOutputChannel(outputChannel) {
        this.logger.add(new outputChannelTransport_1.OutputChannelTransport({
            outputChannel
        }));
    }
    debug(...message) {
        this.writeToLogs(message, 'debug');
    }
    verbose(...message) {
        this.writeToLogs(message, 'verbose');
    }
    info(...message) {
        this.writeToLogs(message, 'info');
    }
    warn(...message) {
        this.writeToLogs(message, 'warn');
    }
    error(...message) {
        this.writeToLogs(message, 'error');
    }
    dispose() {
        if (!this.disposed) {
            this.logger.close();
            this.logger.clear();
            this.disposed = true;
        }
    }
    writeToLogs(message, level) {
        if (this.disposed) {
            throw new Error('Cannot write to disposed logger');
        }
        const formattedMessage = formatMessage(level, message);
        this.logger.log(level, formattedMessage);
    }
}
// forces winston to output only pre-formatted message
WinstonToolkitLogger.LOG_FORMAT = winston.format.printf(({ message }) => {
    return message;
});
exports.WinstonToolkitLogger = WinstonToolkitLogger;
//# sourceMappingURL=winstonToolkitLogger.js.map