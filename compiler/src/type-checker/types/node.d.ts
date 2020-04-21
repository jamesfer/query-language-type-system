import { Expression } from './expression';
export interface Node<T> {
    kind: 'Node';
    expression: Expression<Node<T>>;
    decoration: T;
}
export interface NodeWithChild<T, C> {
    kind: 'Node';
    expression: Expression<C>;
    decoration: T;
}
export declare function getDecoration<T>(node: Node<T>): T;
export declare function getDecorations<T>(nodes: Node<T>[]): T[];
export declare function getOptionalDecorations<T>(nodes: (Node<T | undefined> | undefined)[]): (T | undefined)[];
//# sourceMappingURL=node.d.ts.map