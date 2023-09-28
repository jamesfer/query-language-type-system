"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateCppState = void 0;
const map_state_recorder_1 = require("../../type-checker/state-recorder/map-state-recorder");
const state_recorder_1 = require("../../type-checker/state-recorder/state-recorder");
class GenerateCppState {
    constructor() {
        this.anonymousStructCache = new map_state_recorder_1.MapStateRecorder();
        this.globalStatements = new state_recorder_1.StateRecorder();
        this.localStatements = new state_recorder_1.StateRecorder();
    }
}
exports.GenerateCppState = GenerateCppState;
//# sourceMappingURL=generate-cpp-state.js.map