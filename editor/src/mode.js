"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMode = exports.MODE_NAME = void 0;
const tslib_1 = require("tslib");
const codemirror_1 = require("codemirror");
const lodash_1 = require("lodash");
const highlighter_1 = tslib_1.__importDefault(require("./highlighter"));
exports.MODE_NAME = 'query-language';
exports.initializeMode = lodash_1.once(() => {
    codemirror_1.defineMode(exports.MODE_NAME, (config, options) => new highlighter_1.default(config, options));
});
//# sourceMappingURL=mode.js.map