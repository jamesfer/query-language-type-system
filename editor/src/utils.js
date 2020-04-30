"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function assertNever(x) {
    throw new Error(`Assert never was called with: ${x}`);
}
exports.assertNever = assertNever;
function catchErrors(f) {
    return (t) => {
        try {
            return [undefined, f(t)];
        }
        catch (error) {
            return [error];
        }
    };
}
exports.catchErrors = catchErrors;
//# sourceMappingURL=utils.js.map