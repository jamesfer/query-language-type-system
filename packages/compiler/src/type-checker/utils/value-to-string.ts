import { assertNever } from './utils';
import { visitAndTransformValue } from './visitor-utils';
import { map } from 'lodash';

export const valueToString = visitAndTransformValue<string>((value) => {
  switch (value.kind) {
    case 'DataValue':
      return `${value.name}<${value.parameters.join(', ')}>`;
    case 'RecordLiteral':
      return `{ ${map(value.properties, (property, name) => `${name}: ${property}`).join(', ')} }`;
    case 'DualBinding':
      return `${value.left}:${value.right}`;
    case 'ApplicationValue':
      return `${value.callee} ${value.parameter}`;
    case 'ReadDataValueProperty':
      return `${value.dataValue}[${value.property}]`;
    case 'ReadRecordProperty':
      return `${value.record}.${value.property}`;
    case 'FunctionLiteral':
      return `(${value.parameter}) -> ${value.body}`;
    case 'ImplicitFunctionLiteral':
      return `(implicit ${value.parameter}) -> ${value.body}`;
    case 'PatternMatchValue':
      return `${value.value} match { ... }`;
    case 'FreeVariable':
      return value.name;
    case 'SymbolLiteral':
      return `:${value.name}:`
    case 'BooleanLiteral':
      return value.value.toString();
    case 'NumberLiteral':
      return value.value.toString();
    case 'StringLiteral':
      return value.value;

    default:
      return assertNever(value);
  }
})
