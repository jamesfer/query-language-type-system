import { Message } from 'query-language-compiler';
export interface CompileToOptions {
    backend: 'javascript';
}
export interface CompileToResult {
    output?: string;
    messages: Message[];
}
export default function compileTo(code: string, options: CompileToOptions): CompileToResult;
//# sourceMappingURL=compile-to.d.ts.map