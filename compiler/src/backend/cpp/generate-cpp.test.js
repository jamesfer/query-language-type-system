"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const api_1 = require("../../api");
const generate_cpp_1 = require("./generate-cpp");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
function toCpp(code) {
    const result = api_1.compile(code);
    return result.node
        ? generate_cpp_1.generateCpp(result.node)
        : undefined;
}
describe('generateCpp', () => {
    it('translates a simple expression', () => {
        expect(toCpp('"Hello"')).toBe(dedent_js_1.default `
      void main() {
          "Hello";
      }
    `);
    });
});
//# sourceMappingURL=generate-cpp.test.js.map