import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { apply, bind, identifier, lambda, numberExpression, numberLiteral } from './constructors';
import { checkTypes } from './index';
import { prefixlessUniqueIdGenerator } from './test-utils/test-unique-id-generators';
import { Expression } from './types/expression';
import { Message } from './types/message';
import { ResolvedNode } from './resolve-implicits';
import { pipe } from './utils';

describe('checkTypes', () => {
  describe('when checking an expression with inference', () => {
    let uniqueIdGenerator: UniqueIdGenerator;
    let expression: Expression;
    let messages: Message[];
    let node: ResolvedNode;

    beforeEach(() => {
      uniqueIdGenerator = prefixlessUniqueIdGenerator();
      expression = pipe(
        bind('number', numberExpression(123)),
        bind('identity', lambda([identifier('a')], identifier('a'))),
        apply(identifier('identity'), [identifier('number')]),
      );
      [messages, node] = checkTypes(uniqueIdGenerator, expression);
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the result', () => {
      expect(node.decoration.type).toEqual(numberLiteral(123));
    });
  });
});
