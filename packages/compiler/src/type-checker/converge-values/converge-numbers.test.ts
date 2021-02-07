import { identifier, freeVariable, numberLiteral } from '../constructors';
import { convergeNumbers } from './converge-numbers';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeNumbers', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    it('returns no messages when numbers are equal', () => {
      expect(convergeNumbers(state, numberLiteral(7), numberLiteral(7))).toEqual([[], []]);
    });

    it('returns a message when numbers are not equal', () => {
      expect(convergeNumbers(state, numberLiteral(7), numberLiteral(8))).toEqual([[expect.any(String)], []]);
    });
  });
});
