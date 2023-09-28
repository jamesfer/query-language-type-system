"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tapFirst = void 0;
/**
 * Wraps a function that modifies it's first argument in a new function that will return that first argument after
 * it has been modified. Very useful for `reduce()` iteratees that want to modify the accumulator.
 */
function tapFirst(f) {
    return (first, ...args) => {
        f(first, ...args);
        return first;
    };
}
exports.tapFirst = tapFirst;
//# sourceMappingURL=tap-first.js.map