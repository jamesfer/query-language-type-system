"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSuite = void 0;
const tslib_1 = require("tslib");
const benchmark_1 = require("benchmark");
const parse_1 = tslib_1.__importDefault(require("./parse"));
exports.parseSuite = new benchmark_1.Suite('parse');
exports.parseSuite.add('large function', () => {
    parse_1.default('a -> b -> c -> d -> e -> f -> g -> h -> 1');
});
exports.parseSuite.add('data function', () => {
    parse_1.default('data T = implicit a, b, c\n5');
});
exports.parseSuite.add('many bindings', () => {
    parse_1.default(`data String
data Maybe = a
data Some = t
let go = implicit Maybe m -> m -> 5
let a = Some String
go a`);
});
//# sourceMappingURL=parse.benchmark.js.map