"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenElement = void 0;
function getGenElement(n, generator) {
    let i = 0;
    for (const element of generator) {
        if (i === n) {
            return [element];
        }
        i += 1;
    }
    return [];
}
exports.getGenElement = getGenElement;
//# sourceMappingURL=get-gen-element.js.map