import { Expression } from '..';
import interpretExpression, { WithDebugging, WithMessages } from './interpret-expression';
import { produceExpressionTokens } from './produce-expression-tokens';
import tokenize from './tokenize';

export default function parse(code: string): WithDebugging<Expression | undefined> {
  return interpretExpression(Array.from(produceExpressionTokens(tokenize(code))));
}
