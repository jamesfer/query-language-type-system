import { EditorConfiguration, Mode, StringStream } from 'codemirror';
import 'codemirror/addon/comment/comment';
export declare type Many<T> = T | T[];
export interface HighlighterState {
    inString?: string | undefined;
}
export default class Highlighter implements Mode<HighlighterState> {
    private readonly config;
    private readonly modeOptions?;
    lineComment: string;
    constructor(config: EditorConfiguration, modeOptions?: any);
    token(stream: StringStream, state: HighlighterState): string | null;
    private nextToken;
    private mapTokenKindToStyle;
}
//# sourceMappingURL=highlighter.d.ts.map