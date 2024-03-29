/**
 * Wraps a function that modifies it's first argument in a new function that will return that first argument after
 * it has been modified. Very useful for `reduce()` iteratees that want to modify the accumulator.
 */
export function tapFirst<A, O extends any[]>(f: (first: A, ...other: O) => void): (first: A, ...other: O) => A {
  return (first, ...args) => {
    f(first, ...args);
    return first;
  }
}
