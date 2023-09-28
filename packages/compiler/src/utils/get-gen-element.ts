export function getGenElement<T>(n: number, generator: Generator<T>): [T] | [] {
  let i = 0;
  for (const element of generator) {
    if (i === n) {
      return [element];
    }
    i += 1;
  }
  return [];
}
