import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { newFreeVariable } from '../type-utils';
import { ReadDataPropertyExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';

export const attachTypeToReadDataProperty = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: ReadDataPropertyExpression<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  const dataType = shallowStripImplicits(expression.dataValue.decoration.type);
  let resultType: Value | undefined;
  if (dataType.kind === 'DataValue') {
    if (expression.property < dataType.parameters.length) {
      resultType = dataType.parameters[expression.property];
    } else {
      state.log(`Data value only has ${dataType.parameters.length} properties. Tried to access property number ${expression.property} (zero-indexed).`);
    }
  } else {
    state.log('Tried to read a data property from something that is not a data value');
  }

  return state.wrap(node(expression, {
    scope,
    type: resultType ? shallowStripImplicits(resultType) : newFreeVariable('unknown$', makeUniqueId),
  }));
}
