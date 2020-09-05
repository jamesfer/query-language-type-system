import { Expression } from './expression';
export interface Node<T> extends NodeWithChild<T, Node<T>> {
}
export interface NodeWithChild<T, C> extends NodeWithExpression<T, Expression<C>> {
}
export interface NodeWithExpression<D, E> {
    kind: 'Node';
    expression: E;
    decoration: D;
}
export declare function getDecoration<T>(node: Node<T>): T;
export declare function getDecorations<T>(nodes: Node<T>[]): T[];
export declare function getOptionalDecorations<T>(nodes: (Node<T | undefined> | undefined)[]): (T | undefined)[];
//# sourceMappingURL=node.d.ts.map