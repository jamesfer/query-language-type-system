import { identifier, booleanLiteral, freeVariable } from '../constructors';
import { convergeBooleans } from './converge-booleans';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeBooleans', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    it('returns no messages when booleans are equal', () => {
      expect(convergeBooleans(state, booleanLiteral(true), booleanLiteral(true))).toEqual([[], []]);
    });

    it('returns a message when booleans are not equal', () => {
      expect(convergeBooleans(state, booleanLiteral(true), booleanLiteral(false))).toEqual([[expect.any(String)], []]);
    });
  });
});
