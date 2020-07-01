"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const compile_to_1 = tslib_1.__importDefault(require("./compile-to"));
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const editor_1 = tslib_1.__importDefault(require("./editor"));
class App {
    constructor(inputElement, outputElement) {
        this.inputElement = inputElement;
        this.outputElement = outputElement;
        this.editor = new editor_1.default(this.inputElement);
        this.outputEditor = new editor_1.default(this.outputElement, {
            readOnly: true,
            mode: 'javascript',
        });
        this.displayCompiledCode = () => {
            const code = this.editor.getValue();
            if (/^\s*$/m.test(code)) {
                this.outputEditor.setValue('');
                return;
            }
            try {
                const { messages, output } = compile_to_1.default(code, { backend: 'javascript' });
                if (messages.length > 0) {
                    const formattedMessages = messages.map(message => `    ✖ ${message}`);
                    this.outputEditor.setValue(dedent_js_1.default `
          /**
            Code failed to compile:
          ${formattedMessages.join('\n')}
          */
        `);
                }
                else if (output) {
                    this.outputEditor.setValue(output);
                }
                else {
                    this.outputEditor.setValue('');
                }
            }
            catch (error) {
                this.outputEditor.setValue(dedent_js_1.default `
        /**
          Compiler threw an exception: ${error}
        */
      `);
            }
        };
        this.editor.changes$.subscribe(this.displayCompiledCode);
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map