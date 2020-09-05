import { Kind, URIS } from 'fp-ts/lib/HKT';
export declare type MapIterator<E extends URIS, A, B> = (f: (a: A) => B) => (expression: Kind<E, A>) => Kind<E, B>;
export declare type ReductionIterator<E extends URIS, A, B> = (f: (a: A) => B) => (expression: Kind<E, A>) => B;
export declare type ReductionIteratorMap<Keys extends string, E extends {
    kind: URIS;
}, A, B> = ({
    [k in Keys]: k extends URIS ? ((expression: E extends {
        kind: k;
    } ? Kind<k, A> : never) => B) : never;
});
export declare function makeReduceIterator<EU extends URIS, E extends {
    kind: URIS;
} & Kind<EU, any>, A, B>(iterators: ReductionIteratorMap<E['kind'], E, A, B>): (input: Kind<EU, A>) => B;
export declare type IteratorMapIterator<K extends URIS, A, B> = ((f: (a: A) => B) => (expression: Kind<K, A>) => Kind<K, B>);
export declare type IteratorMap<Keys extends string, E extends {
    kind: URIS;
}, A, B> = ({
    [k in Keys]: k extends URIS ? E extends {
        kind: k;
    } ? IteratorMapIterator<k, A, B> : never : never;
});
export declare function combineIteratorMap<EU extends URIS, E extends {
    kind: URIS;
} & Kind<EU, any>, A, B>(iterators: IteratorMap<E['kind'], E, A, B>): (f: (a: A) => B) => (input: Kind<EU, A>) => Kind<EU, B>;
export declare type Prop<K extends string, V> = {
    [k in K]: V;
};
export declare function passThroughIterator<K extends string>(key: K): <T extends Prop<K, A>, A, B>(f: (value: A) => B) => (input: T) => T & Prop<K, B>;
//# sourceMappingURL=iterators-core.d.ts.map