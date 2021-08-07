import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import {
  application,
  apply,
  booleanExpression,
  booleanLiteral, freeVariable, lambda,
  node,
  numberExpression,
  numberLiteral, record, recordLiteral,
  stringExpression, stringLiteral, symbol, symbolExpression, functionType, identifier,
} from '../constructors';
import { prefixlessUniqueIdGenerator, staticUniqueIdGenerator } from '../test-utils/test-unique-id-generators';
import { Value } from '../types/value';
import { attachShapes, NamedNode } from './index';
import { Application, Expression, FunctionExpression, Message, RecordExpression } from '../..';

describe('attachShapes', () => {
  let uniqueIdGenerator: UniqueIdGenerator;
  let messages: Message[];
  let inferences: [Value, Expression, Value, Expression][];
  let namedNode: NamedNode;

  function makeSimpleNamedNode(shapeName: string, expression: Expression<NamedNode>, type: Value): NamedNode {
    return node(expression, { shapeName, type });
  }

  beforeEach(() => {
    uniqueIdGenerator = prefixlessUniqueIdGenerator();
  });

  describe.each<[string, Expression<any>, Value]>([
    ['number', numberExpression(7), numberLiteral(7)],
    ['boolean', booleanExpression(true), booleanLiteral(true)],
    ['string', stringExpression('Hello'), stringLiteral('Hello')],
    ['symbol', symbolExpression('X'), symbol('X')],
  ])('when called on a %s expression', (_, expression, value) => {
    beforeEach(() => {
      ([messages, inferences, namedNode] = attachShapes(uniqueIdGenerator)(expression));
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers the type of the expression correctly', () => {
      expect(inferences).toEqual([[
        freeVariable(namedNode.decoration.shapeName),
        expect.anything(),
        value,
        expect.anything(),
      ]]);
    });

    it('decorates the node with the name and type', () => {
      expect(namedNode).toEqual(node(
        expression,
        {
          shapeName: expect.any(String),
          type: value,
        },
      ));
    });
  });

  describe('when the expression is a record', () => {
    let expression: RecordExpression;

    beforeEach(() => {
      const recordUniqueIdGenerator = staticUniqueIdGenerator(['a', 'b', 'result']);
      expression = record({ a: numberExpression(7), b: stringExpression('Hello') });
      ([messages, inferences, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers all the type variables', () => {
      expect(inferences).toEqual(expect.arrayContaining([
        [
          freeVariable(namedNode.decoration.shapeName),
          expect.anything(),
          recordLiteral({ a: freeVariable('a'), b: freeVariable('b') }),
          expect.anything(),
        ],
        [
          freeVariable('a'),
          expect.anything(),
          numberLiteral(7),
          expect.anything(),
        ],
        [
          freeVariable('b'),
          expect.anything(),
          stringLiteral('Hello'),
          expect.anything(),
        ],
      ]));
    });

    it('produces the correct named node', () => {
      const expectedExpression: RecordExpression<NamedNode> = {
        ...expression,
        properties: {
          a: makeSimpleNamedNode('a', numberExpression(7), numberLiteral(7)),
          b: makeSimpleNamedNode('b', stringExpression('Hello'), stringLiteral('Hello')),
        },
      };
      expect(namedNode).toEqual(makeSimpleNamedNode(
        namedNode.decoration.shapeName,
        expectedExpression,
        recordLiteral({ a: freeVariable('a'), b: freeVariable('b') }),
      ));
    });
  });

  describe('when the expression is an application', () => {
    let expression: Application;

    beforeEach(() => {
      const recordUniqueIdGenerator = staticUniqueIdGenerator([
        'lambdaParameter',
        'lambdaBody',
        'lambda',
        'numberLiteral',
        'application',
        'internalApplicationResult',
        'internalApplicationParameter',
      ]);
      expression = apply(
        lambda([identifier('x')], stringExpression('Hello')),
        numberExpression(123),
      );
      ([messages, inferences, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it.each<[string, Value]>([
      ['lambdaParameter', freeVariable('x')],
      ['lambdaBody', stringLiteral('Hello')],
      ['lambda', functionType(freeVariable('lambdaBody'), [freeVariable('lambdaParameter')])],
      ['numberLiteral', numberLiteral(123)],
      ['application', freeVariable('internalApplicationResult')],
      ['lambda', functionType(freeVariable('lambdaBody'), [freeVariable('lambdaParameter')])],
      ['internalApplicationParameter', freeVariable('numberLiteral')],
    ])('infers the type of the %s variable', (from, to) => {
      expect(inferences).toContainEqual(expect.arrayContaining([freeVariable(from), expect.anything(), to, expect.anything()]));
    });

    it('produces the correct named node', () => {
      const expectedExpression: Application<NamedNode> = {
        ...expression,
        callee: makeSimpleNamedNode(
          'lambda',
          expect.anything(),
          functionType(freeVariable('lambdaBody'), [freeVariable('lambdaParameter')]),
        ),
        parameter: makeSimpleNamedNode('numberLiteral', numberExpression(123), numberLiteral(123)),
      };
      expect(namedNode).toEqual(makeSimpleNamedNode(
        'application',
        expectedExpression,
        freeVariable('internalApplicationResult'),
      ));
    });
  });

  describe.each([false, true])('when the expression is a function and implicit is %s', (implicit) => {
    let expression: FunctionExpression;

    beforeEach(() => {
      const recordUniqueIdGenerator = staticUniqueIdGenerator(['parameter', 'body', 'result', 'X', 'Y', 'Z', 'A']);
      expression = lambda(
        [[stringExpression('parameter'), implicit]],
        numberExpression(123),
      );
      ([messages, inferences, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it.each<[string, Value]>([
      ['result', functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]])],
      ['parameter', stringLiteral('parameter')],
      ['body', numberLiteral(123)],
    ])('infers the type of the %s variable', (from, to) => {
      expect(inferences).toContainEqual([freeVariable(from), expect.anything(), to, expect.anything()]);
    });

    it('produces the correct named node', () => {
      const expectedNode: FunctionExpression<NamedNode> = {
        ...expression,
        parameter: makeSimpleNamedNode('parameter', stringExpression('parameter'), stringLiteral('parameter')),
        body: makeSimpleNamedNode('body', numberExpression(123), numberLiteral(123)),
      };
      expect(namedNode).toEqual(makeSimpleNamedNode(
        'result',
        expectedNode,
        functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]]),
      ));
    });
  });
});
