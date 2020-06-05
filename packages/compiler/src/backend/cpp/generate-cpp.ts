import { TypedNode } from '../..';
import { visitAndTransformNode } from '../../type-checker/visitor-utils';
import { uniqueIdStream } from '../../utils/unique-id-generator';
import { convertNodeToAst } from './convert-node-to-ast';
import { CppStatement } from './cpp-ast';
import { ArrayState, CombinedState, FState, MapState } from './monad';
import { CppState } from './monad-state-operations';
import { printCppAst } from './print-cpp-ast';

export function generateCpp(node: TypedNode): string {
  const state: CppState = new CombinedState({
    anonymousStructCache: new MapState<string, string>(),
    globalStatements: new ArrayState<CppStatement>(),
    localStatements: new ArrayState<CppStatement>(),
    makeUniqueId: new FState<[string], string>(uniqueIdStream()),
  });
  const expression = visitAndTransformNode(convertNodeToAst)(node).run(state);
  const statements: CppStatement[] = [
    ...state.child('globalStatements').get(),
    {
      kind: 'Function',
      name: 'main',
      returnType: {
        kind: 'Type',
        value: 'void',
      },
      parameters: [],
      body: {
        kind: 'Block',
        statements: [
          ...state.child('localStatements').get(),
          {
            kind: 'ExpressionStatement',
            expression: expression,
          },
        ]
      }
    }
  ];
  return printCppAst(statements);
}
