import { freeVariable, identifier, numberLiteral } from '../constructors';
import { convergeFreeVariableOnRight } from './converge-free-variable-on-right';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeFreeVariableOnRight', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    it('returns nothing if both sides are the same free variable', () => {
      expect(convergeFreeVariableOnRight(state, freeVariable('x'), freeVariable('x'))).toEqual([]);
    });

    it.skip('returns an inferred type if the left is anything else', () => {
      const [messages, inferredTypes] = convergeFreeVariableOnRight(state, numberLiteral(7), freeVariable('x'));
      expect(messages).toEqual([]);
      expect(inferredTypes).toEqual([expect.objectContaining({
        from: 'x',
        to: numberLiteral(7),
      })]);
    });
  });
});
