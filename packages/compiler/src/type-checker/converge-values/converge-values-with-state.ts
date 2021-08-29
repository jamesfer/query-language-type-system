import { Value } from '../types/value';
import { assertNever } from '../utils';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
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
import { ConvergeResult, ConvergeState } from './converge-types';
import { mismatchResult } from './converge-utils';

export const convergeValuesWithState = (
  state: ConvergeState,
  leftValue: Value,
  rightValue: Value,
): ConvergeResult => {
  if (rightValue.kind === 'FreeVariable') {
    return convergeFreeVariableOnRight(state, leftValue, rightValue);
  }

  if (leftValue.kind === 'FreeVariable') {
    return convergeFreeVariableOnLeft(state, leftValue, rightValue);
  }

  if (leftValue.kind === 'DualBinding') {
    return convergeDualBindingOnLeft(state, leftValue, rightValue);
  }

  if (rightValue.kind === 'DualBinding') {
    return convergeDualBindingOnRight(state, leftValue, rightValue);
  }

  if (leftValue.kind === 'ImplicitFunctionLiteral') {
    return convergeImplicitFunctions(state, leftValue, rightValue);
  }

  if (rightValue.kind === 'ImplicitFunctionLiteral') {
    return convergeImplicitFunctions(state, rightValue, leftValue);
  }

  switch (leftValue.kind) {
    case 'DataValue':
      return convergeDataValues(state, leftValue, rightValue);
    case 'RecordLiteral':
      return convergeRecords(state, leftValue, rightValue);
    case 'ApplicationValue':
      return convergeApplications(state, leftValue, rightValue);
    case 'FunctionLiteral':
      return convergeFunctions(state, leftValue, rightValue);
    case 'SymbolLiteral':
      return convergeSymbols(state, leftValue, rightValue);
    case 'BooleanLiteral':
      return convergeBooleans(state, leftValue, rightValue);
    case 'NumberLiteral':
      return convergeNumbers(state, leftValue, rightValue);
    case 'StringLiteral':
      return convergeStrings(state, leftValue, rightValue);
    case 'ReadDataValueProperty':
    case 'ReadRecordProperty':
    case 'PatternMatchValue':
      return mismatchResult(state, leftValue, rightValue);

    default:
      return assertNever(leftValue);
  }
};
