"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Timeout that can handle both cancellation token-style and time limit-style timeout situations.
 * @param timeoutLength Length of timeout duration (in ms)
 */
class Timeout {
    constructor(timeoutLength) {
        this._startTime = new Date().getTime();
        this._endTime = this._startTime + timeoutLength;
        this._timer = new Promise((resolve, reject) => {
            this._timerTimeout = setTimeout(reject, timeoutLength);
            this._timerResolve = resolve;
        });
    }
    /**
     * Returns the amount of time left from the initialization of time Timeout object and with the timeoutLength
     * Bottoms out at 0
     */
    get remainingTime() {
        const remainingTime = this._endTime - new Date().getTime();
        return remainingTime > 0 ? remainingTime : 0;
    }
    /**
     * Returns a promise that times out after timeoutLength ms have passed since Timeout object initialization
     * Use this in Promise.race() calls in order to time out awaited functions
     * Once this timer has finished, cannot be restarted
     */
    get timer() {
        return this._timer;
    }
    /**
     * Returns the elapsed time from the initial Timeout object creation
     * Useful for telemetry reporting!
     */
    get elapsedTime() {
        return new Date().getTime() - this._startTime;
    }
    /**
     * Kills the internal timer and resolves the timer's promise
     * Helpful for tests!
     */
    killTimer() {
        if (this._timerTimeout) {
            clearTimeout(this._timerTimeout);
        }
        if (this._timerResolve) {
            this._timerResolve();
        }
    }
}
exports.Timeout = Timeout;
//# sourceMappingURL=timeoutUtils.js.map