"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRecordLiteralStruct = void 0;
const convert_value_to_type_1 = require("./convert-value-to-type");
const monad_1 = require("./monad");
const monad_state_operations_1 = require("./monad-state-operations");
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
function generateRecordLiteralKey(record) {
    return JSON.stringify(record);
}
function makeNewRecordLiteralStruct(type) {
    return monad_1.pipeRecord({ name: monad_state_operations_1.newUniqueId('recordLiteral') }, () => ({ properties: monad_1.traverseM(Object.values(type.properties), convert_value_to_type_1.convertValueToType) }), ({ name, properties }) => {
        const propertyNames = Object.keys(type.properties);
        const statement = {
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
        return { nothing: monad_state_operations_1.appendGlobalStatement(statement) };
    }, ({ name }) => name);
}
function makeRecordLiteralStruct(type) {
    const key = generateRecordLiteralKey(type);
    const cachedResult = monad_1.Monad.of((state) => (state.child('anonymousStructCache').property(key)));
    return monad_1.flatMapM(cachedResult, cachedStruct => {
        if (cachedStruct) {
            return monad_1.Monad.pure(cachedStruct);
        }
        const newStruct = makeNewRecordLiteralStruct(type);
        return monad_1.flatMapM(newStruct, newStructValue => monad_1.Monad.of((state) => {
            state.child('anonymousStructCache').setProperty(key, newStructValue);
            return newStructValue;
        }));
    });
}
exports.makeRecordLiteralStruct = makeRecordLiteralStruct;
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
//# sourceMappingURL=make-record-literal-struct.js.map