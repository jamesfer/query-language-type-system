export interface FreeFlatMap<A, T> {
  child: Free<A>;
  map(a: A): Free<T>;
}

// export interface FreeDefer<T> {
//   bounce(): T;
// }

export interface FreePure<T> {
  value: T;
}

export type Free<T> =
  | FreeFlatMap<any, T>
  | FreePure<T>;

export function pureFree<T>(value: T): Free<T> {
  return { value: value };
}

export function deferFree<T>(value: () => Free<T>): Free<T> {
  return { child: pureFree(null), map: value };
}

export function returningFree<T extends any[], B>(f: (...args: T) => B): (...args: T) => Free<B> {
  return (...args) => pureFree(f(...args));
}

export function flatMapFree<A, T>(child: Free<A>, map: (value: A) => Free<T>): Free<T> {
  return { child, map };
}

export function mapFree<A, T>(child: Free<A>, map: (value: A) => T): Free<T> {
  return { child, map: value => pureFree(map(value)) };
}

export function traverseFree<A, B>(inputs: A[], f: (a: A) => Free<B>): Free<B[]> {
  return inputs.reduce<Free<B[]>>(
    (collection, input) => flatMapFree(collection, array => (
      mapFree(f(input), value => [...array, value])
    )),
    pureFree([]),
  );
}

export function pipeFree<A1>(free: Free<A1>): Free<A1>;
export function pipeFree<A1, A2>(free: Free<A1>, f1: (a: A1) => Free<A2>): Free<A2>;
export function pipeFree<A1, A2, A3>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>): Free<A3>
export function pipeFree<A1, A2, A3, A4>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>): Free<A4>
export function pipeFree<A1, A2, A3, A4, A5>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>): Free<A5>
export function pipeFree<A1, A2, A3, A4, A5, A6>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>, f5: (a: A5) => Free<A6>): Free<A6>
export function pipeFree<A1, A2, A3, A4, A5, A6, A7>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>, f5: (a: A5) => Free<A6>, f6: (a: A6) => Free<A7>): Free<A7>
export function pipeFree<T>(free: Free<T>, ...fs: ((a: T) => Free<T>)[]): Free<T> {
  return fs.reduce<Free<T>>(flatMapFree, free);
}

export function runFree<T>(free: Free<T>): T {
  const queue: ((a: any) => Free<T>)[] = [];
  while (true) {
    if ('value' in free) {
      const nextInQueue = queue.pop();
      if (!nextInQueue) {
        return free.value;
      }

      free = nextInQueue(free.value);
    } else if ('child' in free) {
      queue.push(free.map);
      free = free.child;
    }
  }
}
