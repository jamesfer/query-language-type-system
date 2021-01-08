import { dataValue } from '../constructors';
import { TypeResult } from '../monad-utils';
import { TypedNode } from '../type-check';
import { DataInstantiation, Expression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToDataInstantiation = (scope: Scope) => (
  expression: DataInstantiation<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> {
  const callee = state.run(typeExpression(makeUniqueId))(expression.callee);
  const parameters = expression.parameters.map(state.run(typeExpression(makeUniqueId)));

  const resultType = dataValue(callee.decoration.type, getImplicitTypeDecorations(parameters));
  // if (callee.decoration.type.kind !== 'SymbolLiteral') {
  //   messages.push(`Cannot use a ${callee.decoration.type.kind} value as the callee of a data value`);
  //   resultType = dataValue('void');
  // } else {
  //   resultType = dataValue(callee.decoration.type.name, stripAllImplicits(getTypeDecorations(parameters)));
  // }

  const expressionNode: Expression<TypedNode> = {
    ...expression,
    callee,
    parameters,
  };
  return state.wrap(typeNode(expressionNode, scope, resultType));
}
