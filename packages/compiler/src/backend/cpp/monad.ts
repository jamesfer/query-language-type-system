import { toPairs, fromPairs } from 'lodash';

export class State<S> {
  constructor(protected state: S) {}

  get(): S {
    return this.state;
  }

  set(state: S): void {
    this.state = state;
  }
}

export class ArrayState<S> extends State<S[]> {
  constructor(state: S[] = []) {
    super(state);
  }

  append(value: S) {
    this.state.push(value);
  }

  concat(values: S[]) {
    this.state = this.state.concat(values);
  }
}

export class MapState<K extends string | number, S> extends State<Record<K, S>> {
  constructor(state: Record<K, S> = {} as Record<K, S>) {
    super(state);
  }

  property(key: K): S | undefined {
    return this.state[key];
  }

  setProperty(key: K, value: S): void {
    this.state[key] = value;
  }
}

export class FState<T extends any[], R> extends State<(...args: T) => R> {
  constructor(f: (...args: T) => R) {
    super(f);
  }

  apply(...args: T): R {
    return this.get()(...args);
  }
}

export class CombinedState<S extends { [k: string]: State<any> }> extends State<S> {
  constructor(state: S) {
    super(state);
  }

  child<K extends keyof S>(key: K): S[K] {
    return this.state[key];
  }
}


export class Monad<S extends State<any>, T> {
  static of<S extends State<any>, T>(f: (state: S) => T): Monad<S, T> {
    return new Monad(f);
  }

  static pure<S extends State<any>, T>(t: T): Monad<S, T> {
    return Monad.of(_ => t);
  }

  private constructor(private f: (state: S) => T) { }

  run(state: S): T {
    return this.f(state);
  }
}

export function mapM<S extends State<any>, A, B>(monad: Monad<S, A>, f: (a: A) => B): Monad<S, B> {
  return Monad.of<S, B>(state => f(monad.run(state)));
}

export function flatMapM<S extends State<any>, A, B>(monad: Monad<S, A>, f: (a: A) => Monad<S, B>): Monad<S, B> {
  return Monad.of<S, B>(state => f(monad.run(state)).run(state));
}

export function sequenceM<S extends State<any>, T>(monads: Monad<S, T>[]): Monad<S, T[]> {
  return monads.reduce<Monad<S, T[]>>(
    (accum, monad) => flatMapM(accum, values => mapM(monad, newValue => [...values, newValue])),
    Monad.of(_ => []),
  );
}

export function traverseM<S extends State<any>, A, B>(values: A[], f: (a: A) => Monad<S, B>): Monad<S, B[]> {
  return values.reduce<Monad<S, B[]>>(
    (accum, value) => flatMapM(accum, accumValues => mapM(f(value), newValue => [...accumValues, newValue])),
    Monad.of(_ => []),
  );
}

export type MonadRecordValues<T> = {
  [K in keyof T]: T[K] extends Monad<any, infer A> ? A : unknown;
};

export function flattenRM<S extends State<any>, T, R extends Record<string, Monad<S, T>>>(record: R): Monad<S, MonadRecordValues<R>> {
  return mapM(traverseM(toPairs(record), ([key, monad]) => mapM(monad, value => [key, value])), fromPairs) as Monad<S, MonadRecordValues<R>>;
}

export function pipeRecord<S extends State<any>, R, I extends { [k: string]: Monad<S, any> }>(initial: I, final: (record: MonadRecordValues<I>) => R): Monad<S, R>
export function pipeRecord<S extends State<any>, R, I extends { [k: string]: Monad<S, any> }, I2 extends { [k: string]: Monad<S, any> }>(initial: I, f1: (record: MonadRecordValues<I>) => I2, final: (record: MonadRecordValues<I & I2>) => R): Monad<S, R>
export function pipeRecord<S extends State<any>, R, I extends { [k: string]: Monad<S, any> }, I2 extends { [k: string]: Monad<S, any> }, I3 extends { [k: string]: Monad<S, any> }>(initial: I, f1: (record: MonadRecordValues<I>) => I2, f2: (record: MonadRecordValues<I & I2>) => I3, final: (record: MonadRecordValues<I & I2 & I3>) => R): Monad<S, R>
export function pipeRecord<S extends State<any>, R, I extends { [k: string]: Monad<S, any> }, I2 extends { [k: string]: Monad<S, any> }, IN extends { [k: string]: Monad<S, any> }>(initial: I, f1: (record: MonadRecordValues<I>) => I2 | R, ...fs: ((record: MonadRecordValues<I2>) => IN | R)[]): Monad<S, R> {
  if (fs.length === 0) {
    return mapM(flattenRM(initial), f1) as Monad<S, R>;
  }

  const operations = [f1, fs.slice(0, -1)] as any as ((record: MonadRecordValues<I>) => IN)[];
  const final = fs[fs.length - 1] as any as (record: MonadRecordValues<I>) => R;
  const penultimateResult = operations.reduce<Monad<S, MonadRecordValues<I>>>(
    (accum, operation) => flatMapM(accum, accumValue => (
      mapM(flattenRM(operation(accumValue)), newValues => ({
        ...accumValue,
        ...newValues,
      }))
    )),
    flattenRM(initial),
  );
  return mapM(penultimateResult, final);
}

