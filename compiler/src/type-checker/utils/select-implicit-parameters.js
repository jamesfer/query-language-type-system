"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectImplicitParameters = void 0;
const adhoc_collect_1 = require("../../utils/adhoc-collect");
function selectImplicitParameters(inputValue) {
    return adhoc_collect_1.adhocCollect(inputValue, value => (value.kind === 'ImplicitFunctionLiteral' ? [value.body, value.parameter] : []));
}
exports.selectImplicitParameters = selectImplicitParameters;
//# sourceMappingURL=select-implicit-parameters.js.map