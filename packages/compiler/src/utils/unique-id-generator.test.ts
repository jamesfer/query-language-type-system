import { uniqueIdStream } from './unique-id-generator';

describe('uniqueIdGenerator', () => {
  it('generates unique ids independently', () => {
    const generator1 = uniqueIdStream();
    const generator2 = uniqueIdStream();
    expect(generator1()).toEqual('1');
    expect(generator2()).toEqual('1');
    expect(generator1()).toEqual('2');
    expect(generator1()).toEqual('3');
    expect(generator2()).toEqual('2');
  });

  it('prepends a prefix if provided', () => {
    const generator = uniqueIdStream();
    expect(generator('prefix')).toEqual('prefix1');
    expect(generator('prefix')).toEqual('prefix2');
  });
});
