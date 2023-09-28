"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const converge_free_variable_on_left_1 = require("./converge-free-variable-on-left");
describe('convergeFreeVariableOnLeft', () => {
    let messageState;
    const partialState = {
        leftExpression: constructors_1.identifier('leftExpression'),
        leftEntireValue: constructors_1.freeVariable('left'),
        rightExpression: constructors_1.identifier('rightExpression'),
        rightEntireValue: constructors_1.freeVariable('right'),
    };
    beforeEach(() => {
        messageState = new state_recorder_1.StateRecorder();
    });
    describe.each(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
        const state = Object.assign(Object.assign({}, partialState), { direction });
        it('returns nothing if both sides are the same free variable', () => {
            expect(converge_free_variable_on_left_1.convergeFreeVariableOnLeft(messageState, state, constructors_1.freeVariable('x'), constructors_1.freeVariable('x'))).toEqual([]);
            expect(messageState.values).toEqual([]);
        });
    });
    describe('when the right is a different value', () => {
        const right = constructors_1.numberLiteral(7);
        it('converges if the direction is either', () => {
            const state = Object.assign(Object.assign({}, partialState), { direction: 'either' });
            expect(converge_free_variable_on_left_1.convergeFreeVariableOnLeft(messageState, state, constructors_1.freeVariable('x'), right)).toEqual([expect.objectContaining({
                    from: 'x',
                    to: right,
                })]);
            expect(messageState.values).toEqual([]);
        });
        it('returns an error message if the direction is not either', () => {
            const state = Object.assign(Object.assign({}, partialState), { direction: 'leftSpecific' });
            expect(converge_free_variable_on_left_1.convergeFreeVariableOnLeft(messageState, state, constructors_1.freeVariable('x'), right)).toEqual([]);
            expect(messageState.values).toEqual([expect.any(String)]);
        });
    });
});
//# sourceMappingURL=converge-free-variable-on-left.test.js.map