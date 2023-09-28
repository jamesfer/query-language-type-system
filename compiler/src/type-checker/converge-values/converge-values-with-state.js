"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeValuesWithState = void 0;
const utils_1 = require("../utils");
const converge_applications_1 = require("./converge-applications");
const converge_booleans_1 = require("./converge-booleans");
const converge_data_values_1 = require("./converge-data-values");
const converge_dual_binding_on_left_1 = require("./converge-dual-binding-on-left");
const converge_dual_binding_on_right_1 = require("./converge-dual-binding-on-right");
const converge_free_variable_on_left_1 = require("./converge-free-variable-on-left");
const converge_free_variable_on_right_1 = require("./converge-free-variable-on-right");
const converge_functions_1 = require("./converge-functions");
const converge_implicit_functions_1 = require("./converge-implicit-functions");
const converge_numbers_1 = require("./converge-numbers");
const converge_records_1 = require("./converge-records");
const converge_strings_1 = require("./converge-strings");
const converge_symbols_1 = require("./converge-symbols");
const converge_utils_1 = require("./converge-utils");
exports.convergeValuesWithState = (messageState, state, leftValue, rightValue) => {
    if (rightValue.kind === 'FreeVariable') {
        return converge_free_variable_on_right_1.convergeFreeVariableOnRight(state, leftValue, rightValue);
    }
    if (leftValue.kind === 'FreeVariable') {
        return converge_free_variable_on_left_1.convergeFreeVariableOnLeft(messageState, state, leftValue, rightValue);
    }
    if (leftValue.kind === 'DualBinding') {
        return converge_dual_binding_on_left_1.convergeDualBindingOnLeft(messageState, state, leftValue, rightValue);
    }
    if (rightValue.kind === 'DualBinding') {
        return converge_dual_binding_on_right_1.convergeDualBindingOnRight(messageState, state, leftValue, rightValue);
    }
    if (leftValue.kind === 'ImplicitFunctionLiteral') {
        return converge_implicit_functions_1.convergeImplicitFunctions(messageState, state, leftValue, rightValue);
    }
    if (rightValue.kind === 'ImplicitFunctionLiteral') {
        return converge_implicit_functions_1.convergeImplicitFunctions(messageState, state, rightValue, leftValue);
    }
    switch (leftValue.kind) {
        case 'DataValue':
            return converge_data_values_1.convergeDataValues(messageState, state, leftValue, rightValue);
        case 'RecordLiteral':
            return converge_records_1.convergeRecords(messageState, state, leftValue, rightValue);
        case 'ApplicationValue':
            return converge_applications_1.convergeApplications(messageState, state, leftValue, rightValue);
        case 'FunctionLiteral':
            return converge_functions_1.convergeFunctions(messageState, state, leftValue, rightValue);
        case 'SymbolLiteral':
            return converge_symbols_1.convergeSymbols(messageState, state, leftValue, rightValue);
        case 'BooleanLiteral':
            return converge_booleans_1.convergeBooleans(messageState, state, leftValue, rightValue);
        case 'NumberLiteral':
            return converge_numbers_1.convergeNumbers(messageState, state, leftValue, rightValue);
        case 'StringLiteral':
            return converge_strings_1.convergeStrings(messageState, state, leftValue, rightValue);
        case 'ReadDataValueProperty':
        case 'ReadRecordProperty':
        case 'PatternMatchValue':
            return converge_utils_1.mismatchResult(messageState, state, leftValue, rightValue);
        default:
            return utils_1.assertNever(leftValue);
    }
};
//# sourceMappingURL=converge-values-with-state.js.map