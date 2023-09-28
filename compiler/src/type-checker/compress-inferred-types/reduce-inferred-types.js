"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceInferredTypes = void 0;
const Either_1 = require("fp-ts/Either");
const function_1 = require("fp-ts/function");
const Option_1 = require("fp-ts/Option");
const Record_1 = require("fp-ts/Record");
const Tuple_1 = require("fp-ts/Tuple");
const adhoc_reduce_1 = require("../../utils/adhoc-reduce");
const state_recorder_1 = require("../state-recorder/state-recorder");
const inferred_type_1 = require("../types/inferred-type");
const merge_partial_types_1 = require("./merge-partial-types");
function isExactMirror(inferredType) {
    return inferredType.operator === 'Equals'
        && inferredType.to.kind === 'FreeVariable'
        && inferredType.to.name === inferredType.from;
}
function buildInferredTypesFromAssumptions(assumptions, existingSources, nextSources) {
    return assumptions.map((assumption) => {
        const sources = Either_1.isLeft(assumption)
            ? [...nextSources, ...existingSources]
            : [...existingSources, ...nextSources];
        const { from, operator, to } = Either_1.toUnion(assumption);
        return { from, operator, to, sources };
    });
}
function toPartialType({ operator, to }) {
    return { operator, to };
}
function mergePartialTypesWithAssumptions(messageState, existing, next) {
    const assumptionsState = new state_recorder_1.StateRecorder();
    const mergedPartialType = merge_partial_types_1.mergePartialTypes(messageState, assumptionsState, toPartialType(existing), toPartialType(next));
    const newInferredTypes = buildInferredTypesFromAssumptions(assumptionsState.values, existing.sources, next.sources);
    return [mergedPartialType, newInferredTypes];
}
function wrapped(messageState, existing, next) {
    const [l, r] = mergePartialTypesWithAssumptions(messageState, existing, next);
    // messageState.push(
    //   `$${existing.from}: ${existing.operator} -> ${JSON.stringify(existing.to)}       &       ${next.operator} -> ${JSON.stringify(next.to)}          =          ${l.operator} -> ${JSON.stringify(l.to)}         given         ${r.map(x => `${x.from} -> ${x.operator} -> ${JSON.stringify(x.to)}`).join('   ,   ')}`
    // );
    return [l, r];
}
const mergeCollapsedTypes = (messageState) => (next) => (existing) => {
    return function_1.pipe(wrapped(messageState, existing, next), Tuple_1.mapFst((mergedPartialType) => (Object.assign(Object.assign({}, mergedPartialType), { from: existing.from, sources: [...existing.sources, ...next.sources] }))));
};
const applyCollapsedType = (messageState) => (allTypes, nextType) => {
    if (isExactMirror(nextType)) {
        // Ignore inferred types that are exactly recursive. These types are always true and don't need
        // to be checked.
        return [allTypes, []];
    }
    return function_1.pipe(allTypes, Record_1.lookup(nextType.from), Option_1.fold(() => [nextType, []], mergeCollapsedTypes(messageState)(nextType)), Tuple_1.mapFst(newType => (Object.assign(Object.assign({}, allTypes), { [newType.from]: newType }))));
};
function reduceInferredTypes(messageState, inferredTypes) {
    return adhoc_reduce_1.adhocReduce({}, inferredTypes.map(inferred_type_1.makeCollapsedInferredType), applyCollapsedType(messageState));
}
exports.reduceInferredTypes = reduceInferredTypes;
//# sourceMappingURL=reduce-inferred-types.js.map