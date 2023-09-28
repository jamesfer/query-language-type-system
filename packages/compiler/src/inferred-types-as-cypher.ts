import { InferredType } from './type-checker/types/inferred-type';
import { Value } from './type-checker/types/value';
import { extractFreeVariableNamesFromValue } from './type-checker/variable-utils';
import { UniqueIdGenerator, uniqueIdStream } from './utils/unique-id-generator';

function mergeVariable(nodeName: string, name: string): string {
  return `MERGE (${nodeName}:VARIABLE { name: '${name}' })`
}

function createRelationship(from: string, operator: string, to: string): string {
  return `CREATE (${from})-[:${operator}]->(${to})`;
}

function stripCharacters(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function valueToNode(value: Value, uniqueIds: UniqueIdGenerator): { nodeName: string, nodeQuery: string } {
  if (value.kind === 'FreeVariable') {
    const nodeName = uniqueIds('to');
    return {
      nodeName,
      nodeQuery: mergeVariable(nodeName, value.name),
    };
  }

  const midPointName = uniqueIds('midPoint');
  const subVariablesQuery = extractFreeVariableNamesFromValue(value).map(name => {
    const variableName = uniqueIds(stripCharacters(name));
    return `
      ${mergeVariable(variableName, name)}
      ${createRelationship(midPointName, 'CONTAINS', variableName)}
    `;
  }).join('\n');
  return {
    nodeName: midPointName,
    nodeQuery: `
      CREATE (${midPointName}:VALUE { content: '${JSON.stringify(value, undefined, 2)}' })
      ${subVariablesQuery}
    `,
  };
}

const typeToCypher = (uniqueIds: UniqueIdGenerator) => (inferredType: InferredType): string => {
  const { nodeName, nodeQuery } = valueToNode(inferredType.to, uniqueIds);
  const fromName = uniqueIds('from');
  return `
    ${nodeQuery}
    ${mergeVariable(fromName, inferredType.from)}
    ${createRelationship(fromName, inferredType.operator, nodeName)}
  `;
}

function convertAllToCypher(inferredType: InferredType[]): string {
  const uniqueIds = uniqueIdStream();
  return inferredType.map(typeToCypher(uniqueIds)).join('\n');
}

function main() {
  console.log(convertAllToCypher(require('../../../inferredTypes.json')));
}

main();
