// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// TODO (950284): Add unit-tests.
class EventSource {
    constructor() {
        this._subscribers = [];
    }
    /** Subscribe to this event.
     * @param handler that will be used.
     * @return IReleasable to be able to unsubscribe to the event.
     */
    subscribe(handler) {
        this._subscribers.push(handler);
        return {
            release: () => {
                // Index of the element could have changed a lot so we need to search for it and remove if we find it.
                const index = this._subscribers.indexOf(handler);
                if (index > -1) {
                    this._subscribers.splice(index, 1);
                }
            },
        };
    }
    /** Notify all event subscribers.
     * @param event The event object that will be sent.
     */
    trigger(event) {
        // Notify our subscribers, looping in reverse order to avoid issues when a subscriber removes itself from the list.
        for (let i = this._subscribers.length - 1; i >= 0; --i) {
            this._subscribers[i](event);
        }
    }
}
exports.EventSource = EventSource;
//# sourceMappingURL=Event.js.map