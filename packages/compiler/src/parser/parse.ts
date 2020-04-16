import { Expression } from '..';
import interpretExpression from './interpret-expression/interpreters';
import { WithMessages } from './interpret-expression/message-state';
import { produceExpressionTokens } from './produce-expression-tokens';
import tokenize from './tokenize';

export default function parse(code: string): WithMessages<Expression | undefined> {
  return interpretExpression(Array.from(produceExpressionTokens(tokenize(code))));
}
