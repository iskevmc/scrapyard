"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
function exec(command, options) {
    return new Promise((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            (error || stderr ? reject : resolve)({ error, stdout, stderr });
        });
    });
}
exports.exec = exec;
function sleep(millis) {
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
}
exports.sleep = sleep;
function allMatches(regex, string, group) {
    return {
        [Symbol.iterator]: function* () {
            let m;
            while (m = regex.exec(string)) {
                yield m[group];
                if (regex.lastIndex === m.index) {
                    regex.lastIndex++;
                }
            }
        }
    };
}
exports.allMatches = allMatches;
function fetchAll(github, first) {
    return __awaiter(this, void 0, void 0, function* () {
        const all = [];
        let res = yield first;
        all.push(...res.data.items);
        while (github.hasNextPage(res)) {
            res = yield github.getNextPage(res);
            all.push(...res.data.items);
        }
        return all;
    });
}
exports.fetchAll = fetchAll;
//# sourceMappingURL=utils.js.map