// import { pipe } from 'fp-ts/lib/pipeable';
// import { Reader, default as reader } from 'fp-ts/lib/Reader';
// import { State, default as state } from 'fp-ts/lib/State';
// import { Writer, default as writer } from 'fp-ts/lib/Writer';
import { RecordLiteral, Value } from '../../type-checker/types/value';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { convertValueToType } from './convert-value-to-type';
import { CppStatement } from './cpp-ast';
import { generateRecordLiteralKey } from './generate-record-literal-key';
import {
  ArrayState,
  CombinedState,
  flatMapM,
  FState, mapM,
  MapState,
  Monad, pipeRecord,
  traverseM,
} from './monad';

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

export type CppState = CombinedState<{
  makeUniqueId: FState<[string], string>,
  anonymousStructCache: MapState<string, string>,
  localStatements: ArrayState<CppStatement>,
  globalStatements: ArrayState<CppStatement>,
}>;

declare function cvtt2(value: Value): Monad<CppState, string>;

function newUniqueId(prefix: string): Monad<CppState, string> {
  return Monad.of(state => state.child('makeUniqueId').apply(prefix));
}

function addGlobalStatement(statement: CppStatement): Monad<CppState, void> {
  return Monad.of((state) => {
    state.child('globalStatements').append(statement);
  });
}

export function makeRecordLiteralStruct(type: RecordLiteral): Monad<CppState, string> {
  return pipeRecord(
    { name: newUniqueId('recordLiteral') },
    () => ({ properties: traverseM(Object.values(type.properties), cvtt2) }),
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
          type: {
            kind: 'Type',
            value: property,
          },
        })),
      };
      return { nothing: addGlobalStatement(statement) };
    },
    ({ name }) => name,
  );
}


// export function makeR(type: RecordLiteral) {
//   const cachedResult = Monad.of((state: CppState) => {
//     const key = generateRecordLiteralKey(type);
//     return state.child('anonymousStructCache').property(key);
//   });
//
//   return flatMapM(cachedResult, (cachedStruct) => {
//     return cachedStruct ? Monad.pure(cachedStruct) : makeNewR(type);
//   });
// }
//
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
