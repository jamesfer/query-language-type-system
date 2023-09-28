import { Applicative1 } from 'fp-ts/Applicative';
import { Chain1 } from 'fp-ts/Chain';
import { tailRec } from 'fp-ts/ChainRec';
import { right, left } from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { Functor1 } from 'fp-ts/Functor';
import { Pointed1 } from 'fp-ts/Pointed';
import { identity } from 'lodash';

interface CompFlatMap<A, B> {
  readonly _tag: 'CompFlatMap'
  child: Comp<A>;
  f(a: A): Comp<B>;
}

interface CompPure<T> {
  readonly _tag: 'CompPure';
  value: T;
}

export type Comp<T> =
  | CompFlatMap<any, T>
  | CompPure<T>

export const URI = 'Comp';

export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Comp: Comp<A>
  }
}

const compFlatMap = <A, B>(child: Comp<A>, f: (a: A) => Comp<B>): Comp<B> => ({
  child,
  f,
  _tag: 'CompFlatMap',
});

const compPure = <A>(value: A): Comp<A> => ({ value, _tag: 'CompPure' });

const _map: Functor1<URI>['map'] = (ma, f) => compFlatMap(ma, flow(f, of));
const _ap: Applicative1<URI>['ap'] = (mab, ma) => compFlatMap(mab, (fab) => compFlatMap(ma, flow(fab, of)))
const _chain: Chain1<URI>['chain'] = compFlatMap;

export const of: Pointed1<URI>['of'] = compPure;
export const map = <A, B>(f: (a: A) => B) => (ma: Comp<A>): Comp<B> => _map(ma, f);
export const ap = <A>(ma: Comp<A>) => <B>(mab: Comp<(a: A) => B>): Comp<B> => _ap(mab, ma);
export const chain = <A, B>(f: (a: A) => Comp<B>) => (ma: Comp<A>): Comp<B> => _chain(ma, f);

export function run<A>(comp: Comp<A>): A {
  const queue: ((a: any) => Comp<A>)[] = [];
  return tailRec(comp, (current) => {
    switch (current._tag) {
      case 'CompPure':
        return queue.length === 0
          ? right(current.value)
          : left(queue.pop()!(current.value));

      case 'CompFlatMap':
        queue.push(current.f);
        return left(current.child);
    }
  });
}

export const Functor: Functor1<URI> = {
  URI,
  map: _map,
}

export const Pointed: Pointed1<URI> = {
  URI,
  of,
}

export const Applicative: Applicative1<URI> = {
  URI,
  of,
  map: _map,
  ap: _ap
}

export const Chain: Chain1<URI> = {
  URI,
  ap: _ap,
  map: _map,
  chain: _chain,
}
