import { CoreExpression, NodeWithExpression } from '../..';
import { ResolvedNodeDecoration } from '../../type-checker/resolve-implicits';
import { assertNever } from '../../type-checker/utils';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { convertValueToType } from './convert-value-to-type';
import { CppExpression } from './cpp-ast';
import { GenerateCppState } from './generate-cpp-state';
import { makeRecordLiteralStruct } from './make-record-literal-struct';

export function convertNodeToAst(
  state: GenerateCppState,
  makeUniqueId: UniqueIdGenerator,
  { expression, decoration }: NodeWithExpression<ResolvedNodeDecoration, CoreExpression<CppExpression>>,
): CppExpression {
  switch (expression.kind) {
    case 'Identifier':
      return {
        kind: 'Identifier',
        name: expression.name,
      };

    case 'BooleanExpression':
      return {
        kind: 'Boolean',
        value: expression.value,
      };

    case 'NumberExpression':
      return {
        kind: 'Number',
        value: expression.value,
      };

    case 'StringExpression':
      return {
        kind: 'String',
        value: expression.value,
      };

    case 'SymbolExpression':
      return {
        kind: 'String',
        value: `SYMBOL$${expression.name}`,
      };

    case 'RecordExpression': {
      const type = decoration.type;
      if (type.kind !== 'RecordLiteral') {
        throw new Error('Cannot handle a record expression that does not have a record literal type');
      }

      const parameters = Object.values(expression.properties);
      const structName = makeRecordLiteralStruct(state, makeUniqueId, type);
      return { structName, parameters, kind: 'StructConstruction' };
    }

    case 'DataInstantiation': {
      if (expression.callee.kind !== 'Identifier') {
        throw new Error('Cannot instantiate a data type that has a callee that is not an identifier');
      }

      return {
        kind: 'StructConstruction',
        parameters: expression.parameters,
        structName: expression.callee.name,
      };
    }

    case 'Application': {
      return {
        kind: 'Application',
        callee: expression.callee,
        parameters: [expression.parameter],
      };
    }

    case 'SimpleFunctionExpression': {
      const localStatements = [...state.localStatements.values];
      state.localStatements.clear();

      return {
        kind: 'Lambda',
        parameters: [{
          kind: 'Parameter',
          type: convertValueToType(state, makeUniqueId, expression.parameterType),
          identifier: {
            kind: 'Identifier',
            name: expression.parameter,
          },
        }],
        body: {
          kind: 'Block',
          statements: [
            ...localStatements,
            {
              kind: 'Return',
              value: expression.body,
            }
          ],
        },
      };
    }

    case 'BindingExpression':
      state.localStatements.push({
        kind: 'Binding',
        name: expression.name,
        value: expression.value,
        type: convertValueToType(state, makeUniqueId, decoration.type),
      });
      return expression.body;

    case 'ReadRecordPropertyExpression':
      return {
        kind: 'ReadProperty',
        object: expression.record,
        property: expression.property,
      }

    case 'ReadDataPropertyExpression':
    case 'NativeExpression':
      throw new Error('Not implemented yet');

    default:
      return assertNever(expression);
  }
}
