import { compile } from '../../api';
import { generateCpp } from './generate-cpp';
import dedent from 'dedent-js';

function toCpp(code: string) {
  const result = compile(code);
  return result.node
    ? generateCpp(result.node)
    : undefined;
}

describe('generateCpp', () => {
  it('translates a simple expression', () => {
    expect(toCpp('"Hello"')).toBe(dedent`
      void main() {
          "Hello";
      }
    `)
  });
});
