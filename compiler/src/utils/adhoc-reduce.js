"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adhocReduce = void 0;
function adhocReduce(accumulator, array, f) {
    let currentAccumulator = accumulator;
    let remaining = array;
    while (remaining.length > 0) {
        const next = remaining.shift();
        const [newAccumulator, newElements] = f(currentAccumulator, next);
        currentAccumulator = newAccumulator;
        remaining = [...newElements, ...remaining];
    }
    return currentAccumulator;
}
exports.adhocReduce = adhocReduce;
//# sourceMappingURL=adhoc-reduce.js.map