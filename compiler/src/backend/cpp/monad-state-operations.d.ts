import { CppStatement } from './cpp-ast';
import { ArrayState, CombinedState, FState, MapState, Monad } from './monad';
export declare type CppState = CombinedState<{
    makeUniqueId: FState<[string], string>;
    anonymousStructCache: MapState<string, string>;
    localStatements: ArrayState<CppStatement>;
    globalStatements: ArrayState<CppStatement>;
}>;
export declare function newUniqueId(prefix: string): Monad<CppState, string>;
export declare function appendGlobalStatement(statement: CppStatement): Monad<CppState, void>;
export declare function appendLocalStatement(statement: CppStatement): Monad<CppState, void>;
export declare function getLocalStatements(): Monad<CppState, CppStatement[]>;
export declare function clearLocalStatements(): Monad<CppState, void>;
//# sourceMappingURL=monad-state-operations.d.ts.map