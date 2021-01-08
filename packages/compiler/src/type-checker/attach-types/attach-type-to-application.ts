import { Application } from '../types/expression';
import { AttachedTypeDecoration, AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { converge, newFreeVariable } from '../type-utils';
import { applyReplacements } from '../variable-utils';
import { TypeResult, TypeWriter } from '../monad-utils';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';
import { isFreeVariable } from './utils/is-free-variable';

export const attachTypeToApplication = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: Application<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  const calleeType = shallowStripImplicits(expression.callee.decoration.type);
  const parameterType = shallowStripImplicits(expression.parameter.decoration.type);
  let finalBodyType: Value;

  // This is a little bit hacky to be able keep the type of the parameter in expressions like:
  // let map = (a -> b) -> F a -> F b
  // The second parameter is an application but we want to maintain the type as an F a and not
  // try to simplify it.
  if (isFreeVariable(scope, calleeType)) {
    finalBodyType = {
      kind: 'ApplicationValue',
      parameter: parameterType,
      callee: calleeType
    };
  } else if (calleeType.kind === 'FunctionLiteral') {
    const parameterReplacements = converge(scope, calleeType.parameter, parameterType);
    if (!parameterReplacements) {
      state.log('Given parameter did not match expected shape');
    } else {
      state.recordReplacements(parameterReplacements);
    }

    finalBodyType = parameterReplacements
      ? applyReplacements(parameterReplacements)(calleeType.body)
      : calleeType.body;
  } else {
    state.log(`Cannot call an expression of type ${calleeType.kind}`);
    finalBodyType = newFreeVariable('applicationResult$', makeUniqueId);
  }

  return state.wrap(node<AttachedTypeDecoration>(
    expression,
    {
      scope,
      type: finalBodyType,
    },
  ));
}
