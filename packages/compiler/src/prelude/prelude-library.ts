const preludeLibrary = `data Number = a
let add = (implicit Number r -> implicit Number g -> r -> g):#{ kind = "binaryOperation", operator = "+", }
"END"`;

export default preludeLibrary;


// let subtract = (implicit Number a -> implicit Number b -> implicit Number c -> a -> b -> c):#{ type = "binaryOperation", operator = "-" }
// let multiply = (implicit Number a -> implicit Number b -> implicit Number c -> a -> b -> c):#{ type = "binaryOperation", operator = "*" }
// let divide = (implicit Number a -> implicit Number b -> implicit Number c -> a -> b -> c):#{ type = "binaryOperation", operator = "/" }
// let modulo = (implicit Number a -> implicit Number b -> implicit Number c -> a -> b -> c):#{ type = "binaryOperation", operator = "%" }
// data Element
// data Void
// let getElementById = (String -> Element):#{ type = "member", object = "document", name = "getElementById", arity = 1, }
// let createElement = (String -> Element):#{ type = "member", object = "document", name = "createElement", arity = 1, }
// let appendElement = (Element -> Element -> Void):#{ type = "memberCall", name = "appendChild", arity = 2, }
