"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const evaluate_1 = require("./evaluate");
const implicit_utils_1 = require("./implicit-utils");
const monad_utils_1 = require("./monad-utils");
const run_type_phase_1 = require("./run-type-phase");
const scope_utils_1 = require("./scope-utils");
const strip_nodes_1 = require("./strip-nodes");
const type_utils_1 = require("./type-utils");
const utils_1 = require("./utils");
const variable_utils_1 = require("./variable-utils");
const visitor_utils_1 = require("./visitor-utils");
function typeNode(expression, scope, implicitType) {
    return constructors_1.node(expression, { type: implicit_utils_1.stripImplicits(implicitType), implicitType, scope });
}
function getTypeDecorations(nodes) {
    return nodes.map(node => node.decoration.type);
}
function copyFreeVariables(scope, makeUniqueId) {
    return visitor_utils_1.visitValueWithState({}, {
        after([state, value]) {
            if (value.kind === 'FreeVariable' && !scope_utils_1.findBinding(scope, value.name)) {
                if (!state[value.name]) {
                    state[value.name] = type_utils_1.newFreeVariable(`${value.name}$copy$`, makeUniqueId);
                }
                return [state, state[value.name]];
            }
            return [state, value];
        },
    });
}
// function getImplicitsForBinding(valueNode: TypedNode): Value[] {
//   const valueList = deepExtractImplicitParameters(valueNode);
//   let variableNames = extractFreeVariableNames(valueNode.decoration.type);
//   let allRelated: Value[] = [];
//   let [related, unrelated] = partition(valueList, usesVariable(variableNames));
//   while (related.length > 0) {
//     allRelated = [...allRelated, ...related];
//     variableNames = [...variableNames, ...flatMap(related, extractFreeVariableNames)];
//     ([related, unrelated] = partition(unrelated, usesVariable(variableNames)));
//   }
//   return allRelated;
// }
exports.typeExpression = (makeUniqueId) => (scope) => (expression) => {
    const state = new monad_utils_1.TypeWriter(scope);
    switch (expression.kind) {
        case 'SymbolExpression':
            return state.wrap(typeNode(expression, scope, constructors_1.symbol(expression.name)));
        case 'BooleanExpression':
            return state.wrap(typeNode(expression, scope, constructors_1.booleanLiteral(expression.value)));
        case 'NumberExpression':
            return state.wrap(typeNode(expression, scope, constructors_1.numberLiteral(expression.value)));
        case 'StringExpression':
            return state.wrap(typeNode(expression, scope, constructors_1.stringLiteral(expression.value)));
        case 'NativeExpression':
            return state.wrap(typeNode(expression, scope, type_utils_1.newFreeVariable('native', makeUniqueId)));
        case 'DataInstantiation': {
            const callee = state.run(exports.typeExpression(makeUniqueId))(expression.callee);
            const parameters = expression.parameters.map(state.run(exports.typeExpression(makeUniqueId)));
            const resultType = constructors_1.dataValue(callee.decoration.type, getTypeDecorations(parameters));
            // if (callee.decoration.type.kind !== 'SymbolLiteral') {
            //   messages.push(`Cannot use a ${callee.decoration.type.kind} value as the callee of a data value`);
            //   resultType = dataValue('void');
            // } else {
            //   resultType = dataValue(callee.decoration.type.name, stripAllImplicits(getTypeDecorations(parameters)));
            // }
            const expressionNode = Object.assign(Object.assign({}, expression), { callee,
                parameters });
            return state.wrap(typeNode(expressionNode, scope, resultType));
        }
        case 'RecordExpression': {
            const keys = Object.keys(expression.properties);
            const propertyNodes = lodash_1.map(expression.properties, state.run(exports.typeExpression(makeUniqueId)));
            const expressionNode = Object.assign(Object.assign({}, expression), { properties: lodash_1.zipObject(keys, propertyNodes) });
            return state.wrap(typeNode(expressionNode, scope, constructors_1.recordLiteral(lodash_1.zipObject(keys, getTypeDecorations(propertyNodes)))));
        }
        case 'FunctionExpression': {
            // Create a free variable for each parameter
            const node1 = state.run(run_type_phase_1.runTypePhaseWithoutRename(makeUniqueId))(expression.parameter);
            const parameter = evaluate_1.evaluateExpression(scope_utils_1.scopeToEScope(state.scope))(strip_nodes_1.stripNode(node1));
            if (!parameter) {
                // TODO handle undefined parameters that failed to be evaluated
                throw new Error(`Failed to evaluate expression: ${JSON.stringify(expression.parameter, undefined, 2)}\nIn scope ${JSON.stringify(scope, undefined, 2)}`);
            }
            const body = state.withChildScope((innerState) => {
                const bindingsFromValue = variable_utils_1.extractFreeVariableNames(parameter);
                innerState.expandScope({
                    bindings: [
                        ...bindingsFromValue.map((name) => (constructors_1.scopeBinding(name, scope, variable_utils_1.applyReplacements(state.replacements)(constructors_1.freeVariable(name))))),
                    ],
                });
                // TODO return inferred variables from typeExpression so that the types of parameters can be
                //      checked. I think this has been accomplished with the new scope behaviour, but need to
                //      double check.
                return innerState.run(exports.typeExpression(makeUniqueId))(expression.body);
            });
            return state.wrap(typeNode(Object.assign(Object.assign({}, expression), { body }), scope, constructors_1.functionType(body.decoration.type, [[parameter, expression.implicit]])));
        }
        case 'Identifier': {
            const binding = lodash_1.find(scope.bindings, { name: expression.name });
            if (binding) {
                return state.wrap(typeNode(expression, scope, copyFreeVariables(scope, makeUniqueId)(binding.type)));
            }
            // return result(expression, scope, newFreeVariable(`${expression.callee}$typingFreeIdentifier$`));
            return state.wrap(typeNode(expression, scope, constructors_1.freeVariable(expression.name)));
        }
        case 'Application': {
            const callee = state.run(exports.typeExpression(makeUniqueId))(expression.callee);
            const parameter = state.run(exports.typeExpression(makeUniqueId))(expression.parameter);
            const expressionNode = Object.assign(Object.assign({}, expression), { callee, parameter });
            // Converge the callee type with a function type
            const parameterTypeVariable = type_utils_1.newFreeVariable('tempParameterVariable$', makeUniqueId);
            const bodyTypeVariable = type_utils_1.newFreeVariable('tempBodyVariable$', makeUniqueId);
            const calleeReplacements = type_utils_1.converge(state.scope, callee.decoration.type, {
                kind: 'FunctionLiteral',
                parameter: parameterTypeVariable,
                body: bodyTypeVariable,
            });
            if (!calleeReplacements) {
                state.log(`Cannot call a ${callee.decoration.type.kind}`);
            }
            else {
                state.recordReplacements(calleeReplacements);
            }
            const parameterType = variable_utils_1.applyReplacements(calleeReplacements || [])(parameterTypeVariable);
            const bodyType = variable_utils_1.applyReplacements(calleeReplacements || [])(bodyTypeVariable);
            const parameterReplacements = type_utils_1.converge(state.scope, parameterType, parameter.decoration.type);
            if (!parameterReplacements) {
                state.log('Given parameter did not match expected shape');
            }
            else {
                state.recordReplacements(parameterReplacements);
            }
            // Apply replacements to all children and implicits
            return state.wrap(typeNode(variable_utils_1.recursivelyApplyReplacements(state.replacements)(expressionNode), scope, variable_utils_1.applyReplacements(state.replacements)(bodyType)));
        }
        case 'BindingExpression': {
            if (lodash_1.some(scope.bindings, { name: expression.name })) {
                state.log(`A variable with the name ${expression.name} already exists`);
            }
            // Extract implicit parameters from all children on the value
            const valueNode = state.run(exports.typeExpression(makeUniqueId))(expression.value);
            const [shallowImplicits] = implicit_utils_1.extractImplicitsParameters(valueNode.decoration.implicitType);
            const [relatedShallowImplicits, unrelatedShallowImplicits] = implicit_utils_1.partitionUnrelatedValues(shallowImplicits, valueNode.decoration.type);
            const deepImplicits = implicit_utils_1.deepExtractImplicitParametersFromExpression(valueNode.expression);
            const [relatedDeepImplicits, unrelatedDeepImplicits] = implicit_utils_1.partitionUnrelatedValues(deepImplicits, valueNode.decoration.type);
            const allRelatedImplicits = [...relatedShallowImplicits, ...relatedDeepImplicits];
            const allUnrelatedImplicits = [...unrelatedShallowImplicits, ...unrelatedDeepImplicits];
            const relatedImplicitParameters = allRelatedImplicits.map(value => (constructors_1.dualBinding(type_utils_1.newFreeVariable('implicitBinding$', makeUniqueId), value)));
            const unrelatedImplicitParameters = allUnrelatedImplicits.map(value => (constructors_1.dualBinding(type_utils_1.newFreeVariable('implicitBinding$', makeUniqueId), value)));
            // Add all implicits to every scope so they can be discovered by the resolveImplicitParameters
            // function
            const allImplicitParameters = [...relatedImplicitParameters, ...unrelatedImplicitParameters];
            const implicitBindings = lodash_1.flatMap(allImplicitParameters, variable_utils_1.getBindingsFromValue)
                .map(({ from, to }) => constructors_1.scopeBinding(from, scope, to));
            const newValueNode = visitor_utils_1.visitNodes({
                after: utils_1.withParentExpressionKind((parentKind, node) => (!parentKind ? node : lodash_1.merge(node, {
                    decoration: {
                        scope: constructors_1.expandScope(node.decoration.scope, { bindings: implicitBindings }),
                    },
                }))),
            })(valueNode);
            // Add the binding to the scope so that it can be used in the body
            const bodyNode = state.withChildScope((innerState) => {
                const scopeType = constructors_1.functionType(valueNode.decoration.type, relatedImplicitParameters.map(parameter => [parameter, true]));
                const binding = constructors_1.scopeBinding(expression.name, newValueNode.decoration.scope, scopeType, strip_nodes_1.stripNode(newValueNode));
                innerState.expandScope({ bindings: [binding] });
                return innerState.run(exports.typeExpression(makeUniqueId))(expression.body);
            });
            const expressionNode = Object.assign(Object.assign({}, expression), { value: Object.assign(Object.assign({}, newValueNode), { decoration: Object.assign(Object.assign({}, newValueNode.decoration), { 
                        // The node type includes all the bindings because we want the unrelated implicits to be
                        // resolved
                        implicitType: constructors_1.functionType(valueNode.decoration.type, [...shallowImplicits, ...relatedDeepImplicits].map(parameter => [parameter, true])) }) }), body: bodyNode });
            return state.wrap(typeNode(expressionNode, scope, bodyNode.decoration.type));
        }
        case 'DualExpression': {
            const leftNode = state.run(exports.typeExpression(makeUniqueId))(expression.left);
            const rightNode = state.run(exports.typeExpression(makeUniqueId))(expression.right);
            // TODO
            // const replacements = unionType
            const expressionNode = Object.assign(Object.assign({}, expression), { left: leftNode, right: rightNode });
            return state.wrap(typeNode(expressionNode, scope, leftNode.decoration.type));
        }
        case 'ReadRecordPropertyExpression': {
            const recordNode = state.run(exports.typeExpression(makeUniqueId))(expression.record);
            const expressionNode = Object.assign(Object.assign({}, expression), { record: recordNode });
            const type = recordNode.decoration.type;
            const resultType = type.kind === 'RecordLiteral' && type.properties[expression.property]
                || undefined;
            if (resultType === undefined) {
                state.log(`Property ${expression.property} does not exist in record`);
            }
            if (!resultType) {
                console.log('Failed to find property on record', type.kind, type.kind === 'RecordLiteral' && type.properties, expression.property);
            }
            return state.wrap(typeNode(expressionNode, scope, resultType ? resultType : constructors_1.dataValue('void')));
        }
        case 'ReadDataPropertyExpression': {
            const dataValueNode = state.run(exports.typeExpression(makeUniqueId))(expression.dataValue);
            const expressionNode = Object.assign(Object.assign({}, expression), { dataValue: dataValueNode });
            const type = dataValueNode.decoration.type;
            const resultType = type.kind === 'DataValue'
                && type.parameters.length < expression.property
                ? type.parameters[expression.property]
                : undefined;
            if (resultType === undefined) {
                state.log(`Data value has less than ${expression.property} parameters`);
            }
            return state.wrap(typeNode(expressionNode, scope, resultType ? resultType : constructors_1.dataValue('void')));
        }
        case 'PatternMatchExpression': {
            const value = state.run(exports.typeExpression(makeUniqueId))(expression.value);
            const patterns = expression.patterns.map(({ test, value }) => {
                const testNode = state.run(run_type_phase_1.runTypePhaseWithoutRename(makeUniqueId))(test);
                const evaluatedTest = evaluate_1.evaluateExpression(scope_utils_1.scopeToEScope(state.scope))(strip_nodes_1.stripNode(testNode));
                if (!evaluatedTest) {
                    // TODO handle undefined parameters that failed to be evaluated
                    throw new Error(`Failed to evaluate expression: ${JSON.stringify(test, undefined, 2)}\nIn scope ${JSON.stringify(scope, undefined, 2)}`);
                }
                const valueNode = state.withChildScope((innerState) => {
                    innerState.expandScope({
                        bindings: [
                            ...variable_utils_1.getBindingsFromValue(evaluatedTest).map(({ from, to }) => (constructors_1.scopeBinding(from, scope, to))),
                            ...state.replacements.map(({ from, to }) => constructors_1.scopeBinding(from, scope, to))
                        ],
                    });
                    // TODO return inferred variables from typeExpression so that the types of parameters can be
                    //      checked. I think this has been accomplished with the new scope behaviour, but need to
                    //      double check.
                    return innerState.run(exports.typeExpression(makeUniqueId))(value);
                });
                return { test: testNode, value: valueNode };
            });
            // TODO Check that all the values have the same type
            // TODO check that all the tests are the same type as the input value
            // TODO check that there are no holes in the tests
            if (patterns.length === 0) {
                state.log('Require at least one pattern in match expression');
            }
            return state.wrap(typeNode(Object.assign(Object.assign({}, expression), { value, patterns }), scope, patterns.length > 0 ? patterns[0].value.decoration.type : constructors_1.dataValue('void')));
        }
        default:
            return utils_1.assertNever(expression);
    }
};
//# sourceMappingURL=type-check.js.map