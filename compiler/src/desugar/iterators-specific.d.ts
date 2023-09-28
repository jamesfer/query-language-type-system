import { Application, BindingExpression, BooleanExpression, DataInstantiation, DualExpression, Expression, FunctionExpression, Identifier, NativeExpression, Node, NodeWithExpression, NumberExpression, PatternMatchExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, StringExpression, SymbolExpression } from '..';
export declare function emptyMapIterator<A, B, E extends Identifier | BooleanExpression | StringExpression | NumberExpression | SymbolExpression | NativeExpression>(f: (a: A) => B): (expression: E) => E;
export declare function applicationMapIterator<A, B>(f: (a: A) => B): (expression: Application<A>) => Application<B>;
export declare function dataInstantiationMapIterator<A, B>(f: (a: A) => B): (expression: DataInstantiation<A>) => DataInstantiation<B>;
export declare function readDataPropertyMapIterator<A, B>(f: (a: A) => B): (expression: ReadDataPropertyExpression<A>) => ReadDataPropertyExpression<B>;
export declare function readRecordPropertyMapIterator<A, B>(f: (a: A) => B): (expression: ReadRecordPropertyExpression<A>) => ReadRecordPropertyExpression<B>;
export declare function functionMapIterator<A, B>(f: (a: A) => B): (expression: FunctionExpression<A>) => FunctionExpression<B>;
export declare function dualMapIterator<A, B>(f: (a: A) => B): (expression: DualExpression<A>) => DualExpression<B>;
export declare function bindingMapIterator<A, B>(f: (a: A) => B): (expression: BindingExpression<A>) => BindingExpression<B>;
export declare function patternMatchMapIterator<A, B>(f: (a: A) => B): (expression: PatternMatchExpression<A>) => PatternMatchExpression<B>;
export declare function recordMapIterator<A, B>(f: (a: A) => B): (expression: RecordExpression<A>) => RecordExpression<B>;
export declare function makeExpressionIterator<A, B>(f: (a: A) => B): (e: Expression<A>) => Expression<B>;
export declare function shallowStripNode<D, A>(node: NodeWithExpression<D, A>): A;
export declare function makeStripNode<D>(makeIterator: <A, B>(f: (a: A) => B) => (e: Expression<A>) => Expression<B>): (n: Expression<Node<D>>) => Expression;
//# sourceMappingURL=iterators-specific.d.ts.map