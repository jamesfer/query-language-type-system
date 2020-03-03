import compileTo from './compile-to';
import Editor from './editor';

export default class App {
  private editor: Editor;

  private displayCompiledCode = () => {
    const code = this.editor.editor.getValue();
    if (/^\s*$/m.test(code)) {
      this.outputElement.value = '';
    } else {
      try {
        const { messages, output } = compileTo(this.editor.editor.getValue(), { backend: 'javascript' });
        if (output) {
          this.outputElement.value = output;
        } else {
          const formattedMessages = messages.map(message => `  ✖ ${message}`);
          this.outputElement.value = `Code failed to compile:\n${formattedMessages.join('\n')}`;
        }
      } catch (error) {
        this.outputElement.value = `Compiler threw an exception: ${error}`;
      }
    }
  };

  constructor(
    private inputElement: HTMLTextAreaElement,
    private outputElement: HTMLInputElement,
  ) {
    this.editor = new Editor(inputElement);

    this.editor.changes$.subscribe(this.displayCompiledCode);
  }
}
