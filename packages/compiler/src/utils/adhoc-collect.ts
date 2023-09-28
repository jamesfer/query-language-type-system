export function adhocCollect<T, R>(initial: T, f: (value: T) => [T, R] | []): R[] {
  let next = initial;
  const accumulator: R[] = [];
  while (true) {
    const result = f(next);
    if (result.length === 0) {
      break;
    }

    next = result[0];
    accumulator.push(result[1]);
  }

  return accumulator;
}
