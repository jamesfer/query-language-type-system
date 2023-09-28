"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tap_first_1 = require("./tap-first");
describe('tapFirst', () => {
    it('returns a function that calls the given one', () => {
        const fn = jest.fn();
        tap_first_1.tapFirst(fn)(7, 'hello');
        expect(fn).toHaveBeenCalledWith(7, 'hello');
    });
    it('returns the exact same copy of the first argument', () => {
        const object = {};
        const fn = jest.fn((obj, string) => { obj['a'] = string; });
        const result = tap_first_1.tapFirst(fn)(object, 'hello');
        expect(result).toBe(object);
        expect(result).toEqual({ a: 'hello' });
    });
});
//# sourceMappingURL=tap-first.test.js.map