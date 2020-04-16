import { flatMap, flatten, isEqual, map, partition } from 'lodash';
import { Expression } from '../..';
import { checkedZip, withRecursiveFreeState } from '../../type-checker/utils';
import { Free, mapFree, pipeFree, pureFree, returningFree, traverseFree } from '../../utils/free';
import { ExpressionToken, ExpressionTokenKind } from '../produce-expression-tokens';
import {
  interpreter,
  Interpreter,
  InterpreterFunction,
  Precedence,
  runInterpreter,
} from './interpreter-utils';
import { doWithFreeState, doWithState, WithMessages, withMessages } from './message-state';
import { flatMapWithTokens, mapWithTokens, WithTokens, withTokens } from './token-state';

export function matchOption<T>(childInterpreter: Interpreter<T>): Interpreter<T | undefined> {
  return interpreter('matchOption', (tokens, previous, precedence) => pipeFree(
    runInterpreter(childInterpreter, tokens, previous, precedence),
    (withMessages) => pureFree(doWithState((state) => {
      const result = state.unwrap(withMessages);
      return result.length > 0 ? result : [withTokens([], undefined)];
    })),
  ));
}

export function matchAll<T1>(i1: Interpreter<T1>): <R>(f: (args: [T1]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): <R>(f: (args: [T1, T2]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): <R>(f: (args: [T1, T2, T3]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): <R>(f: (args: [T1, T2, T3, T4]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): <R>(f: (args: [T1, T2, T3, T4, T5]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2, T3, T4, T5, T6>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>): <R>(f: (args: [T1, T2, T3, T4, T5, T6]) => R) => InterpreterFunction<R>;
export function matchAll<T1, T2, T3, T4, T5, T6, T7>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>, i7: Interpreter<T7>): <R>(f: (args: [T1, T2, T3, T4, T5, T6, T7]) => R) => InterpreterFunction<R>;
export function matchAll<T, R>(...interpreters: Interpreter<T>[]): (f: (args: T[]) => R) => InterpreterFunction<R> {
  return f => (tokens, ...interpreterParams) => doWithFreeState(state => pipeFree(
    interpreters.reduce<Free<WithTokens<T[]>[]>>(
      (combinations, interpreter) => pipeFree(
        combinations,
        combinations => traverseFree(combinations, combination => pipeFree(
          runInterpreter(interpreter, tokens.slice(combination.tokens.length), ...interpreterParams),
          returningFree(state.unwrap.bind(state)),
          returningFree(results => results.map(result => (
            flatMapWithTokens(combination, combination => (
              mapWithTokens(result, resultValue => [...combination, resultValue])
            ))
          ))),
        )),
        returningFree(flatten),
      ),
      pureFree([withTokens<T[]>([], [])]),
    ),
    returningFree(values => values.map(mapWithTokens(f))),
  ));
}

export function matchAny<T1>(i1: Interpreter<T1>): Interpreter<T1>;
export function matchAny<T1, T2>(i1: Interpreter<T1>, i2: Interpreter<T2>): Interpreter<T1 | T2>;
export function matchAny<T1, T2, T3>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>): Interpreter<T1 | T2 | T3>;
export function matchAny<T1, T2, T3, T4>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>): Interpreter<T1 | T2 | T3 | T4>;
export function matchAny<T1, T2, T3, T4, T5>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>): Interpreter<T1 | T2 | T3 | T4 | T5>;
export function matchAny<T1, T2, T3, T4, T5, T6>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, i6: Interpreter<T6>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>, i15: Interpreter<T15>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15>;
export function matchAny<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(i1: Interpreter<T1>, i2: Interpreter<T2>, i3: Interpreter<T3>, i4: Interpreter<T4>, i5: Interpreter<T5>, t6: Interpreter<T6>, i7: Interpreter<T7>, i8: Interpreter<T8>, i9: Interpreter<T9>, i10: Interpreter<T10>, i11: Interpreter<T11>, i12: Interpreter<T12>, i13: Interpreter<T13>, i14: Interpreter<T14>, i15: Interpreter<T15>, i16: Interpreter<T16>): Interpreter<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16>;
export function matchAny<T, R>(...interpreters: Interpreter<T>[]): Interpreter<T> {
  return interpreter(undefined, (...interpreterParams) => doWithFreeState((state) => pipeFree(
    traverseFree(interpreters, interpreter => runInterpreter(interpreter, ...interpreterParams)),
    returningFree(a => state.sequence(a)),
    returningFree(flatten),
  )));
}

function matchRepeatedRecursive<T>(
  tokens: ExpressionToken[],
  previous: Expression | undefined,
  precedence: Precedence,
  childInterpreter: Interpreter<T>,
  previousMatches: WithTokens<T[]>[],
): Free<WithMessages<WithTokens<T[]>[]>> {
  return doWithFreeState((state) => {
    return pipeFree(
      traverseFree(previousMatches, (({ tokens: usedTokens }) => (
        runInterpreter(childInterpreter, tokens.slice(usedTokens.length), previous, precedence)
      ))),
      returningFree(state.sequence.bind(state)),
      (nextMatches): Free<WithTokens<T[]>[]> => {
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

        if (successfulResults.length === 0) {
          return pureFree(completedMatches);
        }

        return mapFree(
          matchRepeatedRecursive(tokens, previous, precedence, childInterpreter, successfulResults),
          (repeatedMatches) => [...completedMatches, ...state.unwrap(repeatedMatches)],
        );
      },
    );
  });
}

export function matchRepeated<T>(childInterpreter: Interpreter<T>): Interpreter<T[]> {
  return interpreter(undefined, (tokens, previous, precedence) => doWithFreeState((state) => {
    return pipeFree(
      // Initially run the interpreter against the tokens
      runInterpreter(childInterpreter, tokens, previous, precedence),
      returningFree(state.unwrap.bind(state)),
      (previousResults) => {
        const previousMatches = previousResults.map(({ tokens, value }) => withTokens(tokens, [value]));
        return matchRepeatedRecursive(tokens, previous, precedence, childInterpreter, previousMatches);
      },
      returningFree(state.unwrap.bind(state)),
    );
  }));
}

export const matchKeyword = (keyword: string): Interpreter<ExpressionToken> => (
  interpreter(`matchKeyword(${keyword})`, (...interpreterParams) => doWithFreeState((state) => (
    pipeFree(
      runInterpreter(matchTokens('keyword'), ...interpreterParams),
      returningFree(state.unwrap.bind(state)),
      returningFree(results => (
        flatMap(results, ({ value: [token] }) => (
          token && token.value === keyword ? [withTokens([token], token)] : []
        ))
      )),
    )
  )))
);

export const matchTokens = (...kinds: ExpressionTokenKind[]): Interpreter<ExpressionToken[]> => (
  interpreter(`matchTokens(${kinds.join(', ')})`, (tokens) => doWithFreeState(() => {
    if (kinds.every((kind, index) => tokens[index] && tokens[index].kind === kind)) {
      const matchedTokens = tokens.slice(0, kinds.length);
      return pureFree([withTokens(matchedTokens, matchedTokens)]);
    }
    return pureFree([]);
  }))
);

export const withPrevious = (precedence: Precedence): Interpreter<Expression> => (
  interpreter('withPrevious', (_, previous, previousPrecedence) => pureFree(withMessages([],
    previous !== undefined && precedence >= previousPrecedence
      ? [withTokens([], previous)]
      : [],
  )))
);

export const withoutPrevious: Interpreter<null> = interpreter('withoutPrevious', (_, previous) => (
  pureFree(withMessages([], previous === undefined ? [withTokens([], null)] : []))
));

interface InterpreterState {
  tokens: ExpressionToken[];
  previous?: Expression;
  precedence: Precedence;
}

export function protectAgainstLoops<T>(wrapped: Interpreter<T>): Interpreter<T> {
  let lastState: InterpreterState | undefined = undefined;
  return interpreter(
    undefined,
    withRecursiveFreeState((state: InterpreterState | undefined, tokens, previous, precedence) => {
      const newState: InterpreterState = { tokens, previous, precedence };
      if (isEqual(lastState, newState)) {
        throw new Error(`Loop detected. Tokens: ${JSON.stringify(lastState?.tokens)}`);
      }
      return [newState, () => runInterpreter(wrapped, tokens, previous, precedence)];
    }),
  );
}

/**
 * This has to be a function because it is referenced inside the other interpret function
 */
function recursivelyMatchExpression(interpretExpressionComponent: Interpreter<Expression>): Interpreter<Expression> {
  return interpreter('recursivelyMatchExpression', (tokens, previous, precedence) => {
    return doWithFreeState((state) => {
      return pipeFree(
        runInterpreter(interpretExpressionComponent, tokens, previous, precedence),
        returningFree(state.unwrap.bind(state)),
        (results) => traverseFree(results, ({ value, tokens: resultTokens }) => pipeFree(
          runInterpreter(
            recursivelyMatchExpression(interpretExpressionComponent),
            tokens.slice(resultTokens.length),
            value,
            precedence,
          ),
          returningFree(state.unwrap.bind(state)),
          returningFree(recursiveResults => (
            recursiveResults.map(({ tokens, value }) => withTokens([...resultTokens, ...tokens], value))
          )),
          returningFree(recursiveResults => recursiveResults.length > 0 ? recursiveResults : results),
        )),
        returningFree(flatten),
      );
    });
  });
}

export function makeExpressionMatcher(interpretExpression: () => Interpreter<Expression>): (precedence: Precedence) => Interpreter<Expression> {
  return precedence => interpreter('matchExpression', (tokens) => (
    runInterpreter(recursivelyMatchExpression(interpretExpression()), tokens, undefined, precedence)
  ));
}

export function makeBrokenExpressionMatcher(interpretExpression: () => Interpreter<Expression>): (precedence: Precedence) => Interpreter<Expression> {
  return precedence => interpreter('matchBrokenExpression', (tokens) => matchAll(
    matchTokens('break'),
    recursivelyMatchExpression(interpretExpression()),
  )(([_, e]) => e)(tokens, undefined, precedence));
}
