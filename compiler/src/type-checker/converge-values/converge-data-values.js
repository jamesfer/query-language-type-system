"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeDataValues = void 0;
const utils_1 = require("../utils");
const converge_utils_1 = require("./converge-utils");
const converge_values_with_state_1 = require("./converge-values-with-state");
function convergeDataValues(messageState, state, dataValue, other) {
    if (other.kind !== 'DataValue' || other.parameters.length !== dataValue.parameters.length) {
        return converge_utils_1.mismatchResult(messageState, state, dataValue, other);
    }
    return [
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, dataValue.name, other.name),
        ...utils_1.checkedZip(dataValue.parameters, other.parameters)
            .flatMap(([left, right]) => converge_values_with_state_1.convergeValuesWithState(messageState, state, left, right)),
    ];
}
exports.convergeDataValues = convergeDataValues;
//# sourceMappingURL=converge-data-values.js.map