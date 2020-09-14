import { RecordLiteral } from '../../type-checker/types/value';
import { convertValueToType } from './convert-value-to-type';
import { CppStatement } from './cpp-ast';
import { flatMapM, Monad, pipeRecord, traverseM } from './monad';
import { appendGlobalStatement, CppState, newUniqueId } from './monad-state-operations';

// export type Result<T> = Reader<UniqueIdGenerator, State<Record<string, string>, Writer<CppStatement[], T>>>;
//
// function cvtt(value: Value): Result<string> {
//   const a = 1 as Result<1>;
//
// }
//
//
//
// function writerAppend<W, A>(value: W): (m: Writer<W[], A>) => Writer<W[], A> {
//   return writer.censor((existing) => [...existing, value]);
// }
//
// function b<T>(results: Result<T>[]): Result<T[]> {
//   results.reduce<Result<T[]>>(
//     (accum, result) => {
//       flatMap
//     },
//     1 as any,
//   );
// }
//
// function make(type: RecordLiteral): Result<string> {
//   const properties = Object.values(type.properties).map(value => cvtt(value));
//
//   return reader.asks((makeUniqueId: UniqueIdGenerator) => {
//     return state.map((anonymousStructCache: Record<string, string>): Writer<CppStatement[], string> => {
//       writer.tell([]);
//
//       const key = generateRecordLiteralKey(type);
//       if (key in anonymousStructCache) {
//         return writer.map(() => anonymousStructCache[key])(writer.tell([]));
//       }
//
//       const name = makeUniqueId('recordLiteral');
//       pipe(
//         writer.tell([]),
//         writer.map(() => name),
//       );
//       writerAppend(statement);
//       Object.values(type.properties).map(value => cvtt(value));
//       const statement: CppStatement = {
//         name,
//         kind: 'Struct',
//         properties: Object.keys(type.properties).map((propertyName) => ({
//           kind: 'Parameter',
//           identifier: {
//             name: propertyName,
//             kind: 'Identifier',
//           },
//           type: {
//             kind: 'Type',
//             value: convertValueToType(type.properties[name]),
//           },
//         })),
//       };
//     })(state.get());
//   })
// }

function generateRecordLiteralKey(record: RecordLiteral): string {
  return JSON.stringify(record);
}

function makeNewRecordLiteralStruct(type: RecordLiteral): Monad<CppState, string> {
  return pipeRecord(
    { name: newUniqueId('recordLiteral') },
    () => ({ properties: traverseM(Object.values(type.properties), convertValueToType) }),
    ({ name, properties }) => {
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
      return { nothing: appendGlobalStatement(statement) };
    },
    ({ name }) => name,
  );
}

export function makeRecordLiteralStruct(type: RecordLiteral) {
  const key = generateRecordLiteralKey(type);
  const cachedResult = Monad.of((state: CppState) => (
    state.child('anonymousStructCache').property(key)
  ));
  return flatMapM(cachedResult, cachedStruct => {
    if (cachedStruct) {
      return Monad.pure(cachedStruct);
    }

    const newStruct = makeNewRecordLiteralStruct(type);
    return flatMapM(newStruct, newStructValue => Monad.of((state) => {
      state.child('anonymousStructCache').setProperty(key, newStructValue);
      return newStructValue;
    }));
  });
}

// export function makeRecordLiteralStruct(anonymousStructCache: Record<string, string>, makeUniqueId: UniqueIdGenerator, type: RecordLiteral): [CppStatement[], string] {
//   const key = generateRecordLiteralKey(type);
//   if (key in anonymousStructCache) {
//     return [[], anonymousStructCache[key]];
//   }
//
//   const name = makeUniqueId('recordLiteral');
//   Object.values(type.properties).map(value => convertValueToType(value));
//   const statement: CppStatement = {
//     name,
//     kind: 'Struct',
//     properties: Object.keys(type.properties).map((propertyName) => ({
//       kind: 'Parameter',
//       identifier: {
//         name: propertyName,
//         kind: 'Identifier',
//       },
//       type: {
//         kind: 'Type',
//         value: convertValueToType(type.properties[name]),
//       },
//     })),
//   };
// }
