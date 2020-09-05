"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageState = exports.doWithFreeState = exports.doWithState = exports.withMessages = void 0;
const free_1 = require("../../utils/free");
function withMessages(messages, value) {
    return { messages, value };
}
exports.withMessages = withMessages;
function doWithState(f) {
    const state = new MessageState();
    return state.wrap(f(state));
}
exports.doWithState = doWithState;
function doWithFreeState(f) {
    const state = new MessageState();
    return free_1.mapFree(f(state), value => state.wrap(value));
}
exports.doWithFreeState = doWithFreeState;
class MessageState {
    constructor() {
        this.messages = [];
    }
    run(f) {
        return (...args) => {
            const { messages, value } = f(...args);
            this.log(messages);
            return value;
        };
    }
    sequence(inputs) {
        return inputs.map(this.unwrap.bind(this));
    }
    unwrap({ messages, value }) {
        this.log(messages);
        return value;
    }
    wrap(value) {
        return withMessages(this.messages, value);
    }
    log(messages) {
        this.messages = this.messages.concat(messages);
    }
}
exports.MessageState = MessageState;
//# sourceMappingURL=message-state.js.map