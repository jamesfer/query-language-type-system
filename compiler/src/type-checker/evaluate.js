"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplify = exports.evaluateExpression = void 0;
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const utils_1 = require("./utils");
const type_utils_1 = require("./type-utils");
const variable_utils_1 = require("./variable-utils");
const visitor_utils_1 = require("./visitor-utils");
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
        case 'SimpleFunctionExpression': {
            const body = exports.evaluateExpression(scope)(expression.body);
            if (!body) {
                return undefined;
            }
            return {
                body,
                parameter: {
                    kind: 'FreeVariable',
                    name: expression.parameter,
                },
                kind: 'FunctionLiteral',
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
                return exports.simplify({
                    parameter,
                    kind: 'ApplicationValue',
                    callee: simplifiedCallee,
                });
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
        case 'NativeExpression':
            const evaluatorImplementation = expression.data.evaluator;
            if (!evaluatorImplementation) {
                throw new Error('Tried to evaluate a native expression that did not have a evaluator implementation');
            }
            if (evaluatorImplementation.kind === 'builtin') {
                return {
                    kind: 'FreeVariable',
                    name: `$builtin$${evaluatorImplementation.name}`,
                };
            }
            else {
                throw new Error(`Unknown type of evaluator native expression:${evaluatorImplementation.kind}`);
            }
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
                if (value.callee.kind === 'ApplicationValue') {
                    if (value.callee.callee.kind === 'FreeVariable') {
                        if (value.callee.callee.name === '$builtin$equals') {
                            return lodash_1.isEqual(value.parameter, value.callee.parameter)
                                ? { kind: 'BooleanLiteral', value: true }
                                : { kind: 'BooleanLiteral', value: false };
                        }
                    }
                    else if (value.callee.callee.kind === 'ApplicationValue' && value.callee.callee.callee.kind === 'FreeVariable') {
                        if (value.callee.callee.callee.name === '$builtin$if') {
                            if (value.callee.callee.parameter.kind === 'BooleanLiteral') {
                                if (value.callee.callee.parameter.value) {
                                    return value.callee.parameter;
                                }
                                else {
                                    return value.parameter;
                                }
                            }
                        }
                    }
                }
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
                if (variable_utils_1.extractFreeVariableNamesFromValue(value.value).length !== 0) {
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