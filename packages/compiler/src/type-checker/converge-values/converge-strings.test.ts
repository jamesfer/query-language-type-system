import { identifier, freeVariable, stringLiteral } from '../constructors';
import { convergeStrings } from './converge-strings';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeStrings', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    it('returns no messages when strings are equal', () => {
      expect(convergeStrings(state, stringLiteral('hello'), stringLiteral('hello'))).toEqual([[], []]);
    });

    it('returns a message when strings are not equal', () => {
      expect(convergeStrings(
        state,
        stringLiteral('hello'),
        stringLiteral('hEllo')
      )).toEqual([[expect.any(String)], []]);
    });
  });
});
