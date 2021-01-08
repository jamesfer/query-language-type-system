import { applicationMapIterator, makeExpressionIterator, recordMapIterator } from '../../desugar/iterators-specific';
import { Scope } from '../types/scope';
import { Expression, RecordExpression } from '../types/expression';
import { TypeResult, TypeWriter } from '../monad-utils';
import { attachTypeToBoolean } from './attach-type-to-boolean';
import { attachTypeToFunction } from './attach-type-to-function';
import { attachTypeToFunctionChildren } from './attach-type-to-function-children';
import { attachTypeToIdentifier } from './attach-type-to-identifier';
import { attachTypeToNative } from './attach-type-to-native';
import { attachTypeToNumber } from './attach-type-to-number';
import { attachTypeToRecord } from './attach-type-to-record';
import { attachTypeToString } from './attach-type-to-string';
import { attachTypeToSymbol } from './attach-type-to-symbol';
import { AttachedTypeNode } from './attached-type-node';
import { attachTypeToApplication } from './attach-type-to-application';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';

/**
 * Attach a type to each expression in the tree. Implicit parameters should be stripped from every child expression
 * before continuing. Therefore, each implicit will only exist in one place.
 */
export const attachTypes = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (expression: Expression): TypeResult<AttachedTypeNode> => {
  switch (expression.kind) {
    case 'SymbolExpression':
      return attachTypeToSymbol(scope)(expression);
    case 'BooleanExpression':
      return attachTypeToBoolean(scope)(expression);
    case 'NumberExpression':
      return attachTypeToNumber(scope)(expression);
    case 'StringExpression':
      return attachTypeToString(scope)(expression);
    case 'Identifier':
      return attachTypeToIdentifier(scope)(expression);
    case 'NativeExpression':
      return attachTypeToNative(scope)(makeUniqueId, expression);
    case 'RecordExpression': {
      const state = new TypeWriter(scope);
      const recordExpression = recordMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      const attachedTypeNode = state.run(attachTypeToRecord)(recordExpression);
      return state.wrap(attachedTypeNode);
    }

    case 'DataInstantiation':
      break;

    case 'FunctionExpression': {
      const state = new TypeWriter(scope);
      const functionExpression = state.append(attachTypeToFunctionChildren(scope)(expression)(attachTypes(makeUniqueId)));
      return state.wrap(state.append(attachTypeToFunction(scope)(functionExpression)));
    }

    case 'Application': {
      const state = new TypeWriter(scope);
      const applicationExpression = applicationMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      const attachedTypeNode = state.run(attachTypeToApplication(makeUniqueId))(applicationExpression);
      return state.wrap(attachedTypeNode);
    }

    case 'BindingExpression':
    case 'DualExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    default:
      break;
  }
}

const deepAttachTypes = (scope: Scope) => (makeUniqueId: UniqueIdGenerator) => (
  makeExpressionIterator(attachTypes(scope)(makeUniqueId))
);
