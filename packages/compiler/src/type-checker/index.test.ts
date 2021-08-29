import { UniqueIdGenerator, uniqueIdStream } from '../utils/unique-id-generator';
import {
  apply,
  bind,
  data,
  identifier,
  lambda, numberExpression,
  numberLiteral, record,
} from './constructors';
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
        bind('number', 123),
        bind('identity', lambda(['a'], 'a')),
        apply('identity', ['number']),
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

  describe('when checking an unused expression with implicit parameters', () => {
    let uniqueIdGenerator: UniqueIdGenerator;
    let expression: Expression;
    let messages: Message[];
    let node: ResolvedNode;

    beforeEach(() => {
      uniqueIdGenerator = prefixlessUniqueIdGenerator();
      expression = pipe(
        data('Integer', ['a']),
        bind('integerIdentity', lambda([[apply('Integer', ['b']), true], identifier('b')], identifier('b'))),
        numberExpression(1),
      );
      [messages, node] = checkTypes(uniqueIdGenerator, expression);
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the result', () => {
      expect(node.decoration.type).toEqual(numberLiteral(1));
    });
  });

  describe('when checking an expression with implicit parameters', () => {
    let uniqueIdGenerator: UniqueIdGenerator;
    let expression: Expression;
    let messages: Message[];
    let node: ResolvedNode;

    beforeEach(() => {
      uniqueIdGenerator = uniqueIdStream();
      expression = pipe(
        data('Integer', ['a']),
        bind('integerIdentity', lambda([[apply('Integer', ['b']), true], identifier('b')], identifier('b'))),
        apply('integerIdentity', [1]),
      );
      [messages, node] = checkTypes(uniqueIdGenerator, expression);
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the result', () => {
      expect(node.decoration.type).toEqual(numberLiteral(1));
    });
  });

  describe('when checking an expression with functions converging', () => {
    let uniqueIdGenerator: UniqueIdGenerator;
    let expression: Expression;
    let messages: Message[];
    let node: ResolvedNode;

    beforeEach(() => {
      uniqueIdGenerator = prefixlessUniqueIdGenerator();
      expression = pipe(
        data('Integer', ['a']),
        bind('integerIdentity', lambda([[apply('Integer', ['b']), true], identifier('b')], identifier('b'))),
        bind('mapInteger', lambda(
          [
            [apply('Integer', ['c']), true],
            identifier('c'),
            lambda(
              [
                [apply('Integer', ['d']), true],
                identifier('d'),
              ],
              identifier('d'),
            ),
          ],
          identifier('c'),
        )),
        apply('mapInteger', [1, 'integerIdentity']),
      );
      [messages, node] = checkTypes(uniqueIdGenerator, expression);
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the result', () => {
      expect(node.decoration.type).toEqual(numberLiteral(1));
    });
  });

  describe('when checking an expression with a typeclass', () => {
    let uniqueIdGenerator: UniqueIdGenerator;
    let expression: Expression;
    let messages: Message[];
    let node: ResolvedNode;

    beforeEach(() => {
      uniqueIdGenerator = uniqueIdStream();

      expression = pipe(
        data('Integer', ['a']),
        data('IAddable', ['I', 'methods'], [
          'x',
          record({
            go: lambda(
              [
                apply('I', ['n']),
                'n',
              ],
              'n',
            ),
          }),
        ]),
        bind('integerIdentity', lambda([apply('Integer', ['b']), 'b'], 'b')),
        bind('implementation', apply('IAddable', ['Integer', record({ go: identifier('integerIdentity') })])),
        numberExpression(111111),
      );
      [messages, node] = checkTypes(uniqueIdGenerator, expression);
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the result', () => {
      expect(node.decoration.type).toEqual(numberLiteral(111111));
    });
  });
});
