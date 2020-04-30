"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const utils_1 = require("./utils");
const type_utils_1 = require("./type-utils");
const variable_utils_1 = require("./variable-utils");
const visitor_utils_1 = require("./visitor-utils");
// const substituteExpressionVariables = (substitutions: { name: string, value: Expression }[]) => (expression: Expression): Expression => {
//   const recurse = substituteExpressionVariables(substitutions);
//   return substitutions.reduce(
//     (body, { name, value }): Expression => {
//       switch (body.kind) {
//         case 'SymbolExpression':
//         case 'NumberExpression':
//         case 'BooleanExpression':
//         case 'FunctionExpression':
//           return body;
//
//         case 'Identifier':
//           return body.name === name ? value : body;
//
//         case 'Application':
//           return {
//             ...body,
//             kind: 'Application',
//             parameter: recurse(body.parameter),
//             callee: recurse(body.callee),
//           };
//
//         case 'DataInstantiation':
//           return {
//             ...body,
//             kind: 'DataInstantiation',
//             parameters: body.parameters.map(recurse),
//           };
//
//         case 'RecordExpression':
//           return {
//             ...body,
//             properties: mapValues(body.properties, recurse),
//           };
//
//         case 'BindingExpression':
//           return {
//             ...body,
//             value: recurse(body.value),
//             body: recurse(body.body),
//           };
//
//         case 'DualExpression':
//           return {
//             ...body,
//             left: recurse(body.left),
//             right: recurse(body.right),
//           };
//
//         case 'ReadRecordPropertyExpression':
//           return {
//             ...body,
//             record: recurse(body.record),
//           };
//
//         case 'ReadDataPropertyExpression':
//           return {
//             ...body,
//             dataValue: recurse(body.dataValue),
//           };
//
//         case 'PatternMatchExpression':
//           return {
//
//           }
//
//         default:
//           return assertNever(body);
//       }
//     },
//     expression,
//   );
// };
exports.evaluateExpression = (scope) => (expression) => {
    switch (expression.kind) {
        case 'SymbolExpression':
            return { kind: 'SymbolLiteral', name: expression.name };
        case 'BooleanExpression':
            return { kind: 'BooleanLiteral', value: expression.value };
        case 'NumberExpression':
            return { kind: 'NumberLiteral', value: expression.value };
        case 'StringExpression':
            return { kind: 'StringLiteral', value: expression.value };
        case 'DualExpression': {
            const left = exports.evaluateExpression(scope)(expression.left);
            const right = exports.evaluateExpression(scope)(expression.right);
            if (!left || !right) {
                return undefined;
            }
            return { left, right, kind: 'DualBinding' };
        }
        case 'DataInstantiation': {
            const name = exports.evaluateExpression(scope)(expression.callee);
            if (!name) {
                return undefined;
            }
            const parameters = expression.parameters.map(exports.evaluateExpression(scope));
            if (utils_1.everyIs(parameters, utils_1.isDefined)) {
                return {
                    parameters,
                    kind: 'DataValue',
                    name: name,
                };
            }
            return undefined;
        }
        case 'FunctionExpression': {
            const parameter = exports.evaluateExpression(scope)(expression.parameter);
            if (!parameter) {
                return undefined;
            }
            const body = exports.evaluateExpression(scope)(expression.body);
            if (!body) {
                return undefined;
            }
            return {
                body,
                parameter,
                kind: expression.implicit ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
            };
        }
        case 'RecordExpression': {
            const properties = lodash_1.mapValues(expression.properties, exports.evaluateExpression(scope));
            if (utils_1.everyValue(properties, utils_1.isDefined)) {
                return { properties, kind: 'RecordLiteral' };
            }
            return undefined;
        }
        case 'Identifier': {
            const declaration = lodash_1.find(scope.bindings, { name: expression.name });
            if (declaration) {
                return declaration.kind === 'ScopeBinding' ? exports.evaluateExpression(scope)(declaration.value) : declaration.type;
            }
            return constructors_1.freeVariable(expression.name);
        }
        case 'Application': {
            const callee = exports.evaluateExpression(scope)(expression.callee);
            if (!callee) {
                return undefined;
            }
            const parameter = exports.evaluateExpression(scope)(expression.parameter);
            if (!parameter) {
                return undefined;
            }
            const simplifiedCallee = exports.simplify(callee);
            if (simplifiedCallee.kind !== 'FunctionLiteral' && simplifiedCallee.kind !== 'ImplicitFunctionLiteral') {
                return {
                    parameter,
                    kind: 'ApplicationValue',
                    callee: simplifiedCallee,
                };
            }
            const replacements = type_utils_1.destructureValue(simplifiedCallee.parameter, parameter);
            if (!replacements) {
                return undefined;
            }
            return exports.simplify(variable_utils_1.applyReplacements(replacements)(simplifiedCallee.body));
        }
        case 'BindingExpression':
            return exports.evaluateExpression(constructors_1.expandEvaluationScope(scope, {
                bindings: [constructors_1.eScopeBinding(expression.name, expression.value)]
            }))(expression.body);
        case 'ReadRecordPropertyExpression': {
            const record = exports.evaluateExpression(scope)(expression.record);
            if (!record) {
                return undefined;
            }
            if (record.kind !== 'RecordLiteral' || !record.properties[expression.property]) {
                // Expression cannot be reduced yet
                return {
                    record,
                    kind: 'ReadRecordProperty',
                    property: expression.property,
                };
            }
            return record.properties[expression.property];
        }
        case 'ReadDataPropertyExpression': {
            const dataValue = exports.evaluateExpression(scope)(expression.dataValue);
            if (!dataValue) {
                return undefined;
            }
            if (dataValue.kind !== 'DataValue' || dataValue.parameters.length <= expression.property) {
                // Expression cannot be reduced yet
                return {
                    dataValue,
                    kind: 'ReadDataValueProperty',
                    property: expression.property,
                };
            }
            return dataValue.parameters[expression.property];
        }
        case 'PatternMatchExpression': {
            const value = exports.evaluateExpression(scope)(expression.value);
            if (!value) {
                return undefined;
            }
            const patterns = expression.patterns.map(({ test, value }) => ({
                test: exports.evaluateExpression(scope)(test),
                value: exports.evaluateExpression(scope)(value),
            }));
            if (!utils_1.everyIs(patterns, (pattern) => (utils_1.isDefined(pattern.test) && utils_1.isDefined(pattern.value)))) {
                return undefined;
            }
            return exports.simplify({
                value,
                patterns,
                kind: 'PatternMatchValue',
            });
        }
        case 'NativeExpression':
            return undefined;
        default:
            return utils_1.assertNever(expression);
    }
};
exports.simplify = visitor_utils_1.visitValue({
    after(value) {
        switch (value.kind) {
            case 'ReadDataValueProperty':
                return value.dataValue.kind === 'DataValue' && value.dataValue.parameters.length > value.property
                    ? value.dataValue.parameters[value.property]
                    : value;
            case 'ReadRecordProperty':
                return value.record.kind === 'RecordLiteral' && value.record.properties[value.property]
                    ? value.record.properties[value.property]
                    : value;
            case 'ApplicationValue': {
                if (value.callee.kind !== 'FunctionLiteral' && value.callee.kind !== 'ImplicitFunctionLiteral') {
                    return value;
                }
                const replacements = type_utils_1.destructureValue(value.callee.parameter, value.parameter);
                if (!replacements) {
                    return value;
                }
                return exports.simplify(variable_utils_1.applyReplacements(replacements)(value.callee.body));
            }
            case 'PatternMatchValue': {
                if (variable_utils_1.extractFreeVariableNames(value.value).length !== 0) {
                    return value;
                }
                const found = utils_1.findWithResult(value.patterns, ({ test }) => type_utils_1.converge(constructors_1.scope(), test, value.value));
                if (!found) {
                    return value;
                }
                const [{ value: matched }, replacements] = found;
                return exports.simplify(variable_utils_1.applyReplacements(replacements)(matched));
            }
            case 'FunctionLiteral':
            case 'ImplicitFunctionLiteral':
            case 'FreeVariable':
            case 'SymbolLiteral':
            case 'NumberLiteral':
            case 'StringLiteral':
            case 'BooleanLiteral':
            case 'DataValue':
            case 'RecordLiteral':
            case 'DualBinding':
                return value;
            default:
                return utils_1.assertNever(value);
        }
    },
});
//# sourceMappingURL=evaluate.js.map