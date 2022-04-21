import { map, zip } from 'fp-ts/Array';
import { Either, left as leftE, right as rightE } from 'fp-ts/Either';
import { absurd, pipe, tupled } from 'fp-ts/function';
import { isEmpty, map as mapR, separate as separateR } from 'fp-ts/Record';
import { mapLeft as mapLeftS } from 'fp-ts/Separated';
import { isBoth } from 'fp-ts/These';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
import {
  equalsPartialType,
  evaluatesToPartialType,
  NamedPartialType,
  PartialType,
} from './partial-type';
import { zipRecords } from './utils/zip-records';
import { shallowExtractImplicits } from '../utils/shallow-extract-implicits';
import { functionType } from '../constructors';

const exactlyMergeTypesWithState = (
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
) => (
  left: Value,
  right: Value,
): Value => {
  const exactlyMergeTypes = exactlyMergeTypesWithState(messageState, assumptionsState);

  if (left.kind === 'FreeVariable') {
    assumptionsState.push(leftE({
      from: left.name,
      operator: 'Equals',
      to: right,
    }));
    return right;
  }

  if (right.kind === 'FreeVariable') {
    assumptionsState.push(rightE({
      from: right.name,
      operator: 'Equals',
      to: left,
    }));
    return left;
  }

  switch (left.kind) {
    case 'SymbolLiteral': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (right.name !== left.name) {
        messageState.push('Type values are different');
        return left;
      }

      return left;
    }

    case 'BooleanLiteral':
    case 'NumberLiteral':
    case 'StringLiteral': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (right.value !== left.value) {
        messageState.push('Type values are different');
        return left;
      }

      return left;
    }

    case 'RecordLiteral': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      const newProperties = pipe(
        zipRecords(left.properties, right.properties),
        mapR(x => isBoth(x) ? rightE(x) : leftE(x)),
        separateR,
        mapLeftS((unevenProperties): void => {
          if (!isEmpty(unevenProperties)) {
            messageState.push('Uneven properties');
          }
        }),
        s => s.right,
        mapR(both => exactlyMergeTypes(both.left, both.right)),
      );

      return {
        kind: 'RecordLiteral',
        properties: newProperties,
      };
    }

    case 'DataValue': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (left.parameters.length !== right.parameters.length) {
        messageState.push('Types are different');
      }

      const name = exactlyMergeTypes(left.name, right.name);
      const parameters = pipe(
        zip(left.parameters)(right.parameters),
        map(tupled(exactlyMergeTypes)),
      );
      return { name, parameters, kind: 'DataValue' };
    }

    case 'DualBinding': {
      const combined = exactlyMergeTypes(left.left, left.right);
      return exactlyMergeTypes(combined, right);
    }

    case 'ApplicationValue': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      const callee = exactlyMergeTypes(left.callee, right.callee);
      const parameter = exactlyMergeTypes(left.parameter, right.parameter);
      return { callee, parameter, kind: 'ApplicationValue' };
    }

    case 'ReadDataValueProperty': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (left.property !== right.property) {
        messageState.push('Data value properties read are different');
        return left;
      }

      const dataValue = exactlyMergeTypes(left.dataValue, right.dataValue);
      return { ...left, dataValue };
    }

    case 'ReadRecordProperty': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (left.property !== right.property) {
        messageState.push('Record properties read are different');
        return left;
      }

      const record = exactlyMergeTypes(left.record, right.record);
      return { ...left, record };
    }

    case 'FunctionLiteral': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      const parameter = exactlyMergeTypes(left.parameter, right.parameter);
      const body = exactlyMergeTypes(left.body, right.body);
      return { ...left, parameter, body };
    }

    case 'ImplicitFunctionLiteral': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      const parameter = exactlyMergeTypes(left.parameter, right.parameter);
      const body = exactlyMergeTypes(left.body, right.body);
      return { ...left, parameter, body };
    }

    case 'PatternMatchValue': {
      if (right.kind !== left.kind) {
        messageState.push('Types are different');
        return left;
      }

      if (left.patterns.length !== right.patterns.length) {
        messageState.push('Pattern counts are different');
        return left;
      }

      const value = exactlyMergeTypes(left.value, right.value);
      const patterns = zip(left.patterns)(right.patterns).map(([leftPattern, rightPattern]) => {
        const test = exactlyMergeTypes(leftPattern.test, rightPattern.test);
        const value = exactlyMergeTypes(leftPattern.value, rightPattern.value);
        return { test, value };
      });
      return { ...left, value, patterns };
    }

    default:
      return absurd(left);
  }
}

/**
 * strip implicits from left
 * if left is a freeVariable, then (left.value.name evaluatesTo right.value)
 * else converge
 */
function stripLeftImplicitsAndConverge(
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
  left: PartialType,
  right: PartialType,
): PartialType {
  const leftValue = shallowStripImplicits(left.to);

  if (leftValue.kind === 'FreeVariable') {
    assumptionsState.push(leftE(evaluatesToPartialType(leftValue.name, right.to)));
    return left;
  }

  // converge
  return equalsPartialType(exactlyMergeTypesWithState(
    messageState,
    assumptionsState,
  )(
    leftValue,
    right.to,
  ));
}

function stripAndRestoreLeftImplicitsAndConverge(
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
  left: PartialType,
  right: PartialType,
): PartialType {
  const [leftValue, implicits] = shallowExtractImplicits(left.to);

  if (leftValue.kind === 'FreeVariable') {
    assumptionsState.push(leftE(evaluatesToPartialType(leftValue.name, right.to)));
    return left;
  }

  // converge
  const convergedValue = exactlyMergeTypesWithState(
    messageState,
    assumptionsState,
  )(
    leftValue,
    right.to,
  );
  return equalsPartialType(functionType(convergedValue, implicits.map(implicit => [implicit, true])));
}

/**
 * strip implicits from right
 * if right is freeVariable, then (right.value.name evaluatesTo left.value)
 * else converge
 */
function stripRightImplicitsAndConverge(
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
  left: PartialType,
  right: PartialType,
): PartialType {
  const rightValue = shallowStripImplicits(right.to);

  if (rightValue.kind === 'FreeVariable') {
    assumptionsState.push(rightE(evaluatesToPartialType(rightValue.name, left.to)));
    return right;
  }

  // converge
  return equalsPartialType(exactlyMergeTypesWithState(
    messageState,
    assumptionsState,
  )(
    left.to,
    rightValue,
  ));
}

function stripAndRestoreRightImplicitsAndConverge(
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
  left: PartialType,
  right: PartialType,
): PartialType {
  const [rightValue, implicits] = shallowExtractImplicits(right.to);

  if (rightValue.kind === 'FreeVariable') {
    assumptionsState.push(rightE(evaluatesToPartialType(rightValue.name, left.to)));
    return right;
  }

  // converge
  const convergedValue = exactlyMergeTypesWithState(
    messageState,
    assumptionsState,
  )(
    left.to,
    rightValue,
  );
  return equalsPartialType(functionType(convergedValue, implicits.map(implicit => [implicit, true])));
}

export function mergePartialTypes(
  messageState: StateRecorder<Message>,
  assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>,
  left: PartialType,
  right: PartialType,
): PartialType {
  const exactlyMergeTypes = exactlyMergeTypesWithState(messageState, assumptionsState);

  switch (left.operator) {
    case 'Equals':
      switch (right.operator) {
        case 'Equals':
          return equalsPartialType(exactlyMergeTypes(left.to, right.to));
        case 'EvaluatesTo':
          return stripAndRestoreLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
        case 'EvaluatedFrom':
          return stripRightImplicitsAndConverge(messageState, assumptionsState, left, right);
        default:
          return absurd(right.operator);
      }
    case 'EvaluatesTo':
      switch (right.operator) {
        case 'Equals':
          return stripAndRestoreRightImplicitsAndConverge(messageState, assumptionsState, left, right);
        case 'EvaluatesTo':
          return equalsPartialType(exactlyMergeTypes(left.to, right.to));
        case 'EvaluatedFrom':
          return stripRightImplicitsAndConverge(messageState, assumptionsState, left, right);
        default:
          return absurd(right.operator);
      }
    case 'EvaluatedFrom':
      switch (right.operator) {
        case 'Equals':
          return stripLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
        case 'EvaluatesTo':
          return stripLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
        case 'EvaluatedFrom':
          return equalsPartialType(exactlyMergeTypes(left.to, right.to));
        default:
          return absurd(right.operator);
      }
    default:
      return absurd(left.operator);
  }
}
