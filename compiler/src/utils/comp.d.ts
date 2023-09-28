import { Applicative1 } from 'fp-ts/Applicative';
import { Chain1 } from 'fp-ts/Chain';
import { Functor1 } from 'fp-ts/Functor';
import { Pointed1 } from 'fp-ts/Pointed';
interface CompFlatMap<A, B> {
    readonly _tag: 'CompFlatMap';
    child: Comp<A>;
    f(a: A): Comp<B>;
}
interface CompPure<T> {
    readonly _tag: 'CompPure';
    value: T;
}
export declare type Comp<T> = CompFlatMap<any, T> | CompPure<T>;
export declare const URI = "Comp";
export declare type URI = typeof URI;
declare module 'fp-ts/lib/HKT' {
    interface URItoKind<A> {
        readonly Comp: Comp<A>;
    }
}
export declare const of: Pointed1<URI>['of'];
export declare const map: <A, B>(f: (a: A) => B) => (ma: Comp<A>) => Comp<B>;
export declare const ap: <A>(ma: Comp<A>) => <B>(mab: Comp<(a: A) => B>) => Comp<B>;
export declare const chain: <A, B>(f: (a: A) => Comp<B>) => (ma: Comp<A>) => Comp<B>;
export declare function run<A>(comp: Comp<A>): A;
export declare const Functor: Functor1<URI>;
export declare const Pointed: Pointed1<URI>;
export declare const Applicative: Applicative1<URI>;
export declare const Chain: Chain1<URI>;
export {};
//# sourceMappingURL=comp.d.ts.map