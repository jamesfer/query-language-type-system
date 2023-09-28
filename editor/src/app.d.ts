export declare class App {
    private inputElement;
    private outputElement;
    private jsLanguageButton;
    private cppLanguageButton;
    private editor;
    private outputEditor;
    private backendOption$;
    private jsButtonSubscription;
    private cppButtonSubscription;
    private compilationSubscription;
    private jsButtonStyleSubscription;
    private cppButtonStyleSubscription;
    constructor(inputElement: HTMLTextAreaElement, outputElement: HTMLTextAreaElement, jsLanguageButton: HTMLButtonElement, cppLanguageButton: HTMLButtonElement);
    private inputCodeObservable;
    private inputCompileOptions;
    private displayCompiledCode;
    private generateCompilationOutput;
}
//# sourceMappingURL=app.d.ts.map