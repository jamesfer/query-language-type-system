"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueIdStream = void 0;
function uniqueIdStream() {
    let counter = 0;
    return prefix => `${prefix !== null && prefix !== void 0 ? prefix : ''}${++counter}`;
}
exports.uniqueIdStream = uniqueIdStream;
//# sourceMappingURL=unique-id-generator.js.map