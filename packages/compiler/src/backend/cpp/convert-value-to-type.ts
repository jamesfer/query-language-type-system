import { Value } from '../../type-checker/types/value';
import { CppType } from './cpp-ast';
import { makeRecordLiteralStruct } from './make-record-literal-struct';
import { mapM, Monad, pipeRecord, traverseM } from './monad';
import { CppState } from './monad-state-operations';

const shallowConvertValueToType = (value: Value): Monad<CppState, string> => {
  switch (value.kind) {
    case 'DataValue':
      return pipeRecord(
        {
          name: shallowConvertValueToType(value.name),
          parameters: traverseM(value.parameters, shallowConvertValueToType),
        },
        ({ name, parameters }) => `${name}<${parameters.join(', ')}>`,
      );

    case 'RecordLiteral':
      return pipeRecord(
        { struct: makeRecordLiteralStruct(value) },
        ({ struct }) => struct,
      );

    case 'ApplicationValue': {
      // Collect all parameters to un-curry the application
      let parameters = [value.parameter];
      let callee = value.callee;
      while (callee.kind === 'ApplicationValue') {
        parameters = [callee.parameter, ...parameters];
        callee = callee.callee;
      }

      return pipeRecord(
        {
          callee: shallowConvertValueToType(callee),
          parameters: traverseM(parameters, shallowConvertValueToType),
        },
        ({ callee, parameters }) => `${callee}<${parameters.join(', ')}>`,
      );
    }

    case 'FunctionLiteral':
      return pipeRecord(
        {
          body: shallowConvertValueToType(value.body),
          parameter: shallowConvertValueToType(value.parameter),
        },
        ({ body, parameter }) => `[](${parameter}) -> ${body}`,
      );

    case 'FreeVariable':
      return Monad.pure(value.name);
    // throw new Error(`Free variable ${value.name} cannot be part of a type`);

    case 'SymbolLiteral':
      return Monad.pure('std::string');

    case 'BooleanLiteral':
      return Monad.pure('boolean');

    case 'NumberLiteral':
      return Monad.pure('double');

    case 'StringLiteral':
      return Monad.pure('std::string');

    case 'DualBinding':
      throw new Error(`Dual binding value cannot be part of a type`);

    case 'ReadDataValueProperty':
      throw new Error(`Read data value property value cannot be part of a type`);

    case 'ReadRecordProperty':
      throw new Error(`Read record property value cannot be part of a type`);

    case 'ImplicitFunctionLiteral':
      throw new Error(`Implicit function literal value cannot be part of a type`);

    case 'PatternMatchValue':
      throw new Error(`Pattern match value cannot be part of a type`);
  }
};

export function convertValueToType(value: Value): Monad<CppState, CppType> {
  return mapM(shallowConvertValueToType(value), string => ({ kind: 'Type', value: string }));
}
