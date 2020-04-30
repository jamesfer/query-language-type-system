import { Expression } from '../..';
export interface JavascriptBackendOptions {
    module: 'commonjs' | 'esm';
}
export declare function generateJavascript(expression: Expression, options: JavascriptBackendOptions): string;
//# sourceMappingURL=generate-javascript.d.ts.map