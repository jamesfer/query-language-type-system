"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("./constructors");
const type_check_1 = require("./type-check");
const utils_1 = require("./utils");
describe('typeExpression', () => {
    // The behaviour of this test case was changed due to the need to not simplify applications when
    // the callee is a free variable
    it.skip('infers the type of the callee to be a function', () => {
        const { state: [_, replacements] } = type_check_1.typeExpression(utils_1.uniqueIdStream())(constructors_1.scope())(constructors_1.apply('M', ['t']));
        const expectedReplacement = {
            from: 'M',
            to: {
                kind: 'FunctionLiteral',
                parameter: {
                    kind: 'FreeVariable',
                    name: expect.any(String),
                },
                body: {
                    kind: 'FreeVariable',
                    name: expect.any(String),
                },
            },
        };
        expect(replacements).toContainEqual(expectedReplacement);
    });
});
//# sourceMappingURL=type-expression.test.js.map