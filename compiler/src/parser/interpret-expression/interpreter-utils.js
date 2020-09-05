"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInterpreter = exports.interpreter = exports.Precedence = void 0;
const free_1 = require("../../utils/free");
const message_state_1 = require("./message-state");
var Precedence;
(function (Precedence) {
    Precedence[Precedence["none"] = 0] = "none";
    Precedence[Precedence["bindingEquals"] = 1] = "bindingEquals";
    Precedence[Precedence["record"] = 2] = "record";
    Precedence[Precedence["functionArrow"] = 3] = "functionArrow";
    Precedence[Precedence["functionArrowParam"] = 4] = "functionArrowParam";
    Precedence[Precedence["implicitFunctionArrowParam"] = 5] = "implicitFunctionArrowParam";
    Precedence[Precedence["patternMatch"] = 6] = "patternMatch";
    Precedence[Precedence["application"] = 7] = "application";
    Precedence[Precedence["application2"] = 8] = "application2";
    Precedence[Precedence["dual"] = 9] = "dual";
    Precedence[Precedence["readProperty"] = 10] = "readProperty";
    Precedence[Precedence["parenthesis"] = 11] = "parenthesis";
})(Precedence = exports.Precedence || (exports.Precedence = {}));
function interpreter(name, interpret) {
    return { name, interpret };
}
exports.interpreter = interpreter;
function runInterpreter(interpreter, tokens, previous, precedence) {
    if (!interpreter.name) {
        return interpreter.interpret(tokens, previous, precedence);
    }
    return free_1.mapFree(interpreter.interpret(tokens, previous, precedence), ({ messages, value: results }) => {
        // const indentedMessages = messages.map(message => `  ${message}`);
        // const debugMessage = `${interpreter.name} running on: ${map(tokens, 'value').join(', ')}`;
        // const resultMessage = `${interpreter.name} ${results.length > 0 ? `succeeded (${results.length} matches, at least ${max(map(results, 'tokens.length'))} tokens)` : 'failed'}`;
        return message_state_1.withMessages([], results);
    });
}
exports.runInterpreter = runInterpreter;
//# sourceMappingURL=interpreter-utils.js.map