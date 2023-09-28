"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRecordLiteralStruct = void 0;
const convert_value_to_type_1 = require("./convert-value-to-type");
function generateRecordLiteralKey(record) {
    return JSON.stringify(record);
}
function makeNewRecordLiteralStruct(state, makeUniqueId, type) {
    const name = makeUniqueId('recordLiteral');
    const properties = Object.values(type.properties).map(property => (convert_value_to_type_1.convertValueToType(state, makeUniqueId, property)));
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
    state.globalStatements.push(statement);
    return name;
}
function makeRecordLiteralStruct(state, makeUniqueId, type) {
    const key = generateRecordLiteralKey(type);
    const cachedStruct = state.anonymousStructCache.property(key);
    if (cachedStruct) {
        return cachedStruct;
    }
    const newStruct = makeNewRecordLiteralStruct(state, makeUniqueId, type);
    state.anonymousStructCache.setProperty(key, newStruct);
    return newStruct;
}
exports.makeRecordLiteralStruct = makeRecordLiteralStruct;
//# sourceMappingURL=make-record-literal-struct.js.map