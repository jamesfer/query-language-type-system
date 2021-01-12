import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { newFreeVariable } from '../type-utils';
import { ReadRecordPropertyExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';

export const attachTypeToReadRecordProperty = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: ReadRecordPropertyExpression<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  const recordType = shallowStripImplicits(expression.record.decoration.type);
  let resultType: Value | undefined;
  if (recordType.kind === 'RecordLiteral') {
    if (expression.property in recordType.properties) {
      resultType = recordType.properties[expression.property];
    } else {
      state.log(`Record type does not have a property named ${expression.property}. Expected one of: ${Object.keys(recordType.properties).join(', ')}`);
    }
  } else {
    state.log('Tried to read a record property from something that is not a record type');
  }

  return state.wrap(node(expression, {
    scope,
    type: resultType ? shallowStripImplicits(resultType) : newFreeVariable('unknown$', makeUniqueId),
  }));
}
