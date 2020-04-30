"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const parse_benchmark_1 = require("./parser/parse.benchmark");
function run(suites) {
    return Promise.all(suites.map(suite => new Promise((resolve, reject) => {
        suite.on('complete', function () {
            resolve(this);
        });
        suite.run();
    })));
}
function toJson(suites) {
    return lodash_1.mapValues(lodash_1.keyBy(suites, 'name'), (suite) => {
        return lodash_1.mapValues(lodash_1.keyBy(suite, 'name'), (benchmark) => {
            return {
                stats: benchmark.stats,
                times: benchmark.times,
                count: benchmark.count,
                cycles: benchmark.cycles,
                hz: benchmark.hz,
            };
        });
    });
}
function formatTime(seconds) {
    return (seconds * 1000).toFixed(2) + 'ms';
    // return millify(seconds * 1e9, {
    //   precision: 2,
    //   space: true,
    //   units: ['ns', 'μs', 'ms', 's', 'm', 'h'],
    // })
}
function formatPercent(percent) {
    return percent.toFixed(2) + '%';
    // return millify(percent, {
    //   precision: 2,
    //   units: ['%'],
    // })
}
function summary(allResults) {
    return lodash_1.flatMap(allResults, (suiteResults, suiteName) => {
        return [suiteName, ...lodash_1.map(suiteResults, (results, name) => {
                return `  ${name}: ${formatTime(results.stats.mean)} ±${formatPercent(results.stats.rme)}`;
            })];
    }).join('\n');
}
run([parse_benchmark_1.parseSuite]).then(toJson).then((results) => {
    console.log('Benchmarks finished');
    console.log(summary(results));
});
//# sourceMappingURL=benchmark.js.map