"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
function* unfoldParameters(value) {
    let currentValue = value;
    while (currentValue.kind === 'FunctionLiteral' || currentValue.kind === 'ImplicitFunctionLiteral') {
        const { parameter, body } = currentValue;
        yield [currentValue.kind === 'ImplicitFunctionLiteral', parameter, body];
        currentValue = body;
    }
}
exports.unfoldParameters = unfoldParameters;
function* unfoldExplicitParameters(value) {
    const skippedImplicits = [];
    for (const [implicit, parameter, body] of unfoldParameters(value)) {
        if (implicit) {
            skippedImplicits.push(parameter);
        }
        else {
            yield [parameter, body, skippedImplicits];
        }
    }
}
exports.unfoldExplicitParameters = unfoldExplicitParameters;
exports.visitExpressionNodes = (visitor) => (expression) => {
    switch (expression.kind) {
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'Identifier':
        case 'NativeExpression':
            return expression;
        case 'RecordExpression':
            return Object.assign(Object.assign({}, expression), { properties: lodash_1.mapValues(expression.properties, exports.visitNodes(visitor)) });
        case 'Application':
            return Object.assign(Object.assign({}, expression), { callee: exports.visitNodes(visitor)(expression.callee), parameter: exports.visitNodes(visitor)(expression.parameter) });
        case 'FunctionExpression':
            return Object.assign(Object.assign({}, expression), { body: exports.visitNodes(visitor)(expression.body) });
        case 'DataInstantiation':
            return Object.assign(Object.assign({}, expression), { parameters: expression.parameters.map(exports.visitNodes(visitor)) });
        case 'BindingExpression':
            return Object.assign(Object.assign({}, expression), { value: exports.visitNodes(visitor)(expression.value), body: exports.visitNodes(visitor)(expression.body) });
        case 'DualExpression':
            return Object.assign(Object.assign({}, expression), { left: exports.visitNodes(visitor)(expression.left), right: exports.visitNodes(visitor)(expression.right) });
        case 'ReadRecordPropertyExpression':
            return Object.assign(Object.assign({}, expression), { record: exports.visitNodes(visitor)(expression.record) });
        case 'ReadDataPropertyExpression':
            return Object.assign(Object.assign({}, expression), { dataValue: exports.visitNodes(visitor)(expression.dataValue) });
        case 'PatternMatchExpression':
            return Object.assign(Object.assign({}, expression), { value: exports.visitNodes(visitor)(expression.value), patterns: expression.patterns.map(({ test, value }) => ({
                    test: exports.visitNodes(visitor)(test),
                    value: exports.visitNodes(visitor)(value),
                })) });
        default:
            return utils_1.assertNever(expression);
    }
};
exports.visitNodes = (visitor) => (node) => {
    var _a, _b;
    const beforeNode = ((_a = visitor.before) === null || _a === void 0 ? void 0 : _a.call(visitor, node)) || node;
    const transformedNode = Object.assign(Object.assign({}, node), { expression: exports.visitExpressionNodes(visitor)(beforeNode.expression) });
    return ((_b = visitor.after) === null || _b === void 0 ? void 0 : _b.call(visitor, transformedNode)) || transformedNode;
};
exports.visitAndTransformNode = (visitor) => (node) => {
    const expression = exports.visitAndTransformChildExpression(exports.visitAndTransformNode(visitor))(node.expression);
    return visitor(Object.assign(Object.assign({}, node), { expression }));
};
exports.visitAndTransformChildExpression = (callback) => (expression) => {
    switch (expression.kind) {
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'Identifier':
        case 'NativeExpression':
            return expression;
        case 'RecordExpression':
            return Object.assign(Object.assign({}, expression), { properties: lodash_1.mapValues(expression.properties, callback) });
        case 'Application':
            return Object.assign(Object.assign({}, expression), { callee: callback(expression.callee), parameter: callback(expression.parameter) });
        case 'FunctionExpression':
            return Object.assign(Object.assign({}, expression), { body: callback(expression.body) });
        case 'DataInstantiation':
            return Object.assign(Object.assign({}, expression), { callee: callback(expression.callee), parameters: expression.parameters.map(callback) });
        case 'BindingExpression':
            return Object.assign(Object.assign({}, expression), { value: callback(expression.value), body: callback(expression.body) });
        case 'DualExpression':
            return Object.assign(Object.assign({}, expression), { left: callback(expression.left), right: callback(expression.right) });
        case 'ReadRecordPropertyExpression':
            return Object.assign(Object.assign({}, expression), { record: callback(expression.record) });
        case 'ReadDataPropertyExpression':
            return Object.assign(Object.assign({}, expression), { dataValue: callback(expression.dataValue) });
        case 'PatternMatchExpression':
            return Object.assign(Object.assign({}, expression), { value: callback(expression.value), patterns: expression.patterns.map(({ test, value }) => ({
                    test: callback(test),
                    value: callback(value),
                })) });
        default:
            return utils_1.assertNever(expression);
    }
};
exports.visitAndTransformExpression = (visitor) => (expression) => {
    return visitor(exports.visitAndTransformChildExpression(exports.visitAndTransformExpression(visitor))(expression));
};
const visitAndTransformChildExpressionPre = (callback) => (expression) => {
    switch (expression.kind) {
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'Identifier':
        case 'NativeExpression':
            return expression;
        case 'RecordExpression':
            return Object.assign(Object.assign({}, expression), { properties: lodash_1.mapValues(expression.properties, callback) });
        case 'Application':
            return Object.assign(Object.assign({}, expression), { callee: callback(expression.callee), parameter: callback(expression.parameter) });
        case 'FunctionExpression':
            return Object.assign(Object.assign({}, expression), { body: callback(expression.body) });
        case 'DataInstantiation':
            return Object.assign(Object.assign({}, expression), { callee: callback(expression.callee), parameters: expression.parameters.map(callback) });
        case 'BindingExpression':
            return Object.assign(Object.assign({}, expression), { value: callback(expression.value), body: callback(expression.body) });
        case 'DualExpression':
            return Object.assign(Object.assign({}, expression), { left: callback(expression.left), right: callback(expression.right) });
        case 'ReadRecordPropertyExpression':
            return Object.assign(Object.assign({}, expression), { record: callback(expression.record) });
        case 'ReadDataPropertyExpression':
            return Object.assign(Object.assign({}, expression), { dataValue: callback(expression.dataValue) });
        case 'PatternMatchExpression':
            return Object.assign(Object.assign({}, expression), { value: callback(expression.value), patterns: expression.patterns.map(({ test, value }) => ({
                    test: callback(test),
                    value: callback(value),
                })) });
        default:
            return utils_1.assertNever(expression);
    }
};
exports.visitAndTransformExpressionBefore = (visitor) => (expression) => {
    return visitAndTransformChildExpressionPre(exports.visitAndTransformExpressionBefore(visitor))(visitor(expression));
};
exports.visitChildValues = (visitor) => (value) => {
    switch (value.kind) {
        case 'SymbolLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
        case 'FreeVariable':
            return value;
        case 'DataValue':
            return Object.assign(Object.assign({}, value), { parameters: value.parameters.map(exports.visitValue(visitor)), name: exports.visitValue(visitor)(value.name) });
        case 'RecordLiteral':
            return Object.assign(Object.assign({}, value), { properties: lodash_1.mapValues(value.properties, exports.visitValue(visitor)) });
        case 'DualBinding':
            return Object.assign(Object.assign({}, value), { left: exports.visitValue(visitor)(value.left), right: exports.visitValue(visitor)(value.right) });
        case 'FunctionLiteral':
        case 'ImplicitFunctionLiteral':
            return Object.assign(Object.assign({}, value), { parameter: exports.visitValue(visitor)(value.parameter), body: exports.visitValue(visitor)(value.body) });
        case 'ApplicationValue':
            return Object.assign(Object.assign({}, value), { parameter: exports.visitValue(visitor)(value.parameter), callee: exports.visitValue(visitor)(value.callee) });
        case 'ReadDataValueProperty':
            return Object.assign(Object.assign({}, value), { dataValue: exports.visitValue(visitor)(value.dataValue) });
        case 'ReadRecordProperty':
            return Object.assign(Object.assign({}, value), { record: exports.visitValue(visitor)(value.record) });
        case 'PatternMatchValue':
            return Object.assign(Object.assign({}, value), { value: exports.visitValue(visitor)(value.value), patterns: value.patterns.map(({ test, value }) => ({
                    test: exports.visitValue(visitor)(test),
                    value: exports.visitValue(visitor)(value),
                })) });
        default:
            return utils_1.assertNever(value);
    }
};
exports.visitValue = (visitor) => (value) => {
    var _a, _b;
    const beforeValue = ((_a = visitor.before) === null || _a === void 0 ? void 0 : _a.call(visitor, value)) || value;
    const transformedValue = exports.visitChildValues(visitor)(beforeValue);
    return ((_b = visitor.after) === null || _b === void 0 ? void 0 : _b.call(visitor, transformedValue)) || transformedValue;
};
const visitAndTransformChildValues = (callback) => (value) => {
    switch (value.kind) {
        case 'SymbolLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
        case 'FreeVariable':
            return value;
        case 'DataValue':
            return Object.assign(Object.assign({}, value), { name: callback(value.name), parameters: value.parameters.map(callback) });
        case 'RecordLiteral':
            return Object.assign(Object.assign({}, value), { properties: lodash_1.mapValues(value.properties, callback) });
        case 'DualBinding':
            return Object.assign(Object.assign({}, value), { left: callback(value.left), right: callback(value.right) });
        case 'FunctionLiteral':
        case 'ImplicitFunctionLiteral':
            return Object.assign(Object.assign({}, value), { parameter: callback(value.parameter), body: callback(value.body) });
        case 'ApplicationValue':
            return Object.assign(Object.assign({}, value), { parameter: callback(value.parameter), callee: callback(value.callee) });
        case 'ReadDataValueProperty':
            return Object.assign(Object.assign({}, value), { dataValue: callback(value.dataValue) });
        case 'ReadRecordProperty':
            return Object.assign(Object.assign({}, value), { record: callback(value.record) });
        case 'PatternMatchValue':
            return Object.assign(Object.assign({}, value), { value: callback(value.value), patterns: value.patterns.map(({ test, value }) => ({
                    test: callback(test),
                    value: callback(value),
                })) });
        default:
            return utils_1.assertNever(value);
    }
};
exports.visitAndTransformValue = (visitor) => (value) => {
    return visitor(visitAndTransformChildValues(exports.visitAndTransformValue(visitor))(value));
};
exports.visitValueForState = (initial, visitor) => (value) => {
    let state = initial;
    const wrap = (visitor) => (value) => {
        const [newState, newValue] = visitor([state, value]);
        state = newState;
        return newValue;
    };
    exports.visitValue({
        before: visitor.before ? wrap(visitor.before) : undefined,
        after: visitor.after ? wrap(visitor.after) : undefined,
    })(value);
    return state;
};
exports.visitValueWithState = (initial, visitor) => (value) => {
    let state = initial;
    const wrap = (visitor) => (value) => {
        const [newState, newValue] = visitor([state, value]);
        state = newState;
        return newValue;
    };
    return exports.visitValue({
        before: visitor.before ? wrap(visitor.before) : undefined,
        after: visitor.after ? wrap(visitor.after) : undefined,
    })(value);
};
//# sourceMappingURL=visitor-utils.js.map