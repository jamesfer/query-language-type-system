"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newFreeVariable = exports.areAllPairsSubtypes = exports.canSatisfyShape = exports.destructureValue = exports.converge = void 0;
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const monad_utils_1 = require("./monad-utils");
const scope_utils_1 = require("./scope-utils");
const utils_1 = require("./utils");
const variable_utils_1 = require("./variable-utils");
function convergeDualBinding(scope, shape, child) {
    const leftResult = converge(scope, shape.left, child);
    if (!leftResult) {
        return undefined;
    }
    const rightResult = converge(scope, shape.right, child);
    if (!rightResult) {
        return undefined;
    }
    return [...leftResult, ...rightResult];
}
function convergeConcrete(scope, shape, child) {
    switch (shape.kind) {
        case 'SymbolLiteral':
            return child.kind === shape.kind && child.name === shape.name ? [] : undefined;
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
            return child.kind === shape.kind && child.value === shape.value ? [] : undefined;
        case 'DualBinding':
            return convergeDualBinding(scope, shape, child);
        case 'RecordLiteral': {
            if (child.kind !== 'RecordLiteral') {
                return undefined;
            }
            const replacementArrays = lodash_1.map(shape.properties, (value, key) => (key in child.properties
                ? converge(scope, value, child.properties[key])
                : undefined));
            return utils_1.everyIs(replacementArrays, utils_1.isDefined) ? lodash_1.flatten(replacementArrays) : undefined;
        }
        case 'DataValue': {
            // TODO if it turns out that we don't need to do much more, then the scope parameter should be
            //      removed from this function
            // if (child.kind !== 'DataValue' || child.name !== shape.name || child.parameters.length !== shape.parameters.length) {
            if (child.kind !== 'DataValue' || child.parameters.length !== shape.parameters.length) {
                return undefined;
            }
            const nameReplacements = converge(scope, shape.name, child.name);
            if (!nameReplacements) {
                return undefined;
            }
            const replacements = utils_1.checkedZip(shape.parameters, child.parameters)
                .map(([shapeParameter, childParameter]) => converge(scope, shapeParameter, childParameter));
            return utils_1.everyIs(replacements, utils_1.isDefined) ? lodash_1.flatten([nameReplacements, ...replacements]) : undefined;
        }
        case 'ImplicitFunctionLiteral':
        case 'FunctionLiteral': {
            const concreteShape = removeImplicitParameters(shape);
            const concreteChild = removeImplicitParameters(child);
            if (concreteShape.kind !== 'FunctionLiteral' || concreteChild.kind !== 'FunctionLiteral') {
                return undefined;
            }
            const parameterReplacements = converge(scope, concreteShape.parameter, concreteChild.parameter);
            if (!parameterReplacements) {
                return undefined;
            }
            const bodyReplacements = converge(scope, concreteShape.body, concreteChild.body);
            if (!bodyReplacements) {
                return undefined;
            }
            return [...parameterReplacements, ...bodyReplacements];
        }
        case 'ApplicationValue': {
            switch (child.kind) {
                case 'ApplicationValue': {
                    const calleeReplacements = converge(scope, shape.callee, child.callee);
                    if (!calleeReplacements) {
                        return undefined;
                    }
                    const parameterReplacements = converge(scope, shape.parameter, child.parameter);
                    if (!parameterReplacements) {
                        return undefined;
                    }
                    return [...calleeReplacements, ...parameterReplacements];
                }
                case 'DataValue': {
                    if (child.parameters.length === 0) {
                        // Cannot destructure a data value if it has no parameters
                        return undefined;
                    }
                    const calleeReplacements = converge(scope, shape.callee, Object.assign(Object.assign({}, child), { parameters: [
                            ...child.parameters.slice(0, -1),
                        ] }));
                    if (!calleeReplacements) {
                        return undefined;
                    }
                    const parameterReplacements = converge(scope, shape.parameter, child.parameters[child.parameters.length - 1]);
                    if (!parameterReplacements) {
                        return undefined;
                    }
                    return [...calleeReplacements, ...parameterReplacements];
                }
                default:
                    return undefined;
            }
        }
        case 'PatternMatchValue':
        case 'ReadDataValueProperty':
        case 'ReadRecordProperty':
            return undefined;
        default:
            return utils_1.assertNever(shape);
    }
}
function convergeFreeVariable(scope, freeVariable, other) {
    if (other.kind === 'FreeVariable' && other.name === freeVariable.name) {
        return [];
    }
    const binding = scope_utils_1.findBinding(scope, freeVariable.name);
    if (binding && (binding.type.kind !== 'FreeVariable' || binding.type.name !== freeVariable.name)) {
        return converge(scope, other, binding.type);
    }
    return [{ from: freeVariable.name, to: other }];
}
/**
 * Looks at two values and tries to infer as much information about the free variables as possible
 * based on any corresponding value in the value. Returns undefined if the two parameters are not
 * compatible.
 */
function converge(scope, shape, child) {
    if (shape.kind === 'DualBinding') {
        return convergeDualBinding(scope, shape, child);
    }
    if (child.kind === 'DualBinding') {
        return convergeDualBinding(scope, child, shape);
    }
    if (shape.kind === 'FreeVariable') {
        return convergeFreeVariable(scope, shape, child);
    }
    if (child.kind === 'FreeVariable') {
        return convergeFreeVariable(scope, child, shape);
    }
    const convergeConcrete1 = convergeConcrete(scope, shape, child);
    return convergeConcrete1;
}
exports.converge = converge;
/**
 * Runs `converge` but then adds the generated replacements to the scope and just returns true or
 * false based on whether the values could be converged.
 */
// export const fitsShape = (scope: Scope) => (shape: Value, child: Value): TypeResult<boolean> => {
//   const replacements = converge(scope, shape, child);
//   return TypeWriter.wrapWithScope(
//     replacements ? addReplacementsToScope(scope, replacements) : scope,
//     !!replacements,
//   );
// };
/**
 * Looks at all the free variables in the shape and generates an expression represents each variable
 * based on value.
 */
function destructureValue(shape, value) {
    switch (shape.kind) {
        case 'SymbolLiteral':
            return value.kind === 'SymbolLiteral' && value.name === shape.kind ? [] : undefined;
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
            return value.kind === shape.kind && value.value === shape.value ? [] : undefined;
        case 'FreeVariable':
            return [{ from: shape.name, to: value }];
        case 'DualBinding':
            const leftReplacements = destructureValue(shape.left, value);
            const rightReplacements = destructureValue(shape.right, value);
            return leftReplacements && rightReplacements
                ? [...leftReplacements, ...rightReplacements]
                : undefined;
        case 'DataValue': {
            const replacements = shape.parameters.map((shapeParameter, index) => (destructureValue(shapeParameter, {
                kind: 'ReadDataValueProperty',
                property: index,
                dataValue: value,
            })));
            // const replacements = checkedZipWith(shape.parameters, value.parameters, destructureValue);
            return utils_1.everyIs(replacements, utils_1.isDefined) ? lodash_1.flatten(replacements) : undefined;
        }
        case 'RecordLiteral':
            const replacements = lodash_1.map(shape.properties, (shapeParameter, property) => (destructureValue(shapeParameter, {
                property,
                kind: 'ReadRecordProperty',
                record: value,
            })));
            // const replacements = map(shape.properties, (property, key) => (
            //   value.properties[key] ? destructureValue(property, value.properties[key]) : undefined
            // ));
            return utils_1.everyIs(replacements, utils_1.isDefined) ? lodash_1.flatten(replacements) : undefined;
        case 'ReadRecordProperty':
        case 'ReadDataValueProperty':
        case 'FunctionLiteral':
        case 'ImplicitFunctionLiteral':
        case 'ApplicationValue':
        case 'PatternMatchValue':
            return [];
        default:
            return utils_1.assertNever(shape);
    }
}
exports.destructureValue = destructureValue;
function removeImplicitParameters(value) {
    return value.kind === 'ImplicitFunctionLiteral'
        ? removeImplicitParameters(value.body)
        : value;
}
function canSatisfyShape(scope, shape, child) {
    return converge(scope, removeImplicitParameters(shape), removeImplicitParameters(child));
}
exports.canSatisfyShape = canSatisfyShape;
function areAllPairsSubtypes(scope, pairGenerator, onFailure) {
    const allReplacements = [];
    const messages = [];
    let index = 0;
    for (const [constraint, parameter] of pairGenerator) {
        // Apply previous replacements to constraint
        const replacedConstraint = variable_utils_1.applyReplacements(allReplacements)(constraint);
        // Find new replacements
        const replacements = canSatisfyShape(scope, replacedConstraint, parameter);
        if (!replacements) {
            messages.push(onFailure(constraint, parameter, index));
        }
        else {
            allReplacements.push(...replacements);
        }
        index += 1;
        // Replace all variables on the right-hand side of the replacements with variables that
        // don't exist in the current left-hand expression or any of its replacements
        // const takenVariables = flatten([
        //   extractFreeVariableNames(calleeType),
        //   ...allReplacements.map(({ to }) => extractFreeVariableNames(to)),
        // ]);
        // const safeReplacements = renameTakenVariables(takenVariables, replacements);
    }
    return [messages, allReplacements];
}
exports.areAllPairsSubtypes = areAllPairsSubtypes;
const applyReplacementsToScope = (scope) => (variableReplacements) => {
    const newScope = {
        bindings: [
            ...scope.bindings.map(binding => {
                var _a;
                const newType = ((_a = lodash_1.find(variableReplacements, { from: binding.name })) === null || _a === void 0 ? void 0 : _a.to) || binding.type;
                return Object.assign(Object.assign({}, binding), { type: variable_utils_1.applyReplacements(variableReplacements)(newType) });
            }),
            ...variableReplacements
                .filter(replacement => !lodash_1.find(scope.bindings, { name: replacement.from }))
                .map(replacement => constructors_1.scopeBinding(replacement.from, scope, replacement.to)),
        ],
    };
    return new monad_utils_1.TypeWriter(newScope).wrap(undefined);
};
function newFreeVariable(prefix, makeUniqueId) {
    return constructors_1.freeVariable(makeUniqueId(prefix));
}
exports.newFreeVariable = newFreeVariable;
//# sourceMappingURL=type-utils.js.map