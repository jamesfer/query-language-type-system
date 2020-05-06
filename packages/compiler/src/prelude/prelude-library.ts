import dedent from 'dedent-js';

const preludeLibrary = dedent`
data Integer = a
data Float = a
data String = a
let add = (a -> b):#{ kind = "binaryOperation", operator = "+", }
let subtract = (a -> b):#{ kind = "binaryOperation", operator = "-", }
let multiply = (a -> b):#{ kind = "binaryOperation", operator = "*", }
let divide = (a -> b):#{ kind = "binaryOperation", operator = "/", }
let modulo = (a -> b):#{ kind = "binaryOperation", operator = "%", }
let power = (a -> b):#{ kind = "binaryOperation", operator = "**", }
"END"
`;

export default preludeLibrary;
