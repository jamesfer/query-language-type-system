import compileTo from './compile-to';
import dedent from 'dedent-js';
import Editor from './editor';

export default class App {
  private editor = new Editor(this.inputElement);
  private outputEditor = new Editor(this.outputElement, {
    readOnly: true,
    mode: 'javascript',
  });

  private displayCompiledCode = () => {
    const code = this.editor.getValue();
    if (/^\s*$/m.test(code)) {
      this.outputEditor.setValue('');
      return;
    }

    try {
      const { messages, output } = compileTo(code, { backend: 'javascript' });
      if (messages.length > 0) {
        const formattedMessages = messages.map(message => `    ✖ ${message}`);
        this.outputEditor.setValue(dedent`
          /**
            Code failed to compile:
          ${formattedMessages.join('\n')}
          */
        `);
      } else if (output) {
        this.outputEditor.setValue(output);
      } else {
        this.outputEditor.setValue('');
      }
    } catch (error) {
      this.outputEditor.setValue(dedent`
        /**
          Compiler threw an exception: ${error}
        */
      `);
    }
  };

  constructor(
    private inputElement: HTMLTextAreaElement,
    private outputElement: HTMLTextAreaElement,
  ) {
    this.editor.changes$.subscribe(this.displayCompiledCode);
  }
}
