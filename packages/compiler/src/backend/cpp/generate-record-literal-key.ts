import { RecordLiteral } from '../../type-checker/types/value';

export function generateRecordLiteralKey(record: RecordLiteral): string {
  return JSON.stringify(record);
}
