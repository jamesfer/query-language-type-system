import {
  applicationMapIterator,
  dualMapIterator,
  readDataPropertyMapIterator,
  readRecordPropertyMapIterator,
  recordMapIterator,
} from '../../desugar/iterators-specific';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { Expression, RecordExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { assertNever } from '../utils';
import { attachTypeToApplication } from './attach-type-to-application';
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
import { AttachTypesState } from './attach-types-state';
import { AttachedTypeNode } from './attached-type-node';

/**
 * Attach a type to each expression in the tree. Implicit parameters should be stripped from every child expression
 * before continuing. Therefore, each implicit will only exist in one place.
 */
const attachTypesWithState = (state: AttachTypesState, makeUniqueId: UniqueIdGenerator, scope: Scope, expression: Expression): AttachedTypeNode => {
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
    case 'RecordExpression':
      return attachTypeToRecord(scope)(
        recordMapIterator(attachTypesWithStateCurried(state, makeUniqueId)(scope))(expression),
      );

    case 'DataInstantiation':
      break;

    case 'FunctionExpression':
      return attachTypeToFunction(scope)(
        attachTypeToFunctionChildren(scope)(expression)(attachTypesWithStateCurried(state, makeUniqueId))
      );

    case 'Application':
      return attachTypeToApplication(state)(makeUniqueId)(scope)(
        applicationMapIterator(attachTypesWithStateCurried(state, makeUniqueId)(scope))(expression),
      );

    case 'DualExpression': {
      return attachTypeToDual(state)(scope)(
        dualMapIterator(attachTypesWithStateCurried(state, makeUniqueId)(scope))(expression),
      );
    }

    case 'BindingExpression':
      return attachTypeToBinding(state)(scope)(
        attachTypeToBindingChildren(scope)(expression)(attachTypesWithStateCurried(state, makeUniqueId)),
      );

    case 'ReadDataPropertyExpression':
      return attachTypeToReadDataProperty(state)(makeUniqueId)(scope)(
        readDataPropertyMapIterator(attachTypesWithStateCurried(state, makeUniqueId)(scope))(expression),
      );

    case 'ReadRecordPropertyExpression':
      return attachTypeToReadRecordProperty(state)(makeUniqueId)(scope)(
        readRecordPropertyMapIterator(attachTypesWithStateCurried(state, makeUniqueId)(scope))(expression),
      );

    case 'PatternMatchExpression': {

    }

    default:
      return assertNever(expression);
  }
}

const attachTypesWithStateCurried = (state: AttachTypesState, makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: Expression,
) => attachTypesWithState(state, makeUniqueId, scope, expression);

export const attachTypes = AttachTypesState.run(attachTypesWithState);
