import { EditorChangeLinkedList } from 'codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed';
export interface EditorSettings {
    mode?: string;
    readOnly?: boolean;
    theme?: string;
    code?: string;
}
export declare class Editor {
    private readonly element;
    private readonly settings;
    private readonly editor;
    private changesSubject$;
    changes$: import("rxjs").Observable<EditorChangeLinkedList[]>;
    constructor(element: HTMLTextAreaElement, settings?: EditorSettings);
    getValue(): string;
    setValue(code: string): void;
    private createEditor;
    private registerListeners;
    private makeListener;
}
//# sourceMappingURL=editor.d.ts.map