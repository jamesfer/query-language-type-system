"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const variable_utils_1 = require("./type-checker/variable-utils");
const unique_id_generator_1 = require("./utils/unique-id-generator");
function mergeVariable(nodeName, name) {
    return `MERGE (${nodeName}:VARIABLE { name: '${name}' })`;
}
function createRelationship(from, operator, to) {
    return `CREATE (${from})-[:${operator}]->(${to})`;
}
function stripCharacters(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}
function valueToNode(value, uniqueIds) {
    if (value.kind === 'FreeVariable') {
        const nodeName = uniqueIds('to');
        return {
            nodeName,
            nodeQuery: mergeVariable(nodeName, value.name),
        };
    }
    const midPointName = uniqueIds('midPoint');
    const subVariablesQuery = variable_utils_1.extractFreeVariableNamesFromValue(value).map(name => {
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
const typeToCypher = (uniqueIds) => (inferredType) => {
    const { nodeName, nodeQuery } = valueToNode(inferredType.to, uniqueIds);
    const fromName = uniqueIds('from');
    return `
    ${nodeQuery}
    ${mergeVariable(fromName, inferredType.from)}
    ${createRelationship(fromName, inferredType.operator, nodeName)}
  `;
};
function convertAllToCypher(inferredType) {
    const uniqueIds = unique_id_generator_1.uniqueIdStream();
    return inferredType.map(typeToCypher(uniqueIds)).join('\n');
}
function main() {
    console.log(convertAllToCypher(require('../../../inferredTypes.json')));
}
main();
//# sourceMappingURL=inferred-types-as-cypher.js.map