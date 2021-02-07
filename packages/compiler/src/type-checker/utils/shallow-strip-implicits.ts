import { ExplicitValue, Value } from '../types/value';

export function shallowStripImplicits(value: Value): Value {
  return value.kind === 'ImplicitFunctionLiteral' ? shallowStripImplicits(value.body) : value;
}
