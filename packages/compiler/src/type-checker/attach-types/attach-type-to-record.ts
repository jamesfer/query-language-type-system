import { mapValues } from 'lodash';
import { node, recordLiteral } from '../constructors';
import { RecordExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

export const attachTypeToRecord = (scope: Scope) => (expression: RecordExpression<AttachedTypeNode>): AttachedTypeNode => {
  return node(expression, {
    scope,
    type: recordLiteral(mapValues(expression.properties, property => shallowStripImplicits(property.decoration.type))),
  });
};
