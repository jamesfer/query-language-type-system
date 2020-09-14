import { CoreExpression, NodeWithExpression } from '../..';
import { TypedDecoration } from '../../type-checker/type-check';
import { assertNever } from '../../type-checker/utils';
import { convertValueToType } from './convert-value-to-type';
import { CppExpression, CppStructConstruction } from './cpp-ast';
import { makeRecordLiteralStruct } from './make-record-literal-struct';
import { mapM, Monad, pipeRecord, sequenceM } from './monad';
import {
  appendLocalStatement,
  clearLocalStatements,
  CppState,
  getLocalStatements,
} from './monad-state-operations';

export function convertNodeToAst({ expression, decoration }: NodeWithExpression<TypedDecoration, CoreExpression<Monad<CppState, CppExpression>>>): Monad<CppState, CppExpression> {
  switch (expression.kind) {
    case 'Identifier':
      return Monad.pure<CppState, CppExpression>({
        kind: 'Identifier',
        name: expression.name,
      });

    case 'BooleanExpression':
      return Monad.pure<CppState, CppExpression>({
        kind: 'Boolean',
        value: expression.value,
      });

    case 'NumberExpression':
      return Monad.pure<CppState, CppExpression>({
        kind: 'Number',
        value: expression.value,
      });

    case 'StringExpression':
      return Monad.pure<CppState, CppExpression>({
        kind: 'String',
        value: expression.value,
      });

    case 'SymbolExpression':
      return Monad.pure<CppState, CppExpression>({
        kind: 'String',
        value: `SYMBOL$${expression.name}`,
      });

    case 'RecordExpression': {
      const type = decoration.type;
      if (type.kind !== 'RecordLiteral') {
        throw new Error('Cannot handle a record expression that does not have a record literal type');
      }

      return pipeRecord(
        { parameters: sequenceM(Object.values(expression.properties)) },
        () => ({ structName: makeRecordLiteralStruct(type) }),
        ({ parameters, structName }) => ({ structName, parameters, kind: 'StructConstruction' }),
      );
    }

    case 'DataInstantiation':
      return pipeRecord(
        { callee: expression.callee, parameters: sequenceM(expression.parameters) },
        ({ callee, parameters }): CppStructConstruction => {
          if (callee.kind !== 'Identifier') {
            throw new Error('Cannot instantiate a data type that has a callee that is not an identifier');
          }

          return {
            parameters,
            kind: 'StructConstruction',
            structName: callee.name,
          };
        },
      );

    case 'Application':
      return pipeRecord(
        { callee: expression.callee, parameter: expression.parameter },
        ({ callee, parameter }) => ({
          callee,
          kind: 'Application',
          parameters: [parameter],
        }),
      );

    case 'SimpleFunctionExpression':
      return pipeRecord(
        { body: expression.body },
        () => ({ localStatements: getLocalStatements() }),
        () => ({ _: clearLocalStatements() }),
        ({ body, localStatements }) => ({
          kind: 'Lambda',
          parameters: [],
          body: {
            kind: 'Block',
            statements: [
              ...localStatements,
              {
                kind: 'Return',
                value: body,
              }
            ],
          },
        }),
      );

    case 'BindingExpression':
      return pipeRecord(
        {
          type: convertValueToType(decoration.type),
          value: expression.value,
          body: expression.body,
        },
        ({ type, value }) => ({
          _: appendLocalStatement({
            value,
            type,
            kind: 'Binding',
            name: expression.name,
          }),
        }),
        ({ body }) => body,
      );

    // case 'DualExpression':
    //   return expression.right;

    case 'ReadRecordPropertyExpression':
      return mapM(expression.record, (record) => ({
        kind: 'ReadProperty',
        object: record,
        property: expression.property,
      }));

    case 'ReadDataPropertyExpression':
    // case 'PatternMatchExpression':
    case 'NativeExpression':
      throw new Error('Not implemented yet');

    default:
      return assertNever(expression);
  }
}
