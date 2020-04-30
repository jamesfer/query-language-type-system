"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("./constructors");
class WriterMonad {
    constructor(state, combine) {
        this.state = state;
        this.combine = combine;
    }
    update(state) {
        this.state = this.combine(this.state, state);
    }
    append({ state, value }) {
        this.update(state);
        return value;
    }
    wrap(value) {
        return { value, state: this.state };
    }
    static createResult(state, value) {
        return { state, value };
    }
}
exports.WriterMonad = WriterMonad;
class TypeWriter extends WriterMonad {
    constructor(scope) {
        super(TypeWriter.emptyTypeState(), ([messages], [newMessages, scope]) => [[...messages, ...newMessages], scope]);
        this.scope = scope;
        this.state = [this.state[0], []];
    }
    get messages() {
        return this.state[0];
    }
    get replacements() {
        return this.state[1];
    }
    log(message) {
        this.state = [[...this.messages, message], this.replacements];
    }
    logAll(messages) {
        this.state = [[...this.messages, ...messages], this.replacements];
    }
    recordReplacements(replacements) {
        this.state = [this.messages, [...this.replacements, ...replacements]];
    }
    updateScope(newScope) {
        this.scope = newScope;
    }
    expandScope(newScope) {
        this.scope = constructors_1.expandScope(this.scope, newScope);
    }
    // run<V>(f: (scope: Scope) => TypeResult<V>): V;
    run(f) {
        return (...args) => this.append(f(this.scope)(...args));
    }
    withChildScope(f) {
        const childWriter = new TypeWriter(this.scope);
        const result = f(childWriter);
        this.update(childWriter.state);
        return result;
    }
    static emptyTypeState() {
        return [[], []];
    }
}
exports.TypeWriter = TypeWriter;
//# sourceMappingURL=monad-utils.js.map