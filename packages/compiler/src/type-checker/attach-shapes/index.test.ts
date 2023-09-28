import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import {
  apply,
  booleanExpression,
  booleanLiteral,
  freeVariable,
  functionType,
  identifier,
  lambda,
  node,
  numberExpression,
  numberLiteral,
  record,
  recordLiteral,
  stringExpression,
  stringLiteral,
  symbol,
  symbolExpression,
} from '../constructors';
import {
  prefixlessUniqueIdGenerator,
  staticUniqueIdGenerator,
} from '../test-utils/test-unique-id-generators';
import { Value } from '../types/value';
import { attachShapes, NamedNode } from './index';
import { Application, Expression, RecordExpression } from '../..';
import { InferredType } from '../types/inferred-type';

describe('attachShapes', () => {
  let uniqueIdGenerator: UniqueIdGenerator;
  let inferences: InferredType[];
  let namedNode: NamedNode;

  function makeSimpleNamedNode(
    shapeName: string,
    expression: Expression<NamedNode>,
    type: Value,
  ): NamedNode {
    return node(expression, { shapeName, type });
  }

  function evaluatedFrom(from: string, to: Value): InferredType {
    return {
      from,
      to,
      operator: 'EvaluatedFrom',
      origin: expect.anything(),
      inferrer: expect.anything(),
    };
  }

  function equals(from: string, to: Value): InferredType {
    return {
      from,
      to,
      operator: 'Equals',
      origin: expect.anything(),
      inferrer: expect.anything(),
    };
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
      ([inferences, namedNode] = attachShapes(uniqueIdGenerator, expression));
    });

    it('infers the type of the expression correctly', () => {
      expect(inferences).toEqual<InferredType[]>([
        evaluatedFrom(namedNode.decoration.shapeName, value),
      ]);
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
      ([inferences, namedNode] = attachShapes(recordUniqueIdGenerator, expression));
    });

    it('infers all the type variables', () => {
      expect(inferences).toEqual(expect.arrayContaining<InferredType>([
        evaluatedFrom(
          namedNode.decoration.shapeName,
          recordLiteral({ a: freeVariable('a'), b: freeVariable('b') }),
        ),
        evaluatedFrom('a', numberLiteral(7)),
        evaluatedFrom('b', stringLiteral('Hello')),
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

  describe.skip('when the expression is an application', () => {
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
      ([inferences, namedNode] = attachShapes(recordUniqueIdGenerator, expression));
    });

    it.each<[string, Value]>([
      ['lambdaParameter', freeVariable('x')],
      ['lambda', functionType(freeVariable('lambdaBody'), [freeVariable('lambdaParameter')])],
      ['numberLiteral', numberLiteral(123)],
      ['internalApplicationResult', freeVariable('application')],
      ['lambda', functionType(freeVariable('lambdaBody'), [freeVariable('lambdaParameter')])],
      // ['internalApplicationParameter', freeVariable('numberLiteral')],
    ])('creates a evaluatedFrom partial type for the %s variable', (from, to) => {
      expect(inferences).toContainEqual(evaluatedFrom(from, to));
    });

    it('creates a equals partial type for the lambda body', () => {
      expect(inferences).toContainEqual(equals('lambdaBody', stringLiteral('Hello')));
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

  // describe.each([false, true])('when the expression is a function and implicit is %s', (implicit) => {
  //   let expression: FunctionExpression;
  //
  //   beforeEach(() => {
  //     const recordUniqueIdGenerator = staticUniqueIdGenerator(['parameter', 'body', 'result', 'X', 'Y', 'Z', 'A']);
  //     expression = lambda(
  //       [[stringExpression('parameter'), implicit]],
  //       numberExpression(123),
  //     );
  //     ([inferences, namedNode] = attachShapes(recordUniqueIdGenerator, expression));
  //   });
  //
  //   it.each<[string, Value]>([
  //     ['result', functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]])],
  //     ['parameter', stringLiteral('parameter')],
  //     ['body', numberLiteral(123)],
  //   ])('infers the type of the %s variable', (from, to) => {
  //     expect(inferences).toContainEqual(evaluatedPair(
  //       { value: freeVariable(from), expression: expect.anything() },
  //       { value: to, expression: expect.anything() },
  //     ));
  //   });
  //
  //   it('produces the correct named node', () => {
  //     const expectedNode: FunctionExpression<NamedNode> = {
  //       ...expression,
  //       parameter: makeSimpleNamedNode('parameter', stringExpression('parameter'), stringLiteral('parameter')),
  //       body: makeSimpleNamedNode('body', numberExpression(123), numberLiteral(123)),
  //     };
  //     expect(namedNode).toEqual(makeSimpleNamedNode(
  //       'result',
  //       expectedNode,
  //       functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]]),
  //     ));
  //   });
  // });
});
