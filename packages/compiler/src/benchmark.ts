import Benchmark, { Suite } from 'benchmark';
import { Dictionary, flatMap, keyBy, map, mapValues } from 'lodash';
import { parseSuite } from './parser/parse.benchmark';

interface Results {
  stats: Benchmark['stats'];
  times: Benchmark['times'];
  count: Benchmark['count'];
  cycles: Benchmark['cycles'];
  hz: Benchmark['hz'];
}

function run(suites: Suite[]): Promise<Suite[]> {
  return Promise.all(suites.map(suite => new Promise<Suite>((resolve, reject) => {
    suite.on('complete', function (this: Suite) {
      resolve(this);
    });
    suite.run();
  })));
}

function toJson(suites: Suite[]): Dictionary<Dictionary<Results>> {
  return mapValues(keyBy(suites, 'name'), (suite) => {
    return mapValues(keyBy(suite as unknown as ArrayLike<Benchmark>, 'name'), (benchmark): Results => {
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

function formatTime(seconds: number): string {
  return (seconds * 1000).toFixed(2) + 'ms';
  // return millify(seconds * 1e9, {
  //   precision: 2,
  //   space: true,
  //   units: ['ns', 'μs', 'ms', 's', 'm', 'h'],
  // })
}

function formatPercent(percent: number): string {
  return percent.toFixed(2) + '%';
  // return millify(percent, {
  //   precision: 2,
  //   units: ['%'],
  // })
}

function summary(allResults: Dictionary<Dictionary<Results>>): string {
  return flatMap(allResults, (suiteResults, suiteName) => {
    return [suiteName, ...map(suiteResults, (results, name) => {
      return `  ${name}: ${formatTime(results.stats.mean)} ±${formatPercent(results.stats.rme)}`;
    })];
  }).join('\n');
}

run([parseSuite]).then(toJson).then((results) => {
  console.log('Benchmarks finished');
  console.log(summary(results));
});
