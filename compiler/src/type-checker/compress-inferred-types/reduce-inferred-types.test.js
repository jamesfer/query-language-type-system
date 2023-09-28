"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const inferred_type_1 = require("../types/inferred-type");
const reduce_inferred_types_1 = require("./reduce-inferred-types");
function inferredType(from, kind, to) {
    return inferred_type_1.makeInferredType(kind, from, to, constructors_1.identifier('origin'), constructors_1.identifier('inferrer'));
}
describe('reduceInferredTypes', () => {
    let messageState;
    beforeEach(() => {
        messageState = new state_recorder_1.StateRecorder();
    });
    it('collapses relationships with compatible plain values', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails relationships with incompatible plain values', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(2), h: constructors_1.numberLiteral(1) })),
        ]);
        expect(messageState.values).toEqual([expect.any(String), expect.any(String)]);
    });
    it('collapses an exact relationship with an implicit evaluated one', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.freeVariable('b'), [constructors_1.freeVariable('a')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails on exact and evaluated relationships that are both implicit', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
    it('collapses an exact relationship with an implicit evaluated to a common free variable', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('collapses an evaluated relationship with exact one', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'EvaluatedFrom', constructors_1.freeVariable('a')),
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(123), [constructors_1.freeVariable('x')])),
            inferredType('a', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.freeVariable('y'), true], constructors_1.freeVariable('x')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('collapses an exact relationship with an implicit evaluated to an existing common free variable', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('a', 'Equals', constructors_1.numberLiteral(1)),
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails an exact relationship with an implicit evaluated to an incompatible existing common free variable', () => {
        const x = reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('a', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.freeVariable('y'), true]])),
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
    it('collapses an evaluated relationship without implicits, with an exact relationship with implicits', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'EvaluatesTo', constructors_1.functionType(constructors_1.numberLiteral(1), [constructors_1.freeVariable('y')])),
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('y')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails when two evaluated relationships have different implicits', () => {
        reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(20), true], constructors_1.freeVariable('y')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(10), true], constructors_1.freeVariable('y')])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
    it('xxx', () => {
        const result = reduce_inferred_types_1.reduceInferredTypes(messageState, [
            inferredType('a', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.freeVariable('y'), true], constructors_1.freeVariable('x')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.freeVariable('a')),
        ]);
        expect(result['d']).toEqual({
            operator: 'EvaluatedFrom',
            from: 'd',
            to: constructors_1.freeVariable('a'),
            sources: expect.anything(),
        });
    });
});
//# sourceMappingURL=reduce-inferred-types.test.js.map