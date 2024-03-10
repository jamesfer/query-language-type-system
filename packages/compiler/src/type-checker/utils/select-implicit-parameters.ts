import { adhocCollect } from '../../utils/adhoc-collect';
import { Value } from '../types/value';

export function selectImplicitParameters(inputValue: Value): Value[] {
  return adhocCollect(inputValue, value => (
    value.kind === 'ImplicitFunctionLiteral' ? [value.body, value.parameter] : []
  ));
}
