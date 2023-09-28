"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const converge_free_variable_on_right_1 = require("./converge-free-variable-on-right");
describe('convergeFreeVariableOnRight', () => {
    describe.each(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
        const state = {
            direction,
            leftExpression: constructors_1.identifier('leftExpression'),
            leftEntireValue: constructors_1.freeVariable('left'),
            rightExpression: constructors_1.identifier('rightExpression'),
            rightEntireValue: constructors_1.freeVariable('right'),
        };
        it('returns nothing if both sides are the same free variable', () => {
            expect(converge_free_variable_on_right_1.convergeFreeVariableOnRight(state, constructors_1.freeVariable('x'), constructors_1.freeVariable('x'))).toEqual([]);
        });
        it.skip('returns an inferred type if the left is anything else', () => {
            const [messages, inferredTypes] = converge_free_variable_on_right_1.convergeFreeVariableOnRight(state, constructors_1.numberLiteral(7), constructors_1.freeVariable('x'));
            expect(messages).toEqual([]);
            expect(inferredTypes).toEqual([expect.objectContaining({
                    from: 'x',
                    to: constructors_1.numberLiteral(7),
                })]);
        });
    });
});
//# sourceMappingURL=converge-free-variable-on-right.test.js.map