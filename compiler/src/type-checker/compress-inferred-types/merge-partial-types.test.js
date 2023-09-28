"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge_partial_types_1 = require("./merge-partial-types");
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
function swapOrder(left, right) {
    return [
        ['default order', [left, right]],
        ['swapped order', [right, left]],
    ];
}
describe('mergePartialTypes', () => {
    const defaultSource = {
        from: 'a',
        operator: 'Equals',
        to: constructors_1.numberLiteral(1),
        inferrer: constructors_1.identifier('testIdentifier'),
        origin: constructors_1.identifier('testIdentifier'),
    };
    let messageState;
    let assumptionsState;
    beforeEach(() => {
        messageState = new state_recorder_1.StateRecorder();
        assumptionsState = new state_recorder_1.StateRecorder();
    });
    it('successfully merges two identical relationships', () => {
        const aEquals1 = {
            from: 'a',
            operator: 'Equals',
            to: constructors_1.numberLiteral(1),
            sources: [defaultSource],
        };
        expect(merge_partial_types_1.mergePartialTypes(messageState, assumptionsState, aEquals1, aEquals1)).toEqual({
            operator: 'Equals',
            to: constructors_1.numberLiteral(1),
        });
        expect(messageState.values).toEqual([]);
        expect(assumptionsState.values).toEqual([]);
    });
    describe('when merging types with identical concrete parts', () => {
        const aEqualsImplicitFunction = {
            from: 'a',
            operator: 'Equals',
            to: constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(2), true]]),
            sources: [defaultSource],
        };
        const aEvaluatesTo1 = {
            from: 'a',
            operator: 'EvaluatesTo',
            to: constructors_1.numberLiteral(1),
            sources: [defaultSource],
        };
        it.each(swapOrder(aEqualsImplicitFunction, aEvaluatesTo1))('retains implicit parameters when given in %s', (_, [left, right]) => {
            expect(merge_partial_types_1.mergePartialTypes(messageState, assumptionsState, left, right)).toEqual({
                operator: 'Equals',
                to: constructors_1.functionType(constructors_1.numberLiteral(1), [[constructors_1.numberLiteral(2), true]]),
            });
            expect(messageState.values).toEqual([]);
            expect(assumptionsState.values).toEqual([]);
        });
    });
    // it('retains implicit parameters when concrete parts need inferring', () => {
    //   const existing: CollapsedInferredType = {
    //     from: 'a',
    //     operator: 'Equals',
    //     to: functionType(freeVariable('b'), [[numberLiteral(2), true]]),
    //     sources: [defaultSource],
    //   };
    //   const next: CollapsedInferredType = {
    //     from: 'a',
    //     operator: 'EvaluatesTo',
    //     to: numberLiteral(1),
    //     sources: [defaultSource],
    //   };
    //   expect(mergeTypeRelations(messageState, next)(existing)).toEqual([
    //     {
    //       from: 'b',
    //       operator: 'EvaluatesTo',
    //       to: numberLiteral(1),
    //       sources: expect.any(Array),
    //     },
    //   ]);
    //   expect(messageState.values).toEqual([]);
    // });
});
//# sourceMappingURL=merge-partial-types.test.js.map