import { find, flatten, map, mapValues, uniqueId } from 'lodash';
import { freeVariable, scopeBinding } from './constructors';
import { TypeResult, TypeWriter } from './monad-utils';
import { TypedNode } from './type-check';
import { BooleanExpression, Expression } from './types/expression';
import { Message } from './types/message';
import { Scope } from './types/scope';
import { BooleanLiteral, DataValue, FreeVariable, Value } from './types/value';
import { assertNever, checkedZip, every, isDefined } from './utils';
import { applyReplacements, substituteVariables, VariableReplacement } from './variable-utils';

export function fitsShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
  if (shape.kind === 'FunctionLiteral' || child.kind === 'FunctionLiteral') {
    return undefined;
  }

  if (child.kind === 'FreeVariable' && shape.kind !== 'FreeVariable' && shape.kind !== 'DualBinding') {
    return [{ from: child.name, to: shape }];
  }

  switch (shape.kind) {
    case 'NumberLiteral':
    case 'BooleanLiteral':
      return child.kind === shape.kind && child.value === shape.value ? [] : undefined;

    case 'SymbolLiteral':
      return child.kind === shape.kind && child.name === shape.name ? [] : undefined;

    case 'FreeVariable':
      return [{ from: shape.name, to: child }];

    case 'DualBinding': {
      const leftResult = fitsShape(scope, shape.left, child);
      const rightResult = fitsShape(scope, shape.right, child);
      return leftResult && rightResult ? [...leftResult, ...rightResult] : undefined;
    }

    case 'RecordLiteral': {
      if (child.kind !== 'RecordLiteral') {
        return undefined;
      }

      const replacementArrays = map(shape.properties, (value, key) => (
        key in child.properties
          ? fitsShape(scope, value, child.properties[key])
          : undefined
      ));

      return every(replacementArrays, isDefined) ? flatten(replacementArrays) : undefined;
    }

    case 'DataValue': {
      // TODO if it turns out that we don't need to do much more, then the scope parameter should be
      //      removed from this function
      // if (child.kind !== 'DataValue' || child.name !== shape.name || child.parameters.length !== shape.parameters.length) {
      if (child.kind !== 'DataValue' || child.parameters.length !== shape.parameters.length) {
        return undefined;
      }

      const nameReplacements = fitsShape(scope, shape.name, child.name);
      if (!nameReplacements) {
        return undefined;
      }

      const replacements = checkedZip(shape.parameters, child.parameters)
        .map(([shapeParameter, childParameter]) => fitsShape(scope, shapeParameter, childParameter));
      return every(replacements, isDefined) ? flatten([nameReplacements, ...replacements]) : undefined;
    }

    default:
      return assertNever(shape);
  }
}

function removeImplicitParameters(value: Value): Value {
  return isFunctionType(value)
      && value.parameters.length === 3
      && value.parameters[0].kind === 'BooleanLiteral'
      && value.parameters[0].value === true
    ? removeImplicitParameters(value.parameters[2])
    : value;
}

export function canSatisfyShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
  return fitsShape(scope, removeImplicitParameters(shape), removeImplicitParameters(child));
}

// export function areAllSubtypes(
//   scope: Scope,
//   constraints: Value[],
//   parameters: Value[],
//   onFailure: (constraint: Value, parameter: Value, index: number) => Message,
// ): [Message[], VariableReplacement[]] {
//   const allReplacements: VariableReplacement[] = [];
//   const messages: Message[] = [];
//   checkedZip(constraints, parameters).forEach(([constraint, parameter], index) => {
//     // Apply previous replacements to constraint
//     const replacedConstraint = applyReplacements(allReplacements, constraint);
//
//     // Find new replacements
//     const replacements = fitsShape(scope, replacedConstraint, parameter);
//     if (!replacements) {
//       messages.push(onFailure(constraint, parameter, index));
//     } else {
//       allReplacements.push(...replacements);
//     }
//
//     // Replace all variables on the right-hand side of the replacements with variables that
//     // don't exist in the current left-hand expression or any of its replacements
//     // const takenVariables = flatten([
//     //   extractFreeVariableNames(calleeType),
//     //   ...allReplacements.map(({ to }) => extractFreeVariableNames(to)),
//     // ]);
//     // const safeReplacements = renameTakenVariables(takenVariables, replacements);
//   });
//
//   return [messages, allReplacements];
// }

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
}

export const areAllPairsSubtypes2 = (scope: Scope) => (
  pairs: Iterable<[Value, Value]>,
  onFailure: (constraint: Value, parameter: Value, index: number) => Message,
): TypeResult<boolean> => {
  const state = new TypeWriter(scope);
  let succeeded = true;
  let index = 0;
  for (const [constraint, parameter] of pairs) {
    // Apply previous replacements to constraint
    const replacedConstraint = substituteVariables(state.scope)(constraint);
    // const replacedConstraint = applyReplacements(allReplacements)(constraint);

    // Find new replacements
    const replacements = canSatisfyShape(state.scope, replacedConstraint, parameter);
    if (!replacements) {
      succeeded = false;
      state.log(onFailure(constraint, parameter, index));
    } else {
      state.run(applyReplacementsToScope)(replacements);
    }

    index += 1;
  }

  return state.wrap(succeeded);
};





// export function typesAreEqual(left: Value, right: Value): boolean {
//   if (left.kind !== 'FreeVariable' && right.kind === 'FreeVariable') {
//     return typesAreEqual(right, left);
//   }
//
//   switch (left.kind) {
//     case 'DataValue':
//       return right.kind === 'DataValue'
//         && left.callee === right.callee
//         && left.parameters.length === right.parameters.length
//         && checkedZip(left.parameters, right.parameters).every(([leftParameter, rightParameter]) => (
//           typesAreEqual(leftParameter, rightParameter)
//         ));
//
//     case 'FreeVariable':
//       return true;
//
//     case 'NumberLiteral':
//       return right.kind === 'NumberLiteral' && left.value === right.value;
//
//     case 'BooleanLiteral':
//       return right.kind === 'BooleanLiteral' && left.value === right.value;
//
//     case 'FunctionLiteral':
//       // TODO
//       return false;
//
//     case 'RecordLiteral':
//       return right.kind === 'RecordLiteral' && Object.keys(left.properties).every(key => (
//         key in right.properties && typesAreEqual(left.properties[key], right.properties[key])
//       ));
//
//     default:
//       return assertNever(left);
//   }
// }

export function newFreeVariable(prefix: string): FreeVariable {
  return freeVariable(uniqueId(prefix));
}

export function isFunctionType(value: Value): value is DataValue & { name: 'Function' } {
  return value.kind === 'DataValue' && value.name.kind === 'SymbolLiteral' && value.name.name === 'Function';
}

export function * unfoldParameters(value: Value): Generator<[boolean, Value, Value]> {
  let currentValue = value;
  while (isFunctionType(currentValue)) {
    const [isImplicit, parameter, result] = currentValue.parameters;
    yield [!!((isImplicit as BooleanLiteral).value), parameter, result];
    currentValue = result;
  }
}

export function * unfoldExplicitParameters(value: Value): Generator<[Value, Value, Value[]]> {
  const skippedImplicits: Value[] = [];
  for (const [implicit, parameter, body] of unfoldParameters(value)) {
    if (implicit) {
      skippedImplicits.push(parameter);
    } else {
      yield [parameter, body, skippedImplicits];
    }
  }
}

interface Visitor<T> {
  before?(t: T): T;
  after?(t: T): T;
}

export const visitExpressionNodes = (visitor: Visitor<TypedNode>) => (expression: Expression<TypedNode>): Expression<TypedNode> => {
  switch (expression.kind) {
    case 'SymbolExpression':
    case 'NumberExpression':
    case 'BooleanExpression':
    case 'Identifier':
      return expression;

    case 'RecordExpression':
      return {
        ...expression,
        properties: mapValues(expression.properties, visitNodes(visitor)),
      };

    case 'Application':
      return {
        ...expression,
        callee: visitNodes(visitor)(expression.callee),
        parameters: expression.parameters.map(visitNodes(visitor)),
      };

    case 'FunctionExpression':
      return {
        ...expression,
        body: visitNodes(visitor)(expression.body),
      };

    case 'DataInstantiation':
      return {
        ...expression,
        parameters: expression.parameters.map(visitNodes(visitor)),
      };

    case 'BindingExpression':
      return {
        ...expression,
        value: visitNodes(visitor)(expression.value),
        body: visitNodes(visitor)(expression.body),
      };

    case 'DualExpression':
      return {
        ...expression,
        left: visitNodes(visitor)(expression.left),
        right: visitNodes(visitor)(expression.right),
      };

    case 'ReadRecordPropertyExpression':
      return {
        ...expression,
        record: visitNodes(visitor)(expression.record),
      };

    case 'ReadDataPropertyExpression':
      return {
        ...expression,
        dataValue: visitNodes(visitor)(expression.dataValue),
      };

    default:
      return assertNever(expression);
  }
};

export const visitNodes = (visitor: Visitor<TypedNode>) => (node: TypedNode): TypedNode => {
  const beforeNode = visitor.before?.(node) || node;
  const transformedNode = {
    ...node,
    expression: visitExpressionNodes(visitor)(beforeNode.expression),
  };
  return visitor.after?.(transformedNode) || transformedNode;
};

interface Visitor<T> {
  before?(t: T): T;
  after?(t: T): T;
}

export const visitChildValues = (visitor: Visitor<Value>) => (value: Value): Value => {
  switch (value.kind) {
    case 'SymbolLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FreeVariable':
      return value;

    case 'DataValue':
      return {
        ...value,
        parameters: value.parameters.map(visitValue(visitor)),
      };

    case 'DualBinding':
      return {
        ...value,
        left: visitValue(visitor)(value.left),
        right: visitValue(visitor)(value.right),
      };

    case 'FunctionLiteral':
      return {
        ...value,
        parameters: value.parameters.map(parameter => ({
          ...parameter,
          value: visitValue(visitor)(parameter.value),
        })),
      };

    case 'RecordLiteral':
      return {
        ...value,
        properties: mapValues(value.properties, visitValue(visitor)),
      };

    default:
      return assertNever(value);
  }
};

export const visitValue = (visitor: Visitor<Value>) => (value: Value): Value => {
  const beforeValue = visitor.before?.(value) || value;
  const transformedValue = visitChildValues(visitor)(beforeValue);
  return visitor.after?.(transformedValue) || transformedValue;
};

export const visitValueWithState = <S>(initial: S, visitor: Visitor<[S, Value]>) => (value: Value): S => {
  let state = initial;
  const wrap = (visitor: (s: [S, Value]) => [S, Value]) => (value: Value) => {
    const [newState, newValue] = visitor([state, value]);
    state = newState;
    return newValue;
  };
  visitValue({
    before: visitor.before ? wrap(visitor.before) : undefined,
    after: visitor.after ? wrap(visitor.after) : undefined,
  })(value);
  return state;
};

