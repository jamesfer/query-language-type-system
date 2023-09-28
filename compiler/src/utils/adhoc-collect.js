"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adhocCollect = void 0;
function adhocCollect(initial, f) {
    let next = initial;
    const accumulator = [];
    while (true) {
        const result = f(next);
        if (result.length === 0) {
            break;
        }
        next = result[0];
        accumulator.push(result[1]);
    }
    return accumulator;
}
exports.adhocCollect = adhocCollect;
//# sourceMappingURL=adhoc-collect.js.map