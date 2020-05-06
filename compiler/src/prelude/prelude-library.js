"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const preludeLibrary = dedent_js_1.default `
data Integer = a
data Float = a
data String = a
let add = (a -> b):#{ kind = "binaryOperation", operator = "+", }
let subtract = (a -> b):#{ kind = "binaryOperation", operator = "-", }
let multiply = (a -> b):#{ kind = "binaryOperation", operator = "*", }
let divide = (a -> b):#{ kind = "binaryOperation", operator = "/", }
let modulo = (a -> b):#{ kind = "binaryOperation", operator = "%", }
let power = (a -> b):#{ kind = "binaryOperation", operator = "**", }
"END"
`;
exports.default = preludeLibrary;
//# sourceMappingURL=prelude-library.js.map