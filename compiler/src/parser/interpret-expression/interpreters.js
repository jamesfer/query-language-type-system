"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const free_1 = require("../../utils/free");
const interpreter_utils_1 = require("./interpreter-utils");
const matchers_1 = require("./matchers");
const message_state_1 = require("./message-state");
const matchExpression = matchers_1.makeExpressionMatcher(() => interpretExpressionComponent);
const matchBrokenExpression = matchers_1.makeBrokenExpressionMatcher(() => interpretExpressionComponent);
const interpretNumber = interpreter_utils_1.interpreter('interpretNumber', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('number'))(([, [token]]) => ({
    kind: 'NumberExpression',
    value: +token.value,
})));
const interpretString = interpreter_utils_1.interpreter('interpretString', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('string'))(([, [token]]) => ({
    kind: 'StringExpression',
    value: token.value.slice(1, -1),
})));
const interpretIdentifier = interpreter_utils_1.interpreter('interpretIdentifier', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('identifier'))(([, [token]]) => ({
    kind: 'Identifier',
    name: token.value,
})));
const interpretBoolean = interpreter_utils_1.interpreter('interpretBoolean', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('boolean'))(([, [token]]) => ({
    kind: 'BooleanExpression',
    value: token.value === 'true',
})));
const interpretFunction = interpreter_utils_1.interpreter('interpretFunction', matchers_1.matchAll(matchers_1.withPrevious(interpreter_utils_1.Precedence.functionArrowParam), matchers_1.matchTokens('arrow'), matchExpression(interpreter_utils_1.Precedence.functionArrow))(([parameter, , body]) => ({
    body,
    parameter,
    kind: 'FunctionExpression',
    implicit: false,
})));
const interpretImplicitFunction = interpreter_utils_1.interpreter('interpretImplicitFunction', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchKeyword('implicit'), matchExpression(interpreter_utils_1.Precedence.implicitFunctionArrowParam), matchers_1.matchTokens('arrow'), matchExpression(interpreter_utils_1.Precedence.functionArrow))(([, , parameter, , body]) => ({
    body,
    parameter,
    kind: 'FunctionExpression',
    implicit: true,
})));
const interpretApplication = interpreter_utils_1.interpreter('interpretApplication', matchers_1.matchAll(matchers_1.withPrevious(interpreter_utils_1.Precedence.application), matchExpression(interpreter_utils_1.Precedence.application2))(([callee, parameter]) => ({
    callee,
    parameter,
    kind: 'Application',
})));
const interpretBinding = interpreter_utils_1.interpreter('interpretBinding', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchKeyword('let'), matchers_1.matchTokens('identifier', 'equals'), matchExpression(interpreter_utils_1.Precedence.bindingEquals), matchBrokenExpression(interpreter_utils_1.Precedence.none))(([, , [name], value, body]) => ({
    value,
    body,
    kind: 'BindingExpression',
    name: name.value,
})));
const interpretData = interpreter_utils_1.interpreter('interpretData', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchKeyword('data'), matchers_1.matchTokens('identifier'), matchers_1.matchOption(interpreter_utils_1.interpreter(undefined, matchers_1.matchAll(matchers_1.matchTokens('equals'), matchers_1.matchOption(matchers_1.matchKeyword('implicit')), matchExpression(interpreter_utils_1.Precedence.bindingEquals), matchers_1.matchOption(matchers_1.matchRepeated(interpreter_utils_1.interpreter(undefined, matchers_1.matchAll(matchers_1.matchTokens('comma'), matchers_1.matchOption(matchers_1.matchKeyword('implicit')), matchExpression(interpreter_utils_1.Precedence.bindingEquals))(a => a)))))(a => a))), matchBrokenExpression(interpreter_utils_1.Precedence.none))(([, , [name], option, body]) => {
    let parameters = [];
    if (option) {
        const [, implicitFirstParameter, firstParameter, otherParameters = []] = option;
        parameters = [
            [firstParameter, !!implicitFirstParameter],
            ...otherParameters.map(([, implicit, parameter]) => [parameter, !!implicit])
        ];
    }
    return {
        body,
        kind: 'BindingExpression',
        name: name.value,
        value: parameters.reduceRight((body, [parameter, implicit], index) => ({
            implicit,
            body,
            kind: 'FunctionExpression',
            parameter: parameter.kind === 'Identifier' ? parameter : {
                kind: 'DualExpression',
                // The parameter needs to be on the left because of how dual expression typing is
                // unfinished
                left: parameter,
                right: {
                    kind: 'Identifier',
                    name: `dataParameter$${index}`
                },
            },
        }), {
            kind: 'DataInstantiation',
            callee: {
                kind: 'SymbolExpression',
                name: name.value,
            },
            parameters: parameters
                .map(([parameter, implicit], index) => ({ parameter, implicit, index }))
                .filter(({ implicit }) => !implicit)
                .map(({ parameter, index }) => parameter.kind === 'Identifier'
                ? parameter
                : {
                    kind: 'Identifier',
                    name: `dataParameter$${index}`,
                }),
            parameterShapes: parameters,
        }),
    };
}));
const interpretDual = interpreter_utils_1.interpreter('interpretDual', matchers_1.matchAll(matchers_1.withPrevious(interpreter_utils_1.Precedence.dual), matchers_1.matchTokens('colon'), matchExpression(interpreter_utils_1.Precedence.dual))(([left, , right]) => ({
    left,
    right,
    kind: 'DualExpression',
})));
const interpretRecord = interpreter_utils_1.interpreter('interpretRecord', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('openBrace'), matchers_1.matchRepeated(interpreter_utils_1.interpreter('innerRecord', matchers_1.matchAll(matchers_1.matchTokens('identifier', 'equals'), matchExpression(interpreter_utils_1.Precedence.record), matchers_1.matchTokens('comma'))(a => a))), matchers_1.matchTokens('closeBrace'))(([, , properties]) => ({
    kind: 'RecordExpression',
    properties: lodash_1.fromPairs(properties.map(([[name], value]) => ([name.value, value]))),
})));
const interpretDataProperty = interpreter_utils_1.interpreter('interpretDataProperty', matchers_1.matchAll(matchers_1.withPrevious(interpreter_utils_1.Precedence.readProperty), matchers_1.matchTokens('dot', 'number'))(([dataValue, [, property]]) => ({
    dataValue,
    kind: 'ReadDataPropertyExpression',
    property: +property.value,
})));
const interpretRecordProperty = interpreter_utils_1.interpreter('interpretRecordProperty', matchers_1.matchAll(matchers_1.withPrevious(interpreter_utils_1.Precedence.readProperty), matchers_1.matchTokens('dot', 'identifier'))(([record, [, property]]) => ({
    record,
    kind: 'ReadRecordPropertyExpression',
    property: property.value,
})));
const interpretPatternMatch = interpreter_utils_1.interpreter('interpretPatternMatch', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchKeyword('match'), matchExpression(interpreter_utils_1.Precedence.patternMatch), matchers_1.matchRepeated(interpreter_utils_1.interpreter(undefined, matchers_1.matchAll(matchers_1.matchTokens('bar'), matchExpression(interpreter_utils_1.Precedence.patternMatch), matchers_1.matchTokens('equals'), matchExpression(interpreter_utils_1.Precedence.none))(a => a))))(([, , value, patterns]) => ({
    value,
    kind: 'PatternMatchExpression',
    patterns: patterns.map(([, test, , value]) => ({ test, value })),
})));
function extractSimpleRecordValues(record) {
    return lodash_1.fromPairs(lodash_1.flatMap(record.properties, (value, key) => {
        if (value.kind === 'BooleanExpression') {
            return [[key, value.value]];
        }
        else if (value.kind === 'NumberExpression') {
            return [[key, value.value]];
        }
        else if (value.kind === 'StringExpression') {
            return [[key, value.value]];
        }
        else if (value.kind === 'RecordExpression') {
            return [[key, extractSimpleRecordValues(value)]];
        }
        return [];
    }));
}
const interpretNative = interpreter_utils_1.interpreter('interpretNative', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('hash'), interpretRecord)(([_1, _2, record]) => ({
    kind: 'NativeExpression',
    data: extractSimpleRecordValues(record),
})));
const interpretParenthesis = interpreter_utils_1.interpreter('interpretParenthesis', matchers_1.matchAll(matchers_1.withoutPrevious, matchers_1.matchTokens('openParen'), matchExpression(interpreter_utils_1.Precedence.none), matchers_1.matchTokens('closeParen'))(([, , expression]) => expression));
const interpretExpressionComponent = matchers_1.protectAgainstLoops(matchers_1.matchAny(interpretData, interpretBoolean, interpretNumber, interpretString, interpretIdentifier, interpretRecord, interpretFunction, interpretImplicitFunction, interpretBinding, interpretDual, interpretRecordProperty, interpretDataProperty, interpretPatternMatch, interpretApplication, interpretNative, interpretParenthesis));
function interpretExpression(tokens) {
    const { messages, value: results } = free_1.runFree(interpreter_utils_1.runInterpreter(matchExpression(interpreter_utils_1.Precedence.none), tokens, undefined, interpreter_utils_1.Precedence.none));
    const longestMatch = lodash_1.maxBy(results, 'tokens.length');
    return message_state_1.withMessages(messages, longestMatch === null || longestMatch === void 0 ? void 0 : longestMatch.value);
}
exports.default = interpretExpression;
//# sourceMappingURL=interpreters.js.map