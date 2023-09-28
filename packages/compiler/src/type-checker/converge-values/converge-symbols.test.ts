import { identifier, freeVariable, symbol } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { convergeSymbols } from './converge-symbols';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeSymbols', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    let messageState: StateRecorder<Message>;
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    beforeEach(() => {
      messageState = new StateRecorder<Message>();
    });

    it('returns no messages when symbols are equal', () => {
      expect(convergeSymbols(messageState, state, symbol('hello'), symbol('hello'))).toEqual([]);
      expect(messageState.values).toEqual([]);
    });

    it('returns a message when symbols are not equal', () => {
      expect(convergeSymbols(messageState, state, symbol('hello'), symbol('hEllo'))).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });
  });
});
