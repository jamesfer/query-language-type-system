"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const converge_values_1 = require("./converge-values");
describe('convergeValues', () => {
    let messageState;
    function converge(left, right) {
        return converge_values_1.convergeValues(messageState, left, { kind: 'Identifier', name: 'A' }, right, { kind: 'Identifier', name: 'B' });
    }
    beforeEach(() => {
        messageState = new state_recorder_1.StateRecorder();
    });
    it('converges two of the exact same value', () => {
        expect(converge(constructors_1.booleanLiteral(true), constructors_1.booleanLiteral(true))).toEqual([]);
        expect(messageState.values).toEqual([]);
    });
    it('emits a message when the values do not converge', () => {
        expect(converge(constructors_1.booleanLiteral(false), constructors_1.booleanLiteral(true))).toEqual([]);
        expect(messageState.values).toEqual([expect.any(String)]); // TODO better assertion
    });
    it('allows functions to converge', () => {
        expect(converge(constructors_1.functionType(constructors_1.freeVariable('a'), [constructors_1.booleanLiteral(true)]), constructors_1.functionType(constructors_1.numberLiteral(7), [constructors_1.freeVariable('b')]))).toEqual(expect.arrayContaining([
            expect.objectContaining({ from: 'a', to: constructors_1.numberLiteral(7) }),
            expect.objectContaining({ from: 'b', to: constructors_1.booleanLiteral(true) }),
        ]));
        expect(messageState.values).toEqual([]);
    });
    describe('when converging implicit functions', () => {
        function convergeWithShape(other) {
            return converge(constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.freeVariable('x')]), true], constructors_1.freeVariable('x')]), other);
        }
        it('allows functions with matching implicits to converge', () => {
            expect(convergeWithShape(constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.freeVariable('y')]), true], constructors_1.freeVariable('y')]))).toContainEqual(expect.objectContaining({
                from: 'y',
                to: constructors_1.freeVariable('x'),
            }));
            expect(messageState.values).toEqual([]);
        });
        it('prevents functions with missing implicits to converge', () => {
            expect(convergeWithShape(constructors_1.functionType(constructors_1.booleanLiteral(true), [constructors_1.numberLiteral(7)]))).toEqual([]);
            expect(messageState.values).toEqual([expect.any(String)]);
        });
        it('prevents a function with a more specific implicit parameter from converging', () => {
            convergeWithShape(constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.numberLiteral(7)]), true], constructors_1.numberLiteral(7)]));
            expect(messageState.values).toEqual([expect.any(String)]);
        });
        it('infers a variable type containing an implicit parameter', () => {
            expect(convergeWithShape(constructors_1.freeVariable('p'))).toContainEqual(expect.objectContaining({
                from: 'p',
                to: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.freeVariable('x')]), true], constructors_1.freeVariable('x')]),
            }));
            expect(messageState.values).toHaveLength(0);
        });
    });
    describe('when converging complex types', () => {
        it('nested implicit args are not accepted', () => {
            converge(constructors_1.recordLiteral({ go: constructors_1.functionType(constructors_1.booleanLiteral(true), [constructors_1.numberLiteral(7)]) }), constructors_1.recordLiteral({ go: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.numberLiteral(7), true], constructors_1.numberLiteral(7)]) }));
            expect(messageState.values).toEqual([expect.any(String)]);
        });
        it.skip('more specific nested implicit args are accepted', () => {
            converge(constructors_1.recordLiteral({
                go: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.freeVariable('x')]), true], constructors_1.numberLiteral(7)]),
            }), constructors_1.recordLiteral({
                go: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.numberLiteral(7)]), true], constructors_1.numberLiteral(7)]),
            }));
            expect(messageState.values).toEqual([]);
        });
        it('less specific nested implicit args are accepted', () => {
            converge(constructors_1.recordLiteral({
                go: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.numberLiteral(7)]), true], constructors_1.numberLiteral(7)]),
            }), constructors_1.recordLiteral({
                go: constructors_1.functionType(constructors_1.booleanLiteral(true), [[constructors_1.dataValue('Num', [constructors_1.freeVariable('x')]), true], constructors_1.numberLiteral(7)]),
            }));
            expect(messageState.values).toEqual([]);
        });
    });
});
//# sourceMappingURL=converge-values.test.js.map