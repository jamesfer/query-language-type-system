"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const api_1 = require("../../api");
const unique_id_generator_1 = require("../../utils/unique-id-generator");
const generate_cpp_1 = require("./generate-cpp");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
function toCpp(code) {
    const result = api_1.compile(code);
    return result.node
        ? generate_cpp_1.generateCpp(unique_id_generator_1.uniqueIdStream(), result.node)
        : undefined;
}
describe('generateCpp', () => {
    it('translates a simple expression', () => {
        expect(toCpp('"Hello"')).toBe(dedent_js_1.default `
      int main() {
          "Hello";
      }
    `);
    });
    it('extracts anonymous functions', () => {
        const result = toCpp(dedent_js_1.default `
      let f = a -> a
      f 1
    `);
        expect(result).toBe(dedent_js_1.default `
      int main() {
          double f = [](double a$rename$25) -> {
              return a$rename$25;
          };
          f(1);
      }
    `);
    });
});
//# sourceMappingURL=generate-cpp.test.js.map