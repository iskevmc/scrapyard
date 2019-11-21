/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UrlBuilder {
    //Joins multiple paths with '/'. Not intended to use with query params or hashes
    static Join(baseUrl, ...args) {
        if (!baseUrl || !args || !args[0]) {
            return baseUrl;
        }
        let finalUrl = baseUrl;
        //If we're going to build up a url, pull off final '/', if present
        //If we don't have any args, we don't want to change the finalUrl we'll return
        if (args && args.length > 0 && finalUrl.endsWith("/")) {
            finalUrl = finalUrl.substring(0, finalUrl.length - 1);
        }
        for (let idx = 0; idx < args.length; idx++) {
            let arg = args[idx];
            //Ensure each arg doesn't start with a '/', we'll be adding those
            if (arg.startsWith("/")) {
                arg = arg.substring(1, arg.length);
            }
            finalUrl = `${finalUrl}/${arg}`;
        }
        return finalUrl;
    }
    static AddQueryParams(baseUrl, ...args) {
        if (!baseUrl || !args || !args[0]) {
            return baseUrl;
        }
        let finalUrl = baseUrl;
        //If we're going to build up a url, pull off final '/', if present
        //If we don't have any args, we don't want to change the finalUrl we'll return
        if (args && args.length > 0 && finalUrl.endsWith("/")) {
            finalUrl = finalUrl.substring(0, finalUrl.length - 1);
        }
        for (let idx = 0; idx < args.length; idx++) {
            const prefix = (idx === 0 ? "?" : "&");
            let arg = args[idx];
            if (arg.startsWith("?") || arg.startsWith("&")) {
                arg = arg.substring(1, arg.length);
            }
            finalUrl = `${finalUrl}${prefix}${arg}`;
        }
        return finalUrl;
    }
    static AddHashes(baseUrl, ...args) {
        if (!baseUrl || !args || !args[0]) {
            return baseUrl;
        }
        let finalUrl = baseUrl;
        //If we're going to build up a url, pull off final '/', if present
        //If we don't have any args, we don't want to change the finalUrl we'll return
        if (args && args.length > 0 && finalUrl.endsWith("/")) {
            finalUrl = finalUrl.substring(0, finalUrl.length - 1);
        }
        for (let idx = 0; idx < args.length; idx++) {
            const prefix = (idx === 0 ? "#" : "&");
            let arg = args[idx];
            if (arg.startsWith("#") || arg.startsWith("&")) {
                arg = arg.substring(1, arg.length);
            }
            finalUrl = `${finalUrl}${prefix}${arg}`;
        }
        return finalUrl;
    }
}
exports.UrlBuilder = UrlBuilder;

//# sourceMappingURL=urlbuilder.js.map
