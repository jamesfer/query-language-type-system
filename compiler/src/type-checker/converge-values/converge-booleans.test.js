"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const converge_booleans_1 = require("./converge-booleans");
describe('convergeBooleans', () => {
    describe.each(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
        let messageState;
        const state = {
            direction,
            leftExpression: constructors_1.identifier('leftExpression'),
            leftEntireValue: constructors_1.freeVariable('left'),
            rightExpression: constructors_1.identifier('rightExpression'),
            rightEntireValue: constructors_1.freeVariable('right'),
        };
        beforeEach(() => {
            messageState = new state_recorder_1.StateRecorder();
        });
        it('returns no messages when booleans are equal', () => {
            expect(converge_booleans_1.convergeBooleans(messageState, state, constructors_1.booleanLiteral(true), constructors_1.booleanLiteral(true))).toEqual([]);
            expect(messageState.values).toEqual([]);
        });
        it('returns a message when booleans are not equal', () => {
            expect(converge_booleans_1.convergeBooleans(messageState, state, constructors_1.booleanLiteral(true), constructors_1.booleanLiteral(false))).toEqual([]);
            expect(messageState.values).toEqual([expect.any(String)]);
        });
    });
});
//# sourceMappingURL=converge-booleans.test.js.map