"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveImplicitParameters = void 0;
const constructors_1 = require("./constructors");
const implicit_utils_1 = require("./implicit-utils");
const scope_utils_1 = require("./scope-utils");
const type_utils_1 = require("./type-utils");
const utils_1 = require("./utils");
const visitor_utils_1 = require("./visitor-utils");
// function findImplementationFor(scope: Scope, parameter: Value): string | undefined {
//   const implementations = findMatchingImplementations(scope, parameter);
//   return implementations.length === 1 ? implementations[0].name : undefined;
// }
//
//
// function iterateExpression(expression: Expression<TypedNode>, type: Value): [Message[], Expression<TypedNode>] {
//   switch (expression.kind) {
//     case 'SymbolExpression':
//     case 'NumberExpression':
//     case 'BooleanExpression':
//     case 'Identifier':
//       return [[], expression];
//
//     case 'DataInstantiation': {
//       const [messagesArray = [], parameters = []] = unzip(
//         expression.parameters.map(strictResolveImplicitParameters),
//       );
//       const [calleeMessages, callee] = strictResolveImplicitParameters(expression.callee);
//       return [flatten([calleeMessages, ...messagesArray]), { ...expression, parameters, callee }];
//     }
//
//     case 'DualExpression': {
//       const [leftMessages, left] = strictResolveImplicitParameters(expression.left);
//       const [rightMessages, right] = strictResolveImplicitParameters(expression.right);
//       return [[...leftMessages, ...rightMessages], { ...expression, left, right }];
//     }
//
//     case 'Application': {
//       // console.log('Resolving application', JSON.stringify(expression.callee.decoration.scope.bindings.map(({ node, callee }) => ({ callee, value: stripNode(node) })), undefined, 2));
//       const [messagesArray, parameter] = strictResolveImplicitParameters(expression.parameter);
//       const [calleeMessages, callee] = strictResolveImplicitParameters(expression.callee);
//       return [flatten([...messagesArray, calleeMessages]), { ...expression, parameter, callee }];
//     }
//
//     case 'FunctionExpression': {
//       if (type.kind !== 'FunctionLiteral') {
//         throw new Error(`Not sure how to convert a function expression that does not have a function type. Actual: ${type.kind}`);
//       }
//
//       const [messages, body] = strictResolveImplicitParameters(expression.body);
//       return [messages, { ...expression, body }];
//     }
//
//     case 'RecordExpression': {
//       const [messages = {}, properties = {}] = unzipObject(mapValues(expression.properties, strictResolveImplicitParameters));
//       return [flatMap(messages), {
//         ...expression,
//         properties: properties,
//       }];
//     }
//
//     case 'BindingExpression': {
//       // Any implicits attached to the top level of the value cannot be resolved because they have
//       // still have some free variables in them. Instead we just want to resolve all the implicits
//       // lower down in the chain. After adding the requested implicits to the scope.
//       // TODO
//       const [valueMessages, value] = resolveImplicitParameters(expression.value, true);
//       const [bodyMessages, body] = strictResolveImplicitParameters(expression.body);
//       return [[...valueMessages, ...bodyMessages], {
//         ...expression,
//         value: value,
//         body: body,
//       }];
//     }
//
//     case 'ReadRecordPropertyExpression': {
//       const [messages, record] = strictResolveImplicitParameters(expression.record);
//       return [messages, {
//         ...expression,
//         record,
//       }];
//     }
//
//     case 'ReadDataPropertyExpression': {
//       const [messages, dataValue] = strictResolveImplicitParameters(expression.dataValue);
//       return [messages, {
//         ...expression,
//         dataValue,
//       }];
//     }
//
//     default:
//       return assertNever(expression);
//   }
// }
//
function getImplicitImplementations(scope, value) {
    // Find all the implicit parts of the type
    const [implicitParameters, result] = implicit_utils_1.extractImplicitsParameters(value);
    if (implicitParameters.length === 0) {
        return { result, implementations: [], skippedImplicits: [], messages: [] };
    }
    // Find all the implicit parts of the type that only mention unbound parameters not in the above list
    const [skippedImplicits, implicitsToFill] = implicit_utils_1.partitionUnrelatedValues(implicitParameters, result);
    if (implicitsToFill.length === 0) {
        return { result, skippedImplicits, implementations: [], messages: [] };
    }
    // Find all possible implementations of those implicits
    const possibleImplementations = implicitsToFill.map(implicit => scope_utils_1.findMatchingImplementations(scope, implicit));
    // Perform cartesian product of all the possibilities
    const possibleCombinations = utils_1.permuteArrays(possibleImplementations);
    // Remove any that have conflicting binds
    const validCombinations = possibleCombinations.filter(combination => {
        const pairs = utils_1.checkedZipWith(implicitsToFill, combination, (implicit, { type }) => [implicit, type]);
        const [messages, replacements] = type_utils_1.areAllPairsSubtypes(scope, pairs, () => 'Failed');
        return messages.length === 0;
    });
    // If there is more than one possible set of replacements for a implicit parameter, that parameter is ambiguous
    if (validCombinations.length > 1) {
        return {
            result,
            skippedImplicits,
            implementations: [],
            messages: [`Implicits were ambiguous. ${validCombinations.length} possible sets of values found for ${implicitsToFill.length} implicits`],
        };
    }
    // If there are no possibilities then the implicits are unresolvable
    if (validCombinations.length === 0) {
        return {
            result,
            skippedImplicits,
            implementations: [],
            messages: ['Could not find a valid set of replacements for implicits'],
        };
    }
    return {
        result,
        skippedImplicits,
        implementations: validCombinations[0],
        messages: [],
    };
}
function shallowResolveImplicitParameters(parentKind, typedNode) {
    const { expression, decoration: { scope, implicitType: type } } = typedNode;
    const { result, skippedImplicits, implementations, messages } = getImplicitImplementations(scope, type);
    // Recurse through the rest of the tree
    // const [expressionMessages, resolvedExpression] = iterateExpression(expression, result);
    // If there is only one remaining possible set of replacements for each implicit parameter, then that is the answer
    const finalType = constructors_1.functionType(result, skippedImplicits.map(value => [value, true]));
    return [messages, implementations.reduce((callee, { name, type, scope }) => constructors_1.node({
            callee,
            kind: 'Application',
            parameter: constructors_1.node(constructors_1.identifier(name), { type: implicit_utils_1.stripImplicits(type), implicitType: type, scope }),
        }, {
            scope,
            type: implicit_utils_1.stripImplicits(finalType),
            implicitType: finalType,
        }), constructors_1.node(typedNode.expression, { type: implicit_utils_1.stripImplicits(finalType), implicitType: finalType, scope }))];
    // TODO
    // Work out any additional replacements that have been discovered through the resolution process
    // Apply those to the remaining type
}
function resolveImplicitParameters(node) {
    const [getState, visitor] = utils_1.accumulateStatesWithResult(utils_1.withParentExpressionKind(shallowResolveImplicitParameters));
    const newNode = visitor_utils_1.visitNodes({ after: visitor })(node);
    return [getState(), newNode];
}
exports.resolveImplicitParameters = resolveImplicitParameters;
//# sourceMappingURL=resolve-implicits.js.map