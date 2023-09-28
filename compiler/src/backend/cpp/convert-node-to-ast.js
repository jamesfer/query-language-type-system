"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNodeToAst = void 0;
const utils_1 = require("../../type-checker/utils");
const convert_value_to_type_1 = require("./convert-value-to-type");
const make_record_literal_struct_1 = require("./make-record-literal-struct");
function convertNodeToAst(state, makeUniqueId, { expression, decoration }) {
    switch (expression.kind) {
        case 'Identifier':
            return {
                kind: 'Identifier',
                name: expression.name,
            };
        case 'BooleanExpression':
            return {
                kind: 'Boolean',
                value: expression.value,
            };
        case 'NumberExpression':
            return {
                kind: 'Number',
                value: expression.value,
            };
        case 'StringExpression':
            return {
                kind: 'String',
                value: expression.value,
            };
        case 'SymbolExpression':
            return {
                kind: 'String',
                value: `SYMBOL$${expression.name}`,
            };
        case 'RecordExpression': {
            const type = decoration.type;
            if (type.kind !== 'RecordLiteral') {
                throw new Error('Cannot handle a record expression that does not have a record literal type');
            }
            const parameters = Object.values(expression.properties);
            const structName = make_record_literal_struct_1.makeRecordLiteralStruct(state, makeUniqueId, type);
            return { structName, parameters, kind: 'StructConstruction' };
        }
        case 'DataInstantiation': {
            if (expression.callee.kind !== 'Identifier') {
                throw new Error('Cannot instantiate a data type that has a callee that is not an identifier');
            }
            return {
                kind: 'StructConstruction',
                parameters: expression.parameters,
                structName: expression.callee.name,
            };
        }
        case 'Application': {
            return {
                kind: 'Application',
                callee: expression.callee,
                parameters: [expression.parameter],
            };
        }
        case 'SimpleFunctionExpression': {
            const localStatements = [...state.localStatements.values];
            state.localStatements.clear();
            return {
                kind: 'Lambda',
                parameters: [{
                        kind: 'Parameter',
                        type: convert_value_to_type_1.convertValueToType(state, makeUniqueId, expression.parameterType),
                        identifier: {
                            kind: 'Identifier',
                            name: expression.parameter,
                        },
                    }],
                body: {
                    kind: 'Block',
                    statements: [
                        ...localStatements,
                        {
                            kind: 'Return',
                            value: expression.body,
                        }
                    ],
                },
            };
        }
        case 'BindingExpression':
            state.localStatements.push({
                kind: 'Binding',
                name: expression.name,
                value: expression.value,
                type: convert_value_to_type_1.convertValueToType(state, makeUniqueId, decoration.type),
            });
            return expression.body;
        case 'ReadRecordPropertyExpression':
            return {
                kind: 'ReadProperty',
                object: expression.record,
                property: expression.property,
            };
        case 'ReadDataPropertyExpression':
        case 'NativeExpression':
            throw new Error('Not implemented yet');
        default:
            return utils_1.assertNever(expression);
    }
}
exports.convertNodeToAst = convertNodeToAst;
//# sourceMappingURL=convert-node-to-ast.js.map