"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const converge_strings_1 = require("./converge-strings");
describe('convergeStrings', () => {
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
        it('returns no messages when strings are equal', () => {
            expect(converge_strings_1.convergeStrings(messageState, state, constructors_1.stringLiteral('hello'), constructors_1.stringLiteral('hello'))).toEqual([]);
            expect(messageState.values).toEqual([]);
        });
        it('returns a message when strings are not equal', () => {
            expect(converge_strings_1.convergeStrings(messageState, state, constructors_1.stringLiteral('hello'), constructors_1.stringLiteral('hEllo'))).toEqual([]);
            expect(messageState.values).toEqual([expect.any(String)]);
        });
    });
});
//# sourceMappingURL=converge-strings.test.js.map