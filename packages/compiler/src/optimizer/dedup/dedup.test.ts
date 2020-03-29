import { generateJavascript, stripNode } from '../..';
import parse from '../../parser/parse';
import { runTypePhase } from '../../type-checker/run-type-phase';
import { dedup } from './dedup';

describe('dedup', () => {
  it('does something', () => {
    const { value: expression } = parse('a (b 5) (b 5)');
    expect(expression).toBeDefined();
    if (expression) {
      const [messages, node] = runTypePhase(expression);
      console.log(generateJavascript(stripNode(node)));
      console.log(generateJavascript(stripNode(dedup(node))));
    }
  });

  it('does something 2', () => {
    const { value: expression } = parse('a (b 1 10 5) (b 1 11 5)');
    expect(expression).toBeDefined();
    if (expression) {
      const [messages, node] = runTypePhase(expression);
      console.log(generateJavascript(stripNode(node)));
      const a = dedup(node);
      const b = stripNode(a);
      console.log(generateJavascript(b));
    }
  });
});
