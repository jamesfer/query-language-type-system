import { generateJavascript, stripNode } from '../..';
import parse from '../../parser/parse';
import { runTypePhase } from '../../type-checker/run-type-phase';
import { dedup } from './dedup';

const { value: expression } = parse('a (b 1 2 10 5) (b 1 2 11 5)');
if (expression) {
  const [messages, node] = runTypePhase(expression);
  console.log(generateJavascript(stripNode(node)));
  const a = dedup(node);
  const b = stripNode(a);
  console.log(generateJavascript(b));
}
