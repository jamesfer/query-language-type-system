"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unique_id_generator_1 = require("../utils/unique-id-generator");
const constructors_1 = require("./constructors");
const type_check_1 = require("./type-check");
describe('typeExpression', () => {
    // The behaviour of this test case was changed due to the need to not simplify applications when
    // the callee is a free variable
    it.skip('infers the type of the callee to be a function', () => {
        const { state: [_, replacements] } = type_check_1.typeExpression(unique_id_generator_1.uniqueIdStream())(constructors_1.scope())(constructors_1.apply('M', ['t']));
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