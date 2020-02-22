import { Expression } from '..';
import interpretExpression, { WithMessages } from './interpret-expression';
import tokenize from './tokenize';

export default function parse(code: string): WithMessages<Expression | undefined> {
  return interpretExpression(Array.from(tokenize(code)));
}
