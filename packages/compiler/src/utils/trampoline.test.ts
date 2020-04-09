import {
  flatMapTrampoline,
  mapTrampoline,
  pureTrampoline,
  runTrampoline,
  Trampoline,
} from './trampoline';

function countDown<T>(times: number, value: T): Trampoline<T> {
  return () => {
    if (times === 1) {
      return { done: value };
    }

    return { bounce: countDown(times - 1, value) };
  }
}

function nestedCountDown<T>(outer: number, inner: number, value: T): Trampoline<T> {
  if (outer === 1) {
    return pureTrampoline(value);
  }

  return flatMapTrampoline(countDown(inner, value), () => nestedCountDown(outer - 1, inner, value));
}

const count = 1e6;

describe('trampoline', () => {
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

  describe('runTrampoline', () => {
    it('returns the value of a trampoline', () => {
      expect(runTrampoline(() => ({ done: 1 }))).toEqual(1);
    });

    it('waits for an uncompleted trampoline to complete', () => {
      expect(runTrampoline(countDown(100, 'Done'))).toEqual('Done');
    });

    it('does not cause a stack overflow', () => {
      expect(runTrampoline(countDown(count, 'Done'))).toEqual('Done');
    });
  });

  describe('pureTrampoline', () => {
    it('immediately completes the trampoline with the value', () => {
      expect(pureTrampoline(1)()).toEqual({ done: 1 });
    });
  });

  describe('mapTrampoline', () => {
    it('applies a function to a completed trampoline', () => {
      const trampoline = mapTrampoline(countDown(10, 'Hello'), word => `${word} world`);
      expect(runTrampoline(trampoline)).toEqual('Hello world');
    });

    it('does not cause a stack overflow', () => {
      const trampoline = mapTrampoline(countDown(count, 'Hello'), word => `${word} world`);
      expect(runTrampoline(trampoline)).toEqual('Hello world');
    });
  });

  describe('flatMapTrampoline', () => {
    it('applies a function to the completed trampoline', () => {
      const trampoline = flatMapTrampoline(countDown(10, 'Hello'), word => countDown(5, `${word} world`));
      expect(runTrampoline(trampoline)).toEqual('Hello world');
    });

    it('does not cause a stack overflow', () => {
      const trampoline = flatMapTrampoline(countDown(count, 'Hello'), word => countDown(count, `${word} world`));
      expect(runTrampoline(trampoline)).toEqual('Hello world');
    });
  });

  describe('n', () => {
    it('10, count', () => {
      expect(runTrampoline(nestedCountDown(10, count, 'Hello'))).toEqual('Hello');
    });

    it('count, 10', () => {
      expect(runTrampoline(nestedCountDown(count, 10, 'Hello'))).toEqual('Hello');
    });
  });

  describe('m', () => {
    function r(n: number): Trampoline<number> {
      if (n === 1) {
        return pureTrampoline(n);
      }

      return mapTrampoline(r(n - 1), x => x + n);
    }

    it('f', () => {
      expect(() => r(count)).toThrowError('Maximum call stack size exceeded');
    });

    type TrampolineCore<T> = { bounce: () => TrampolineCore<T> } | { done: T };

    type Trampoline2<T> = { deferred: ((a: any) => Trampoline2<any>)[], value: TrampolineCore<any> };

    function pureTrampoline2<T>(value: T): Trampoline2<T> {
      return { deferred: [], value: { done: value } };
    }

    function deferTrampoline2<T>(f: () => Trampoline2<T>): Trampoline2<T> {
      return { deferred: [f], value: { done: undefined } };
    }

    function mapTrampoline2<A, B>(trampoline: Trampoline2<A>, f: (a: A) => B): Trampoline2<B> {
      return {
        value: trampoline.value,
        deferred: [(a: A) => pureTrampoline2(f(a)), ...trampoline.deferred],
      };
      // const result = trampoline;
      // if ('done' in result) {
      //   return { deferred: };
      // }
      //
      // process.stdout.write('mapTrampoline bounce\n');
      // return {
      //   bounce: () => {
      //     process.stdout.write('mapTrampoline bounceFn\n');
      //     const bounced = result.bounce();
      //     process.stdout.write('mapTrampoline bounceFn afterBounce\n');
      //     return mapTrampoline2(bounced, f)
      //   },
      // };
    }

    function runTrampoline2<T>({ deferred, value }: Trampoline2<T>): T {
      let queue = deferred;
      let result = value;
      while (true) {
        while ('bounce' in result) {
          result = result.bounce();
        }

        const nextInQueue = queue.pop();
        if (!nextInQueue) {
          break;
        }

        const nextTrampoline = nextInQueue(result.done);
        result = nextTrampoline.value;
        queue.push(...nextTrampoline.deferred);
      }

      return result.done;
    }

    function r2(n: number): Trampoline2<number> {
      if (n === 1) {
        return pureTrampoline2(n);
      }

      return mapTrampoline2(deferTrampoline2(() => r2(n - 1)), x => x + n);
      // return {
      //   bounce: () => {
      //     process.stdout.write('r2 ' + n + ' bounceFn\n');
      //     const recursed = r2(n - 1);
      //     process.stdout.write('r2 ' + n + ' after recurse\n');
      //     return mapTrampoline2(recursed, x => x + n)
      //   },
      // };
    }

    it('f2', () => {
      expect(runTrampoline2(r2(1e6))).toBe(100);
    });


    it('rFree', () => {
      expect(runFree(rFree(1e8))).toBe(10);
    })
  });
});
