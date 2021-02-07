import { identifier, freeVariable, symbol } from '../constructors';
import { convergeSymbols } from './converge-symbols';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeSymbols', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    it('returns no messages when symbols are equal', () => {
      expect(convergeSymbols(state, symbol('hello'), symbol('hello'))).toEqual([[], []]);
    });

    it('returns a message when symbols are not equal', () => {
      expect(convergeSymbols(state, symbol('hello'), symbol('hEllo'))).toEqual([[expect.any(String)], []]);
    });
  });
});
