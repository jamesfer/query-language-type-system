import {
  applicationMapIterator,
  dualMapIterator,
  makeExpressionIterator, readDataPropertyMapIterator, readRecordPropertyMapIterator,
  recordMapIterator,
} from '../../desugar/iterators-specific';
import { Scope } from '../types/scope';
import { Expression, RecordExpression } from '../types/expression';
import { TypeResult, TypeWriter } from '../monad-utils';
import { assertNever } from '../utils';
import { attachTypeToBinding } from './attach-type-to-binding';
import { attachTypeToBindingChildren } from './attach-type-to-binding-children';
import { attachTypeToBoolean } from './attach-type-to-boolean';
import { attachTypeToDual } from './attach-type-to-dual';
import { attachTypeToFunction } from './attach-type-to-function';
import { attachTypeToFunctionChildren } from './attach-type-to-function-children';
import { attachTypeToIdentifier } from './attach-type-to-identifier';
import { attachTypeToNative } from './attach-type-to-native';
import { attachTypeToNumber } from './attach-type-to-number';
import { attachTypeToReadDataProperty } from './attach-type-to-read-data-property';
import { attachTypeToReadRecordProperty } from './attach-type-to-read-record-property';
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

    case 'FunctionExpression':
      return new TypeWriter(scope).chain(
        attachTypeToFunctionChildren(scope)(expression)(attachTypes(makeUniqueId)),
        attachTypeToFunction(scope),
      );

    case 'Application': {
      const state = new TypeWriter(scope);
      const applicationExpression = applicationMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      return attachTypeToApplication(makeUniqueId)(state.scope)(applicationExpression);
    }

    case 'DualExpression': {
      const state = new TypeWriter(scope);
      const dualExpression = dualMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      return attachTypeToDual(state.scope)(dualExpression);
    }

    case 'BindingExpression':
      return new TypeWriter(scope).chain(
        attachTypeToBindingChildren(scope)(expression)(attachTypes(makeUniqueId)),
        attachTypeToBinding(scope),
      );

    case 'ReadDataPropertyExpression': {
      const state = new TypeWriter(scope);
      const readDataPropertyExpression = readDataPropertyMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      return attachTypeToReadDataProperty(makeUniqueId)(state.scope)(readDataPropertyExpression);
    }

    case 'ReadRecordPropertyExpression': {
      const state = new TypeWriter(scope);
      const readRecordPropertyExpression = readRecordPropertyMapIterator(state.run(attachTypes(makeUniqueId)))(expression);
      return attachTypeToReadRecordProperty(makeUniqueId)(state.scope)(readRecordPropertyExpression);
    }

    case 'PatternMatchExpression':
      break;

    default:
      return assertNever(expression);
  }
}

const deepAttachTypes = (scope: Scope) => (makeUniqueId: UniqueIdGenerator) => (
  makeExpressionIterator(attachTypes(scope)(makeUniqueId))
);
