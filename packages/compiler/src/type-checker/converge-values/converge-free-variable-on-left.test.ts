import { freeVariable, identifier, numberLiteral } from '../constructors';
import { convergeFreeVariableOnLeft } from './converge-free-variable-on-left';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeFreeVariableOnLeft', () => {
  const partialState = {
    leftExpression: identifier('leftExpression'),
    leftEntireValue: freeVariable('left'),
    rightExpression: identifier('rightExpression'),
    rightEntireValue: freeVariable('right'),
  };

  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state = { ...partialState, direction };

    it('returns nothing if both sides are the same free variable', () => {
      expect(convergeFreeVariableOnLeft(state, freeVariable('x'), freeVariable('x'))).toEqual([[], []]);
    });
  });

  describe('when the right is a different value', () => {
    const right = numberLiteral(7);

    it('converges if the direction is either', () => {
      const state: ConvergeState = { ...partialState, direction: 'either' };
      expect(convergeFreeVariableOnLeft(state, freeVariable('x'), right)).toEqual([[], [expect.objectContaining({
        from: 'x',
        to: right,
      })]]);
    });

    it('returns an error message if the direction is not either', () => {
      const state: ConvergeState = { ...partialState, direction: 'leftSpecific' };
      expect(convergeFreeVariableOnLeft(state, freeVariable('x'), right)).toEqual([[expect.any(String)], []]);
    });
  });
});
