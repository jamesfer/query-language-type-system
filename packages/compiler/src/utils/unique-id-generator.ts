export type UniqueIdGenerator = (prefix?: string) => string

export function uniqueIdStream(): UniqueIdGenerator {
  let counter = 0;
  return prefix => `${prefix ?? ''}${++counter}`;
}
