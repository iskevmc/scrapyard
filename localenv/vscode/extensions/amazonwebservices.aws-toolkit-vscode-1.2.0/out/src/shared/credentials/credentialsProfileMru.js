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
/**
 * Tracks the credentials selected by the user, ordered by most recent.
 */
class CredentialsProfileMru {
    constructor(_context) {
        this._context = _context;
    }
    /**
     * @description Returns the most recently used credentials names
     */
    getMruList() {
        return this._context.globalState.get(CredentialsProfileMru.configurationStateName, []);
    }
    /**
     * @description Places a credential at the top of the MRU list
     * @param profileName The credentials most recently used
     */
    setMostRecentlyUsedProfile(profileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const mru = this.getMruList();
            const currentIndex = mru.indexOf(profileName);
            if (currentIndex !== -1) {
                mru.splice(currentIndex, 1);
            }
            mru.splice(0, 0, profileName);
            mru.splice(CredentialsProfileMru.MAX_CREDENTIAL_MRU_SIZE);
            yield this._context.globalState.update(CredentialsProfileMru.configurationStateName, mru);
        });
    }
}
CredentialsProfileMru.MAX_CREDENTIAL_MRU_SIZE = 5;
CredentialsProfileMru.configurationStateName = 'recentCredentials';
exports.CredentialsProfileMru = CredentialsProfileMru;
//# sourceMappingURL=credentialsProfileMru.js.map