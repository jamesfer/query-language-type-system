import { Value } from '../types/value';

export function shallowExtractImplicits(value: Value): [Value, Value[]] {
  let body = value;
  const implicitParameters: Value[] = [];
  while (body.kind === 'ImplicitFunctionLiteral') {
    implicitParameters.push(body.parameter);
    body = body.body;
  }
  return [body, implicitParameters];
}
