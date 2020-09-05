"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const preludeLibrary = dedent_js_1.default `
data BUILT_IN
data Integer = a
data Float = a
data String = a
data Boolean = a
data True
data False
let trueBooleanImpl = Boolean True
let falseBooleanImpl = Boolean False
let add = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "+", }, }
let subtract = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "-", }, }
let multiply = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "*", }, }
let divide = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "/", }, }
let modulo = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "%", }, }
let power = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "**", }, }
let equals = (implicit Boolean r -> a -> b -> r):#{ evaluator = { kind = "builtin", name = "equals", }, javascript = { kind = "binaryOperation", operator = "===", }, }
let if = (implicit Boolean c -> implicit t a -> implicit t b -> implicit t r -> c -> a -> b -> r):#{ evaluator = { kind = "builtin", name = "if", }, javascript = { kind = "ternaryOperator", }, }
"END"
`;
exports.default = preludeLibrary;
// let add = (a -> b -> c):#{ kind = "binaryOperation", operator = "+", }
// let subtract = (a -> b -> c):#{ kind = "binaryOperation", operator = "-", }
// let multiply = (a -> b -> c):#{ kind = "binaryOperation", operator = "*", }
// let divide = (a -> b -> c):#{ kind = "binaryOperation", operator = "/", }
// let modulo = (a -> b -> c):#{ kind = "binaryOperation", operator = "%", }
// let power = (a -> b -> c):#{ kind = "binaryOperation", operator = "**", }
// let integerEquals = (implicit Integer a -> implicit Integer b -> implicit Boolean c -> a -> b -> c):#{ kind = "binaryOperation", operator = "===", }
// let floatEquals = (implicit Float a -> implicit Float b -> implicit Boolean c -> a -> b -> c):#{ kind = "binaryOperation", operator = "===", }
// data EqualClass = a, { equals = implicit a leftValue -> implicit a rightValue -> implicit Boolean c -> leftValue -> rightValue -> c, }
// let integerEqualClassImpl = EqualClass Integer { equals = integerEquals, }
// let floatEqualClassImpl = EqualClass Float { equals = floatEquals, }
// let equals = implicit EqualClass type methods -> a -> b -> methods.equals a b
//# sourceMappingURL=prelude-library.js.map