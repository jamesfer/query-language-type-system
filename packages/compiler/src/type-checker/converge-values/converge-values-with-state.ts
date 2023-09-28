import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { assertNever } from '../utils';
import { convergeApplications } from './converge-applications';
import { convergeBooleans } from './converge-booleans';
import { convergeDataValues } from './converge-data-values';
import { convergeDualBindingOnLeft } from './converge-dual-binding-on-left';
import { convergeDualBindingOnRight } from './converge-dual-binding-on-right';
import { convergeFreeVariableOnLeft } from './converge-free-variable-on-left';
import { convergeFreeVariableOnRight } from './converge-free-variable-on-right';
import { convergeFunctions } from './converge-functions';
import { convergeImplicitFunctions } from './converge-implicit-functions';
import { convergeNumbers } from './converge-numbers';
import { convergeRecords } from './converge-records';
import { convergeStrings } from './converge-strings';
import { convergeSymbols } from './converge-symbols';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';

export const convergeValuesWithState = (
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  leftValue: Value,
  rightValue: Value,
): InferredType[] => {
  if (rightValue.kind === 'FreeVariable') {
    return convergeFreeVariableOnRight(state, leftValue, rightValue);
  }

  if (leftValue.kind === 'FreeVariable') {
    return convergeFreeVariableOnLeft(messageState, state, leftValue, rightValue);
  }

  if (leftValue.kind === 'DualBinding') {
    return convergeDualBindingOnLeft(messageState, state, leftValue, rightValue);
  }

  if (rightValue.kind === 'DualBinding') {
    return convergeDualBindingOnRight(messageState, state, leftValue, rightValue);
  }

  if (leftValue.kind === 'ImplicitFunctionLiteral') {
    return convergeImplicitFunctions(messageState, state, leftValue, rightValue);
  }

  if (rightValue.kind === 'ImplicitFunctionLiteral') {
    return convergeImplicitFunctions(messageState, state, rightValue, leftValue);
  }

  switch (leftValue.kind) {
    case 'DataValue':
      return convergeDataValues(messageState, state, leftValue, rightValue);
    case 'RecordLiteral':
      return convergeRecords(messageState, state, leftValue, rightValue);
    case 'ApplicationValue':
      return convergeApplications(messageState, state, leftValue, rightValue);
    case 'FunctionLiteral':
      return convergeFunctions(messageState, state, leftValue, rightValue);
    case 'SymbolLiteral':
      return convergeSymbols(messageState, state, leftValue, rightValue);
    case 'BooleanLiteral':
      return convergeBooleans(messageState, state, leftValue, rightValue);
    case 'NumberLiteral':
      return convergeNumbers(messageState, state, leftValue, rightValue);
    case 'StringLiteral':
      return convergeStrings(messageState, state, leftValue, rightValue);
    case 'ReadDataValueProperty':
    case 'ReadRecordProperty':
    case 'PatternMatchValue':
      return mismatchResult(messageState, state, leftValue, rightValue);

    default:
      return assertNever(leftValue);
  }
};
