"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDestructurableBindings = void 0;
const iterators_specific_1 = require("../../desugar/iterators-specific");
const state_recorder_1 = require("../state-recorder/state-recorder");
const visitor_utils_1 = require("../visitor-utils");
const extractBinding = (state) => (node) => {
    if (node.expression.kind === 'Identifier') {
        state.push([node.expression.name, node.decoration.type]);
    }
    return node;
};
function extractDestructurableBindings(node) {
    const state = new state_recorder_1.StateRecorder();
    const extractBindingIntoState = extractBinding(state);
    const internal = (node) => extractBindingIntoState(visitor_utils_1.mapNode(iterator, node));
    const iterator = iterators_specific_1.makeExpressionIterator(internal);
    internal(node);
    return state.values;
}
exports.extractDestructurableBindings = extractDestructurableBindings;
//# sourceMappingURL=extract-destructurable-bindings.js.map