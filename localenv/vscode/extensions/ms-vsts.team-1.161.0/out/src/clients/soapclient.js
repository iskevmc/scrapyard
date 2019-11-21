/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//jeyou: Based on RestClient from vso-node-api (v5.1.2)
/* tslint:disable */
const vscode_1 = require("vscode");
const httpclient_1 = require("./httpclient");
var httpCodes = {
    300: "Multiple Choices",
    301: "Moved Permanantly",
    302: "Resource Moved",
    304: "Not Modified",
    305: "Use Proxy",
    306: "Switch Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout"
};
function processResponse(url, res, contents, onResult) {
    if (res.statusCode > 299) {
        // not success
        var msg = httpCodes[res.statusCode] ? "Failed Request: " + httpCodes[res.statusCode] : "Failed Request";
        msg += '(' + res.statusCode + ') - ';
        if (contents && contents.length > 0) {
            var soapObj = contents;
            if (soapObj && soapObj.message) {
                msg += soapObj.message;
            }
            else {
                msg += url;
            }
        }
        onResult(new Error(msg), res.statusCode, null);
    }
    else {
        try {
            var soapObj = null;
            if (contents && contents.length > 0) {
                soapObj = contents;
            }
        }
        catch (e) {
            onResult(new Error('Invalid Resource'), res.statusCode, null);
            return;
        }
        onResult(null, res.statusCode, soapObj);
    }
}
exports.processResponse = processResponse;
;
class SoapClient {
    constructor(userAgent, handlers) {
        this.httpClient = new httpclient_1.HttpClient(userAgent, handlers);
    }
    post(url, requestEnvelope, onResult) {
        this._sendSoap('POST', url, requestEnvelope, onResult);
    }
    _sendSoap(verb, url, requestEnvelope, onResult) {
        let headers = {};
        headers["Accept-Encoding"] = "gzip"; //Tell the server we'd like to receive a gzip compressed response
        headers["Accept-Language"] = vscode_1.env.language; //"en-US";
        headers["Content-Type"] = "application/soap+xml; charset=utf-8";
        headers["Chunked"] = "false";
        headers["Content-Length"] = requestEnvelope.length;
        this.httpClient.send(verb, url, requestEnvelope, headers, (err, res, responseEnvelope) => {
            if (err) {
                onResult(err, err.statusCode, null);
                return;
            }
            processResponse(url, res, responseEnvelope, onResult);
        });
    }
}
exports.SoapClient = SoapClient;

//# sourceMappingURL=soapclient.js.map
