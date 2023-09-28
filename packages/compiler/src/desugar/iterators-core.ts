import { Kind, URIS } from 'fp-ts/lib/HKT';

export type MapIterator<E extends URIS, A, B> = (f: (a: A) => B) => (expression: Kind<E, A>) => Kind<E, B>
export type ReductionIterator<E extends URIS, A, B> = (f: (a: A) => B) => (expression: Kind<E, A>) => B;

export type ReductionIteratorMap<Keys extends string, E extends { kind: URIS }, A, B> = (
  // E extends { kind: infer K }
  //   ? K extends string
  { [k in Keys]: k extends URIS ? ((expression: E extends { kind: k } ? Kind<k, A> : never) => B) : never }
    // : never
    // : never
);

// export function makeReduceIterator<EU extends URIS, E extends { kind: URIS } & Kind<EU, any>, A, B>(
//   iterators: ReductionIteratorMap<E['kind'], E, A, B>,
// ): (input: Kind<EU, A>) => B {
//   return (input) => {
//     if (input.kind in iterators) {
//       return iterators[input.kind](input);
//     }
//     throw new Error(`Unknown iterator for object with a kind of ${input.kind}. Known iterators: ${Object.keys(iterators).join(', ')}`);
//   }
// }

export type IteratorMapIterator<K extends URIS, A, B> = ((f: (a: A) => B) => (expression: Kind<K, A>) => Kind<K, B>);

export type IteratorMap<Keys extends string, E extends { kind: URIS }, A, B> = (
  // E extends { kind: infer K }
  //   ? K extends string
  { [k in Keys]: k extends URIS ? E extends { kind: k } ? IteratorMapIterator<k, A, B> : never : never }
  // : never
  // : never
);

export function combineIteratorMap<EU extends URIS, E extends { kind: URIS } & Kind<EU, any>, A, B>(
  iterators: IteratorMap<E['kind'], E, A, B>
): (f: (a: A) => B) => (input: Kind<EU, A> & { kind: URIS }) => Kind<EU, B> {
  return f => (input) => {
    if (input.kind in iterators) {
      return iterators[input.kind](f)(input);
    }
    throw new Error(`Unknown iterator for object with a kind of ${input.kind}. Known iterators: ${Object.keys(iterators).join(', ')}`);
  }
}

export type Prop<K extends string, V> = {
  [k in K]: V;
}

export function passThroughIterator<K extends string>(
  key: K,
): <T extends Prop<K, A>, A, B>(f: (value: A) => B) => (input: T) => T & Prop<K, B> {
  return f => input => ({ ...input, [key]: f(input[key]) });
}
