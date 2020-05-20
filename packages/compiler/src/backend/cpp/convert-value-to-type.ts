import { flatMap, map } from 'lodash';
import { Value } from '../../type-checker/types/value';
import { CppStatement } from './cpp-ast';
import { generateRecordLiteralKey } from './generate-record-literal-key';

function mapNWrapped<S, T, U>(wrapped: [S[], T][], f: (t: T[]) => U): [S[], U] {
  return [flatMap(wrapped, '0'), f(map(wrapped, '1'))];
}

export const convertValueToType = (anonymousStructCache: Record<string, string>) => (value: Value): [CppStatement[], string] => {
  const recurse = convertValueToType(anonymousStructCache);
  switch (value.kind) {
    case 'DataValue':
      return mapNWrapped(
        [recurse(value.name), ...value.parameters.map(recurse)],
        ([name, ...parameters]) => (
          `${name}<${parameters.join(', ')}>`
        ),
      );

    case 'RecordLiteral': {
      const key = generateRecordLiteralKey(value);
      if (key in anonymousStructCache) {
        return [[], key];
      }

      return [

      ];
    }

    case 'DualBinding':
      throw new Error(`Dual binding value cannot be part of a type`);

    case 'ApplicationValue': {
      let parameters = [value.parameter];
      let callee = value.callee;
      while (callee.kind === 'ApplicationValue') {
        parameters = [callee.parameter, ...parameters];
        callee = callee.callee;
      }

      return `${recurse(callee)}<${parameters.map(recurse).join(', ')}>`;
    }


    case 'ReadDataValueProperty':
      throw new Error(`Read data value property value cannot be part of a type`);

    case 'ReadRecordProperty':
      throw new Error(`Read record property value cannot be part of a type`);

    case 'FunctionLiteral':
      return `[](${recurse(value.parameter)}) -> ${recurse(value.body)}`;

    case 'ImplicitFunctionLiteral':
      throw new Error(`Implicit function literal value cannot be part of a type`);

    case 'PatternMatchValue':
      throw new Error(`Pattern match value cannot be part of a type`);

    case 'FreeVariable':
      return value.name;
    // throw new Error(`Free variable ${value.name} cannot be part of a type`);

    case 'SymbolLiteral':
      return 'std::string';

    case 'BooleanLiteral':
      return 'boolean';

    case 'NumberLiteral':
      return 'double';

    case 'StringLiteral':
      return 'std::string';
  }
};
