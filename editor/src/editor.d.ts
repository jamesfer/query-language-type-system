import { Editor as CMEditor, EditorChangeLinkedList } from 'codemirror';
import { Subject } from 'rxjs';
import 'codemirror/mode/htmlmixed/htmlmixed';
export interface EditorSettings {
    readOnly?: boolean;
    theme?: string;
    code?: string;
}
export default class Editor {
    private readonly element;
    private readonly settings;
    editor: CMEditor;
    changes$: Subject<EditorChangeLinkedList[]>;
    constructor(element: HTMLTextAreaElement, settings?: EditorSettings);
    private createEditor;
    private registerListeners;
    private makeListener;
}
//# sourceMappingURL=editor.d.ts.map