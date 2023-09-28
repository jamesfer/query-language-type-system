"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs_1 = require("fs");
const lodash_1 = require("lodash");
const perf_hooks_1 = require("perf_hooks");
const api_1 = require("./api");
const parse_1 = tslib_1.__importDefault(require("./parser/parse"));
const type_checker_1 = require("./type-checker");
const utils_1 = require("./type-checker/utils");
const visitor_utils_1 = require("./type-checker/visitor-utils");
const unique_id_generator_1 = require("./utils/unique-id-generator");
const assert_1 = require("./utils/assert");
const generate_javascript_1 = require("./backend/javascript/generate-javascript");
const require_from_string_1 = tslib_1.__importDefault(require("require-from-string"));
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
        const before = perf_hooks_1.performance.now();
        const result = yield f();
        const after = perf_hooks_1.performance.now();
        return [after - before, result];
    });
}
function timeFunction(f) {
    const before = perf_hooks_1.performance.now();
    const result = f();
    const after = perf_hooks_1.performance.now();
    return [after - before, result];
}
function timeAndPrintSection(name, f) {
    try {
        process.stdout.write(name);
        const [time, value] = timeFunction(f);
        process.stdout.write(chalk_1.default.grey(` ${time.toFixed(0)}ms\n`));
        return value;
    }
    catch (e) {
        process.stdout.write('\n');
        throw e;
    }
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
function runCheckTypes(expression) {
    process.stdout.write('➜ Checking types...');
    const [time, [messages]] = timeFunction(() => type_checker_1.checkTypes(unique_id_generator_1.uniqueIdStream(), expression));
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
function compileCode(code) {
    try {
        return timeAndPrintSection('➜ Compiling...', () => {
            return api_1.compile(code);
        });
    }
    catch (e) {
        console.error(chalk_1.default.red('✖ Compilation threw an error: ') + e);
    }
}
function evaluateExpression(expression) {
    const javascriptCode = generate_javascript_1.generateJavascript(expression, { module: 'commonjs' });
    try {
        return require_from_string_1.default(javascriptCode);
    }
    catch (error) {
        throw new Error(`Encountered an error while requiring generated code\n${error}\n\nCode: ${javascriptCode}`);
    }
}
function evaluate(expression) {
    try {
        return timeAndPrintSection('➜ Evaluating...', () => {
            return evaluateExpression(expression);
        });
    }
    catch (e) {
        console.log(chalk_1.default.red('✖ Failed to evaluate expression: ') + e);
    }
}
function handleCode(code) {
    const result = compileCode(code);
    if (result == null) {
        return;
    }
    if (result.expression == null) {
        console.error(chalk_1.default.red('✖ Failed to produce an expression from compiled code.'));
        result.messages.forEach((message) => {
            console.error(chalk_1.default.red(`  - ${message}`));
        });
        return;
    }
    const value = evaluate(result.expression);
    console.log(chalk_1.default.green('\u2713 Succeeded'));
    console.log();
    console.log(value);
    // console.log(indent(prettyPrintValue(value)));
    // console.log();
}
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (process.argv[2] === '-e') {
            const code = process.argv[3];
            assert_1.assert(code != null, 'Missing code argument after -e');
            handleCode(code);
        }
        else {
            const filename = process.argv[2];
            if (!filename) {
                console.log(chalk_1.default.red('✖ Need to provide a filename'));
                process.exit(1);
            }
            const code = yield readFile(filename);
            handleCode(code);
        }
    });
}
main();
//# sourceMappingURL=cli.js.map