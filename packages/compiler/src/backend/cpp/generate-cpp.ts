import { flatMap, map } from 'lodash';
import { NodeWithChild, TypedNode } from '../..';
import { TypedDecoration } from '../../type-checker/type-check';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { convertValueToType } from './convert-value-to-type';
import { CppExpression, CppStatement } from './cpp-ast';
import { makeRecordLiteralStruct } from './make-record-literal-struct';

export interface ConvertedAst {
  globalStatements: CppStatement[];
  localStatements: CppStatement[];
  expression: CppExpression;
}

function convertedAst(expression: CppExpression, localStatements: CppStatement[] = [], globalStatements: CppStatement[] = []): ConvertedAst {
  return {
    expression,
    localStatements,
    globalStatements,
  };
}

function mapAst(ast: ConvertedAst, f: (expression: CppExpression) => CppExpression): ConvertedAst {
  return {
    ...ast,
    expression: f(ast.expression),
  };
}

function mapNAst(asts: ConvertedAst[], f: (expressions: CppExpression[]) => CppExpression): ConvertedAst {
  return {
    globalStatements: flatMap(asts, 'globalStatements'),
    localStatements: flatMap(asts, 'localStatements'),
    expression: f(map(asts, 'expression')),
  };
}

function appendGlobalStatement(ast: ConvertedAst, statement: CppStatement): ConvertedAst {
  return {
    ...ast,
    globalStatements: [...ast.globalStatements, statement],
  };
}

const convertNodeToCode = (makeUniqueId: UniqueIdGenerator) => ({ expression, decoration }: NodeWithChild<TypedDecoration, ConvertedAst>): ConvertedAst {
  switch (expression.kind) {
    case 'Identifier':
      return convertedAst({
        kind: 'Identifier',
        name: expression.name,
      });

    case 'BooleanExpression':
      break;
    case 'NumberExpression':
      break;
    case 'StringExpression':
      break;
    case 'SymbolExpression':
      break;
    case 'RecordExpression': {
      if (decoration.type.kind !== 'RecordLiteral') {
        throw new Error('Cannot handle a record expression that does not have a record literal type');
      }
      const type = decoration.type;
      const values = Object.values(expression.properties);
      const structName = makeUniqueId('recordLiteral');
      const struct = makeRecordLiteralStruct(structName, type);
      const constructionAst = mapNAst(values, (properties) => {
        return {
          structName,
          kind: 'StructConstruction',
          parameters: properties,
        };
      });

      return appendGlobalStatement(constructionAst, struct);
    }

    case 'Application':
      return mapNAst([expression.callee, expression.parameter], ([callee, parameter]) => ({
        callee,
        kind: 'Application',
        parameters: [parameter],
      }));

    case 'FunctionExpression':
      break;
    case 'DataInstantiation':
      break;
    case 'BindingExpression':
      break;
    case 'DualExpression':
      break;
    case 'ReadRecordPropertyExpression':
      break;
    case 'ReadDataPropertyExpression':
      break;
    case 'PatternMatchExpression':
      break;
    case 'NativeExpression':
      break;
  }
}

export function generateCpp(node: TypedNode): string {

}
