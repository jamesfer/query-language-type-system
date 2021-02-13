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
import { InferredType } from '../converge-values/converge-types';
import { prefixlessUniqueIdGenerator, staticUniqueIdGenerator } from '../test-utils/test-unique-id-generators';
import { Value } from '../types/value';
import { attachShapes, NamedNode } from './index';
import { Application, Expression, FunctionExpression, Message, RecordExpression } from '../..';

describe('attachShapes', () => {
  let uniqueIdGenerator: UniqueIdGenerator;

  function makeSimpleNamedNode(shapeName: string, expression: Expression<NamedNode>, type: Value): NamedNode {
    return node(expression, { shapeName, type });
  }

  beforeEach(() => {
    uniqueIdGenerator = prefixlessUniqueIdGenerator();
  });

  it.each<[string, Expression<any>, Value]>([
    ['number', numberExpression(7), numberLiteral(7)],
    ['boolean', booleanExpression(true), booleanLiteral(true)],
    ['string', stringExpression('Hello'), stringLiteral('Hello')],
    ['symbol', symbolExpression('X'), symbol('X')],
  ])('attaches the type of a %s expression', (_, expression, value) => {
    const [messages, inferredTypes, namedNode] = attachShapes(uniqueIdGenerator)(expression);
    expect(messages).toEqual([]);
    expect(inferredTypes).toEqual([{
      from: namedNode.decoration.shapeName,
      to: value,
    }]);
    expect(namedNode).toEqual(node(
      expression,
      {
        shapeName: expect.any(String),
        type: value,
      },
    ));
  });

  describe('when the expression is a record', () => {
    let expression: RecordExpression;
    let messages: Message[];
    let inferredTypes: InferredType[];
    let namedNode: NamedNode;

    beforeEach(() => {
      const recordUniqueIdGenerator = staticUniqueIdGenerator(['a', 'b', 'result']);
      expression = record({ a: numberExpression(7), b: stringExpression('Hello') });
      ([messages, inferredTypes, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
    });

    it('produces no messages', () => {
      expect(messages).toEqual([]);
    });

    it('infers all the type variables', () => {
      expect(inferredTypes).toEqual(expect.arrayContaining([
        {
          from: namedNode.decoration.shapeName,
          to: recordLiteral({ a: freeVariable('a'), b: freeVariable('b') }),
        },
        {
          from: 'a',
          to: numberLiteral(7),
        },
        {
          from: 'b',
          to: stringLiteral('Hello'),
        },
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
    let messages: Message[];
    let inferredTypes: InferredType[];
    let namedNode: NamedNode;

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
      ([messages, inferredTypes, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
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
      const inferredType = inferredTypes.find(inferred => inferred.from === from);
      expect(inferredType).toHaveProperty('from', from);
      expect(inferredType).toHaveProperty('to', to);
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

  describe('when the expression is a function', () => {
    let expression: FunctionExpression;
    let messages: Message[];
    let inferredTypes: InferredType[];
    let namedNode: NamedNode;

    describe.each([
      false,
      true,
    ])('and implicit is %s', (implicit) => {
      beforeEach(() => {
        const recordUniqueIdGenerator = staticUniqueIdGenerator(['parameter', 'body', 'result', 'X', 'Y', 'Z', 'A']);
        expression = lambda(
          [[stringExpression('parameter'), implicit]],
          numberExpression(123),
        );
        ([messages, inferredTypes, namedNode] = attachShapes(recordUniqueIdGenerator)(expression));
      });

      it('produces no messages', () => {
        expect(messages).toEqual([]);
      });

      it.each<[string, Value]>([
        ['result', functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]])],
        ['parameter', stringLiteral('parameter')],
        ['body', numberLiteral(123)],
      ])('infers the type of the %s variable', (from, to) => {
        expect(inferredTypes).toContainEqual({ from, to });
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
});
