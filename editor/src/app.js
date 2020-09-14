"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const compile_to_1 = tslib_1.__importDefault(require("./compile-to"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const editor_1 = tslib_1.__importDefault(require("./editor"));
const activeLanguageButtonClass = 'selected';
class App {
    constructor(inputElement, outputElement, jsLanguageButton, cppLanguageButton) {
        this.inputElement = inputElement;
        this.outputElement = outputElement;
        this.jsLanguageButton = jsLanguageButton;
        this.cppLanguageButton = cppLanguageButton;
        this.editor = new editor_1.default(this.inputElement);
        this.outputEditor = new editor_1.default(this.outputElement, {
            readOnly: true,
            mode: 'javascript',
        });
        this.backendOption$ = new rxjs_1.BehaviorSubject('javascript');
        this.jsButtonSubscription = rxjs_1.fromEvent(this.jsLanguageButton, 'click').pipe(operators_1.mapTo('javascript')).subscribe(this.backendOption$);
        this.cppButtonSubscription = rxjs_1.fromEvent(this.cppLanguageButton, 'click').pipe(operators_1.mapTo('cpp')).subscribe(this.backendOption$);
        this.compilationSubscription = rxjs_1.combineLatest(this.inputCodeObservable(), this.inputCompileOptions()).subscribe(([code, options]) => {
            this.displayCompiledCode(this.generateCompilationOutput(code, options));
        });
        this.jsButtonStyleSubscription = this.backendOption$.subscribe((backend) => {
            if (backend === 'javascript') {
                this.jsLanguageButton.classList.add(activeLanguageButtonClass);
            }
            else {
                this.jsLanguageButton.classList.remove(activeLanguageButtonClass);
            }
        });
        this.cppButtonStyleSubscription = this.backendOption$.subscribe((backend) => {
            if (backend === 'cpp') {
                this.cppLanguageButton.classList.add(activeLanguageButtonClass);
            }
            else {
                this.cppLanguageButton.classList.remove(activeLanguageButtonClass);
            }
        });
    }
    inputCodeObservable() {
        return this.editor.changes$.pipe(operators_1.map(() => this.editor.getValue()));
    }
    inputCompileOptions() {
        return this.backendOption$.pipe(operators_1.map(backend => ({ backend })));
    }
    displayCompiledCode(output) {
        this.outputEditor.setValue('code' in output ? output.code : output.error);
    }
    generateCompilationOutput(code, options) {
        if (/^\s*$/m.test(code)) {
            return { code: '' };
        }
        try {
            const { messages, output } = compile_to_1.default(code, options);
            if (output) {
                return { code: output };
            }
            else {
                const formattedMessages = messages.map(message => ` *    ✖ ${message}`);
                return {
                    error: dedent_js_1.default `
            /**
             * Code failed to compile:
             ${formattedMessages.join('\n')}
             */
          `,
                };
            }
        }
        catch (error) {
            return {
                error: dedent_js_1.default `
          /**
            Compiler threw an exception: ${error}
          */
        `,
            };
        }
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map