import { compile } from '../../api';
import { uniqueIdStream } from '../../utils/unique-id-generator';
import { generateCpp } from './generate-cpp';
import dedentJs from 'dedent-js';

function toCpp(code: string) {
  const result = compile(code);
  return result.node
    ? generateCpp(uniqueIdStream(), result.node)
    : undefined;
}

describe('generateCpp', () => {
  it('translates a simple expression', () => {
    expect(toCpp('"Hello"')).toBe(dedentJs`
      int main() {
          "Hello";
      }
    `);
  });

  it('extracts anonymous functions', () => {
    const result = toCpp(dedentJs`
      let f = a -> a
      f 1
    `);
    expect(result).toBe(dedentJs`
      int main() {
          double f = [](double a$rename$25) -> {
              return a$rename$25;
          };
          f(1);
      }
    `);
  });
});
