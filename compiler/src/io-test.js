"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_1 = require("fp-ts/function");
const fp_ts_1 = require("fp-ts");
function recursive1(value) {
    if (value === 1) {
        return fp_ts_1.io.of(1);
    }
    else {
        return recursive1(value - 1);
    }
}
function recursive2(value) {
    return fp_ts_1.io.flatten(() => {
        if (value === 1) {
            return fp_ts_1.io.of(1);
        }
        else {
            return recursive2(value - 1);
        }
    });
}
function recursive3(value) {
    return function_1.pipe(fp_ts_1.io.of(value), fp_ts_1.io.chain(value => value === 1 ? fp_ts_1.io.of(1) : recursive3(value - 1)));
}
console.log(recursive3(1e6)());
//# sourceMappingURL=io-test.js.map