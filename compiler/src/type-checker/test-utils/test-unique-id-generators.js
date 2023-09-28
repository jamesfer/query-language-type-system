"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticUniqueIdGenerator = exports.prefixlessUniqueIdGenerator = void 0;
function prefixlessUniqueIdGenerator() {
    let i = 0;
    return () => {
        i += 1;
        return i.toString();
    };
}
exports.prefixlessUniqueIdGenerator = prefixlessUniqueIdGenerator;
function staticUniqueIdGenerator(values) {
    let i = -1;
    return () => {
        i += 1;
        if (i < values.length) {
            return values[i];
        }
        throw new Error(`Static unique id generator was only provided ${values.length} values`);
    };
}
exports.staticUniqueIdGenerator = staticUniqueIdGenerator;
//# sourceMappingURL=test-unique-id-generators.js.map