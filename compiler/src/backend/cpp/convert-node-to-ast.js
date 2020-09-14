"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNodeToAst = void 0;
const utils_1 = require("../../type-checker/utils");
const convert_value_to_type_1 = require("./convert-value-to-type");
const make_record_literal_struct_1 = require("./make-record-literal-struct");
const monad_1 = require("./monad");
const monad_state_operations_1 = require("./monad-state-operations");
function convertNodeToAst({ expression, decoration }) {
    switch (expression.kind) {
        case 'Identifier':
            return monad_1.Monad.pure({
                kind: 'Identifier',
                name: expression.name,
            });
        case 'BooleanExpression':
            return monad_1.Monad.pure({
                kind: 'Boolean',
                value: expression.value,
            });
        case 'NumberExpression':
            return monad_1.Monad.pure({
                kind: 'Number',
                value: expression.value,
            });
        case 'StringExpression':
            return monad_1.Monad.pure({
                kind: 'String',
                value: expression.value,
            });
        case 'SymbolExpression':
            return monad_1.Monad.pure({
                kind: 'String',
                value: `SYMBOL$${expression.name}`,
            });
        case 'RecordExpression': {
            const type = decoration.type;
            if (type.kind !== 'RecordLiteral') {
                throw new Error('Cannot handle a record expression that does not have a record literal type');
            }
            return monad_1.pipeRecord({ parameters: monad_1.sequenceM(Object.values(expression.properties)) }, () => ({ structName: make_record_literal_struct_1.makeRecordLiteralStruct(type) }), ({ parameters, structName }) => ({ structName, parameters, kind: 'StructConstruction' }));
        }
        case 'DataInstantiation':
            return monad_1.pipeRecord({ callee: expression.callee, parameters: monad_1.sequenceM(expression.parameters) }, ({ callee, parameters }) => {
                if (callee.kind !== 'Identifier') {
                    throw new Error('Cannot instantiate a data type that has a callee that is not an identifier');
                }
                return {
                    parameters,
                    kind: 'StructConstruction',
                    structName: callee.name,
                };
            });
        case 'Application':
            return monad_1.pipeRecord({ callee: expression.callee, parameter: expression.parameter }, ({ callee, parameter }) => ({
                callee,
                kind: 'Application',
                parameters: [parameter],
            }));
        case 'SimpleFunctionExpression':
            return monad_1.pipeRecord({ body: expression.body }, () => ({ localStatements: monad_state_operations_1.getLocalStatements() }), () => ({ _: monad_state_operations_1.clearLocalStatements() }), ({ body, localStatements }) => ({
                kind: 'Lambda',
                parameters: [],
                body: {
                    kind: 'Block',
                    statements: [
                        ...localStatements,
                        {
                            kind: 'Return',
                            value: body,
                        }
                    ],
                },
            }));
        case 'BindingExpression':
            return monad_1.pipeRecord({
                type: convert_value_to_type_1.convertValueToType(decoration.type),
                value: expression.value,
                body: expression.body,
            }, ({ type, value }) => ({
                _: monad_state_operations_1.appendLocalStatement({
                    value,
                    type,
                    kind: 'Binding',
                    name: expression.name,
                }),
            }), ({ body }) => body);
        // case 'DualExpression':
        //   return expression.right;
        case 'ReadRecordPropertyExpression':
            return monad_1.mapM(expression.record, (record) => ({
                kind: 'ReadProperty',
                object: record,
                property: expression.property,
            }));
        case 'ReadDataPropertyExpression':
        // case 'PatternMatchExpression':
        case 'NativeExpression':
            throw new Error('Not implemented yet');
        default:
            return utils_1.assertNever(expression);
    }
}
exports.convertNodeToAst = convertNodeToAst;
//# sourceMappingURL=convert-node-to-ast.js.map