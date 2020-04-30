"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const __1 = require("../..");
const api_1 = require("../../api");
describe('removeUnusedBindings', () => {
    it('removes binding expressions that are not used', () => {
        const result = api_1.compile(dedent_js_1.default `
      let a = 1
      let b = 2
      a
    `);
        expect(result.node).toBeDefined();
        if (result.node) {
            const expected = {
                kind: 'BindingExpression',
                name: 'a',
                value: {
                    kind: 'NumberExpression',
                    value: 1,
                },
                body: {
                    kind: 'Identifier',
                    name: 'a',
                },
            };
            expect(__1.stripNode(result.node)).toEqual(expected);
        }
    });
});
//# sourceMappingURL=remove-unused-bindings.test.js.map