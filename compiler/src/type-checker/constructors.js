"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.node = exports.readDataProperty = exports.readRecordProperty = exports.data = exports.dual = exports.dataInstantiation = exports.record = exports.stringExpression = exports.booleanExpression = exports.numberExpression = exports.apply = exports.identifier = exports.lambda = exports.bind = exports.symbolExpression = exports.application = exports.dualBinding = exports.stringLiteral = exports.numberLiteral = exports.booleanLiteral = exports.freeVariable = exports.recordLiteral = exports.functionType = exports.dataValue = exports.symbol = void 0;
const lodash_1 = require("lodash");
/**
 * Values
 */
function symbol(name) {
    return {
        name,
        kind: 'SymbolLiteral',
    };
}
exports.symbol = symbol;
function dataValue(name, parameters = []) {
    return {
        parameters,
        name: typeof name === 'string' ? symbol(name) : name,
        kind: 'DataValue',
    };
}
exports.dataValue = dataValue;
function functionType(returnType, parameters) {
    // TODO create a custom function type value
    return parameters.reduceRight((body, parameter) => Array.isArray(parameter)
        ? {
            body,
            kind: parameter[1] ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
            parameter: parameter[0],
        }
        : {
            body,
            parameter,
            kind: 'FunctionLiteral',
        }, returnType);
}
exports.functionType = functionType;
function recordLiteral(properties) {
    return {
        properties,
        kind: 'RecordLiteral',
    };
}
exports.recordLiteral = recordLiteral;
function freeVariable(name) {
    return {
        name,
        kind: 'FreeVariable',
    };
}
exports.freeVariable = freeVariable;
function booleanLiteral(value) {
    return {
        value,
        kind: 'BooleanLiteral',
    };
}
exports.booleanLiteral = booleanLiteral;
function numberLiteral(value) {
    return {
        value,
        kind: 'NumberLiteral',
    };
}
exports.numberLiteral = numberLiteral;
function stringLiteral(value) {
    return {
        value,
        kind: 'StringLiteral',
    };
}
exports.stringLiteral = stringLiteral;
function dualBinding(left, right) {
    return {
        left,
        right,
        kind: 'DualBinding',
    };
}
exports.dualBinding = dualBinding;
function application(callee, parameter) {
    return {
        callee,
        parameter,
        kind: 'ApplicationValue',
    };
}
exports.application = application;
function toExpression(expression) {
    if (typeof expression === 'string') {
        return identifier(expression);
    }
    if (typeof expression === 'number') {
        return numberExpression(expression);
    }
    if (typeof expression === 'boolean') {
        return booleanExpression(expression);
    }
    return expression;
}
function allToExpression(expressions) {
    return expressions.map(toExpression);
}
function symbolExpression(name) {
    return {
        name,
        kind: 'SymbolExpression',
    };
}
exports.symbolExpression = symbolExpression;
exports.bind = (name, value) => (body) => ({
    name,
    body,
    kind: 'BindingExpression',
    value: toExpression(value),
});
function defaultExplicit(parameters) {
    return parameters.map(parameter => Array.isArray(parameter) ? parameter : [parameter, false]);
}
function lambda(parameters, body) {
    if (parameters.length === 0) {
        throw new Error('Cannot create a function with no parameters');
    }
    return defaultExplicit(parameters).reduceRight((body, [parameter, implicit]) => ({
        body,
        implicit,
        kind: 'FunctionExpression',
        parameter: toExpression(parameter),
    }), toExpression(body));
}
exports.lambda = lambda;
function identifier(name) {
    return {
        name,
        kind: 'Identifier',
    };
}
exports.identifier = identifier;
function apply(callee, parameters) {
    return lodash_1.castArray(parameters).reduce((callee, parameter) => ({
        kind: 'Application',
        callee: callee,
        parameter: toExpression(parameter),
    }), toExpression(callee));
}
exports.apply = apply;
function numberExpression(value) {
    return {
        value,
        kind: 'NumberExpression',
    };
}
exports.numberExpression = numberExpression;
function booleanExpression(value) {
    return {
        value,
        kind: 'BooleanExpression',
    };
}
exports.booleanExpression = booleanExpression;
function stringExpression(value) {
    return {
        value,
        kind: 'StringExpression',
    };
}
exports.stringExpression = stringExpression;
function record(properties) {
    return {
        properties,
        kind: 'RecordExpression',
    };
}
exports.record = record;
function dataInstantiation(name, parameters, parameterShapes) {
    return {
        kind: 'DataInstantiation',
        callee: typeof name === 'string' && name[0].toUpperCase() === name[0] ? symbolExpression(name) : toExpression(name),
        parameters: allToExpression(parameters),
        parameterShapes: defaultExplicit(parameterShapes).map(([parameter, implicit]) => ([toExpression(parameter), implicit])),
    };
}
exports.dataInstantiation = dataInstantiation;
function dual(left, right) {
    return {
        kind: 'DualExpression',
        left: toExpression(left),
        right: toExpression(right),
    };
}
exports.dual = dual;
exports.data = (name, parameterNames = [], parameters = parameterNames) => (
// {
//   kind: 'Data'
// }
exports.bind(name, lambda(parameters, dataInstantiation(name, parameterNames.map(identifier), parameters))));
function readRecordProperty(record, property) {
    return {
        property,
        kind: 'ReadRecordPropertyExpression',
        record: toExpression(record),
    };
}
exports.readRecordProperty = readRecordProperty;
function readDataProperty(dataValue, property) {
    return {
        property,
        kind: 'ReadDataPropertyExpression',
        dataValue: toExpression(dataValue),
    };
}
exports.readDataProperty = readDataProperty;
/**
 * Other
 */
function node(expression, decoration) {
    return {
        expression,
        decoration,
        kind: 'Node',
    };
}
exports.node = node;
//# sourceMappingURL=constructors.js.map