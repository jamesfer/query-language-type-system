"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipRecords = void 0;
const function_1 = require("fp-ts/function");
const Record_1 = require("fp-ts/Record");
const These_1 = require("fp-ts/These");
const fp_1 = require("lodash/fp");
function zipRecords(leftRecord, rightRecord) {
    return function_1.pipe(leftRecord, Record_1.mapWithIndex((key, leftValue) => function_1.pipe(rightRecord, Record_1.lookup(key), These_1.leftOrBoth(leftValue))), fp_1.assign(function_1.pipe(rightRecord, Record_1.mapWithIndex((key, rightValue) => function_1.pipe(leftRecord, Record_1.lookup(key), These_1.rightOrBoth(rightValue))))));
}
exports.zipRecords = zipRecords;
//# sourceMappingURL=zip-records.js.map