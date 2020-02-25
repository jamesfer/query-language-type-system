export function assertNever(x: never): never {
  throw new Error(`Assert never was called with: ${x}`);
}

export function catchErrors<T, R>(f: (t: T) => R): (t: T) => ([Error] | [undefined, R]) {
  return (t) => {
    try {
      return [undefined, f(t)];
    } catch (error) {
      return [error];
    }
  };
}
