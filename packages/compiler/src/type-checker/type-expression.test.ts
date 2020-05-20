import { uniqueIdStream } from '../utils/unique-id-generator';
import { apply, scope } from './constructors';
import { typeExpression } from './type-check';
import { VariableReplacement } from './variable-utils';

describe('typeExpression', () => {
  // The behaviour of this test case was changed due to the need to not simplify applications when
  // the callee is a free variable
  it.skip('infers the type of the callee to be a function', () => {
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

