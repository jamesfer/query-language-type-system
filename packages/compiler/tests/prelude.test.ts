import requireFromString from 'require-from-string';
import { compile, generateJavascript } from '../src';

function run(code: string) {
  const { expression } = compile(code);
  if (expression) {
    const javascriptCode = generateJavascript(expression, { module: 'commonjs' });
    return requireFromString(javascriptCode);
  }
  return undefined;
}

describe('prelude', () => {
  describe('add', () => {
    it('adds numbers together', () => {
      const result = run('add 1 3');
      expect(result).toBe(4);
    });
  });

  describe('subtract', () => {
    it('subtracts numbers', () => {
      const result = run('subtract 10 3');
      expect(result).toBe(7);
    });
  });

  describe('multiply', () => {
    it('multiplies numbers', () => {
      const result = run('multiply 10 3');
      expect(result).toBe(30);
    });
  });

  describe('divide', () => {
    it('divides numbers', () => {
      const result = run('divide 9 3');
      expect(result).toBe(3);
    });
  });

  describe('modulo', () => {
    it('modulos numbers', () => {
      const result = run('modulo 10 3');
      expect(result).toBe(1);
    });
  });

  describe('power', () => {
    it('power numbers', () => {
      const result = run('power 10 3');
      expect(result).toBe(1000);
    });
  });
});
