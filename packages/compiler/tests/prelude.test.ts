import requireFromString from 'require-from-string';
import { compile, generateJavascript } from '../src';

function run(code: string) {
  const { expression, messages } = compile(code);
  if (expression) {
    const javascriptCode = generateJavascript(expression, { module: 'commonjs' });
    try {
      return requireFromString(javascriptCode);
    } catch (error) {
      throw new Error(`Encountered an error while requiring generated code\n${error}\n\nCode: ${javascriptCode}`);
    }
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

  describe('addMe', () => {
    it('adds numbers', () => {
      const result = run('addMe 1 2');
      expect(result).toBe(3);
    });
  });
});
