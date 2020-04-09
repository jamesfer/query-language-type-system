export interface Trampoline<T>{
  (): { bounce: Trampoline<T> } | { done: T };
}

export function runTrampoline<T>(trampoline: Trampoline<T>): T {
  let result = trampoline();
  while ('bounce' in result) {
    result = result.bounce();
  }
  return result.done;
}

export function pureTrampoline<T>(value: T): Trampoline<T> {
  return () => ({ done: value });
}

export function returningTrampoline<A, B>(f: (input: A) => B): (input: A) => Trampoline<B> {
  return input => pureTrampoline(f(input));
}

// x = 4, () =>
// x = 3, () =>
// x = 2, () =>
// x = 1, {}

// map, call
//   x = 4, () =>
// map, bounce, () =>

export function mapTrampoline<A, B>(trampoline: Trampoline<A>, f: (a: A) => B): Trampoline<B> {
  return () => {
    const result = trampoline();
    if ('done' in result) {
      return { done: f(result.done) };
    }

    return { bounce: mapTrampoline(result.bounce, f) };
  };
}

export function flatMapTrampoline<A, B>(trampoline: Trampoline<A>, f: (a: A) => Trampoline<B>): Trampoline<B> {
  return () => {
    const result = trampoline();
    if ('done' in result) {
      return f(result.done)();
    }

    return { bounce: flatMapTrampoline(result.bounce, f) };
  };
}

export function traverseTrampoline<A, B>(inputs: A[], f: (a: A) => Trampoline<B>): Trampoline<B[]> {
  return inputs.reduce<Trampoline<B[]>>(
    (collection, input) => flatMapTrampoline(collection, array => (
      mapTrampoline(f(input), value => [...array, value])
    )),
    pureTrampoline([]),
  )
}

export function pipeTrampoline<A1>(trampoline: Trampoline<A1>): Trampoline<A1>;
export function pipeTrampoline<A1, A2>(trampoline: Trampoline<A1>, f1: (a: A1) => Trampoline<A2>): Trampoline<A2>;
export function pipeTrampoline<A1, A2, A3>(trampoline: Trampoline<A1>, f1: (a: A1) => Trampoline<A2>, f2: (a: A2) => Trampoline<A3>): Trampoline<A3>
export function pipeTrampoline<A1, A2, A3, A4>(trampoline: Trampoline<A1>, f1: (a: A1) => Trampoline<A2>, f2: (a: A2) => Trampoline<A3>, f3: (a: A3) => Trampoline<A4>): Trampoline<A4>
export function pipeTrampoline<A1, A2, A3, A4, A5>(trampoline: Trampoline<A1>, f1: (a: A1) => Trampoline<A2>, f2: (a: A2) => Trampoline<A3>, f3: (a: A3) => Trampoline<A4>, f4: (a: A4) => Trampoline<A5>): Trampoline<A5>
export function pipeTrampoline<A1, A2, A3, A4, A5, A6>(trampoline: Trampoline<A1>, f1: (a: A1) => Trampoline<A2>, f2: (a: A2) => Trampoline<A3>, f3: (a: A3) => Trampoline<A4>, f4: (a: A4) => Trampoline<A5>, f5: (a: A5) => Trampoline<A6>): Trampoline<A6>
export function pipeTrampoline<T>(trampoline: Trampoline<T>, ...fs: ((a: T) => Trampoline<T>)[]): Trampoline<T> {
  return fs.reduce<Trampoline<T>>(
    (collected, current) => flatMapTrampoline(collected, value => current(value)),
    trampoline,
  );
}

