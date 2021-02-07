import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { converge, newFreeVariable } from '../type-utils';
import { PatternMatchExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

export const attachTypeToPatternMatch = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (
  expression: PatternMatchExpression<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  const valueType = shallowStripImplicits(expression.value.decoration.type);

  // Check that each test is the same type as the value
  expression.patterns.forEach((pattern, index) => {
    const testType = shallowStripImplicits(pattern.test.decoration.type);
    const testReplacements = converge(
      scope,
      // TODO write a test on a higher level that two tests cannot converge a value type to two different values
      valueType,
      testType,
    );
    if (!testReplacements) {
      state.log(`Test number ${index} is not the same type as the matched pattern`);
    } else {
      state.recordReplacements(testReplacements);
    }
  });

  // Check that each value in the pattern is compatible
  const patternValueType = expression.patterns.reduce<null | Value>(
    (previousPatternType, currentPattern) => {
      const currentPatternType = shallowStripImplicits(currentPattern.value.decoration.type);
      if (previousPatternType) {
        const replacements = converge(scope, previousPatternType, currentPatternType);
        if (!replacements) {
          state.log('Values of pattern match are not all the same type');
        } else {
          state.recordReplacements(replacements);
        }
      }

      return currentPatternType;
    },
    null,
  );

  if (expression.patterns.length === 0) {
    state.log('Pattern match expression must have at least one pattern');
  }

  return state.wrap(node(expression, {
    scope,
    type: patternValueType ?? newFreeVariable('unknown$', makeUniqueId),
  }))
}
