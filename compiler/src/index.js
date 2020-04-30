"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var tokenize_1 = require("./parser/tokenize");
exports.tokenize = tokenize_1.default;
exports.TokenKind = tokenize_1.TokenKind;
tslib_1.__exportStar(require("./api"), exports);
// export * from './cli';
tslib_1.__exportStar(require("./type-checker/strip-nodes"), exports);
tslib_1.__exportStar(require("./backend/javascript/generate-javascript"), exports);
tslib_1.__exportStar(require("./type-checker/types/node"), exports);
//# sourceMappingURL=index.js.map