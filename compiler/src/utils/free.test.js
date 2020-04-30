"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const free_1 = require("./free");
const count = 1e6;
function countDown(times, value) {
    if (times === 1) {
        return free_1.pureFree(value);
    }
    return free_1.deferFree(() => countDown(times - 1, value));
}
function nestedCountDown(outer, inner, value) {
    if (outer === 1) {
        return free_1.pureFree(value);
    }
    return free_1.flatMapFree(countDown(inner, value), () => nestedCountDown(outer - 1, inner, value));
}
describe('free', () => {
    describe('maximumStackSize', () => {
        function recurse(n) {
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
            expect(free_1.runFree(free_1.pureFree(1))).toBe(1);
        });
        it('waits for an uncompleted free to complete', () => {
            expect(free_1.runFree(countDown(100, 'Done'))).toBe('Done');
        });
        it('does not cause a stack overflow', () => {
            expect(free_1.runFree(countDown(count, 'Done'))).toBe('Done');
        });
    });
    describe('mapFree', () => {
        it('applies a function to a completed free', () => {
            const free = free_1.mapFree(countDown(10, 'Hello'), word => `${word} world`);
            expect(free_1.runFree(free)).toBe('Hello world');
        });
        it('does not cause a stack overflow', () => {
            const free = free_1.mapFree(countDown(count, 'Hello'), word => `${word} world`);
            expect(free_1.runFree(free)).toBe('Hello world');
        });
    });
    describe('flatMapFree', () => {
        it('applies a function to the completed free', () => {
            const free = free_1.flatMapFree(countDown(10, 'Hello'), word => countDown(5, `${word} world`));
            expect(free_1.runFree(free)).toBe('Hello world');
        });
        it('does not cause a stack overflow', () => {
            const free = free_1.flatMapFree(countDown(count, 'Hello'), word => countDown(count, `${word} world`));
            expect(free_1.runFree(free)).toBe('Hello world');
        });
    });
    describe('returningFree', () => {
        it('wraps a functions result in a free', () => {
            expect(free_1.runFree(free_1.returningFree(() => 'Hello')())).toBe('Hello');
        });
    });
    describe('traverseFree', () => {
        it('maps a list of inputs over a function', () => {
            expect(free_1.runFree(free_1.traverseFree([1, 2, 3], input => countDown(100, input + 1)))).toEqual([2, 3, 4]);
        });
    });
    describe('pipeFree', () => {
        it('chains consecutive operations to a free', () => {
            expect(free_1.runFree(free_1.pipeFree(free_1.pureFree(1), number => countDown(100, number * 10), free_1.returningFree(number => `message: ${number}`), message => countDown(20, [message, message.length])))).toEqual(['message: 10', 11]);
        });
    });
    describe('nested recursive free structures', () => {
        it.each([
            [10, count],
            [count, 10],
        ])('when outer loop is %d and inner loop is %d', (outer, inner) => {
            expect(free_1.runFree(nestedCountDown(outer, inner, 'Hello'))).toBe('Hello');
        });
    });
});
//# sourceMappingURL=free.test.js.map