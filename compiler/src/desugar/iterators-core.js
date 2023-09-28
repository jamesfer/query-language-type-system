"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passThroughIterator = exports.combineIteratorMap = void 0;
function combineIteratorMap(iterators) {
    return f => (input) => {
        if (input.kind in iterators) {
            return iterators[input.kind](f)(input);
        }
        throw new Error(`Unknown iterator for object with a kind of ${input.kind}. Known iterators: ${Object.keys(iterators).join(', ')}`);
    };
}
exports.combineIteratorMap = combineIteratorMap;
function passThroughIterator(key) {
    return f => input => (Object.assign(Object.assign({}, input), { [key]: f(input[key]) }));
}
exports.passThroughIterator = passThroughIterator;
//# sourceMappingURL=iterators-core.js.map