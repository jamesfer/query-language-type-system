import { Expression } from '..';
import { compile } from '../api';
import preludeLibrary from './prelude-library';

function replaceEndWith(prelude: Expression, expression: Expression): Expression {
  if (prelude.kind === 'BindingExpression') {
    return {
      ...prelude,
      body: replaceEndWith(prelude.body, expression),
    };
  }

  if (prelude.kind === 'StringExpression' && prelude.value === "END") {
    return expression;
  }

  throw new Error(`Failed to find the end of the prelude expression. Ended on ${expression.kind}`);
}

export function attachPrelude(expression: Expression): Expression {
  const { messages, expression: preludeExpression } = compile(preludeLibrary, { prelude: false });
  if (!preludeExpression) {
    throw new Error('Failed to compile prelude library. Messages: ' + messages.join(', '));
  }

  return replaceEndWith(preludeExpression, expression);
}
