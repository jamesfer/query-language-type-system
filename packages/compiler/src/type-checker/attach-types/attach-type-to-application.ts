import { convergeValues } from '../converge-values';
import { Application } from '../types/expression';
import { AttachTypesState } from './attach-types-state';
import { AttachedTypeDecoration, AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { converge, newFreeVariable } from '../type-utils';
import { applyReplacements } from '../variable-utils';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { functionType, node } from '../constructors';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
import { isFreeVariable } from './utils/is-free-variable';

export const attachTypeToApplication = (state: AttachTypesState) => (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: Application<AttachedTypeNode>,
): AttachedTypeNode => {
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
    // TODO the expression types required by converge values are not convenient
    // const [messages, parameterReplacements] = convergeValues(calleeType.parameter, expression.callee.expression as any, parameterType, expression.parameter.expression as any);

    const [[messages, replacements], leftImplicits, rightImplicits] = convergeValues(
      calleeType,
      expression.callee.expression as any,
      functionType(newFreeVariable('returnType', makeUniqueId), [expression.parameter.decoration.type]),
      expression.parameter as any,
    );

    state.log(messages);
    state.recordInferredTypes(replacements);

    finalBodyType = replacements
      ? applyReplacements(replacements)(calleeType.body)
      : calleeType.body;
  } else {
    state.log(`Cannot call an expression of type ${calleeType.kind}`);
    finalBodyType = newFreeVariable('applicationResult$', makeUniqueId);
  }

  return node<AttachedTypeDecoration>(
    expression,
    {
      scope,
      type: finalBodyType,
    },
  );
}
