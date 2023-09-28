"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJavascript = void 0;
const tslib_1 = require("tslib");
const generator_1 = tslib_1.__importDefault(require("@babel/generator"));
const types = tslib_1.__importStar(require("@babel/types"));
const lodash_1 = require("lodash");
const utils_1 = require("../../type-checker/utils");
// const destructureExpression = (base: Expression) =>
//   (value: Expression): [string, Expression][] => {
//   switch (value.kind) {
//     case 'SymbolExpression':
//     case 'BooleanExpression':
//     case 'NumberExpression':
//     case 'StringExpression':
//       return [];
//
//     case 'Identifier':
//       return [[value.name, base]];
//
//     case 'DualExpression':
//       return [
//         ...destructureExpression(base)(value.left),
//         ...destructureExpression(base)(value.right),
//       ];
//
//     case 'DataInstantiation':
//       return flatMap(value.parameters, (parameter, index) => destructureExpression({
//         kind: 'ReadDataPropertyExpression',
//         dataValue: base,
//         property: index,
//       })(parameter));
//
//     case 'RecordExpression':
//       return flatMap(value.properties, (parameter, key) => destructureExpression({
//         kind: 'ReadRecordPropertyExpression',
//         record: base,
//         property: key,
//       })(parameter));
//
//     case 'Application':
//     case 'FunctionExpression':
//     case 'ReadDataPropertyExpression':
//     case 'ReadRecordPropertyExpression':
//     case 'BindingExpression':
//     case 'PatternMatchExpression':
//     case 'NativeExpression':
//       return [];
//
//     default:
//       return assertNever(value);
//   }
// };
const reservedKeywords = new Set([
    'if',
    'return',
    'for',
    'const',
    'let',
]);
function makeIdentifierSafe(name) {
    // strip all the trailing underscores from the name
    const strippedName = name.replace(/_*$/, '');
    if (reservedKeywords.has(strippedName)) {
        return `${name}_`;
    }
    return name;
}
function convertExpressionToCode(expression) {
    switch (expression.kind) {
        case 'Identifier': {
            return [[], types.identifier(makeIdentifierSafe(expression.name))];
        }
        case 'SymbolExpression':
            return [[], types.stringLiteral(`$SYMBOL$${expression.name}`)];
        case 'BooleanExpression':
            return [[], types.booleanLiteral(expression.value)];
        case 'NumberExpression':
            return [[], types.numericLiteral(expression.value)];
        case 'StringExpression':
            return [[], types.stringLiteral(expression.value)];
        case 'RecordExpression': {
            const [childStatements = [], properties = []] = utils_1.unzip(lodash_1.map(expression.properties, (property, key) => {
                const [propertyStatements, value] = convertExpressionToCode(property);
                return [propertyStatements, types.objectProperty(types.identifier(key), value)];
            }));
            return [lodash_1.flatten([[], ...childStatements]), types.objectExpression(properties)];
        }
        case 'Application': {
            const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
            const [parameterStatements, parameter] = convertExpressionToCode(expression.parameter);
            const callExpression = types.callExpression(callee, [parameter]);
            return [[...calleeStatements, ...parameterStatements], callExpression];
        }
        case 'SimpleFunctionExpression': {
            const [bodyStatements, body] = convertExpressionToCode(expression.body);
            return [[], types.arrowFunctionExpression([types.identifier(expression.parameter)], bodyStatements.length === 0 ? body : types.blockStatement([
                    ...bodyStatements,
                    types.returnStatement(body),
                ]))];
            // const parameterName = `$PARAMETER$1`;
            // const destructuredParameters =
            //   destructureExpression(identifier(parameterName))(expression.parameter);
            // const destructuringStatements = flatMap(destructuredParameters, ([name, expression]) => {
            //   const [parameterStatements, parameter] = convertExpressionToCode(expression);
            //   return [...parameterStatements, types.variableDeclaration('const', [
            //     types.variableDeclarator(types.identifier(name), parameter)
            //   ])];
            // });
            // return [[], types.arrowFunctionExpression(
            //   [types.identifier(parameterName)],
            //   types.blockStatement([
            //     ...destructuringStatements,
            //     types.returnStatement(body),
            //   ]),
            // )];
        }
        case 'DataInstantiation': {
            const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
            const [allPropertyStatements = [], objectProperties = []] = utils_1.unzip(expression.parameters.map((value, index) => {
                const [propertyStatements, property] = convertExpressionToCode(value);
                return [propertyStatements, types.objectProperty(types.identifier(`${index}`), property)];
            }));
            return [lodash_1.flatten([calleeStatements, ...allPropertyStatements]), types.objectExpression([
                    types.objectProperty(types.identifier('$DATA_NAME$'), callee),
                    ...objectProperties,
                ])];
        }
        case 'BindingExpression': {
            const [valueStatements, value] = convertExpressionToCode(expression.value);
            const [bodyStatements, body] = convertExpressionToCode(expression.body);
            const declaration = types.variableDeclaration('const', [
                types.variableDeclarator(types.identifier(makeIdentifierSafe(expression.name)), value),
            ]);
            return [[...valueStatements, declaration, ...bodyStatements], body];
        }
        case 'ReadRecordPropertyExpression': {
            // return types.memberExpression(
            //   convertExpressionToCode(expression.record),
            //   expression.property);
            const [recordStatements, record] = convertExpressionToCode(expression.record);
            const identifier = types.identifier(expression.property);
            const memberExpression = types.memberExpression(record, identifier);
            return [recordStatements, memberExpression];
        }
        case 'ReadDataPropertyExpression':
            const [dataValueStatements, dataValue] = convertExpressionToCode(expression.dataValue);
            return [dataValueStatements, types.memberExpression(dataValue, types.identifier(`${expression.property}`), true)];
        case 'NativeExpression': {
            const nativeData = expression.data.javascript;
            if (!nativeData) {
                throw new Error(`Cannot output a native expression without a javascript spec:${JSON.stringify(expression.data, undefined, 2)}`);
            }
            const { kind } = nativeData;
            switch (kind) {
                case 'member': {
                    const { object, name, arity } = nativeData;
                    if (typeof object !== 'string' || typeof name !== 'string' || typeof arity !== 'number') {
                        throw new Error('Cannot output member native expression with incorrect data');
                    }
                    const callee = types.memberExpression(types.identifier(object), types.identifier(name));
                    const parameterNames = lodash_1.range(arity).map(index => `$nativeParameter$${index}`);
                    const parameters = parameterNames.map(parameterName => types.identifier(parameterName));
                    const result = parameterNames.reduceRight((body, name) => types.arrowFunctionExpression([types.identifier(name)], body), types.callExpression(callee, parameters));
                    return [[], result];
                }
                case 'memberCall': {
                    const { name, arity } = nativeData;
                    if (typeof name !== 'string' || typeof arity !== 'number') {
                        throw new Error('Cannot output member call native expression with incorrect data');
                    }
                    const objectName = '$nativeObject';
                    const callee = types.memberExpression(types.identifier(objectName), types.identifier(name));
                    const parameterNames = lodash_1.range(arity).map(index => `$nativeParameter$${index}`);
                    const parameters = parameterNames.map(parameterName => types.identifier(parameterName));
                    const result = [objectName, ...parameterNames].reduceRight((body, name) => types.arrowFunctionExpression([types.identifier(name)], body), types.callExpression(callee, parameters));
                    return [[], result];
                }
                case 'binaryOperation': {
                    const { operator } = nativeData;
                    if (typeof operator !== 'string') {
                        throw new Error('Cannot output a binary operation without an operator');
                    }
                    const left = types.identifier('$leftBinaryParam');
                    const right = types.identifier('$rightBinaryParam');
                    const result = [left, right].reduceRight((body, identifier) => types.arrowFunctionExpression([identifier], body), types.binaryExpression(operator, left, right));
                    return [[], result];
                }
                case 'ternaryOperator': {
                    const condition = types.identifier('$conditionParam');
                    const consequent = types.identifier('$consequentParam');
                    const alternative = types.identifier('$alternativeParam');
                    const result = [condition, consequent, alternative].reduceRight((body, identifier) => types.arrowFunctionExpression([identifier], body), types.conditionalExpression(condition, consequent, alternative));
                    return [[], result];
                }
                default: {
                    const { name } = nativeData;
                    if (typeof name !== 'string') {
                        throw new Error('Native expression is missing a name');
                    }
                    return [[], types.identifier(name)];
                }
            }
        }
        default:
            return utils_1.assertNever(expression);
    }
}
function wrapInExport(moduleType, statements, value) {
    return types.program([
        ...statements,
        moduleType === 'esm'
            ? types.exportDefaultDeclaration(value)
            : types.expressionStatement(types.assignmentExpression('=', types.memberExpression(types.identifier('module'), types.identifier('exports')), value)),
    ]);
}
function generateJavascript(expression, options) {
    const [statements, value] = convertExpressionToCode(expression);
    const program = wrapInExport(options.module, statements, value);
    return generator_1.default(program).code;
}
exports.generateJavascript = generateJavascript;
//# sourceMappingURL=generate-javascript.js.map