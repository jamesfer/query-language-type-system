"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeSymbols = void 0;
const converge_utils_1 = require("./converge-utils");
function convergeSymbols(messageState, state, symbol, other) {
    return other.kind === 'SymbolLiteral' && other.name === symbol.name
        ? []
        : converge_utils_1.mismatchResult(messageState, state, symbol, other);
}
exports.convergeSymbols = convergeSymbols;
//# sourceMappingURL=converge-symbols.js.map