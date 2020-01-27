import { find, flatMap, flatten, map, mapValues } from 'lodash';
import {
  bind,
  eScopeBinding,
  expandEvaluationScope, freeVariable,
  readDataProperty,
  readRecordProperty, symbol,
} from './constructors';
import { EScopeBinding, EvaluationScope } from './types/evaluation-scope';
import { Expression } from './types/expression';
import { ApplicationValue, DataValue, Value } from './types/value';
import { assertNever, checkedZip, checkedZipWith, every, everyValue, isDefined } from './utils';
import { VariableReplacement } from './variable-utils';

export const substituteExpressionVariables = (substitutions: { name: string, value: Expression }[]) => (expression: Expression): Expression => {
  const recurse = substituteExpressionVariables(substitutions);
  return substitutions.reduce(
    (body, { name, value }): Expression => {
      switch (body.kind) {
        case 'SymbolExpression':
        case 'NumberExpression':
        case 'BooleanExpression':
        case 'FunctionExpression':
          return body;

        case 'Identifier':
          return body.name === name ? value : body;

        case 'Application':
          return {
            ...body,
            kind: 'Application',
            parameters: body.parameters.map(recurse),
            callee: recurse(body.callee),
          };

        case 'DataInstantiation':
          return {
            ...body,
            kind: 'DataInstantiation',
            parameters: body.parameters.map(recurse),
          };

        case 'RecordExpression':
          return {
            ...body,
            properties: mapValues(body.properties, recurse),
          };

        case 'BindingExpression':
          return {
            ...body,
            value: recurse(body.value),
            body: recurse(body.body),
          };

        case 'DualExpression':
          return {
            ...body,
            left: recurse(body.left),
            right: recurse(body.right),
          };

        case 'ReadRecordPropertyExpression':
          return {
            ...body,
            record: recurse(body.record),
          };

        case 'ReadDataPropertyExpression':
          return {
            ...body,
            dataValue: recurse(body.dataValue),
          };

        // case 'ImplementExpression':
        //   return {
        //     ...body,
        //     parameters: body.parameters.map(recurse),
        //     body: recurse(body.body),
        //   };
        //
        // case 'DataDeclaration':
        //   return {
        //     ...body,
        //     parameters: body.parameters.map(recurse),
        //     body: recurse(body.body),
        //   };

        default:
          return assertNever(body);
      }
    },
    expression,
  );
};

function destructureValue(shape: Value, value: Value): VariableReplacement[] | undefined {
  switch (shape.kind) {
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FunctionLiteral':
      return [];

    case 'FreeVariable':
      return [{ from: shape.name, to: value }];

    case 'DualBinding':
      const leftReplacements = destructureValue(shape.left, value);
      const rightReplacements = destructureValue(shape.right, value);
      return leftReplacements && rightReplacements
        ? [...leftReplacements, ...rightReplacements]
        : undefined;

    case 'DataValue': {
      if (value.kind !== 'DataValue' || value.name !== shape.name) {
        return undefined;
      }

      const replacements = checkedZipWith(shape.parameters, value.parameters, destructureValue);
      return every(replacements, isDefined) ? flatten(replacements) : undefined;
    }

    case 'RecordLiteral':
      if (value.kind !== 'RecordLiteral') {
        return undefined;
      }

      const replacements = map(shape.properties, (property, key) => (
        value.properties[key] ? destructureValue(property, value.properties[key]) : undefined
      ));
      return every(replacements, isDefined) ? flatten(replacements) : undefined;
  }
}

const destructureValueToBinds = (previousExpression: Expression) => (shape: Value): EScopeBinding[] => {
  switch (shape.kind) {
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FunctionLiteral':
    case 'SymbolLiteral':
      return [];

    case 'FreeVariable':
      return [eScopeBinding(shape.name, previousExpression)];

    case 'DualBinding':
      const leftReplacements = destructureValueToBinds(previousExpression)(shape.left);
      const rightReplacements = destructureValueToBinds(previousExpression)(shape.right);
      return [...leftReplacements, ...rightReplacements];

    case 'DataValue':
      return flatMap(shape.parameters, (parameter, index) => (
        destructureValueToBinds(readDataProperty(previousExpression, index))(parameter)
      ));

    case 'RecordLiteral':
      return flatMap(shape.properties, (parameter, key) => (
        destructureValueToBinds(readRecordProperty(previousExpression, key))(parameter)
      ));

    default:
      return assertNever(shape);
  }
};

export const evaluateExpression = (scope: EvaluationScope) => (expression: Expression): Value | undefined => {
  switch (expression.kind) {
    case 'SymbolExpression':
      return { kind: 'SymbolLiteral', name: expression.name };

    case 'NumberExpression':
      return { kind: 'NumberLiteral', value: expression.value };

    case 'BooleanExpression':
      return { kind: 'BooleanLiteral', value: expression.value };

    case 'DualExpression': {
      const left = evaluateExpression(scope)(expression.left);
      const right = evaluateExpression(scope)(expression.right);
      if (!left || !right) {
        console.log('Failed to evaluate dual expression');
        return undefined;
      }
      return { left, right, kind: 'DualBinding' };
    }

    case 'DataInstantiation': {
      const name = evaluateExpression(scope)(expression.callee);
      if (!name) {
        console.log('Failed to evaluate callee of data instantiation', expression.callee);
        return undefined;
      }

      const parameters = expression.parameters.map(evaluateExpression(scope));
      if (every(parameters, isDefined)) {
        return {
          parameters,
          kind: 'DataValue',
          name: name,
        };
      }
      console.log('Failed to evaluate all parameters of a DataInstantiation');
      return undefined;
    }

    case 'FunctionExpression': {
      const parameters = map(expression.parameters, 'value').map(evaluateExpression(scope));
      if (!every(parameters, isDefined)) {
        console.log('Failed to evaluate all parameters of a function expression');
        return undefined;
      }

      return {
        kind: 'FunctionLiteral',
        body: expression.body,
        parameters: parameters.map(value => ({ value, kind: 'FunctionLiteralParameter' })),
      };
    }

    case 'RecordExpression': {
      const properties = mapValues(expression.properties, evaluateExpression(scope));
      if (everyValue(properties, isDefined)) {
        return { properties, kind: 'RecordLiteral' };
      }

      console.log('Failed to evaluate all properties of a record expression');
      return undefined;
    }

    case 'Identifier': {
      const declaration = find(scope.bindings, { name: expression.name });
      if (declaration) {
        return declaration.kind === 'ScopeBinding' ? evaluateExpression(scope)(declaration.value) : declaration.type;
      }
      return freeVariable(expression.name);
    }

    case 'Application': {
      const calleeValue = evaluateExpression(scope)(expression.callee);
      if (!calleeValue) {
        console.log('Failed to evaluate callee of an application');
        return undefined;
      }

      if (calleeValue.kind !== 'FunctionLiteral') {
        console.log('Failed to evaluate application because the callee was not a function literal');
        return undefined;
      }

      if (expression.parameters.length > calleeValue.parameters.length) {
        console.log('Too many parameters given to application');
        return undefined;
      }

      const parameterBindings = flatMap(
        checkedZip(expression.parameters, calleeValue.parameters),
        ([parameter, shape]) => destructureValueToBinds(parameter)(shape.value),
      );
      const newScope = expandEvaluationScope(scope, { bindings: parameterBindings });

      // Normal application
      if (expression.parameters.length === calleeValue.parameters.length) {
        return evaluateExpression(newScope)(calleeValue.body);
      }


      const newBody: ApplicationValue = {
        kind: 'ApplicationValue',
        callee: evaluateExpression(newScope)(calleeValue.body),
        parameters: ,
      };

      return {
        kind: 'DataValue',
        name: symbol('Function'),
        parameters: [
          ...calleeValue.parameters.slice(expression.parameters.length).map(parameter => parameter.value),
        ],
      };

      // return {
      //   kind: 'FunctionLiteral',
      //   parameters: calleeValue.parameters.slice(expression.parameters.length),
      //   body: parameterBindings.reduceRight(
      //     (previousValue, { name, value }) => bind(name, value)(previousValue),
      //     calleeValue.body,
      //   ),
      // };

        // // Replace all occurrences of the parameters in the body with their value
        // const parameterPairs = checkedZipWith(
        //   expression.parameters,
        //   calleeValue.parameters.slice(0, expression.parameters.length),
        //   (value, { callee }) => ({ callee, value }),
        // );
        // const newBody = substituteExpressionVariables(parameterPairs)(calleeValue.body);
        //
        // // Regular apply
        // if (expression.parameters.length === calleeValue.parameters.length) {
        //   return evaluateExpression(scope)(newBody);
        // }
        //
        // // Partial apply
        // return {
        //   kind: 'FunctionLiteral',
        //   body: newBody,
        //   parameters: calleeValue.parameters.slice(expression.parameters.length),
        // };
    }

    case 'BindingExpression':
      return evaluateExpression(expandEvaluationScope(scope, {
        bindings: [eScopeBinding(expression.name, expression.value)]
      }))(expression.body);

    case 'ReadRecordPropertyExpression': {
      const record = evaluateExpression(scope)(expression.record);
      if (!record || record.kind !== 'RecordLiteral' || !record.properties[expression.property]) {
        console.log('Failed to evaluate read record property expression because the subject was not a record');
        return undefined;
      }
      return record.properties[expression.property];
    }

    case 'ReadDataPropertyExpression': {
      const dataValue = evaluateExpression(scope)(expression.dataValue);
      if (!dataValue || dataValue.kind !== 'DataValue' || dataValue.parameters.length <= expression.property) {
        console.log('Failed to evaluate read data property expression because the subject was not a data value');
        return undefined;
      }
      return dataValue.parameters[expression.property];
    }

    // case 'DataDeclaration': {
    //   const parameterNames = expression.parameters.map((_, index) => `p${index}`);
    //   const newScope = expandEvaluationScope(scope, {
    //     bindings: [{
    //       kind: 'ScopeBinding',
    //       callee: expression.callee,
    //       value: {
    //         kind: 'FunctionExpression',
    //         parameters: parameterNames.map(callee => ({ callee, kind: 'FunctionExpressionParameter' })),
    //         body: {
    //           kind: 'DataInstantiation',
    //           callee: expression.callee,
    //           parameters: parameterNames.map(identifier),
    //         },
    //       },
    //     }],
    //   });
    //
    //   return evaluateExpression(newScope)(expression.body);
    // }
    //
    // case 'ImplementExpression': {
    //   if (expression.parameters.length === 0) {
    //     return undefined;
    //   }
    //
    //   const lastParam = expression.parameters[expression.parameters.length - 1];
    //   const newScope = expandEvaluationScope(scope, {
    //     bindings: [{
    //       kind: 'ScopeBinding',
    //       callee: expression.identifier,
    //       value: lastParam,
    //     }],
    //   });
    //
    //   return evaluateExpression(newScope)(expression.body);
    // }

    default:
      return assertNever(expression);
  }
};

// export const evaluateNode = (scope: EvaluationScope) => ({ expression }: TypedNode): Value<Expression<TypedNode>> | undefined => evaluateExpression(scope)(expression);
// export const evaluateExpression = (scope: EvaluationScope) => (expression: Expression<TypedNode>): Value<Expression<TypedNode>> | undefined => {
//   switch (expression.kind) {
//     case 'NumberExpression':
//       return { kind: 'NumberLiteral', value: expression.value };
//
//     case 'BooleanExpression':
//       return { kind: 'BooleanLiteral', value: expression.value };
//
//     case 'DataInstantiation':
//       const parameters = expression.parameters.map(evaluateNode(scope));
//       return every(parameters, isDefined)
//         ? {
//           parameters,
//           kind: 'DataValue',
//           callee: expression.callee,
//         }
//         : undefined;
//
//     case 'FunctionExpression':
//       return {
//         kind: 'FunctionLiteral',
//         body: expression.body.expression,
//         parameters: expression.parameters.map(parameter => ({
//           kind: 'FunctionLiteralParameter',
//           callee: parameter.callee,
//         })),
//       };
//
//     case 'RecordExpression': {
//       const properties = mapValues(expression.properties, evaluateNode(scope));
//       return everyValue(properties, isDefined)
//         ? { properties, kind: 'RecordLiteral' }
//         : undefined;
//     }
//
//     case 'Identifier': {
//       // TODO create a property access expression and then return a function literal here
//       if (expression.callee.startsWith('.')) {
//         return {
//           kind: 'DataValue',
//           callee: `$PROPERTY_ACCESS:${expression.callee.slice(1)}`,
//           parameters: [],
//         };
//       }
//
//       const declaration = find(scope.bindings, { callee: expression.callee });
//       return declaration ? evaluateExpression(scope)(declaration.value) : undefined;
//     }
//
//     case 'Application': {
//       const calleeValue = evaluateNode(scope)(expression.callee);
//       if (!calleeValue) {
//         return undefined;
//       }
//
//       if (calleeValue.kind === 'FunctionLiteral') {
//         {
//           if (expression.parameters.length > calleeValue.parameters.length) {
//             return undefined;
//           }
//
//           // Replace all occurrences of the parameters in the body with their value
//           const parameterPairs = checkedZipWith(
//             expression.parameters,
//             calleeValue.parameters.slice(0, expression.parameters.length),
//             (value, { callee }) => ({ callee, value }),
//           );
//           const newBody = substituteExpressionVariables(parameterPairs)(calleeValue.body);
//
//           // Regular apply
//           if (expression.parameters.length === calleeValue.parameters.length) {
//             return evaluateExpression(scope)(newBody);
//           }
//
//           // Partial apply
//           return {
//             kind: 'FunctionLiteral',
//             body: newBody,
//             parameters: calleeValue.parameters.slice(expression.parameters.length),
//           };
//         }
//       }
//
//       if (calleeValue.kind === 'DataValue') {
//         // TODO convert this into a real expression
//         if (!calleeValue.callee.startsWith('$PROPERTY_ACCESS:') || expression.parameters.length !== 1) {
//           return undefined;
//         }
//
//         const [record] = expression.parameters;
//         const recordValue = evaluateNode(scope)(record);
//         if (!recordValue || recordValue.kind !== 'RecordLiteral') {
//           return undefined;
//         }
//
//         const [, propertyName] = calleeValue.callee.split(':');
//         return (propertyName in recordValue.properties)
//           ? recordValue.properties[propertyName]
//           : undefined;
//       }
//
//       return undefined;
//     }
//
//     case 'BindingExpression': {
//       const newScope = expandEvaluationScope(scope, {
//         bindings: [{
//           kind: 'ScopeBinding',
//           callee: expression.callee,
//           value: expression,
//         }]
//       });
//
//       return evaluateNode(newScope)(expression.body);
//     }
//
//     case 'DataDeclaration': {
//       // TODO revisit. It is very complex to create a decorated expression in the middle of a
//       //      evaluation pass. Maybe there is better way to do this.
//       const newScope = expandEvaluationScope(scope, {
//         bindings: [{
//           kind: 'ScopeBinding',
//           callee: expression.callee,
//           value: {
//             kind: 'FunctionExpression',
//             parameters: expression.parameters.map((_, index) => ({
//               kind: 'FunctionExpressionParameter',
//               callee: `p${index}`,
//             })),
//             body: node<TypedDecoration>(
//               {
//                 kind: 'DataInstantiation',
//                 callee: expression.callee,
//                 parameters: expression.parameters.map((_, index) => node<TypedDecoration>(
//                   identifier(`p${index}`),
//                   // TODO
//                   { scope: makeScope(), type: dataValue('null') },
//                 )),
//               },
//               // TODO
//               { scope: makeScope(), type: dataValue('null') },
//             ),
//           },
//         }],
//       });
//
//       return evaluateNode(newScope)(expression.body);
//     }
//
//     case 'ImplementExpression': {
//       if (expression.parameters.length === 0) {
//         return undefined;
//       }
//
//       const lastParam = expression.parameters[expression.parameters.length - 1];
//       const newScope = expandEvaluationScope(scope, {
//         bindings: [{
//           kind: 'ScopeBinding',
//           callee: expression.identifier,
//           value: lastParam.expression,
//         }],
//       });
//
//       return evaluateNode(newScope)(expression.body);
//     }
//
//     default:
//       return assertNever(expression);
//   }
// };

// export function evaluateDeclaration(scope: EvaluationScope, declaration: Declaration): [EvaluationScope, CoreValue[]] {
//   switch (declaration.kind) {
//     case 'DataDeclaration': {
//       const a: EScopeDataDeclaration = {
//         kind: 'DataDeclaration',
//         callee: declaration.callee,
//         parameters: declaration.parameters.map(({ callee }) => callee),
//       };
//       return [expandEvaluationScope(scope, { declarations: [a] }), []];
//     }
//
//     case 'FunctionDeclaration': {
//       const f: EScopeFunctionDeclaration = {
//         kind: 'FunctionDeclaration',
//         body: declaration.body,
//         callee: declaration.callee,
//         parameters: declaration.parameters,
//       };
//       return [expandEvaluationScope(scope, { declarations: [f] }), []];
//     }
//
//     case 'ExpressionDeclaration': {
//       const result = evaluateExpression(scope, declaration.value);
//       return [scope, result ? [result] : []];
//     }
//
//     case 'ImplementDeclaration':
//       return [scope, []];
//
//     default:
//       return assertNever(declaration);
//   }
// }
//
// export function evaluate(scope: EvaluationScope, declarations: Declaration[]): Value[] {
//   return flatten(mapWithState(declarations, scope, evaluateDeclaration));
// }
