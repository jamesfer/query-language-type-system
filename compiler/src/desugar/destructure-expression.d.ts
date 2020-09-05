import { DesugaredNode } from './desugar-destructuring';
export interface VariableExpressionReplacement {
    name: string;
    node: DesugaredNode;
}
export declare function performExpressionDestructuring(valueNode: DesugaredNode, { expression }: DesugaredNode): VariableExpressionReplacement[];
//# sourceMappingURL=destructure-expression.d.ts.map