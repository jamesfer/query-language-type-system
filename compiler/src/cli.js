"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs_1 = require("fs");
const lodash_1 = require("lodash");
const perf_hooks_1 = require("perf_hooks");
const parse_1 = tslib_1.__importDefault(require("./parser/parse"));
const constructors_1 = require("./type-checker/constructors");
const evaluate_1 = require("./type-checker/evaluate");
const run_type_phase_1 = require("./type-checker/run-type-phase");
const utils_1 = require("./type-checker/utils");
const visitor_utils_1 = require("./type-checker/visitor-utils");
function indent(string, spaces = 2) {
    const indentString = Array(spaces).fill(' ').join('');
    return string.replace(/^/gm, indentString);
}
const prettyPrintValue = visitor_utils_1.visitAndTransformValue((value) => {
    switch (value.kind) {
        case 'DataValue':
            return `${value.name}[${value.parameters.join(', ')}`;
        case 'RecordLiteral':
            return `{ ${lodash_1.map(value.properties, (property, key) => `${property}: ${key}`).join(', ')} }`;
        case 'DualBinding':
            return `${value.left}:${value.right}`;
        case 'ApplicationValue':
            return `(${value.callee} ${value.parameter})`;
        case 'ReadDataValueProperty':
            return `${value.dataValue}#${value.property}`;
        case 'ReadRecordProperty':
            return `${value.record}.${value.property}`;
        case 'FunctionLiteral':
            return `${value.parameter} -> ${value.body}`;
        case 'ImplicitFunctionLiteral':
            return `implicit ${value.parameter} -> ${value.body}`;
        case 'FreeVariable':
            return value.name;
        case 'SymbolLiteral':
            return `\`${value.name}\``;
        case 'BooleanLiteral':
            return value.value ? 'true' : 'false';
        case 'NumberLiteral':
            return value.value.toString();
        case 'StringLiteral':
            return value.value;
        case 'PatternMatchValue': {
            const patterns = value.patterns.map(({ test, value }) => `  | ${test} = ${value}`);
            return `${value.value}\n${patterns.join('')}`;
        }
        default:
            return utils_1.assertNever(value);
    }
});
function timePromise(f) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let before = perf_hooks_1.performance.now();
        const result = yield f();
        let after = perf_hooks_1.performance.now();
        return [after - before, result];
    });
}
function timeFunction(f) {
    let before = perf_hooks_1.performance.now();
    const result = f();
    let after = perf_hooks_1.performance.now();
    return [after - before, result];
}
function readFileTimed(filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return timePromise(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const code = yield fs_1.promises.readFile(filename);
            return code.toString();
        }));
    });
}
function readFile(filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        process.stdout.write('➜ Reading file...');
        try {
            const [time, code] = yield readFileTimed(filename);
            process.stdout.write(chalk_1.default.grey(` ${time.toFixed(0)}ms\n`));
            return code;
        }
        catch (error) {
            process.stdout.write('\n');
            console.log(chalk_1.default.red('✖ Error'));
            throw error;
        }
    });
}
function parseCode(code) {
    process.stdout.write('➜ Parsing code...');
    const [time, { value: expression }] = timeFunction(() => parse_1.default(code.toString()));
    if (!expression) {
        process.stdout.write('\n');
        console.log(chalk_1.default.red('✖ Failed to parse code'));
        process.exit(1);
    }
    process.stdout.write(chalk_1.default.grey(` ${time.toFixed(0)}ms\n`));
    return expression;
}
function checkTypes(expression) {
    process.stdout.write('➜ Checking types...');
    const [time, [messages]] = timeFunction(() => run_type_phase_1.runTypePhase(expression));
    if (messages.length > 0) {
        process.stdout.write('\n');
        console.log(chalk_1.default.red('✖ Failed to type code'));
        messages.forEach((message) => {
            console.log(chalk_1.default.red('•', message));
        });
        process.exit(1);
    }
    process.stdout.write(chalk_1.default.grey(` ${time.toFixed(0)}ms\n`));
}
function evaluate(expression) {
    process.stdout.write('➜ Evaluating...');
    const [time, value] = timeFunction(() => evaluate_1.evaluateExpression(constructors_1.evaluationScope())(expression));
    if (!value) {
        process.stdout.write('\n');
        console.log(chalk_1.default.red('✖ Failed to evaluate expression'));
        process.exit(1);
    }
    process.stdout.write(chalk_1.default.grey(` ${time.toFixed(0)}ms\n`));
    return value;
}
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const filename = process.argv[2];
        if (!filename) {
            console.log(chalk_1.default.red('✖ Need to provide a filename'));
            process.exit(1);
        }
        const code = yield readFile(filename);
        const expression = parseCode(code);
        checkTypes(expression);
        const value = evaluate(expression);
        console.log(chalk_1.default.green('\u2713 Succeeded'));
        console.log();
        console.log(indent(prettyPrintValue(value)));
        console.log();
    });
}
main();
//# sourceMappingURL=cli.js.map