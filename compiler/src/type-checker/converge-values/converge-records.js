"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeRecords = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const converge_utils_1 = require("./converge-utils");
const converge_values_with_state_1 = require("./converge-values-with-state");
function convergeRecords(messageState, state, record, other) {
    if (other.kind !== 'RecordLiteral') {
        return converge_utils_1.mismatchResult(messageState, state, record, other);
    }
    const recordProperties = lodash_1.sortBy(Object.keys(record.properties));
    const otherProperties = lodash_1.sortBy(Object.keys(other.properties));
    const zippedProperties = utils_1.checkedZip(recordProperties, otherProperties);
    if (zippedProperties.some(([left, right]) => left !== right)) {
        return converge_utils_1.mismatchResult(messageState, state, record, other);
    }
    return zippedProperties.flatMap(([recordProperty, otherProperty]) => converge_values_with_state_1.convergeValuesWithState(messageState, state, record.properties[recordProperty], other.properties[otherProperty]));
}
exports.convergeRecords = convergeRecords;
//# sourceMappingURL=converge-records.js.map