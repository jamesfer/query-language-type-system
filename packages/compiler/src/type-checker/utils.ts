import { AssertionError } from 'assert';
import { flatMap, mapValues, reduce, set, unzip as unzipLodash, zip, zipWith, concat } from 'lodash';

export function assertNever(x: never): never {
  throw new Error('Assert never was actually called');
}

export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError({ message: `Assertion failed: ${message}` });
  }
}

export function clipArrays<T, U>(array1: T[], array2: U[]): [T[], U[]] {
  if (array1.length > array2.length) {
    return [array1.slice(0, array2.length), array2];
  }
  if (array1.length < array2.length) {
    return [array1, array2.slice(0, array1.length)];
  }
  return [array1, array2];
}

export function checkedZip<T, U>(array1: T[], array2: U[]): [T, U][] {
  const [left, right] = clipArrays(array1, array2);
  return zip(left, right) as any;
}

export function checkedZipWith<T, U, R>(array1: T[], array2: U[], zipper: (value1: T, value2: U) => R): R[] {
  const [left, right] = clipArrays(array1, array2);
  return zipWith(left, right, zipper) as any;
}

export function unzip<T1>(array: [T1][]): [T1[] | undefined];
export function unzip<T1, T2>(array: [T1, T2][]): [T1[] | undefined, T2[] | undefined];
export function unzip<T1, T2, T3>(array: [T1, T2, T3][]): [T1[] | undefined, T2[] | undefined, T3[] | undefined];
export function unzip<T extends []>(array: T[]): (T[] | undefined)[] {
  return unzipLodash(array) as any;
}

export function unzipObject<T1>(object: { [k: string]: [T1] }): [{ [k: string]: T1 } | undefined];
export function unzipObject<T1, T2>(object: { [k: string]: [T1, T2] }): [{ [k: string]: T1 } | undefined, { [k: string]: T2 } | undefined];
export function unzipObject<T1, T2, T3>(object: { [k: string]: [T1, T2, T3] }): [{ [k: string]: T1 } | undefined, { [k: string]: T2 } | undefined, { [k: string]: T3 } | undefined];
export function unzipObject<T>(object: { [k: string]: T[] }): ({ [k: string]: T } | undefined)[] {
  return reduce<{ [k: string]: T[]}, { [k: string]: T }[]>(
    object,
    (agg, value, key) => reduce(value, (agg, item, index) => set(agg, [index, key], item), agg),
    [],
  );
}

export function everyIs<T, X extends T>(array: T[], check: (element: T) => element is X): array is X[] {
  return array.every(check);
}

export function everyValue<T, X extends T>(object: { [k: string]: T }, check: (element: T) => element is X): object is { [k: string]: X } {
  return Object.values(object).every(check);
}

export function mapWithState<T, S, R>(array: T[], initialState: S, f: (state: S, element: T, index: number) => [S, R]): [S, R[]] {
  let state = initialState;
  const values = array.map((element, index) => {
    const [newState, result] = f(state, element, index);
    state = newState;
    return result;
  });
  return [state, values];
}

export function mapValuesWithState<T, S, R>(object: { [k: string]: T }, initialState: S, f: (state: S, element: T, key: string) => [S, R]): [S, { [k: string]: R }] {
  let state = initialState;
  const values = mapValues(object, (element, key) => {
    const [newState, result] = f(state, element, key);
    state = newState;
    return result;
  });
  return [state, values];
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function pipe<R, A1>(f1: (a: A1) => R, a: A1): R;
export function pipe<R, A1, A2>(f2: (a: A2) => R, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3>(f3: (a: A3) => R, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4>(f4: (a: A4) => R, f3: (a: A3) => A3, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5>(f5: (a: A5) => R, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5, A6>(f6: (a: A6) => R, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5, A6, A7>(f7: (a: A7) => R, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8>(f8: (a: A8) => R, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8, A9>(f9: (a: A9) => R, f8: (a: A8) => A9, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe<R, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>(f10: (a: A10) => R, f9: (a: A9) => A10, f8: (a: A8) => A9, f7: (a: A7) => A8, f6: (a: A6) => A7, f5: (a: A5) => A6, f4: (a: A4) => A5, f3: (a: A3) => A4, f2: (a: A2) => A3, f1: (a: A1) => A2, a: A1): R;
export function pipe(...functions: ((...args: any[]) => any) | any): any {
  if (functions.length < 1) {
    return undefined;
  }

  const last = functions[functions.length - 1];
  return functions.slice(0, -1).reduceRight(
    (value: any, f: any) => f(value),
    last,
  );
}

export function spreadApply<R, T1>(f: (a1: T1) => R): (a: [T1]) => R;
export function spreadApply<R, T1, T2>(f: (a1: T1, a2: T2) => R): (a: [T1, T2]) => R;
export function spreadApply<R, T1, T2, T3>(f: (a1: T1, a2: T2, a3: T3) => R): (a: [T1, T2, T3]) => R;
export function spreadApply<R, T>(f: (...as: T[]) => R): (a: T[]) => R {
  return args => f(...args);
}

function permuteArraysRecursive<T>(arrays: T[][], parentCombinations: T[][]): T[][] {
  if (arrays.length === 0) {
    return parentCombinations;
  }

  const [current, ...rest] = arrays;

  const currentPermutations = flatMap(parentCombinations, combination => current.map(value => [...combination, value]));
  return permuteArraysRecursive(rest, currentPermutations);
}

export function permuteArrays<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) {
    return [];
  }

  const [current, ...rest] = arrays;
  return permuteArraysRecursive(rest, current.map(value => [value]));
}

const accumulateStateWith = <S, T, R>(initial: S, accumulate: (left: S, right: S) => S) => (func: (arg: T) => [S, R]): [() => S, (arg: T) => R] => {
  let state = initial;
  return [
    () => state,
    (arg) => {
      const [newState, result] = func(arg);
      state = accumulate(state, newState);
      return result;
    },
  ];
};

function resultWithArg<A, T>(f: (arg: A) => T): (arg: A) => [T, A] {
  return arg => [f(arg), arg];
}

export function accumulateStates<S, T>(func: (arg: T) => S[]): [() => S[], (arg: T) => T] {
  return accumulateStateWith<S[], T, T>([], concat)(resultWithArg(func));
}

export function accumulateStatesWithResult<S, T, R>(func: (arg: T) => [S[], R]): [() => S[], (arg: T) => R] {
  return accumulateStateWith<S[], T, R>([], concat)(func);
}

export function accumulateStatesUsingAnd<S, T>(func: (arg: T) => boolean): [() => boolean, (arg: T) => T] {
  return accumulateStateWith<boolean, T, T>(true, (left, right) => left && right)(resultWithArg(func));
}

export function accumulateStatesUsingOr<S, T>(func: (arg: T) => boolean): [() => boolean, (arg: T) => T] {
  return accumulateStateWith<boolean, T, T>(false, (left, right) => left || right)(resultWithArg(func));
}

export function findWithResult<T, R>(list: T[], f: (element: T) => R | undefined): [T, R] | undefined {
  let result: R | undefined = undefined;
  let found = list.find(element => {
    result = f(element);
    return result;
  });

  if (found === undefined || result === undefined) {
    return undefined;
  }

  return [found, result]
}
