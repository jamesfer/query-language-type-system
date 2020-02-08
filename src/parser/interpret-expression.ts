import { map, maxBy } from 'lodash';
import {
  BindingExpression,
  BooleanExpression,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NumberExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
} from '../type-checker/types/expression';
import { Message } from '../type-checker/types/message';
import { Token, TokenKind } from './tokenize';

export interface WithTokens<T> {
  tokens: Token[];
  value: T;
}

function withTokens<T>(tokens: Token[], value: T): WithTokens<T> {
  return { tokens, value };
}

export interface WithMessages<T> {
  messages: Message[];
  value: T;
}

function withMessages<T>(messages: Message[], value: T): WithMessages<T> {
  return { messages, value };
}

// export type Interpreter<T> = (tokens: Token[], previous: Expression | undefined) => WithTokens<T> | undefined;

type InterpreterFunction<T> = (tokens: Token[], previous: Expression | undefined) => WithMessages<WithTokens<T> | undefined>

export interface Interpreter<T> {
  name: string | undefined;
  interpret: InterpreterFunction<T>;
}

function interpreter<T>(
  name: string | undefined,
  interpret: (tokens: Token[], previous: Expression | undefined) => WithMessages<WithTokens<T> | undefined>,
): Interpreter<T> {
  return { name, interpret };
}

function runInterpreter<T>(
  interpreter: Interpreter<T>,
  tokens: Token[],
  previous: Expression | undefined,
): WithMessages<WithTokens<T> | undefined> {
  if (!interpreter.name) {
    return interpreter.interpret(tokens, previous);
  }

  const { messages, value: result } = interpreter.interpret(tokens, previous);
  const indentedMessages = messages.map(message => `  ${message}`);
  const debugMessage = `${interpreter.name} running on: ${map(tokens, 'value').join(', ')}`;
  const resultMessage = `${interpreter.name} ${result ? `succeeded (matched ${result.tokens.length} tokens)` : 'failed'}`;
  return withMessages([debugMessage, ...indentedMessages, resultMessage], result);
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
    const results: T[] = [];
    let remainingTokens = tokens;
    for (const interpreter of interpreters) {
      const result = state.run(runInterpreter)(interpreter, remainingTokens, previous);
      if (!result) {
        return undefined;
      }

      results.push(result.value);
      remainingTokens = remainingTokens.slice(result.tokens.length);
    }

    return withTokens(tokens.slice(0, -remainingTokens.length), f(results));
  });
}

function matchAny<T1>(i1: Interpreter<T1>): InterpreterFunction<T1>;
function matchAny<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): InterpreterFunction<T1 | T2>;
function matchAny<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): InterpreterFunction<T1 | T2 | T3>;
function matchAny<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): InterpreterFunction<T1 | T2 | T3 | T4>;
function matchAny<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): InterpreterFunction<T1 | T2 | T3 | T4 | T5>;
function matchAny<T1, T2, T3, T4, T5, T6>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>): InterpreterFunction<T1 | T2 | T3 | T4 | T5 | T6>;
function matchAny<T1, T2, T3, T4, T5, T6, T7>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>): InterpreterFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>): InterpreterFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>): InterpreterFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
function matchAny<T, R>(...interpreters: Interpreter<T>[]): InterpreterFunction<T> {
  return (tokens, previous) => doWithState((state) => {
    const collection = interpreters.map(interpreter => (
      state.run(runInterpreter)(interpreter, tokens, previous)
    ));
    return maxBy(collection, 'tokens.length');
  });
}

// function optionallyMatch<T>(interpreter: Interpreter<T>): Interpreter<T | undefined> {
//   return (tokens, previous) => interpreter(tokens, previous) || withTokens([], undefined);
// }

const matchKeyword = (keyword: string): Interpreter<Token> => interpreter(`matchKeyword(${keyword})`, (tokens, previous) => doWithState((state) => {
  const result = state.run(runInterpreter)(matchTokens(TokenKind.keyword), tokens, previous);
  if (!result) {
    return undefined;
  }

  const { value: [token] } = result;
  return token.value === keyword ? withTokens([token], token) : undefined;
}));

const matchTokens = (...kinds: TokenKind[]): Interpreter<Token[]> => interpreter(`matchTokens(${kinds.join(', ')})`, (tokens) => doWithState(() => {
  if (kinds.every((kind, index) => tokens[index] && tokens[index].kind === kind)) {
    const matchedTokens = tokens.slice(0, kinds.length);
    return withTokens(matchedTokens, matchedTokens);
  }
  return undefined;
}));

const withPrevious: Interpreter<Expression> = interpreter('withPrevious', (_, previous) => (
  withMessages([], previous === undefined ? undefined : withTokens([], previous))
));

const withoutPrevious: Interpreter<null> = interpreter('withoutPrevious', (_, previous) => (
  withMessages([], previous === undefined ? withTokens([], null) : undefined)
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

function recursivelyMatchExpression(tokens: Token[], previous: Expression | undefined, previousTokens: Token[]): WithMessages<WithTokens<Expression> | undefined> {
  return doWithState((state) => {
    const result = state.run(runInterpreter)(interpretExpressionComponent, tokens, previous);
    if (!result) {
      return previous ? withTokens(previousTokens, previous) : undefined;
    }

    const { value, tokens: resultTokens } = result;
    return state.run(recursivelyMatchExpression)(
      tokens.slice(resultTokens.length),
      value,
      [...previousTokens, ...resultTokens],
    );
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

const interpretRecordProperty = interpreter('interpretRecordProperty', matchAll(
  withPrevious,
  matchTokens(TokenKind.hash, TokenKind.number),
)(([dataValue, [, property]]): ReadDataPropertyExpression => ({
  dataValue,
  kind: 'ReadDataPropertyExpression',
  property: +property.value,
})));

const interpretDataProperty = interpreter('interpretDataProperty', matchAll(
  withPrevious,
  matchTokens(TokenKind.dot, TokenKind.identifier),
)(([record, [, property]]): ReadRecordPropertyExpression => ({
  record,
  kind: 'ReadRecordPropertyExpression',
  property: property.value,
})));

const interpretExpressionComponent: Interpreter<Expression> = protectAgainstLoops(interpreter(undefined, matchAny(
  interpretBoolean,
  interpretNumber,
  interpretIdentifier,
  interpretFunction,
  interpretImplicitFunction,
  interpretBinding,
  interpretDual,
  interpretDataProperty,
  interpretRecordProperty,
)));


/**
 * This has to be a function because it is referenced inside the other interpret function
 */

export default function interpretExpression(tokens: Token[]): WithMessages<Expression | undefined> {
  const { messages, value } = runInterpreter(matchExpression, tokens, undefined);
  return withMessages(messages, value ? value.value : undefined);
}
