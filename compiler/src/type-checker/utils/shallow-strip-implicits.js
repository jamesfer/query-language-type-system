"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowStripImplicits = void 0;
function shallowStripImplicits(value) {
    return value.kind === 'ImplicitFunctionLiteral' ? shallowStripImplicits(value.body) : value;
}
exports.shallowStripImplicits = shallowStripImplicits;
//# sourceMappingURL=shallow-strip-implicits.js.map