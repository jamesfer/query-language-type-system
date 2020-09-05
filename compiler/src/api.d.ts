import { CoreExpression, CoreNode } from './desugar/desugar';
import { Message } from './type-checker/types/message';
import { Value } from './type-checker/types/value';
export { TypedNode } from './type-checker/type-check';
export interface CompileResult {
    expression?: CoreExpression;
    node?: CoreNode;
    messages: Message[];
}
export interface CompileOptions {
    prelude?: boolean;
    removeUnused?: boolean;
}
export declare function compile(code: string, options?: CompileOptions): CompileResult;
export declare function evaluate(code: string): Value | undefined;
//# sourceMappingURL=api.d.ts.map