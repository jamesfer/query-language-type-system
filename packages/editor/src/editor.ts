import { fromTextArea, Editor as CMEditor, EditorChangeLinkedList } from 'codemirror';
import { Subject } from 'rxjs';
import { MODE_NAME, initializeMode } from './mode';
import 'codemirror/mode/htmlmixed/htmlmixed';

export interface EditorSettings {
  mode?: string;
  readOnly?: boolean;
  theme?: string;
  code?: string;
}

export default class Editor {
  private readonly editor: CMEditor;
  private changesSubject$ = new Subject<EditorChangeLinkedList[]>();
  public changes$ = this.changesSubject$.asObservable();

  constructor(
    private readonly element: HTMLTextAreaElement,
    private readonly settings: EditorSettings = {},
  ) {
    initializeMode();
    this.editor = this.createEditor();
    this.registerListeners(this.editor);
  }

  getValue() {
    return this.editor.getValue();
  }

  setValue(code: string) {
    this.editor.setValue(code);
  }

  private createEditor(): CMEditor {
    return fromTextArea(this.element, {
      mode: this.settings.mode || MODE_NAME,
      theme: this.settings.theme || 'monokai',
      // lineNumbers: true, // TODO this doesn't work for some reason
      inputStyle: 'contenteditable',
      readOnly: this.settings.readOnly ? 'nocursor' : false,
      value: this.settings.code || '',
      // lint: this.lintOptions(), // TODO
    });
  }

  private registerListeners(editor: CMEditor) {
    editor.on('changes', this.makeListener(this.changesSubject$));
  }

  private makeListener<T>(subject: Subject<T>): (_: CMEditor, value: T) => void {
    return (_, value) => subject.next(value);
  }
}
