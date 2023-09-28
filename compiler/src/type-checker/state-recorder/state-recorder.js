"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateRecorder = void 0;
class StateRecorder {
    constructor() {
        this.values = [];
    }
    push(value) {
        this.values.push(value);
    }
    pushAll(values) {
        values.forEach((value) => {
            this.push(value);
        });
    }
    clear() {
        this.values = [];
    }
}
exports.StateRecorder = StateRecorder;
//# sourceMappingURL=state-recorder.js.map