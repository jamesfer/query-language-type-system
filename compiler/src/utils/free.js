"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFree = exports.pipeFree = exports.traverseFree = exports.mapFree = exports.flatMapFree = exports.returningFree = exports.deferFree = exports.pureFree = void 0;
function pureFree(value) {
    return { value: value };
}
exports.pureFree = pureFree;
function deferFree(value) {
    return { child: pureFree(null), map: value };
}
exports.deferFree = deferFree;
function returningFree(f) {
    return (...args) => pureFree(f(...args));
}
exports.returningFree = returningFree;
function flatMapFree(child, map) {
    return { child, map };
}
exports.flatMapFree = flatMapFree;
function mapFree(child, map) {
    return { child, map: value => pureFree(map(value)) };
}
exports.mapFree = mapFree;
function traverseFree(inputs, f) {
    return inputs.reduce((collection, input) => flatMapFree(collection, array => (mapFree(f(input), value => [...array, value]))), pureFree([]));
}
exports.traverseFree = traverseFree;
function pipeFree(free, ...fs) {
    return fs.reduce(flatMapFree, free);
}
exports.pipeFree = pipeFree;
function runFree(free) {
    const queue = [];
    while (true) {
        if ('value' in free) {
            const nextInQueue = queue.pop();
            if (!nextInQueue) {
                return free.value;
            }
            free = nextInQueue(free.value);
        }
        else if ('child' in free) {
            queue.push(free.map);
            free = free.child;
        }
    }
}
exports.runFree = runFree;
//# sourceMappingURL=free.js.map