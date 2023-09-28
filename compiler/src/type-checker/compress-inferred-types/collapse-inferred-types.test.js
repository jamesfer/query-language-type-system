"use strict";
// Test cases
Object.defineProperty(exports, "__esModule", { value: true });
// a exactly x -> y
// a evaluated impl w -> x -> y
// pass
// a exactly impl w -> x -> y
// a evaluated impl w -> x -> y
// fail
// a exactly n
// n exactly impl w -> x -> y
// a = impl w -> x -> y
// a evaluated n
// n exactly impl w -> x -> y
// a = x -> y
// a evaluated n
// n exactly impl w -> x -> y
// a exactly x -> y
// pass
// We can just apply replacements to all types as soon as they join the reduced stack because their
// values are dependent on the relationship. If we have `a evaluated n`, we can't replace all the
// a's with n's because we lose the fact that those a's need to be the evaluated result of n.
// What we leave applying all the replacements until the last minute. Instead, when we are
// converging values, we can just assume that identifiers with the same name will be identical. We
// don't need to apply those replacements. When doing this we need to perform another check that
// the implicits are the same. If we have `a evaluated n` and `a exactly n`. When the actual value
// for n is inserted, we need to check that it doesn't come with implicits as that would be
// forbidden in this example. This check would also need to work in the scenario of
// `a evaluated impl w -> n` and `a exactly n`. `n` here needs to have no implicits. in the scenario
// of `a evaluated impl w -> n` and `a evaluated n`, `n` could have any implicits.
// `a evaluated x`, `a exactly y`, we guess the value of y in `y evaluated x`
// `a exactly x`, `a exactly y`, we guess the value of y in `y exactly x`
// `a evaluated x`, `a evaluated y`, we can't guess the value of y because it could be
// `y evaluated x` or `x evaluated y`.
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const inferred_type_1 = require("../types/inferred-type");
const collapse_inferred_types_1 = require("./collapse-inferred-types");
function inferredType(from, kind, to) {
    return inferred_type_1.makeInferredType(kind, from, to, constructors_1.identifier('origin'), constructors_1.identifier('inferrer'));
}
describe('collapseInferredTypes', () => {
    let messageState;
    beforeEach(() => {
        messageState = new state_recorder_1.StateRecorder();
    });
    it('collapses relationships with compatible plain values', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails relationships with incompatible plain values', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(1), h: constructors_1.numberLiteral(2) })),
            inferredType('d', 'Equals', constructors_1.recordLiteral({ g: constructors_1.numberLiteral(2), h: constructors_1.numberLiteral(1) })),
        ]);
        expect(messageState.values).toEqual([expect.any(String), expect.any(String)]);
    });
    it('collapses an exact relationship with an implicit evaluated one', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.freeVariable('b'), [constructors_1.freeVariable('a')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails on exact and evaluated relationships that are both implicit', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('b'), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('a')])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
    it('collapses an exact relationship with an implicit evaluated to a common free variable', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('collapses an evaluated relationship with exact one', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'EvaluatedFrom', constructors_1.freeVariable('a')),
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(123), [constructors_1.freeVariable('x')])),
            inferredType('a', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.freeVariable('y'), true], constructors_1.freeVariable('x')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('collapses an exact relationship with an implicit evaluated to an existing common free variable', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('a', 'Equals', constructors_1.numberLiteral(1)),
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails an exact relationship with an implicit evaluated to an incompatible existing common free variable', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('a', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.freeVariable('y'), true]])),
            inferredType('d', 'Equals', constructors_1.freeVariable('a')),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.freeVariable('a'), [[constructors_1.freeVariable('x'), true]])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
    it('collapses an evaluated relationship without implicits, with an exact relationship with implicits', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'EvaluatesTo', constructors_1.functionType(constructors_1.numberLiteral(1), [constructors_1.freeVariable('y')])),
            inferredType('d', 'Equals', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.freeVariable('x'), true], constructors_1.freeVariable('y')])),
        ]);
        expect(messageState.values).toEqual([]);
    });
    it('fails when two evaluated relationships have different implicits', () => {
        collapse_inferred_types_1.collapseInferredTypes(messageState, [
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(20), true], constructors_1.freeVariable('y')])),
            inferredType('d', 'EvaluatedFrom', constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(10), true], constructors_1.freeVariable('y')])),
        ]);
        expect(messageState.values).toEqual([expect.any(String)]);
    });
});
//# sourceMappingURL=collapse-inferred-types.test.js.map