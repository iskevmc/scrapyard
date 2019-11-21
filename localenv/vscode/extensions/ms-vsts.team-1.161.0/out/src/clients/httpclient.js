/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//jeyou: Brought over from vso-node-api (v5.1.2), added support for sending SOAP and handling gzip compression
/* tslint:disable */
const url = require("url");
const http = require("http");
const zlib = require("zlib");
const https = require("https");
const tunnel = require("tunnel");
http.globalAgent.maxSockets = 100;
class HttpClient {
    constructor(userAgent, handlers, socketTimeout) {
        this.userAgent = userAgent;
        this.handlers = handlers;
        if (socketTimeout) {
            this.socketTimeout = socketTimeout;
        }
        else {
            // Default 3 minutes
            this.socketTimeout = 3 * 60000;
        }
    }
    // POST, PATCH, PUT
    send(verb, requestUrl, objs, headers, onResult) {
        var options = this._getOptions(verb, requestUrl, headers);
        this.request(options.protocol, options.options, objs, onResult);
    }
    _getOptions(method, requestUrl, headers) {
        var parsedUrl = url.parse(requestUrl);
        var usingSsl = parsedUrl.protocol === 'https:';
        var prot = usingSsl ? https : http;
        var defaultPort = usingSsl ? 443 : 80;
        this.isSsl = usingSsl;
        var proxyUrl;
        if (process.env.HTTPS_PROXY && usingSsl) {
            proxyUrl = url.parse(process.env.HTTPS_PROXY);
        }
        else if (process.env.HTTP_PROXY) {
            proxyUrl = url.parse(process.env.HTTP_PROXY);
        }
        var options = {
            host: parsedUrl.hostname,
            port: parsedUrl.port || defaultPort,
            path: (parsedUrl.pathname || '') + (parsedUrl.search || ''),
            method: method,
            headers: headers || {}
        };
        //options.headers["Accept"] = contentType;
        options.headers["User-Agent"] = this.userAgent;
        var useProxy = proxyUrl && proxyUrl.hostname;
        if (useProxy) {
            var agentOptions = {
                maxSockets: http.globalAgent.maxSockets,
                proxy: {
                    // TODO: support proxy-authorization
                    //proxyAuth: "user:password",
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                }
            };
            var tunnelAgent;
            var overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            }
            else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }
            options.agent = tunnelAgent(agentOptions);
        }
        if (this.handlers) {
            this.handlers.forEach((handler) => {
                handler.prepareRequest(options);
            });
        }
        return {
            protocol: prot,
            options: options,
        };
    }
    request(protocol, options, objs, onResult) {
        // Set up a callback to pass off 401s to an authentication handler that can deal with it
        var callback = (err, res, contents) => {
            var authHandler;
            if (this.handlers) {
                this.handlers.some(function (handler /*, index, handlers*/) {
                    // Find the first one that can handle the auth based on the response
                    if (handler.canHandleAuthentication(res)) {
                        authHandler = handler;
                        return true;
                    }
                    return false;
                });
            }
            if (authHandler !== undefined) {
                authHandler.handleAuthentication(this, protocol, options, objs, onResult);
            }
            else {
                // No auth handler found, call onResult normally
                onResult(err, res, contents);
            }
        };
        this.requestInternal(protocol, options, objs, callback);
    }
    requestInternal(protocol, options, objs, onResult) {
        var reqData;
        var socket;
        if (objs) {
            reqData = objs;
        }
        var callbackCalled = false;
        var handleResult = (err, res, contents) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res, contents);
            }
        };
        var req = protocol.request(options, function (res) {
            var buffer = [];
            var output = '';
            // If we're handling gzip compression, don't set the encoding to utf8
            if (res.headers["content-encoding"] && res.headers["content-encoding"] === "gzip") {
                var gunzip = zlib.createGunzip();
                res.pipe(gunzip);
                gunzip.on('data', function (data) {
                    buffer.push(data.toString());
                }).on('end', function () {
                    handleResult(null, res, buffer.join(""));
                }).on('error', function (err) {
                    handleResult(err, null, null);
                });
            }
            else {
                res.setEncoding('utf8'); //Do this only if we expect we're getting a string back
                res.on('data', function (chunk) {
                    output += chunk;
                });
                res.on('end', function () {
                    // res has statusCode and headers
                    handleResult(null, res, output);
                });
            }
        });
        req.on('socket', function (sock) {
            socket = sock;
        });
        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this.socketTimeout, function () {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + options.path), null, null);
        });
        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null, null);
        });
        if (reqData) {
            req.write(reqData, 'utf8');
        }
        req.end();
    }
}
exports.HttpClient = HttpClient;

//# sourceMappingURL=httpclient.js.map
