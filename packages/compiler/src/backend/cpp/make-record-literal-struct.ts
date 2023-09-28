import { RecordLiteral } from '../../type-checker/types/value';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { convertValueToType } from './convert-value-to-type';
import { CppStatement } from './cpp-ast';
import { GenerateCppState } from './generate-cpp-state';

function generateRecordLiteralKey(record: RecordLiteral): string {
  return JSON.stringify(record);
}

function makeNewRecordLiteralStruct(state: GenerateCppState, makeUniqueId: UniqueIdGenerator, type: RecordLiteral): string {
  const name = makeUniqueId('recordLiteral');
  const properties = Object.values(type.properties).map(property => (
    convertValueToType(state, makeUniqueId, property)
  ));
  const propertyNames = Object.keys(type.properties);
  const statement: CppStatement = {
    name,
    kind: 'Struct',
    properties: properties.map((property, index) => ({
      kind: 'Parameter',
      identifier: {
        name: propertyNames[index],
        kind: 'Identifier',
      },
      type: property,
    })),
  };
  state.globalStatements.push(statement);
  return name;
}

export function makeRecordLiteralStruct(
  state: GenerateCppState,
  makeUniqueId: UniqueIdGenerator,
  type: RecordLiteral,
): string {
  const key = generateRecordLiteralKey(type);
  const cachedStruct = state.anonymousStructCache.property(key);
  if (cachedStruct) {
    return cachedStruct;
  }

  const newStruct = makeNewRecordLiteralStruct(state, makeUniqueId, type);
  state.anonymousStructCache.setProperty(key, newStruct);
  return newStruct;
}
