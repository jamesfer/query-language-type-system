import { tapFirst } from './tap-first';

describe('tapFirst', () => {
  it('returns a function that calls the given one', () => {
    const fn = jest.fn<void, [number, string]>();
    tapFirst(fn)(7, 'hello');
    expect(fn).toHaveBeenCalledWith(7, 'hello');
  });

  it('returns the exact same copy of the first argument', () => {
    const object: { a?: string } = {};
    const fn = (obj: { a?: string }, string: string) => {
      obj['a'] = string;
    };
    const result = tapFirst(fn)(object, 'hello');
    expect(result).toBe(object);
    expect(result).toEqual({ a: 'hello' });
  });
});
