import { CoreExpression, CoreNode } from './desugar/desugar';
import { Message } from './type-checker/types/message';
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
//# sourceMappingURL=api.d.ts.map