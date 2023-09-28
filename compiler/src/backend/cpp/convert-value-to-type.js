"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValueToType = void 0;
const make_record_literal_struct_1 = require("./make-record-literal-struct");
const shallowConvertValueToType = (state, makeUniqueId) => (value) => {
    switch (value.kind) {
        case 'DataValue': {
            const name = shallowConvertValueToType(state, makeUniqueId)(value.name);
            const parameters = value.parameters.map(shallowConvertValueToType(state, makeUniqueId));
            return `${name}<${parameters.join(', ')}>`;
        }
        case 'RecordLiteral':
            return make_record_literal_struct_1.makeRecordLiteralStruct(state, makeUniqueId, value);
        case 'ApplicationValue': {
            // Collect all parameters to un-curry the application
            let parameters = [value.parameter];
            let callee = value.callee;
            while (callee.kind === 'ApplicationValue') {
                parameters = [callee.parameter, ...parameters];
                callee = callee.callee;
            }
            const resultCallee = shallowConvertValueToType(state, makeUniqueId)(callee);
            const resultParameters = parameters.map(shallowConvertValueToType(state, makeUniqueId));
            return `${resultCallee}<${resultParameters.join(', ')}>`;
        }
        case 'FunctionLiteral': {
            const body = shallowConvertValueToType(state, makeUniqueId)(value.body);
            const parameter = shallowConvertValueToType(state, makeUniqueId)(value.parameter);
            return `[](${parameter}) -> ${body}`;
        }
        case 'FreeVariable':
            return value.name;
        // throw new Error(`Free variable ${value.name} cannot be part of a type`);
        case 'SymbolLiteral':
            return 'std::string';
        case 'BooleanLiteral':
            return 'boolean';
        case 'NumberLiteral':
            return 'double';
        case 'StringLiteral':
            return 'std::string';
        case 'DualBinding':
            throw new Error(`Dual binding value cannot be part of a type`);
        case 'ReadDataValueProperty':
            throw new Error(`Read data value property value cannot be part of a type`);
        case 'ReadRecordProperty':
            throw new Error(`Read record property value cannot be part of a type`);
        case 'ImplicitFunctionLiteral':
            throw new Error(`Implicit function literal value cannot be part of a type`);
        case 'PatternMatchValue':
            throw new Error(`Pattern match value cannot be part of a type`);
    }
};
function convertValueToType(state, makeUniqueId, value) {
    const result = shallowConvertValueToType(state, makeUniqueId)(value);
    return { kind: 'Type', value: result };
}
exports.convertValueToType = convertValueToType;
//# sourceMappingURL=convert-value-to-type.js.map