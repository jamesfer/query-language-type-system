"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripNode = void 0;
const visitor_utils_1 = require("./visitor-utils");
function stripNode(node) {
    return visitor_utils_1.visitAndTransformExpressionBefore(node => node.expression)(node);
}
exports.stripNode = stripNode;
//# sourceMappingURL=strip-nodes.js.map