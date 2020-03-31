import { generateJavascript, stripNode } from '../..';
import parse from '../../parser/parse';
import { runTypePhase } from '../../type-checker/run-type-phase';
import { dedup } from './dedup';

describe('dedup', () => {
  it('extracts common expressions of height 2', () => {
    const { value: expression } = parse('a (b 1) (b 1)');
    expect(expression).toBeDefined();
    if (expression) {
      const [, node] = runTypePhase(expression);
      expect(generateJavascript(stripNode(dedup(node)))).toBe(`const $extracted$0 = b$rename$2(1);
export default a$rename$1($extracted$0)($extracted$0);`);
    }
  });

  it('extracts common expressions larger than height 2', () => {
    const { value: expression } = parse('a (b 1 2) (b 1 2)');
    expect(expression).toBeDefined();
    if (expression) {
      const [, node] = runTypePhase(expression);
      expect(generateJavascript(stripNode(dedup(node)))).toBe(`const $extracted$0 = b$rename$12(1)(2);
export default a$rename$11($extracted$0)($extracted$0);`);
      console.log(generateJavascript(stripNode(node)));
      console.log(generateJavascript(stripNode(dedup(node))));
    }
  });

  it('extracts patterns with placeholders in the middle of them', () => {
    const { value: expression } = parse('a (b 1 10 4 5) (b 1 11 4 5)');
    expect(expression).toBeDefined();
    if (expression) {
      const [, node] = runTypePhase(expression);
      console.log(generateJavascript(stripNode(node)));
      expect(generateJavascript(stripNode(dedup(node)))).toBe(`const $extracted$0 = $extracted$0$placeholder$0 => b$rename$26(1)($extracted$0$placeholder$0)(4)(5);

export default a$rename$25($extracted$0(10))($extracted$0(11));`);
      const a = dedup(node);
      const b = stripNode(a);
      console.log(generateJavascript(b));
    }
  });
});
