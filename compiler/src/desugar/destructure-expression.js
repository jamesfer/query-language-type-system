"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performExpressionDestructuring = void 0;
const lodash_1 = require("lodash");
function flattenApplication({ callee, parameter }, otherParameters = []) {
    const parameters = [parameter, ...otherParameters];
    if (callee.expression.kind === 'Application') {
        return flattenApplication(callee.expression, parameters);
    }
    return { callee, parameters: parameters };
}
function performExpressionDestructuring(valueNode, { expression }) {
    const { decoration: valueDecoration } = valueNode;
    const { type } = valueDecoration;
    switch (expression.kind) {
        case 'Identifier':
            return [{
                    name: expression.name,
                    node: valueNode,
                }];
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
            return [];
        case 'RecordExpression': {
            if (type.kind !== 'RecordLiteral') {
                throw new Error(`Could not destructure record expression that has the wrong type: ${type.kind}`);
            }
            const propertyNames = Object.keys(expression.properties);
            if (!propertyNames.some(property => property in type.properties)) {
                throw new Error(`Could not destructure record expression. Expected to find properties: ${propertyNames.join(', ')} in the type's properties: ${Object.keys(type.properties).join(', ')}`);
            }
            return lodash_1.flatMap(expression.properties, (property, propertyName) => (performExpressionDestructuring({
                kind: 'Node',
                expression: {
                    kind: 'ReadRecordPropertyExpression',
                    record: valueNode,
                    property: propertyName
                },
                decoration: Object.assign(Object.assign({}, valueDecoration), { type: type.properties[propertyName] })
            }, property)));
        }
        case 'DataInstantiation': {
            if (type.kind !== 'DataValue') {
                throw new Error(`Could not destructure data value expression that has the wrong type: ${type.kind}`);
            }
            if (type.parameters.length < expression.parameters.length) {
                throw new Error(`Could not destructure data value that has too few parameters. Type has ${type.parameters.length} parameters while destructure expression has ${expression.parameters.length}`);
            }
            return lodash_1.flatMap(expression.parameters, (parameter, index) => performExpressionDestructuring({
                kind: 'Node',
                expression: {
                    kind: 'ReadDataPropertyExpression',
                    property: index,
                    dataValue: valueNode,
                },
                decoration: Object.assign(Object.assign({}, valueDecoration), { type: type.parameters[index] })
            }, parameter));
        }
        case 'Application': {
            const { callee, parameters } = flattenApplication(expression);
            // const calleeType = callee.decoration.type;
            return lodash_1.flatMap(parameters, (parameter, index) => performExpressionDestructuring({
                kind: 'Node',
                expression: {
                    kind: 'ReadDataPropertyExpression',
                    property: index,
                    dataValue: valueNode,
                },
                decoration: Object.assign(Object.assign({}, valueDecoration), { type: parameter.decoration.type }),
            }, parameter));
            // if (calleeType.kind === 'DataValue') {
            //   if (calleeType.parameters.length !== parameters.length) {
            //     throw new Error(`Incorrect number of parameters in application destructuring. Application has ${parameters.length} parameters but the callee only expected ${calleeType.parameters.length}`);
            //   }
            //
            //   return flatMap(parameters, (parameter, index) => performExpressionDestructuring(
            //     {
            //       kind: 'Node',
            //       expression: {
            //         kind: 'ReadDataPropertyExpression',
            //         property: index,
            //         dataValue: valueNode,
            //       },
            //       decoration: {
            //         ...valueDecoration,
            //         type: calleeType.parameters[index],
            //       },
            //     },
            //     parameter,
            //   ));
            // }
            //
            // if (calleeType.kind === 'FunctionLiteral') {
            //   let replacements: VariableExpressionReplacement[] = [];
            //   parameters.reduceRight<ExplicitValue>(
            //     (type, parameter, index) => {
            //       if (type.kind !== 'FunctionLiteral') {
            //         throw new Error(`Could not destructure application value because we hit a ${type.kind}`);
            //       }
            //
            //       replacements = replacements.concat(performExpressionDestructuring(
            //         {
            //           kind: 'Node',
            //           expression: {
            //             kind: 'ReadDataPropertyExpression',
            //             property: index,
            //             dataValue: valueNode,
            //           },
            //           decoration: {
            //             ...valueDecoration,
            //             type: type.parameter,
            //           },
            //         },
            //         parameter,
            //       ));
            //
            //       return type.body;
            //     },
            //     calleeType,
            //   );
            //
            //   return replacements;
            // }
            //
            // throw new Error(`Could not destructure application when the callee is of type ${calleeType.kind}`);
        }
        case 'DualExpression':
            return [
                ...performExpressionDestructuring(valueNode, expression.left),
                ...performExpressionDestructuring(valueNode, expression.right),
            ];
        case 'SimpleFunctionExpression':
        case 'BindingExpression':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'PatternMatchExpression':
        case 'NativeExpression':
            // TODO maybe incorrect?
            return [];
    }
}
exports.performExpressionDestructuring = performExpressionDestructuring;
//# sourceMappingURL=destructure-expression.js.map