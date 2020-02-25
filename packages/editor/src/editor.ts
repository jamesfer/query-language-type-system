import { fromTextArea, Editor as CMEditor, EditorChangeLinkedList } from 'codemirror';
import { Subject } from 'rxjs';
import { MODE_NAME, initializeMode } from './mode';
import 'codemirror/mode/htmlmixed/htmlmixed';

export interface EditorSettings {
  readOnly?: boolean;
  theme?: string;
  code?: string;
}

export default class Editor {
  public editor: CMEditor;
  public changes$ = new Subject<EditorChangeLinkedList[]>();

  constructor(
    private readonly element: HTMLTextAreaElement,
    private readonly settings: EditorSettings = {},
  ) {
    initializeMode();
    this.editor = this.createEditor();
    this.registerListeners(this.editor);
  }

  private createEditor(): CMEditor {
    return fromTextArea(this.element, {
      mode: MODE_NAME,
      theme: this.settings.theme || 'monokai',
      // lineNumbers: true, // TODO this doesn't work for some reason
      inputStyle: 'contenteditable',
      readOnly: this.settings.readOnly ? 'nocursor' : false,
      value: this.settings.code || '',
      // lint: this.lintOptions(), // TODO
    });
  }

  private registerListeners(editor: CMEditor) {
    editor.on('changes', this.makeListener(this.changes$));
  }

  private makeListener<T>(subject: Subject<T>): (_: CMEditor, value: T) => void {
    return (_, value) => subject.next(value);
  }
}
