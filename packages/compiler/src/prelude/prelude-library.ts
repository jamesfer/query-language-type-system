import dedent from 'dedent-js';

// const preludeLibrary = dedent`
// data BUILT_IN
// data Integer = a
// data Addable = a, { addMe = implicit a left -> implicit a right -> implicit a result -> left -> right -> result, }
// let addMe = implicit Addable type methods -> implicit type left -> implicit type right -> left -> right -> methods.addMe left right
// let integerAddableImplementation = Addable Integer { addMe = (implicit Integer left -> implicit Integer right -> implicit Integer result -> left -> right -> result):#{ javascript = { kind = "binaryOperation", operator = "+", }, }, }
// "END"
// `;

const preludeLibrary = dedent`
data BUILT_IN
data Integer = a
data Float = a
data String = a
data Boolean = a
-- These are blocked on allowing a function to be called with different parameters
--data True
--data False
--let trueBooleanImpl = Boolean True
--let falseBooleanImpl = Boolean False

let add = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "+", }, }
let subtract = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "-", }, }
let multiply = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "*", }, }
let divide = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "/", }, }
let modulo = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "%", }, }
let power = (a -> b):#{ javascript = { kind = "binaryOperation", operator = "**", }, }
let equals = (a -> b -> implicit Boolean r -> r):#{ evaluator = { kind = "builtin", name = "equals", }, javascript = { kind = "binaryOperation", operator = "===", }, }
let if = (implicit Boolean c -> implicit t a -> implicit t b -> implicit t r -> c -> a -> b -> r):#{ evaluator = { kind = "builtin", name = "if", }, javascript = { kind = "ternaryOperator", }, }
"END"
`;

export default preludeLibrary;
