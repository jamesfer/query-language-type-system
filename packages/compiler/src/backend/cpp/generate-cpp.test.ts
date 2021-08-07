import { compile } from '../../api';
import { uniqueIdStream } from '../../utils/unique-id-generator';
import { generateCpp } from './generate-cpp';
import dedent from 'dedent-js';

function toCpp(code: string) {
  const result = compile(code);
  return result.node
    ? generateCpp(uniqueIdStream(), result.node)
    : undefined;
}

describe('generateCpp', () => {
  it('translates a simple expression', () => {
    expect(toCpp('"Hello"')).toBe(dedent`
      int main() {
          "Hello";
      }
    `);
  });

  it('extracts anonymous functions', () => {
    const result = toCpp(dedent`
      let f = a -> a
      f 1
    `);
    expect(result).toBe(dedent`
      int main() {
          double f = [](double a$rename$14) -> {
              return a$rename$14;
          };
          f(1);
      }
    `);
  });
});
