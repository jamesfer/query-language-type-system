import { TypedNode } from './type-check';
import { Expression } from './types/expression';
export declare function assertNever(x: never): never;
export declare function clipArrays<T, U>(array1: T[], array2: U[]): [T[], U[]];
export declare function checkedZip<T, U>(array1: T[], array2: U[]): [T, U][];
export declare function checkedZipWith<T, U, R>(array1: T[], array2: U[], zipper: (value1: T, value2: U) => R): R[];
export declare function unzip<T1>(array: [T1][]): [T1[] | undefined];
export declare function unzip<T1, T2>(array: [T1, T2][]): [T1[] | undefined, T2[] | undefined];
export declare function unzip<T1, T2, T3>(array: [T1, T2, T3][]): [T1[] | undefined, T2[] | undefined, T3[] | undefined];
export declare function unzipObject<T1>(object: {
    [k: string]: [T1];
}): [{
    [k: string]: T1;
} | undefined];
export declare function unzipObject<T1, T2>(object: {
    [k: string]: [T1, T2];
}): [{
    [k: string]: T1;
} | undefined, {
    [k: string]: T2;
} | undefined];
export declare function unzipObject<T1, T2, T3>(object: {
    [k: string]: [T1, T2, T3];
}): [{
    [k: string]: T1;
} | undefined, {
    [k: string]: T2;
} | undefined, {
    [k: string]: T3;
} | undefined];
export declare function everyIs<T, X extends T>(array: T[], check: (element: T) => element is X): array is X[];
export declare function everyValue<T, X extends T>(object: {
    [k: string]: T;
}, check: (element: T) => element is X): object is {
    [k: string]: X;
};
export declare function mapWithState<T, S, R>(array: T[], initialState: S, f: (state: S, element: T, index: number) => [S, R]): [S, R[]];
export declare function mapValuesWithState<T, S, R>(object: {
    [k: string]: T;
}, initialState: S, f: (state: S, element: T, key: string) => [S, R]): [S, {
    [k: string]: R;
}];
export declare function isDefined<T>(value: T | undefined): value is T;
export declare function pipe<R, A1>(f1: (a: A1) => R, a: A1): R;
export declare function pipe<R, A1, A2>(f2: (a: A2) => R, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3>(f3: (a: A3) => R, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4>(f4: (a: A4) => R, f3: (a: A3) => A3, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5>(f5: (a: A5) => R, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5, A6>(f6: (a: A6) => R, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5, A6, A7>(f7: (a: A7) => R, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8>(f8: (a: A8) => R, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8, A9>(f9: (a: A9) => R, f8: (a: A8) => A9, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>(f10: (a: A10) => R, f9: (a: A9) => A10, f8: (a: A8) => A9, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export declare function spreadApply<R, T1>(f: (a1: T1) => R): (a: [T1]) => R;
export declare function spreadApply<R, T1, T2>(f: (a1: T1, a2: T2) => R): (a: [T1, T2]) => R;
export declare function spreadApply<R, T1, T2, T3>(f: (a1: T1, a2: T2, a3: T3) => R): (a: [T1, T2, T3]) => R;
export declare function permuteArrays<T>(arrays: T[][]): T[][];
export declare function accumulateStates<S, T>(func: (arg: T) => S[]): [() => S[], (arg: T) => T];
export declare function accumulateStatesWithResult<S, T, R>(func: (arg: T) => [S[], R]): [() => S[], (arg: T) => R];
export declare function accumulateStatesUsingAnd<S, T>(func: (arg: T) => boolean): [() => boolean, (arg: T) => T];
export declare function accumulateStatesUsingOr<S, T>(func: (arg: T) => boolean): [() => boolean, (arg: T) => T];
export declare function withRecursiveState<T extends any[], S, R>(f: (state: S | undefined, ...args: T) => [S, () => R]): (...args: T) => R;
export declare function withStateStack<S, T extends any[], R>(f: (pushState: (state: S) => void, state: S | undefined, ...args: T) => R): (...args: T) => R;
/**
 * Automatically tracks the parent kind of each expression and provides its to the given callback.
 */
export declare function withParentExpressionKind<R>(f: (parentKind: Expression['kind'] | undefined, node: TypedNode) => R): (node: TypedNode) => R;
export declare function findWithResult<T, R>(list: T[], f: (element: T) => R | undefined): [T, R] | undefined;
//# sourceMappingURL=utils.d.ts.map