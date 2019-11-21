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
const child_process_1 = require("child_process");
const Event_1 = require("../utility/Event");
// Runs commands in new process and returns results.
class CommandRunner {
    constructor(currentWorkingDirectory = null, commandEnvironmentVariables = null) {
        this._outputEmitted = new Event_1.EventSource();
        this._options = {
            cwd: currentWorkingDirectory,
            env: commandEnvironmentVariables
        };
    }
    get outputEmitted() {
        return this._outputEmitted;
    }
    // Runs a command with args and returns the output/error result.
    // Because of limitations of child_process.spawn on Windows, this method can only be used
    // if "command" corresponds to an executable. If not, use "runThroughExecAsync" instead.
    // https://nodejs.org/api/child_process.html#child_process_spawning_bat_and_cmd_files_on_windows
    runAsync(command, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandWithArgs = `${command} ${args.join(` `)}`;
            const spawnOptions = { detached: true };
            Object.assign(spawnOptions, this._options);
            const process = child_process_1.spawn(command, args, spawnOptions);
            return yield this.handleProcessOutputAsync(process, commandWithArgs);
        });
    }
    // "runAsync", implemented using child_process.spawn, should be the default choice for running commands.
    // However, in specific cases, running commands through child_process.exec might be needed.
    runThroughExecAsync(command, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandWithArgs = `${command} ${args.join(` `)}`;
            const process = child_process_1.exec(commandWithArgs, this._options);
            return yield this.handleProcessOutputAsync(process, commandWithArgs);
        });
    }
    handleProcessOutputAsync(process, commandWithArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let outputData = ``;
                process.stdout.on(`data`, (data) => {
                    outputData += data.toString();
                    this._outputEmitted.trigger(data.toString());
                });
                let errorData = ``;
                process.stderr.on(`data`, (data) => {
                    errorData += data.toString();
                    this._outputEmitted.trigger(data.toString());
                });
                process.on(`error`, (error) => {
                    const errorMessage = `Failed to execute: ${commandWithArgs}. Error: ${error.message}`;
                    errorData += errorMessage;
                    this._outputEmitted.trigger(errorMessage);
                    reject(new Error(errorData));
                });
                process.on(`exit`, (code) => {
                    if (code != 0) {
                        reject(new Error(errorData));
                        return;
                    }
                    resolve(outputData);
                });
            });
        });
    }
}
exports.CommandRunner = CommandRunner;
//# sourceMappingURL=CommandRunner.js.map