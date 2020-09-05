import { CoreExpression } from '../..';
export interface JavascriptBackendOptions {
    module: 'commonjs' | 'esm';
}
export declare function generateJavascript(expression: CoreExpression, options: JavascriptBackendOptions): string;
//# sourceMappingURL=generate-javascript.d.ts.map