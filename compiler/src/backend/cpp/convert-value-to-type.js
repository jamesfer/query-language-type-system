"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValueToType = void 0;
const make_record_literal_struct_1 = require("./make-record-literal-struct");
const monad_1 = require("./monad");
const shallowConvertValueToType = (value) => {
    switch (value.kind) {
        case 'DataValue':
            return monad_1.pipeRecord({
                name: shallowConvertValueToType(value.name),
                parameters: monad_1.traverseM(value.parameters, shallowConvertValueToType),
            }, ({ name, parameters }) => `${name}<${parameters.join(', ')}>`);
        case 'RecordLiteral':
            return monad_1.pipeRecord({ struct: make_record_literal_struct_1.makeRecordLiteralStruct(value) }, ({ struct }) => struct);
        case 'ApplicationValue': {
            // Collect all parameters to un-curry the application
            let parameters = [value.parameter];
            let callee = value.callee;
            while (callee.kind === 'ApplicationValue') {
                parameters = [callee.parameter, ...parameters];
                callee = callee.callee;
            }
            return monad_1.pipeRecord({
                callee: shallowConvertValueToType(callee),
                parameters: monad_1.traverseM(parameters, shallowConvertValueToType),
            }, ({ callee, parameters }) => `${callee}<${parameters.join(', ')}>`);
        }
        case 'FunctionLiteral':
            return monad_1.pipeRecord({
                body: shallowConvertValueToType(value.body),
                parameter: shallowConvertValueToType(value.parameter),
            }, ({ body, parameter }) => `[](${parameter}) -> ${body}`);
        case 'FreeVariable':
            return monad_1.Monad.pure(value.name);
        // throw new Error(`Free variable ${value.name} cannot be part of a type`);
        case 'SymbolLiteral':
            return monad_1.Monad.pure('std::string');
        case 'BooleanLiteral':
            return monad_1.Monad.pure('boolean');
        case 'NumberLiteral':
            return monad_1.Monad.pure('double');
        case 'StringLiteral':
            return monad_1.Monad.pure('std::string');
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
function convertValueToType(value) {
    return monad_1.mapM(shallowConvertValueToType(value), string => ({ kind: 'Type', value: string }));
}
exports.convertValueToType = convertValueToType;
//# sourceMappingURL=convert-value-to-type.js.map