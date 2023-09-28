"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collapseInferredTypes = void 0;
const Array_1 = require("fp-ts/Array");
const function_1 = require("fp-ts/function");
const Option_1 = require("fp-ts/Option");
const Record_1 = require("fp-ts/Record");
const adhoc_reduce_1 = require("../../utils/adhoc-reduce");
const assert_1 = require("../../utils/assert");
const converge_values_1 = require("../converge-values");
const inferred_type_1 = require("../types/inferred-type");
const shallow_strip_implicits_1 = require("../utils/shallow-strip-implicits");
// Old algorithm
// // Remove implicits from the existing value if needed
// const existingValue = stripImplicitsIfNeeded(existing);
// if (existingValue.kind === 'FreeVariable') {
//   return [{ ...next, from: existingValue.name }];
// }
//
// // Remove implicits from the next value if needed
// const nextValue = stripImplicitsIfNeeded(next);
// if (nextValue.kind === 'FreeVariable') {
//   return [{ ...next, kind: existing.kind, from: nextValue.name, to: existing.to }];
// }
//
// // Converge the values and expect every other relationship to be exact
// return convergeValues(
//   messageState,
//   existingValue,
//   existing.sources[existing.sources.length - 1].inferrer,
//   nextValue,
//   next.inferrer,
// ).map(({ from, to, originatingExpression, inferringExpression }): InferredType => ({
//   from,
//   to,
//   kind: 'Equals',
//   origin: originatingExpression,
//   inferrer: inferringExpression,
// }));
// function stripImplicitsIfNeeded(type: CollapsedInferredType): Value {
//   return type.kind === 'Evaluated' ? shallowStripImplicits(type.to) : type.to;
// }
function performValueConverge(messageState, existingValue, existingExpression, nextValue, nextExpression) {
    return function_1.pipe(converge_values_1.convergeValues(messageState, existingValue, existingExpression, nextValue, nextExpression), 
    // TODO need to include the sources from the existing and next inferred types
    Array_1.map(({ from, to, originatingExpression, inferringExpression }) => (inferred_type_1.makeInferredType('Equals', from, to, originatingExpression, inferringExpression))), Array_1.map(inferred_type_1.makeCollapsedInferredType));
}
/**
 * This is the most complex part of the typing algorithm.
 *
 * x exact ...
 * x exact ...
 * -> Converge ...
 *
 * x evaluated implicit y -> ...
 * x exact ...
 * -> Converge ...
 *
 * x exact implicit y -> ...
 * x evaluated ...
 * -> Converge ...
 */
const convergeCollapsedType = (messageState, next) => (existing) => {
    assert_1.assert(next.sources.length > 0, 'Tried to combine a new inferred type that has no sources');
    assert_1.assert(existing.sources.length > 0, 'Tried to combine an existing inferred type that has no sources');
    switch (existing.operator) {
        case 'Equals':
            switch (next.operator) {
                case 'Equals':
                    // converge
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                case 'EvaluatesTo': {
                    // strip implicits from existing
                    // if existing is freeVariable, then (existing.name evaluatesTo next.value)
                    // else converge
                    const existingValue = shallow_strip_implicits_1.shallowStripImplicits(existing.to);
                    if (existingValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: existingValue.name,
                                to: next.to,
                                sources: [
                                    ...existing.sources,
                                    ...next.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existingValue, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                }
                case 'EvaluatedFrom': {
                    // strip implicits from next
                    // if next is freeVariable, then (next.name evaluatesTo existing.value)
                    // else converge
                    const nextValue = shallow_strip_implicits_1.shallowStripImplicits(next.to);
                    if (nextValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: nextValue.name,
                                to: existing.to,
                                sources: [
                                    ...next.sources,
                                    ...existing.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, nextValue, next.sources[next.sources.length - 1].inferrer);
                }
                default:
                    return function_1.absurd(next.operator);
            }
        case 'EvaluatesTo':
            switch (next.operator) {
                case 'Equals': {
                    // strip implicits from next
                    // if next is freeVariable, then (next.name evaluatesTo existing.value)
                    // else converge
                    const nextValue = shallow_strip_implicits_1.shallowStripImplicits(next.to);
                    if (nextValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: nextValue.name,
                                to: existing.to,
                                sources: [
                                    ...next.sources,
                                    ...existing.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, nextValue, next.sources[next.sources.length - 1].inferrer);
                }
                case 'EvaluatesTo':
                    // converge
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                case 'EvaluatedFrom': {
                    // strip implicits from next
                    // if next is freeVariable, then (next.name evaluatesTo existing.value)
                    // else converge
                    const nextValue = shallow_strip_implicits_1.shallowStripImplicits(next.to);
                    if (nextValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: nextValue.name,
                                to: existing.to,
                                sources: [
                                    ...next.sources,
                                    ...existing.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, nextValue, next.sources[next.sources.length - 1].inferrer);
                }
                default:
                    return function_1.absurd(next.operator);
            }
        case 'EvaluatedFrom':
            switch (next.operator) {
                case 'Equals': {
                    // strip implicits from existing
                    // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
                    // else converge
                    const existingValue = shallow_strip_implicits_1.shallowStripImplicits(existing.to);
                    if (existingValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: existingValue.name,
                                to: next.to,
                                sources: [
                                    ...existing.sources,
                                    ...next.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existingValue, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                }
                case 'EvaluatesTo': {
                    // strip implicits from existing
                    // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
                    // else converge
                    const existingValue = shallow_strip_implicits_1.shallowStripImplicits(existing.to);
                    if (existingValue.kind === 'FreeVariable') {
                        return [{
                                operator: 'EvaluatesTo',
                                from: existingValue.name,
                                to: next.to,
                                sources: [
                                    ...existing.sources,
                                    ...next.sources,
                                ],
                            }];
                    }
                    return performValueConverge(messageState, existingValue, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                }
                case 'EvaluatedFrom':
                    // converge
                    return performValueConverge(messageState, existing.to, existing.sources[existing.sources.length - 1].inferrer, next.to, next.sources[next.sources.length - 1].inferrer);
                default:
                    return function_1.absurd(next.operator);
            }
        default:
            return function_1.absurd(existing.operator);
    }
};
function appendNewInferredType(existing, nextType) {
    return Object.assign(Object.assign({}, existing), { [nextType.from]: nextType });
}
function isExactMirror(inferredType) {
    return inferredType.operator === 'Equals'
        && inferredType.to.kind === 'FreeVariable'
        && inferredType.to.name === inferredType.from;
}
const combineCollapsedTypes = (messageState) => (allTypes, nextType) => {
    if (isExactMirror(nextType)) {
        // Ignore inferred types that are exactly recursive. These types are always true and don't need
        // to be checked.
        return [allTypes, []];
    }
    return function_1.pipe(allTypes, Record_1.lookup(nextType.from), Option_1.fold(() => [appendNewInferredType(allTypes, nextType), []], function_1.flow(convergeCollapsedType(messageState, nextType), inferredTypes => [allTypes, inferredTypes])));
};
function collapseInferredTypes(messageState, inferredTypes) {
    return adhoc_reduce_1.adhocReduce({}, inferredTypes.map(inferred_type_1.makeCollapsedInferredType), combineCollapsedTypes(messageState));
}
exports.collapseInferredTypes = collapseInferredTypes;
//# sourceMappingURL=collapse-inferred-types.js.map