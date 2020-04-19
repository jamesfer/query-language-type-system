import {
  deferFree,
  flatMapFree,
  Free,
  mapFree, pipeFree,
  pureFree,
  returningFree,
  runFree,
  traverseFree,
} from './free';

const count = 1e6;

function countDown<T>(times: number, value: T): Free<T> {
  if (times === 1) {
    return pureFree(value);
  }

  return deferFree(() => countDown(times - 1, value));
}

function nestedCountDown<T>(outer: number, inner: number, value: T): Free<T> {
  if (outer === 1) {
    return pureFree(value);
  }

  return flatMapFree(countDown(inner, value), () => nestedCountDown(outer - 1, inner, value));
}

describe('free', () => {
  describe('maximumStackSize', () => {
    function recurse(n: number): number {
      if (n === 1) {
        return n;
      }
      return recurse(n - 1) + 1;
    }

    it('the count exceeds the maximum stack size', () => {
      expect(() => recurse(count)).toThrowError('Maximum call stack size exceeded');
    });
  });

  describe('runFree', () => {
    it('returns the value of a free', () => {
      expect(runFree(pureFree(1))).toBe(1);
    });

    it('waits for an uncompleted free to complete', () => {
      expect(runFree(countDown(100, 'Done'))).toBe('Done');
    });

    it('does not cause a stack overflow', () => {
      expect(runFree(countDown(count, 'Done'))).toBe('Done');
    });
  });

  describe('mapFree', () => {
    it('applies a function to a completed free', () => {
      const free = mapFree(countDown(10, 'Hello'), word => `${word} world`);
      expect(runFree(free)).toBe('Hello world');
    });

    it('does not cause a stack overflow', () => {
      const free = mapFree(countDown(count, 'Hello'), word => `${word} world`);
      expect(runFree(free)).toBe('Hello world');
    });
  });

  describe('flatMapFree', () => {
    it('applies a function to the completed free', () => {
      const free = flatMapFree(countDown(10, 'Hello'), word => countDown(5, `${word} world`));
      expect(runFree(free)).toBe('Hello world');
    });

    it('does not cause a stack overflow', () => {
      const free = flatMapFree(countDown(count, 'Hello'), word => countDown(count, `${word} world`));
      expect(runFree(free)).toBe('Hello world');
    });
  });

  describe('returningFree', () => {
    it('wraps a functions result in a free', () => {
      expect(runFree(returningFree(() => 'Hello')())).toBe('Hello');
    });
  });

  describe('traverseFree', () => {
    it('maps a list of inputs over a function', () => {
      expect(runFree(traverseFree([1, 2, 3], input => countDown(100, input + 1)))).toEqual([2, 3, 4]);
    });
  });

  describe('pipeFree', () => {
    it('chains consecutive operations to a free', () => {
      expect(runFree(pipeFree(
        pureFree(1),
        number => countDown(100, number * 10),
        returningFree(number => `message: ${number}`),
        message => countDown(20, [message, message.length]),
      ))).toEqual(['message: 10', 11]);
    });
  });

  describe('nested recursive free structures', () => {
    it.each([
      [10, count],
      [count, 10],
    ])('when outer loop is %d and inner loop is %d', (outer, inner) => {
      expect(runFree(nestedCountDown(outer, inner, 'Hello'))).toBe('Hello');
    });
  });
});
