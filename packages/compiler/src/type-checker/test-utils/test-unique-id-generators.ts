import { UniqueIdGenerator } from '../../utils/unique-id-generator';

export function prefixlessUniqueIdGenerator(): UniqueIdGenerator {
  let i = 0;
  return () => {
    i += 1;
    return i.toString();
  };
}

export function staticUniqueIdGenerator(values: string[]): UniqueIdGenerator {
  let i = -1;
  return () => {
    i += 1;
    if (i < values.length) {
      return values[i];
    }
    throw new Error(`Static unique id generator was only provided ${values.length} values`);
  };
}
