// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LogLevel_1 = require("./LogLevel");
const TelemetryEvent_1 = require("./TelemetryEvent");
const telaug_1 = require("telaug");
class Logger {
    constructor(fileLogWriter, sourceIdentifier) {
        this._fileLogWriter = fileLogWriter;
        this._sourceIdentifier = sourceIdentifier;
        this.logFilePath = this._fileLogWriter.logFilePath;
    }
    trace(event, properties, error) {
        this.log(LogLevel_1.LogLevel.Trace, event, properties, error);
    }
    warning(event, error, properties) {
        this.log(LogLevel_1.LogLevel.Warning, event, properties, error);
    }
    error(event, error, properties) {
        this.log(LogLevel_1.LogLevel.Error, event, properties, error);
    }
    log(level, event, properties, error) {
        const messages = [];
        // Log telemetry if the event passed is of type TelemetryEvent.
        if (Object.values(TelemetryEvent_1.TelemetryEvent).includes(event)) {
            if (error == null) {
                telaug_1.Telemetry.sendTelemetryEvent(event, properties);
                messages.push(`Event: ${event}`);
            }
            else {
                // TODO: Replace by Telemetry.sendFault once it supports properties.
                const fault = new telaug_1.Fault(event, telaug_1.FaultType.Error, error.message, error);
                if (properties != null) {
                    for (const key in properties) {
                        fault.addProperty(key, properties[key]);
                    }
                }
                fault.send();
                messages.push(`Error: ${event}`);
            }
        }
        else {
            messages.push(event);
        }
        // Log an entry in the file log.
        if (properties != null) {
            messages.push(`<json>${this.cleanLineJumps(JSON.stringify(properties), /*replaceWith*/ ``)}</json>`);
        }
        if (error != null) {
            messages.push(`<stack>${this.cleanLineJumps(error.stack)}</stack>`);
        }
        const dateTime = new Date().toISOString();
        const formattedMessage = `${dateTime} | ${this._sourceIdentifier.slice(0, 10).padEnd(10)} | ${level} | ${messages.join(` `)}\n`;
        this._fileLogWriter.write(formattedMessage);
    }
    closeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._fileLogWriter.closeAsync();
        });
    }
    cleanLineJumps(message, replaceWith = `\\n`) {
        return message.replace(/(?:\r\n|\r|\n)/g, replaceWith);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map