import dedent from 'dedent-js';
import compileTo, { CompileToOptions } from './compile-to';
import { BehaviorSubject, combineLatest, fromEvent, Observable } from 'rxjs';
import { map, mapTo } from 'rxjs/operators';
import Editor from './editor';

type CompilationOutput =
  | { code: string }
  | { error: string };

const activeLanguageButtonClass = 'selected';

export default class App {
  private editor = new Editor(this.inputElement);
  private outputEditor = new Editor(this.outputElement, {
    readOnly: true,
    mode: 'javascript',
  });

  private backendOption$ = new BehaviorSubject<'javascript' | 'cpp'>('javascript');

  private jsButtonSubscription = fromEvent(this.jsLanguageButton, 'click').pipe(
    mapTo<any, 'javascript'>('javascript'),
  ).subscribe(this.backendOption$);

  private cppButtonSubscription = fromEvent(this.cppLanguageButton, 'click').pipe(
    mapTo<any, 'cpp'>('cpp'),
  ).subscribe(this.backendOption$);

  private compilationSubscription = combineLatest(
    this.inputCodeObservable(),
    this.inputCompileOptions(),
  ).subscribe(([code, options]) => {
    this.displayCompiledCode(this.generateCompilationOutput(code, options));
  });

  private jsButtonStyleSubscription = this.backendOption$.subscribe((backend) => {
    if (backend === 'javascript') {
      this.jsLanguageButton.classList.add(activeLanguageButtonClass);
    } else {
      this.jsLanguageButton.classList.remove(activeLanguageButtonClass);
    }
  });

  private cppButtonStyleSubscription = this.backendOption$.subscribe((backend) => {
    if (backend === 'cpp') {
      this.cppLanguageButton.classList.add(activeLanguageButtonClass);
    } else {
      this.cppLanguageButton.classList.remove(activeLanguageButtonClass);
    }
  });

  constructor(
    private inputElement: HTMLTextAreaElement,
    private outputElement: HTMLTextAreaElement,
    private jsLanguageButton: HTMLButtonElement,
    private cppLanguageButton: HTMLButtonElement,
  ) {}

  private inputCodeObservable(): Observable<string> {
    return this.editor.changes$.pipe(map(() => this.editor.getValue()));
  }

  private inputCompileOptions(): Observable<CompileToOptions> {
    return this.backendOption$.pipe(map(backend => ({ backend })));
  }

  private displayCompiledCode(output: CompilationOutput) {
    this.outputEditor.setValue('code' in output ? output.code : output.error);
  }

  private generateCompilationOutput(code: string, options: CompileToOptions): CompilationOutput {
    if (/^\s*$/.test(code)) {
      return { code: '' };
    }

    try {
      const { messages, output } = compileTo(code, options);
      if (output) {
        return { code: output };
      } else {
        const formattedMessages = messages.map(message => ` *    ✖ ${message}`);
        return {
          error: dedent`
            /**
             * Code failed to compile:
             ${formattedMessages.join('\n')}
             */
          `,
        };
      }
    } catch (error) {
      return {
        error: dedent`
          /**
            Compiler threw an exception: ${error}
          */
        `,
      };
    }
  }
}

