"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveImplicits = void 0;
const function_1 = require("fp-ts/function");
const Array_1 = require("fp-ts/Array");
const iterators_specific_1 = require("../../desugar/iterators-specific");
const collapse_inferred_types_1 = require("../compress-inferred-types/collapse-inferred-types");
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const inferred_type_1 = require("../types/inferred-type");
const utils_1 = require("../utils");
const select_implicit_parameters_1 = require("../utils/select-implicit-parameters");
const visitor_utils_1 = require("../visitor-utils");
const find_matching_implementation_1 = require("./find-matching-implementation");
/**
 * In a very simple algorithm, finds the implicits of `currentValue` that need to be resolved for it to match
 * `expectedType`. It does this by counting the number of implicits in each value and returning the first `n`
 * implicits from `currentValue` so that it has the same number as `expectedType`.
 */
function findImplicitsToResolve(decoration) {
    const expectedParameters = select_implicit_parameters_1.selectImplicitParameters(decoration.shape);
    const actualParameters = select_implicit_parameters_1.selectImplicitParameters(decoration.type);
    return actualParameters.slice(0, Math.max(0, actualParameters.length - expectedParameters.length));
}
function isValidCombination(implicitsToResolve, combination) {
    const messageState = new state_recorder_1.StateRecorder();
    const origin = constructors_1.identifier('__resolve_implicits_origin__');
    const inferrer = constructors_1.identifier('__resolve_implicits_inferrer__');
    const pairs = function_1.pipe(Array_1.zip(implicitsToResolve, combination), Array_1.map(Array_1.zip(['Equals', 'EvaluatedFrom'])), Array_1.chainWithIndex((index, pair) => Array_1.zip([index, index], pair)), Array_1.map(([index, [to, operator]]) => inferred_type_1.makeInferredType(operator, `v${index}`, to, origin, inferrer)));
    collapse_inferred_types_1.collapseInferredTypes(messageState, pairs);
    return messageState.values.length === 0;
}
function findAllMatchingImplementationsFor(state, implicitsToResolve, scope) {
    if (implicitsToResolve.length === 0) {
        return [];
    }
    // Find all possible implementation values for these implicits
    const possibleImplementations = implicitsToResolve.map(implicit => find_matching_implementation_1.findMatchingImplementations(scope, implicit));
    // Perform cartesian product of all the possible implementations
    const possibleImplementationCombinations = utils_1.permuteArrays(possibleImplementations);
    // Remove any that have conflicting binds
    const validCombinations = possibleImplementationCombinations.filter((combination) => (isValidCombination(implicitsToResolve, combination.map(([, value]) => value))));
    // If there is more than one possible set of replacements for a implicit parameter, that parameter is ambiguous
    if (validCombinations.length > 1) {
        state.push(`Implicits were ambiguous. ${validCombinations.length} possible sets of values found for ${implicitsToResolve.length} implicits`);
        return [];
    }
    // If there are no possibilities then the implicits are unresolvable
    if (validCombinations.length === 0) {
        state.push('Could not find a valid set of replacements for implicits');
        return [];
    }
    return validCombinations[0];
}
function trimFirstImplicitParameters(type) {
    return type.kind === 'ImplicitFunctionLiteral' ? type.body : type;
}
function applyImplicitParameters(baseNode) {
    const { scope, resolvedImplicits } = baseNode.decoration;
    return resolvedImplicits.reduceRight((callee, [parameter, type]) => {
        return constructors_1.node({
            callee,
            kind: 'Application',
            parameter: constructors_1.node(constructors_1.identifier(parameter), { scope, type, resolvedImplicits: [] }),
        }, {
            scope,
            type: trimFirstImplicitParameters(callee.decoration.type),
            resolvedImplicits: [],
        });
    }, baseNode);
}
const resolveImplicitsFor = (state) => (node) => {
    const implicitsToResolve = findImplicitsToResolve(node.decoration);
    const matchingImplementations = findAllMatchingImplementationsFor(state, implicitsToResolve, node.decoration.scope);
    return applyImplicitParameters(Object.assign(Object.assign({}, node), { decoration: {
            scope: node.decoration.scope,
            type: node.decoration.type,
            resolvedImplicits: matchingImplementations,
        } }));
};
function resolveImplicits(node) {
    const state = new state_recorder_1.StateRecorder();
    const internal = (node) => resolveImplicitsFor(state)(visitor_utils_1.mapNode(iterator, node));
    const iterator = iterators_specific_1.makeExpressionIterator(internal);
    const result = internal(node);
    return [state.values, result];
}
exports.resolveImplicits = resolveImplicits;
//# sourceMappingURL=index.js.map