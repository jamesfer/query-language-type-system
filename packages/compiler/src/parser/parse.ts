import { Expression } from '..';
import interpretExpression, { WithMessages } from './interpret-expression';
import { produceExpressionTokens } from './produce-expression-tokens';
import tokenize from './tokenize';

export default function parse(code: string): WithMessages<Expression | undefined> {
  return interpretExpression(Array.from(produceExpressionTokens(tokenize(code))));
}
