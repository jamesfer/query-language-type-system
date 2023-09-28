export function adhocReduce<A, T>(
  accumulator: A,
  array: T[],
  f: (accumulator: A, element: T) => [A, T[]],
): A {
  let currentAccumulator = accumulator;
  let remaining = array;
  while (remaining.length > 0) {
    const next = remaining.shift()!;
    const [newAccumulator, newElements] = f(currentAccumulator, next);
    currentAccumulator = newAccumulator;
    remaining = [...newElements, ...remaining];
  }
  return currentAccumulator;
}
