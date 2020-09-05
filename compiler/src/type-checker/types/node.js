"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptionalDecorations = exports.getDecorations = exports.getDecoration = void 0;
function getDecoration(node) {
    return node.decoration;
}
exports.getDecoration = getDecoration;
function getDecorations(nodes) {
    return nodes.map(getDecoration);
}
exports.getDecorations = getDecorations;
function getOptionalDecorations(nodes) {
    return nodes.map(node => node ? getDecoration(node) : undefined);
}
exports.getOptionalDecorations = getOptionalDecorations;
//# sourceMappingURL=node.js.map