import {
  apply,
  data, dataValue,
  evaluationScope,
  identifier,
} from './constructors';
import { evaluateExpression } from './evaluate';
import { Expression } from './types/expression';
import { Value } from './types/value';

describe('evaluate', () => {
  // it.each<[string, Expression, Value]>([
  //   ['number', { kind: 'NumberExpression', value: 1 }, { kind: 'NumberLiteral', value: 1 }],
  //   ['string', { kind: 'BooleanExpression', value: true }, { kind: 'BooleanLiteral', value: true }],
  // ])('evaluates a simple %s literal expression', (_, exp, value) => {
  //   expect(evaluateExpression(evaluationScope(), [
  //     expression(exp),
  //   ])).toEqual([value]);
  // });
  //
  // it('evaluates a function call', () => {
  //   expect(evaluateExpression(evaluationScope(), [
  //     data('c'),
  //     data('Tuple2', ['a', 'b']),
  //     data('Red', ['c']),
  //     data('Green', ['c']),
  //     func('go', [funcParam('a'), funcParam('b')], apply(identifier('Tuple2'), [identifier('a'), identifier('b')])),
  //     expression(apply(identifier('go'), [apply(identifier('Red'), [identifier('c')]), apply(identifier('Green'), [identifier('c')])])),
  //   ])).toEqual([dataValue('Tuple2', [dataValue('Red', [expect.anything()]), dataValue('Green', [expect.anything()])])])
  // });
});
