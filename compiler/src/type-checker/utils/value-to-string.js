"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.valueToString = void 0;
const utils_1 = require("../utils");
const visitor_utils_1 = require("../visitor-utils");
const lodash_1 = require("lodash");
exports.valueToString = visitor_utils_1.visitAndTransformValue((value) => {
    switch (value.kind) {
        case 'DataValue':
            return `${value.name}<${value.parameters.join(', ')}>`;
        case 'RecordLiteral':
            return `{ ${lodash_1.map(value.properties, (property, name) => `${name}: ${property}`).join(', ')} }`;
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
            return `:${value.name}:`;
        case 'BooleanLiteral':
            return value.value.toString();
        case 'NumberLiteral':
            return value.value.toString();
        case 'StringLiteral':
            return value.value;
        default:
            return utils_1.assertNever(value);
    }
});
//# sourceMappingURL=value-to-string.js.map