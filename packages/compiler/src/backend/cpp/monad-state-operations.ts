import { CppStatement } from './cpp-ast';
import { ArrayState, CombinedState, FState, MapState, Monad } from './monad';

export type CppState = CombinedState<{
  makeUniqueId: FState<[string], string>,
  anonymousStructCache: MapState<string, string>,
  localStatements: ArrayState<CppStatement>,
  globalStatements: ArrayState<CppStatement>,
}>;

export function newUniqueId(prefix: string): Monad<CppState, string> {
  return Monad.of(state => state.child('makeUniqueId').apply(prefix));
}

export function appendGlobalStatement(statement: CppStatement): Monad<CppState, void> {
  return Monad.of((state) => {
    state.child('globalStatements').append(statement);
  });
}

export function appendLocalStatement(statement: CppStatement): Monad<CppState, void> {
  return Monad.of((state) => {
    state.child('localStatements').append(statement);
  });
}

export function getLocalStatements(): Monad<CppState, CppStatement[]> {
  return Monad.of((state) => state.child('localStatements').get());
}

export function clearLocalStatements(): Monad<CppState, void> {
  return Monad.of((state) => {
    state.child('localStatements').set([]);
  });
}
