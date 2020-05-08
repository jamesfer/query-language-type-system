import { apply, scope } from './constructors';
import { typeExpression } from './type-check';
import { uniqueIdStream } from './utils';
import { VariableReplacement } from './variable-utils';

describe('typeExpression', () => {
  it('infers the type of the callee to be a function', () => {
    const { state: [_, replacements] } = typeExpression(uniqueIdStream())(scope())(apply('M', ['t']));
    const expectedReplacement: VariableReplacement = {
      from: 'M',
      to: {
        kind: 'FunctionLiteral',
        parameter: {
          kind: 'FreeVariable',
          name: expect.any(String),
        },
        body: {
          kind: 'FreeVariable',
          name: expect.any(String),
        },
      },
    };
    expect(replacements).toContainEqual(expectedReplacement);
  });
});

