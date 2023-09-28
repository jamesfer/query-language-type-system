"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Editor = void 0;
const codemirror_1 = require("codemirror");
const rxjs_1 = require("rxjs");
const mode_1 = require("./mode");
require("codemirror/mode/htmlmixed/htmlmixed");
class Editor {
    constructor(element, settings = {}) {
        this.element = element;
        this.settings = settings;
        this.changesSubject$ = new rxjs_1.Subject();
        this.changes$ = this.changesSubject$.asObservable();
        mode_1.initializeMode();
        this.editor = this.createEditor();
        this.registerListeners(this.editor);
    }
    getValue() {
        return this.editor.getValue();
    }
    setValue(code) {
        this.editor.setValue(code);
    }
    createEditor() {
        return codemirror_1.fromTextArea(this.element, {
            mode: this.settings.mode || mode_1.MODE_NAME,
            theme: this.settings.theme || 'monokai',
            // lineNumbers: true, // TODO this doesn't work for some reason
            inputStyle: 'contenteditable',
            readOnly: this.settings.readOnly ? 'nocursor' : false,
            value: this.settings.code || '',
        });
    }
    registerListeners(editor) {
        editor.on('changes', this.makeListener(this.changesSubject$));
    }
    makeListener(subject) {
        return (_, value) => subject.next(value);
    }
}
exports.Editor = Editor;
//# sourceMappingURL=editor.js.map