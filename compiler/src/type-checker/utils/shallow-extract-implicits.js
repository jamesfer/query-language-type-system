"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowExtractImplicits = void 0;
function shallowExtractImplicits(value) {
    let body = value;
    const implicitParameters = [];
    while (body.kind === 'ImplicitFunctionLiteral') {
        implicitParameters.push(body.parameter);
        body = body.body;
    }
    return [body, implicitParameters];
}
exports.shallowExtractImplicits = shallowExtractImplicits;
//# sourceMappingURL=shallow-extract-implicits.js.map