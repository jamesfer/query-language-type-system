import { fromPairs, maxBy, flatMap } from 'lodash';
import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NativeExpression,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
  RecordExpression,
  StringExpression,
} from '../..';
import { runFree } from '../../utils/free';
import { ExpressionToken } from '../produce-expression-tokens';
import { Interpreter, interpreter, Precedence, runInterpreter } from './interpreter-utils';
import {
  makeBrokenExpressionMatcher,
  makeExpressionMatcher,
  matchAll,
  matchAny,
  matchKeyword,
  matchOption,
  matchRepeated,
  matchTokens,
  protectAgainstLoops,
  withoutPrevious,
  withPrevious,
} from './matchers';
import { WithMessages, withMessages } from './message-state';

const matchExpression = makeExpressionMatcher(() => interpretExpressionComponent);
const matchBrokenExpression = makeBrokenExpressionMatcher(() => interpretExpressionComponent);

const interpretNumber = interpreter('interpretNumber', matchAll(
  withoutPrevious,
  matchTokens('number'),
)(([, [token]]): NumberExpression => ({
  kind: 'NumberExpression',
  value: +token.value,
})));

const interpretString = interpreter('interpretString', matchAll(
  withoutPrevious,
  matchTokens('string'),
)(([, [token]]): StringExpression => ({
  kind: 'StringExpression',
  value: token.value.slice(1, -1),
})));

const interpretIdentifier = interpreter('interpretIdentifier', matchAll(
  withoutPrevious,
  matchTokens('identifier'),
)(([, [token]]): Identifier => ({
  kind: 'Identifier',
  name: token.value,
})));

const interpretBoolean = interpreter('interpretBoolean', matchAll(
  withoutPrevious,
  matchTokens('boolean'),
)(([, [token]]): BooleanExpression => ({
  kind: 'BooleanExpression',
  value: token.value === 'true',
})));

const interpretFunction = interpreter('interpretFunction', matchAll(
  withPrevious(Precedence.functionArrowParam),
  matchTokens('arrow'),
  matchExpression(Precedence.functionArrow),
)(([parameter, , body]): FunctionExpression => ({
  body,
  parameter,
  kind: 'FunctionExpression',
  implicit: false,
})));

const interpretImplicitFunction = interpreter('interpretImplicitFunction', matchAll(
  withoutPrevious,
  matchKeyword('implicit'),
  matchExpression(Precedence.implicitFunctionArrowParam),
  matchTokens('arrow'),
  matchExpression(Precedence.functionArrow),
)(([, , parameter, , body]): FunctionExpression => ({
  body,
  parameter,
  kind: 'FunctionExpression',
  implicit: true,
})));

const interpretApplication = interpreter('interpretApplication', matchAll(
  withPrevious(Precedence.application),
  matchExpression(Precedence.application2),
)(([callee, parameter]): Application => ({
  callee,
  parameter,
  kind: 'Application',
})));

const interpretBinding = interpreter('interpretBinding', matchAll(
  withoutPrevious,
  matchKeyword('let'),
  matchTokens('identifier', 'equals'),
  matchExpression(Precedence.bindingEquals),
  matchBrokenExpression(Precedence.none),
)(([, , [name], value, body]): BindingExpression => ({
  value,
  body,
  kind: 'BindingExpression',
  name: name.value,
})));

const interpretData = interpreter('interpretData', matchAll(
  withoutPrevious,
  matchKeyword('data'),
  matchTokens('identifier'),
  matchOption(interpreter(undefined, matchAll(
    matchTokens('equals'),
    matchOption(matchKeyword('implicit')), matchExpression(Precedence.bindingEquals),
    matchOption(matchRepeated(interpreter(undefined, matchAll(
      matchTokens('comma'),
      matchOption(matchKeyword('implicit')),
      matchExpression(Precedence.bindingEquals),
    )(a => a)))),
  )(a => a))),
  matchBrokenExpression(Precedence.none),
)(([, , [name], option, body]): BindingExpression => {
  let parameters: [Expression, boolean][] = [];
  if (option) {
    const [, implicitFirstParameter, firstParameter, otherParameters = []] = option;
    parameters = [
      [firstParameter, !!implicitFirstParameter],
      ...otherParameters.map<[Expression, boolean]>(([, implicit, parameter]) => [parameter, !!implicit])
    ];
  }
  return {
    body,
    kind: 'BindingExpression',
    name: name.value,
    value: parameters.reduceRight<Expression>(
      (body, [parameter, implicit], index): FunctionExpression => ({
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
      }),
      {
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
            }
        ),
        parameterShapes: parameters,
      },
    ),
  };
}));

const interpretDual = interpreter('interpretDual', matchAll(
  withPrevious(Precedence.dual),
  matchTokens('colon'),
  matchExpression(Precedence.dual),
)(([left, , right]): DualExpression => ({
  left,
  right,
  kind: 'DualExpression',
})));

const interpretRecord = interpreter('interpretRecord', matchAll(
  withoutPrevious,
  matchTokens('openBrace'),
  matchRepeated(interpreter('innerRecord', matchAll(
    matchTokens('identifier', 'equals'),
    matchExpression(Precedence.record),
    matchTokens('comma'),
  )(a => a))),
  matchTokens('closeBrace'),
)(([, , properties]): RecordExpression => ({
  kind: 'RecordExpression',
  properties: fromPairs(properties.map(([[name], value]) => ([name.value, value]))),
})));

const interpretDataProperty = interpreter('interpretDataProperty', matchAll(
  withPrevious(Precedence.readProperty),
  matchTokens('dot', 'number'),
)(([dataValue, [, property]]): ReadDataPropertyExpression => ({
  dataValue,
  kind: 'ReadDataPropertyExpression',
  property: +property.value,
})));

const interpretRecordProperty = interpreter('interpretRecordProperty', matchAll(
  withPrevious(Precedence.readProperty),
  matchTokens('dot', 'identifier'),
)(([record, [, property]]): ReadRecordPropertyExpression => ({
  record,
  kind: 'ReadRecordPropertyExpression',
  property: property.value,
})));

const interpretPatternMatch = interpreter('interpretPatternMatch', matchAll(
  withoutPrevious,
  matchKeyword('match'),
  matchExpression(Precedence.patternMatch),
  matchRepeated(interpreter(undefined, matchAll(
    matchTokens('bar'),
    matchExpression(Precedence.patternMatch),
    matchTokens('equals'),
    matchExpression(Precedence.none),
  )(a => a))),
)(([, , value, patterns]): PatternMatchExpression => ({
  value,
  kind: 'PatternMatchExpression',
  patterns: patterns.map(([, test, , value]) => ({ test, value })),
})));

function extractSimpleRecordValues(record: RecordExpression): { [k: string]: any } {
  return fromPairs(flatMap(record.properties, (value: Expression, key): [string, any][] => {
    if (value.kind === 'BooleanExpression') {
      return [[key, value.value]];
    } else if (value.kind === 'NumberExpression') {
      return [[key, value.value]];
    } else if (value.kind === 'StringExpression') {
      return [[key, value.value]];
    } else if (value.kind === 'RecordExpression') {
      return [[key, extractSimpleRecordValues(value)]];
    }
    return [];
  }));
}

const interpretNative = interpreter('interpretNative', matchAll(
  withoutPrevious,
  matchTokens('hash'),
  interpretRecord,
  // matchRepeated(interpreter(undefined, matchAll(
  //   matchTokens('identifier', 'equals'),
  //   matchExpression,
  //   matchTokens('comma'),
  // )(a => a))),
  // matchTokens('closeBrace'),
)(([_1, _2, record]): NativeExpression => ({
  kind: 'NativeExpression',
  data: extractSimpleRecordValues(record),
  // fromPairs(properties.map(([[identifier], value]) => [identifier.value, value.value])),
})));

const interpretParenthesis = interpreter('interpretParenthesis', matchAll(
  withoutPrevious,
  matchTokens('openParen'),
  matchExpression(Precedence.none),
  matchTokens('closeParen'),
)(([, , expression]) => expression));

const interpretExpressionComponent: Interpreter<Expression> = protectAgainstLoops(matchAny(
  interpretData,
  interpretBoolean,
  interpretNumber,
  interpretString,
  interpretIdentifier,
  interpretRecord,
  interpretFunction,
  interpretImplicitFunction,
  interpretBinding,
  interpretDual,
  interpretRecordProperty,
  interpretDataProperty,
  interpretPatternMatch,
  interpretApplication,
  interpretNative,
  interpretParenthesis,
));

export default function interpretExpression(tokens: ExpressionToken[]): WithMessages<Expression | undefined> {
  const { messages, value: results } = runFree(runInterpreter(
    matchExpression(Precedence.none),
    tokens,
    undefined,
    Precedence.none,
  ));
  const longestMatch = maxBy(results, 'tokens.length');
  return withMessages(messages, longestMatch?.value);
}
