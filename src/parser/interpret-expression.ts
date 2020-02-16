import { flatMap, map, max, maxBy, partition } from 'lodash';
import {
  BindingExpression,
  BooleanExpression,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
} from '../type-checker/types/expression';
import { Message } from '../type-checker/types/message';
import { checkedZip } from '../type-checker/utils';
import { Token, TokenKind } from './tokenize';

export interface WithTokens<T> {
  tokens: Token[];
  value: T;
}

function withTokens<T>(tokens: Token[], value: T): WithTokens<T> {
  return { tokens, value };
}

function mapWithTokens<A, B>(f: (a: A) => B): (result: WithTokens<A>) => WithTokens<B>;
function mapWithTokens<A, B>(result: WithTokens<A>, f: (a: A) => B): WithTokens<B>;
function mapWithTokens<A, B>(result: WithTokens<A> | ((a: A) => B), f?: ((a: A) => B)): WithTokens<B> | ((result: WithTokens<A>) => WithTokens<B>) {
  if (typeof result === 'function') {
    return (actualResult) => mapWithTokens(actualResult, result);
  }

  if (!f) {
    throw new Error('Missing parameter to mapWithTokens');
  }

  const { tokens, value } = result;
  return withTokens(tokens, f(value));
}

function flatMapWithTokens<A, B>({ tokens, value }: WithTokens<A>, f: (a: A) => WithTokens<B>): WithTokens<B> {
  const { tokens: resultTokens, value: resultValue } = f(value);
  return withTokens([...tokens, ...resultTokens], resultValue);
}

export interface WithMessages<T> {
  messages: Message[];
  value: T;
}

function withMessages<T>(messages: Message[], value: T): WithMessages<T> {
  return { messages, value };
}

type InterpreterFunction<T> = (tokens: Token[], previous: Expression | undefined) => WithMessages<WithTokens<T>[]>

export interface Interpreter<T> {
  name: string | undefined;
  interpret: InterpreterFunction<T>;
}

function interpreter<T>(
  name: string | undefined,
  interpret: InterpreterFunction<T>,
): Interpreter<T> {
  return { name, interpret };
}

function runInterpreter<T>(
  interpreter: Interpreter<T>,
  tokens: Token[],
  previous: Expression | undefined,
): WithMessages<WithTokens<T>[]> {
  if (!interpreter.name) {
    return interpreter.interpret(tokens, previous);
  }

  const { messages, value: results } = interpreter.interpret(tokens, previous);
  const indentedMessages = messages.map(message => `  ${message}`);
  const debugMessage = `${interpreter.name} running on: ${map(tokens, 'value').join(', ')}`;
  const resultMessage = `${interpreter.name} ${results.length > 0 ? `succeeded (${results.length} matches, at least ${max(map(results, 'tokens.length'))} tokens)` : 'failed'}`;
  return withMessages([debugMessage, ...indentedMessages, resultMessage], results);
}

function doWithState<T>(f: (state: MessageState) => T): WithMessages<T> {
  const state = new MessageState();
  return state.wrap(f(state));
}

class MessageState {
  private messages: Message[] = [];

  run<T extends any[], R>(f: (...args: T) => WithMessages<R>): (...args: T) => R {
    return (...args) => {
      const { messages, value } = f(...args);
      this.log(...messages);
      return value;
    }
  }

  wrap<T>(value: T) {
    return withMessages(this.messages, value);
  }

  log(...messages: Message[]): void {
    this.messages.push(...messages);
  }
}

function matchAll<T1>(i1: Interpreter<T1>): <R>(f: (args: [T1]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): <R>(f: (args: [T1, T2]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): <R>(f: (args: [T1, T2, T3]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): <R>(f: (args: [T1, T2, T3, T4]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): <R>(f: (args: [T1, T2, T3, T4, T5]) => R) => InterpreterFunction<R>;
function matchAll<T, R>(...interpreters: Interpreter<T>[]): (f: (args: T[]) => R) => InterpreterFunction<R> {
  return (f) => (tokens, previous) => doWithState((state) => {
    return interpreters.reduce<WithTokens<T[]>[]>(
      (combinations, interpreter) => flatMap(combinations, (combination) => (
        state.run(runInterpreter)(interpreter, tokens.slice(combination.tokens.length), previous)
          .map(result => flatMapWithTokens(combination, combination => (
            mapWithTokens(result, resultValue => [...combination, resultValue])
          )))
      )),
      [withTokens<T[]>([], [])],
    ).map(mapWithTokens(f));
  });
}

function matchAny<T1>(i1: Interpreter<T1>): Interpreter<T1>;
function matchAny<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): Interpreter<T1 | T2>;
function matchAny<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): Interpreter<T1 | T2 | T3>;
function matchAny<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): Interpreter<T1 | T2 | T3 | T4>;
function matchAny<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): Interpreter<T1 | T2 | T3 | T4 | T5>;
function matchAny<T1, T2, T3, T4, T5, T6>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6>;
function matchAny<T1, T2, T3, T4, T5, T6, T7>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
function matchAny<T, R>(...interpreters: Interpreter<T>[]): Interpreter<T> {
  return interpreter(undefined, (tokens, previous) => doWithState((state) => {
    return flatMap(interpreters, interpreter => (
      state.run(runInterpreter)(interpreter, tokens, previous)
    ));
  }));
}

function matchRepeated<T>(childInterpreter: Interpreter<T>): Interpreter<T[]> {
  return interpreter(undefined, (tokens, previous) => doWithState((state) => {
    let completedMatches: WithTokens<T[]>[] = [];
    let previousMatches: WithTokens<T[]>[] = [];

    // Initially run the interpreter against the tokens
    previousMatches = state.run(runInterpreter)(childInterpreter, tokens, previous)
      .map(({ tokens, value }) => withTokens(tokens, [value]));

    while (previousMatches.length > 0) {
      // Find more matches for each of the existing possibilities
      const nextMatches = previousMatches.map(({ tokens: usedTokens }) => (
        state.run(runInterpreter)(childInterpreter, tokens.slice(usedTokens.length), previous)
      ));
      const [failedMatches, successfulMatches] = partition(
        checkedZip(previousMatches, nextMatches),
        ([, nextResults]) => nextResults.length === 0,
      );

      // Add each of the failed to matches to the completed list
      completedMatches = [...completedMatches, ...map(failedMatches, '0')];

      // Add the successful matches to the previous matches to continue searching for them
      previousMatches = flatMap(successfulMatches, ([previousResult, nextResults]) => (
        nextResults.map(nextResult => flatMapWithTokens(previousResult, previousValues => (
          mapWithTokens(nextResult, nextValue => [...previousValues, nextValue])
        )))
      ));
    }

    return completedMatches;
  }));
}

const matchKeyword = (keyword: string): Interpreter<Token> => interpreter(`matchKeyword(${keyword})`, (tokens, previous) => doWithState((state) => {
  const results = state.run(runInterpreter)(matchTokens(TokenKind.keyword), tokens, previous);
  return flatMap(results, ({ value: [token] }): WithTokens<Token>[] => {
    return token && token.value === keyword ? [withTokens([token], token)] : [];
  });
}));

const matchTokens = (...kinds: TokenKind[]): Interpreter<Token[]> => interpreter(`matchTokens(${kinds.join(', ')})`, (tokens) => doWithState(() => {
  if (kinds.every((kind, index) => tokens[index] && tokens[index].kind === kind)) {
    const matchedTokens = tokens.slice(0, kinds.length);
    return [withTokens(matchedTokens, matchedTokens)];
  }
  return [];
}));

const withPrevious: Interpreter<Expression> = interpreter('withPrevious', (_, previous) => (
  withMessages([], previous === undefined ? [] : [withTokens([], previous)])
));

const withoutPrevious: Interpreter<null> = interpreter('withoutPrevious', (_, previous) => (
  withMessages([], previous === undefined ? [withTokens([], null)] : [])
));

function protectAgainstLoops<T>(wrapped: Interpreter<T>): Interpreter<T> {
  let lastTokens: Token[] | undefined;
  let lastPrevious: Expression | undefined;
  return interpreter(undefined, (tokens, previous) => doWithState((state) => {
    if (lastTokens && tokens.length === lastTokens.length && previous === lastPrevious) {
      throw new Error(`Loop detected. Tokens: ${JSON.stringify(lastTokens)}`);
    }

    lastTokens = tokens;
    lastPrevious = previous;
    return state.run(runInterpreter)(wrapped, tokens, previous);
  }));
}

function recursivelyMatchExpression(tokens: Token[], previous: Expression | undefined, previousTokens: Token[]): WithMessages<WithTokens<Expression>[]> {
  return doWithState((state) => {
    const results = state.run(runInterpreter)(interpretExpressionComponent, tokens, previous);
    return [...results, ...flatMap(results, ({ value, tokens: resultTokens }) => (
      state.run(recursivelyMatchExpression)(
        tokens.slice(resultTokens.length),
        value,
        [...previousTokens, ...resultTokens],
      ))
    )];
  });
}

const matchExpression: Interpreter<Expression> = interpreter('matchExpression', (tokens) => {
  return recursivelyMatchExpression(tokens, undefined, []);
});

const interpretNumber = interpreter('interpretNumber', matchAll(
  withoutPrevious,
  matchTokens(TokenKind.number),
)(([, [token]]): NumberExpression => ({
  kind: 'NumberExpression',
  value: +token.value,
})));

const interpretIdentifier = interpreter('interpretIdentifier', matchAll(
  withoutPrevious,
  matchTokens(TokenKind.identifier),
)(([, [token]]): Identifier => ({
  kind: 'Identifier',
  name: token.value,
})));

const interpretBoolean = interpreter('interpretBoolean', matchAll(
  withoutPrevious,
  matchTokens(TokenKind.boolean),
)(([, [token]]): BooleanExpression => ({
  kind: 'BooleanExpression',
  value: token.value === 'true',
})));

const interpretFunction = interpreter('interpretFunction', matchAll(
  withPrevious,
  matchTokens(TokenKind.arrow),
  matchExpression,
)(([parameter, , body]): FunctionExpression => ({
  body,
  parameter,
  kind: 'FunctionExpression',
  implicit: false,
})));

const interpretImplicitFunction = interpreter('interpretImplicitFunction', matchAll(
  withoutPrevious,
  matchKeyword('implicit'),
  matchExpression,
  matchTokens(TokenKind.arrow),
  matchExpression,
)(([, , parameter, , body]): FunctionExpression => ({
  body,
  parameter,
  kind: 'FunctionExpression',
  implicit: true,
})));


const interpretBinding = interpreter('interpretBinding', matchAll(
  withoutPrevious,
  matchKeyword('let'),
  matchTokens(TokenKind.identifier, TokenKind.equals),
  matchExpression,
  matchExpression,
)(([, , [name], value, body]): BindingExpression => ({
  value,
  body,
  kind: 'BindingExpression',
  name: name.value,
})));

const interpretDual = interpreter('interpretDual', matchAll(
  withPrevious,
  matchTokens(TokenKind.colon),
  matchExpression,
)(([left, , right]): DualExpression => ({
  left,
  right,
  kind: 'DualExpression',
})));

const interpretDataProperty = interpreter('interpretDataProperty', matchAll(
  withPrevious,
  matchTokens(TokenKind.hash, TokenKind.number),
)(([dataValue, [, property]]): ReadDataPropertyExpression => ({
  dataValue,
  kind: 'ReadDataPropertyExpression',
  property: +property.value,
})));

const interpretRecordProperty = interpreter('interpretRecordProperty', matchAll(
  withPrevious,
  matchTokens(TokenKind.dot, TokenKind.identifier),
)(([record, [, property]]): ReadRecordPropertyExpression => ({
  record,
  kind: 'ReadRecordPropertyExpression',
  property: property.value,
})));

const interpretPatternMatch = interpreter('interpretPatternMatch', matchAll(
  withoutPrevious,
  matchKeyword('match'),
  matchExpression,
  matchRepeated(interpreter(undefined, matchAll(
    matchTokens(TokenKind.bar),
    matchExpression,
    matchTokens(TokenKind.equals),
    matchExpression,
  )(a => a))),
)(([, , value, patterns]): PatternMatchExpression => ({
  value,
  kind: 'PatternMatchExpression',
  patterns: patterns.map(([, test, , value]) => ({ test, value })),
})));

const interpretExpressionComponent: Interpreter<Expression> = protectAgainstLoops(matchAny(
  interpretBoolean,
  interpretNumber,
  interpretIdentifier,
  interpretFunction,
  interpretImplicitFunction,
  interpretBinding,
  interpretDual,
  interpretRecordProperty,
  interpretDataProperty,
  interpretPatternMatch,
));


/**
 * This has to be a function because it is referenced inside the other interpret function
 */

export default function interpretExpression(tokens: Token[]): WithMessages<Expression | undefined> {
  const { messages, value: results } = runInterpreter(matchExpression, tokens, undefined);
  const longestMatch = maxBy(results, 'tokens.length');
  return withMessages(messages, longestMatch ? longestMatch.value : undefined);
}
