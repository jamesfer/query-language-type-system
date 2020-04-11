import { Suite } from 'benchmark';
import parse from './parse';

export const parseSuite = new Suite('parse');

parseSuite.add('large function', () => {
  parse('a -> b -> c -> d -> e -> f -> g -> h -> 1');
});

parseSuite.add('data function', () => {
  parse('data T = implicit a, b, c\n5');
});

parseSuite.add('many bindings', () => {
  parse(
`data String
data Maybe = a
data Some = t
let go = implicit Maybe m -> m -> 5
let a = Some String
go a`
  );
});
