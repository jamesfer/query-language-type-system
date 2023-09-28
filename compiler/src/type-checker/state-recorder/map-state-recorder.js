"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapStateRecorder = void 0;
const monad_1 = require("../../backend/cpp/monad");
class MapStateRecorder extends monad_1.State {
    constructor(state = {}) {
        super(state);
    }
    property(key) {
        return this.state[key];
    }
    setProperty(key, value) {
        this.state[key] = value;
    }
}
exports.MapStateRecorder = MapStateRecorder;
//# sourceMappingURL=map-state-recorder.js.map