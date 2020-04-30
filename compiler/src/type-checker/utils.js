"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { AssertionError } from 'assert';
const lodash_1 = require("lodash");
const free_1 = require("../utils/free");
function assertNever(x) {
    throw new Error('Assert never was actually called');
}
exports.assertNever = assertNever;
// export function assert(condition: any, message: string): asserts condition {
//   if (!condition) {
//     throw new AssertionError({ message: `Assertion failed: ${message}` });
//   }
// }
function clipArrays(array1, array2) {
    if (array1.length > array2.length) {
        return [array1.slice(0, array2.length), array2];
    }
    if (array1.length < array2.length) {
        return [array1, array2.slice(0, array1.length)];
    }
    return [array1, array2];
}
exports.clipArrays = clipArrays;
function checkedZip(array1, array2) {
    const [left, right] = clipArrays(array1, array2);
    return lodash_1.zip(left, right);
}
exports.checkedZip = checkedZip;
function checkedZipWith(array1, array2, zipper) {
    const [left, right] = clipArrays(array1, array2);
    return lodash_1.zipWith(left, right, zipper);
}
exports.checkedZipWith = checkedZipWith;
function unzip(array) {
    return lodash_1.unzip(array);
}
exports.unzip = unzip;
function unzipObject(object) {
    return lodash_1.reduce(object, (agg, value, key) => lodash_1.reduce(value, (agg, item, index) => lodash_1.set(agg, [index, key], item), agg), []);
}
exports.unzipObject = unzipObject;
function everyIs(array, check) {
    return array.every(check);
}
exports.everyIs = everyIs;
function everyValue(object, check) {
    return Object.values(object).every(check);
}
exports.everyValue = everyValue;
function mapWithState(array, initialState, f) {
    let state = initialState;
    const values = array.map((element, index) => {
        const [newState, result] = f(state, element, index);
        state = newState;
        return result;
    });
    return [state, values];
}
exports.mapWithState = mapWithState;
function mapValuesWithState(object, initialState, f) {
    let state = initialState;
    const values = lodash_1.mapValues(object, (element, key) => {
        const [newState, result] = f(state, element, key);
        state = newState;
        return result;
    });
    return [state, values];
}
exports.mapValuesWithState = mapValuesWithState;
function isDefined(value) {
    return value !== undefined;
}
exports.isDefined = isDefined;
function pipe(...functions) {
    if (functions.length < 1) {
        return undefined;
    }
    const last = functions[functions.length - 1];
    return functions.slice(0, -1).reduceRight((value, f) => f(value), last);
}
exports.pipe = pipe;
function spreadApply(f) {
    return args => f(...args);
}
exports.spreadApply = spreadApply;
function permuteArraysRecursive(arrays, parentCombinations) {
    if (arrays.length === 0) {
        return parentCombinations;
    }
    const [current, ...rest] = arrays;
    const currentPermutations = lodash_1.flatMap(parentCombinations, combination => current.map(value => [...combination, value]));
    return permuteArraysRecursive(rest, currentPermutations);
}
function permuteArrays(arrays) {
    if (arrays.length === 0) {
        return [];
    }
    const [current, ...rest] = arrays;
    return permuteArraysRecursive(rest, current.map(value => [value]));
}
exports.permuteArrays = permuteArrays;
const accumulateStateWith = (initial, accumulate) => (func) => {
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
function resultWithArg(f) {
    return arg => [f(arg), arg];
}
function accumulateStates(func) {
    return accumulateStateWith([], lodash_1.concat)(resultWithArg(func));
}
exports.accumulateStates = accumulateStates;
function accumulateStatesWithResult(func) {
    return accumulateStateWith([], lodash_1.concat)(func);
}
exports.accumulateStatesWithResult = accumulateStatesWithResult;
function accumulateStatesUsingAnd(func) {
    return accumulateStateWith(true, (left, right) => left && right)(resultWithArg(func));
}
exports.accumulateStatesUsingAnd = accumulateStatesUsingAnd;
function accumulateStatesUsingOr(func) {
    return accumulateStateWith(false, (left, right) => left || right)(resultWithArg(func));
}
exports.accumulateStatesUsingOr = accumulateStatesUsingOr;
// export function maintainState<S, T>(func: (state: S | undefined, arg: T) => [S, () => T]): (arg: T) => T {
//   const state: S | undefined = undefined;
//   return (arg) => {
//     const [newState, compute] = func(state, arg);
//
//   }
// }
function withRecursiveFreeState(f) {
    let state = undefined;
    return (...args) => {
        const [newState, continuation] = f(state, ...args);
        const previousState = state;
        state = newState;
        return free_1.mapFree(continuation(), (result) => {
            state = previousState;
            return result;
        });
    };
}
exports.withRecursiveFreeState = withRecursiveFreeState;
function withStateStack(f) {
    let stateStack = [];
    const pushState = (state) => stateStack.push(state);
    return (...args) => {
        const oldState = [...stateStack];
        const result = f(pushState, lodash_1.last(stateStack), ...args);
        stateStack = oldState;
        return result;
    };
}
exports.withStateStack = withStateStack;
/**
 * Automatically tracks the parent kind of each expression and provides its to the given callback.
 */
function withParentExpressionKind(f) {
    return withStateStack((pushState, parentKind, node) => {
        pushState(node.expression.kind);
        return f(parentKind, node);
    });
}
exports.withParentExpressionKind = withParentExpressionKind;
function findWithResult(list, f) {
    let result = undefined;
    let found = list.find(element => {
        result = f(element);
        return result;
    });
    if (found === undefined || result === undefined) {
        return undefined;
    }
    return [found, result];
}
exports.findWithResult = findWithResult;
//# sourceMappingURL=utils.js.map