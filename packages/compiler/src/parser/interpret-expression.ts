import { flatMap, map, max, maxBy, partition, isEqual, fromPairs, flatten } from 'lodash';
import {
  Application,
  BindingExpression,
  BooleanExpression, DataInstantiation,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier, NativeExpression,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression, RecordExpression, StringExpression, Token,
} from '..';
import { Message } from '..';
import { checkedZip, withRecursiveTrampolineState } from '../type-checker/utils';
import {
  flatMapTrampoline,
  mapTrampoline,
  pipeTrampoline,
  pureTrampoline, returningTrampoline, runTrampoline,
  Trampoline,
  traverseTrampoline,
} from '../utils/trampoline';
import { ExpressionToken, ExpressionTokenKind } from './produce-expression-tokens';

export interface WithTokens<T> {
  tokens: ExpressionToken[];
  value: T;
}

function withTokens<T>(tokens: ExpressionToken[], value: T): WithTokens<T> {
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

enum Precedence {
  none,
  bindingEquals,
  record,
  functionArrow,
  patternMatch,
  application,
  application2,
  dual,
  readProperty,
  parenthesis,
}

type InterpreterFunction<T> = (tokens: ExpressionToken[], previous: Expression | undefined, precedence: Precedence) => Trampoline<WithMessages<WithTokens<T>[]>>

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
  tokens: ExpressionToken[],
  previous: Expression | undefined,
  precedence: Precedence,
): Trampoline<WithMessages<WithTokens<T>[]>> {
  if (!interpreter.name) {
    return interpreter.interpret(tokens, previous, precedence);
  }

  return mapTrampoline(interpreter.interpret(tokens, previous, precedence), ({ messages, value: results }) => {
    const indentedMessages = messages.map(message => `  ${message}`);
    const debugMessage = `${interpreter.name} running on: ${map(tokens, 'value').join(', ')}`;
    const resultMessage = `${interpreter.name} ${results.length > 0 ? `succeeded (${results.length} matches, at least ${max(map(results, 'tokens.length'))} tokens)` : 'failed'}`;
    return withMessages([debugMessage, ...indentedMessages, resultMessage], results);
  });
}

function doWithState<T>(f: (state: MessageState) => T): WithMessages<T> {
  const state = new MessageState();
  return state.wrap(f(state));
}

function doWithTrampolineState<T>(f: (state: MessageState) => Trampoline<T>): Trampoline<WithMessages<T>> {
  const state = new MessageState();
  return mapTrampoline(f(state), value => state.wrap(value));
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

  sequence<T>(inputs: WithMessages<T>[]): T[] {
    return inputs.map(this.unwrap.bind(this));
  }

  runTrampoline<R>(t: Trampoline<WithMessages<R>>): Trampoline<R> {
    return mapTrampoline(t, this.unwrap.bind(this));
  }

  unwrap<T>({ messages, value }: WithMessages<T>): T {
    this.log(...messages);
    return value;
  }

  unwrapTrampoline<T>({ messages, value }: WithMessages<T>): T {
    this.log(...messages);
    return value;
  }

  wrap<T>(value: T) {
    return withMessages(this.messages, value);
  }

  log(...messages: Message[]): void {
    this.messages.push(...messages);
  }
}

function matchOption<T>(childInterpreter: Interpreter<T>): Interpreter<T | undefined> {
  return interpreter('matchOption', (tokens, previous, precedence) => pipeTrampoline(
    runInterpreter(childInterpreter, tokens, previous, precedence),
    (withMessages) => pureTrampoline(doWithState((state) => {
      const result = state.unwrap(withMessages);
      return result.length > 0 ? result : [withTokens([], undefined)];
    })),
  ));
}

function matchAll<T1>(i1: Interpreter<T1>): <R>(f: (args: [T1]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): <R>(f: (args: [T1, T2]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): <R>(f: (args: [T1, T2, T3]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): <R>(f: (args: [T1, T2, T3, T4]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): <R>(f: (args: [T1, T2, T3, T4, T5]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4, T5, T6>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>): <R>(f: (args: [T1, T2, T3, T4, T5, T6]) => R) => InterpreterFunction<R>;
function matchAll<T1, T2, T3, T4, T5, T6, T7>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>, i7: Interpreter<T7>): <R>(f: (args: [T1, T2, T3, T4, T5, T6, T7]) => R) => InterpreterFunction<R>;
function matchAll<T, R>(...interpreters: Interpreter<T>[]): (f: (args: T[]) => R) => InterpreterFunction<R> {
  return f => (tokens, ...interpreterParams) => doWithTrampolineState(state => pipeTrampoline(
    interpreters.reduce<Trampoline<WithTokens<T[]>[]>>(
      (combinations, interpreter) => pipeTrampoline(
        combinations,
        combinations => traverseTrampoline(combinations, combination => pipeTrampoline(
          runInterpreter(interpreter, tokens.slice(combination.tokens.length), ...interpreterParams),
          returningTrampoline(state.unwrap.bind(state)),
          returningTrampoline(results => results.map(result => (
            flatMapWithTokens(combination, combination => (
              mapWithTokens(result, resultValue => [...combination, resultValue])
            ))
          ))),
        )),
        returningTrampoline(flatten),
      ),
      pureTrampoline([withTokens<T[]>([], [])]),
    ),
    returningTrampoline(values => values.map(mapWithTokens(f))),
  ));
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
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>, i15: Interpreter<T15>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15>;
function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>, i15: Interpreter<T15>, i16: Interpreter<T16>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16>;
function matchAny<T, R>(...interpreters: Interpreter<T>[]): Interpreter<T> {
  return interpreter(undefined, (...interpreterParams) => doWithTrampolineState((state) => pipeTrampoline(
    traverseTrampoline(interpreters, interpreter => runInterpreter(interpreter, ...interpreterParams)),
    returningTrampoline(a => state.sequence(a)),
    returningTrampoline(flatten),
  )));
}

function matchRepeatedRecursive<T>(tokens: ExpressionToken[], previous: Expression | undefined, precedence: Precedence, previousMatches: WithTokens<T[]>[], childInterpreter: Interpreter<T>): Trampoline<WithMessages<WithTokens<T[]>[]>> {
  return doWithTrampolineState((state) => {
    return pipeTrampoline(
      traverseTrampoline(previousMatches, (({ tokens: usedTokens }) => (
        runInterpreter(childInterpreter, tokens.slice(usedTokens.length), previous, precedence)
      ))),
      returningTrampoline(state.sequence.bind(state)),
      nextMatches => {
        const [failedMatches, successfulMatches] = partition(
          checkedZip(previousMatches, nextMatches),
          ([, nextResults]) => nextResults.length === 0,
        );

        // Add each of the failed to matches to the completed list
        const completedMatches = map(failedMatches, '0');

        // Add the successful matches to the previous matches to continue searching for them
        const successfulResults = flatMap(successfulMatches, ([previousResult, nextResults]) => (
          nextResults.map(nextResult => flatMapWithTokens(previousResult, previousValues => (
            mapWithTokens(nextResult, nextValue => [...previousValues, nextValue])
          )))
        ));

        return mapTrampoline(
          matchRepeatedRecursive(tokens, previous, precedence, successfulResults, childInterpreter),
          (repeatedMatches) => [...completedMatches, ...state.unwrap(repeatedMatches)],
        );
      },
    );
  });
}

function matchRepeated<T>(childInterpreter: Interpreter<T>): Interpreter<T[]> {
  return interpreter(undefined, (tokens, previous, precedence) => doWithTrampolineState((state) => {
    return pipeTrampoline(
      // Initially run the interpreter against the tokens
      runInterpreter(childInterpreter, tokens, previous, precedence),
      returningTrampoline(state.unwrap.bind(state)),
      (previousResults) => {
        const previousMatches = previousResults.map(({ tokens, value }) => withTokens(tokens, [value]));
        return matchRepeatedRecursive(tokens, previous, precedence, previousMatches, childInterpreter);
      },
      returningTrampoline(state.unwrap.bind(state)),
    );
  }));
}

const matchKeyword = (keyword: string): Interpreter<ExpressionToken> => (
  interpreter(`matchKeyword(${keyword})`, (...interpreterParams) => doWithTrampolineState((state) => (
    pipeTrampoline(
      runInterpreter(matchTokens('keyword'), ...interpreterParams),
      returningTrampoline(state.unwrap.bind(state)),
      returningTrampoline(results => (
        flatMap(results, ({ value: [token] }) => (
          token && token.value === keyword ? [withTokens([token], token)] : []
        ))
      ))
    )
  )))
);

const matchTokens = (...kinds: ExpressionTokenKind[]): Interpreter<ExpressionToken[]> => (
  interpreter(`matchTokens(${kinds.join(', ')})`, (tokens) => doWithTrampolineState(() => {
    if (kinds.every((kind, index) => tokens[index] && tokens[index].kind === kind)) {
      const matchedTokens = tokens.slice(0, kinds.length);
      return pureTrampoline([withTokens(matchedTokens, matchedTokens)]);
    }
    return pureTrampoline([]);
  }))
);

const withPrevious = (precedence: Precedence): Interpreter<Expression> => (
  interpreter('withPrevious', (_, previous, previousPrecedence) => pureTrampoline(withMessages([],
    previous !== undefined && precedence >= previousPrecedence
      ? [withTokens([], previous)]
      : []
  )))
);

const withoutPrevious: Interpreter<null> = interpreter('withoutPrevious', (_, previous) => (
  pureTrampoline(withMessages([], previous === undefined ? [withTokens([], null)] : []))
));

interface InterpreterState {
  tokens: ExpressionToken[];
  previous?: Expression;
  precedence: Precedence;
}

function protectAgainstLoops<T>(wrapped: Interpreter<T>): Interpreter<T> {
  let lastState: InterpreterState | undefined = undefined;
  return interpreter(
    undefined,
    withRecursiveTrampolineState((state: InterpreterState | undefined, tokens, previous, precedence) => {
      const newState: InterpreterState = { tokens, previous, precedence };
      if (isEqual(lastState, newState)) {
        throw new Error(`Loop detected. Tokens: ${JSON.stringify(lastState?.tokens)}`);
      }
      return [newState, () => runInterpreter(wrapped, tokens, previous, precedence)];
    })
  );
}

/**
 * This has to be a function because it is referenced inside the other interpret function
 */
const recursivelyMatchExpression: Interpreter<Expression> = interpreter('recursivelyMatchExpression', (tokens, previous, precedence) => {
  return doWithTrampolineState((state) => {
    return pipeTrampoline(
      runInterpreter(interpretExpressionComponent, tokens, previous, precedence),
      returningTrampoline(state.unwrap.bind(state)),
      (results) => traverseTrampoline(results, ({ value, tokens: resultTokens }) => pipeTrampoline(
        runInterpreter(
          recursivelyMatchExpression,
          tokens.slice(resultTokens.length),
          value,
          precedence,
        ),
        returningTrampoline(state.unwrap.bind(state)),
        returningTrampoline(results => (
          results.map(({ tokens, value }) => withTokens([...resultTokens, ...tokens], value))
        )),
        returningTrampoline(recursiveResults => [...results, ...recursiveResults]),
      )),
      returningTrampoline(flatten),
    );
    // (results) => {
    //     const recursiveResults = flatMap(results, ({ value, tokens: resultTokens }) => (
    //       state.run(runInterpreter)(
    //         recursivelyMatchExpression,
    //         tokens.slice(resultTokens.length),
    //         value,
    //         precedence,
    //       ))
    //       .map(({ tokens, value }) => withTokens([...resultTokens, ...tokens], value))
    //     );
    //     return [...results, ...recursiveResults];
    //   }
    // );
    // const results = state.run(runInterpreter)(interpretExpressionComponent, tokens, previous, precedence);
  });
});

const matchExpression = (precedence: Precedence): Interpreter<Expression> => (
  interpreter('matchExpression', (tokens) => (
    runInterpreter(recursivelyMatchExpression, tokens, undefined, precedence)
  ))
);

const matchBrokenExpression = (precedence: Precedence): Interpreter<Expression> => {
  return interpreter('matchBrokenExpression', (tokens) => (
    matchAll(matchTokens('break'), recursivelyMatchExpression)(([_, e]) => e)(tokens, undefined, precedence)
  ));
};

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
  withPrevious(Precedence.functionArrow),
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
  matchExpression(Precedence.functionArrow),
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
      (body, [parameter, implicit]): FunctionExpression => ({
        implicit,
        parameter,
        body,
        kind: 'FunctionExpression',
      }),
      {
        kind: 'DataInstantiation',
        callee: {
          kind: 'SymbolExpression',
          name: name.value,
        },
        parameters: map(parameters.filter(([, implicit]) => !implicit), 0),
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
  matchRepeated(interpreter(undefined, matchAll(
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

const interpretNative = interpreter('interpretNative', matchAll(
  withoutPrevious,
  matchTokens('hash', 'openBrace'),
  matchRepeated(interpreter(undefined, matchAll(
    matchTokens('identifier', 'equals'),
    matchAny(interpretNumber, interpretString),
    matchTokens('comma'),
  )(a => a))),
  matchTokens('closeBrace'),
)(([_1, _2, properties]): NativeExpression => ({
  kind: 'NativeExpression',
  data: fromPairs(properties.map(([[identifier], value]) => [identifier.value, value.value])),
})));

const interpretParenthesis = interpreter('interpretParenthesis', matchAll(
  matchOption(withPrevious(Precedence.parenthesis)),
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
  const { messages, value: results } = runTrampoline(runInterpreter(
    matchExpression(Precedence.none),
    tokens,
    undefined,
    Precedence.none,
  ));
  const longestMatch = maxBy(results, 'tokens.length');
  return withMessages(messages, longestMatch?.value);
}
