import { find, flatten, map } from 'lodash';
import { freeVariable, scopeBinding } from './constructors';
import { TypeResult, TypeWriter } from './monad-utils';
import { findBinding } from './scope-utils';
import { Message } from './types/message';
import { Scope } from './types/scope';
import {
  BooleanLiteral,
  DataValue,
  DualBinding,
  FreeVariable,
  RecordLiteral,
  SymbolLiteral,
  Value,
} from './types/value';
import { assertNever, checkedZip, everyIs, isDefined, UniqueIdGenerator } from './utils';
import { applyReplacements, VariableReplacement } from './variable-utils';

function convergeDualBinding(scope: Scope, shape: DualBinding, child: Value): VariableReplacement[] | undefined {
  const leftResult = converge(scope, shape.left, child);
  if (!leftResult) {
    return undefined;
  }

  const rightResult = converge(scope, shape.right, child);
  if (!rightResult) {
    return undefined;
  }

  return [...leftResult, ...rightResult]
}

function convergeConcrete(scope: Scope, shape: Exclude<Value, FreeVariable>, child: Exclude<Value, FreeVariable>): VariableReplacement[] | undefined {
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

      const replacementArrays = map(shape.properties, (value, key) => (
        key in child.properties
          ? converge(scope, value, child.properties[key])
          : undefined
      ));

      return everyIs(replacementArrays, isDefined) ? flatten(replacementArrays) : undefined;
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

      const replacements = checkedZip(shape.parameters, child.parameters)
        .map(([shapeParameter, childParameter]) => converge(scope, shapeParameter, childParameter));
      return everyIs(replacements, isDefined) ? flatten([nameReplacements, ...replacements]) : undefined;
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

          const calleeReplacements = converge(scope, shape.callee, {
            ...child,
            parameters: [
              ...child.parameters.slice(0, -1),
            ],
          });
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
      return assertNever(shape);
  }
}

function convergeFreeVariable(scope: Scope, freeVariable: FreeVariable, other: Value): VariableReplacement[] | undefined {
  if (other.kind === 'FreeVariable' && other.name === freeVariable.name) {
    return [];
  }

  const binding = findBinding(scope, freeVariable.name);
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
export function converge(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
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
export function destructureValue(shape: Value, value: Value): VariableReplacement[] | undefined {
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
      const replacements = shape.parameters.map((shapeParameter, index) => (
        destructureValue(shapeParameter, {
          kind: 'ReadDataValueProperty',
          property: index,
          dataValue: value,
        })
      ));
      // const replacements = checkedZipWith(shape.parameters, value.parameters, destructureValue);
      return everyIs(replacements, isDefined) ? flatten(replacements) : undefined;
    }

    case 'RecordLiteral':
      const replacements = map(shape.properties, (shapeParameter, property) => (
        destructureValue(shapeParameter, {
          property,
          kind: 'ReadRecordProperty',
          record: value,
        })
      ));
      // const replacements = map(shape.properties, (property, key) => (
      //   value.properties[key] ? destructureValue(property, value.properties[key]) : undefined
      // ));
      return everyIs(replacements, isDefined) ? flatten(replacements) : undefined;

    case 'ReadRecordProperty':
    case 'ReadDataValueProperty':
    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
    case 'ApplicationValue':
    case 'PatternMatchValue':
      return [];

    default:
      return assertNever(shape);
  }
}

function removeImplicitParameters(value: Value): Value {
  return value.kind === 'ImplicitFunctionLiteral'
    ? removeImplicitParameters(value.body)
    : value;
}

export function canSatisfyShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
  return converge(scope, removeImplicitParameters(shape), removeImplicitParameters(child));
}

export function areAllPairsSubtypes(
  scope: Scope,
  pairGenerator: Iterable<[Value, Value]>,
  onFailure: (constraint: Value, parameter: Value, index: number) => Message,
): [Message[], VariableReplacement[]] {
  const allReplacements: VariableReplacement[] = [];
  const messages: Message[] = [];
  let index = 0;
  for (const [constraint, parameter] of pairGenerator) {
    // Apply previous replacements to constraint
    const replacedConstraint = applyReplacements(allReplacements)(constraint);

    // Find new replacements
    const replacements = canSatisfyShape(scope, replacedConstraint, parameter);
    if (!replacements) {
      messages.push(onFailure(constraint, parameter, index));
    } else {
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

const applyReplacementsToScope = (scope: Scope) => (variableReplacements: VariableReplacement[]): TypeResult<undefined> => {
  const newScope: Scope = {
    bindings: [
      ...scope.bindings.map(binding => {
        const newType: Value = find(variableReplacements, { from: binding.name })?.to || binding.type;
        return {
          ...binding,
          type: applyReplacements(variableReplacements)(newType),
        };
      }),
      ...variableReplacements
        .filter(replacement => !find(scope.bindings, { name: replacement.from }))
        .map(replacement => scopeBinding(replacement.from, scope, replacement.to)),
    ],
  };

  return new TypeWriter(newScope).wrap(undefined);
};


export function newFreeVariable(prefix: string, makeUniqueId: UniqueIdGenerator): FreeVariable {
  return freeVariable(makeUniqueId(prefix));
}

