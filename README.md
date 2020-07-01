# Query Language ![CI](https://github.com/jamesfer/query-language-type-system/workflows/CI/badge.svg)

**[Try it online](https://jamesfer.me/query-language-type-system/)**

This is a proof of concept language I have been working on for a while now that compiles to
Javascript and C++ (coming soon). It is purely functional and features a somewhat unique
type-system.

## Type system ideology

When I was thinking about type-systems that exist in languages such as Scala and Haskell, they
seemed very powerful, however they still needed to invent new syntax when a new type level feature
was discovered or became popular. Examples for Haskell are linear types, type families, rank-N types
etc. While Haskell has a useful system of introduction syntax in a backwards compatible manner, they
still had to come up with the syntax in the first place. Based on this, my hypothesis is that Haskell's type system
is not a purely accurate representation of the way we humans think about computers, or the way programs naturally form.
Maybe there is a better representation of types that fits what we want to do with them more easily
and wouldn't require additional syntax for all these features because they can be built from the core elements of the language.
From this idea, I tried to reduce the core elements of the type system into the minimal number of constructs
needed to represent them and hoped that this would produce the better representation that I was searching for.
The result is a type system that more closely resembles a set on constraints that the compiler tries to fill.

## Tour

Everything in the language is an expression, even files. So the Hello World is simply:
```
"Hello World"
```
How this compiles depends on the target. If you are using the online compiler, this will end up as
an export from a Javascript module because it defaults to building a module from the input code.

All the other base types exist and comments can be written using two dashes (`--`):
```
-- Integers
5073
```
```
-- Floats
9.0391e4.56
```
```
-- Booleans
true
```

You can create variables using the `let` keyword and you can call functions using lambda-calculus
style application:
```
let a = 5
let b = 10
add a b
```

The `let` keyword is also used to declare functions. Functions are not treated differently from any
other value:
```
let identity = a -> a
identity 5
```

The `data` keyword can be used to create unique combinations of data. These are similar to algebraic
data types in other languages but they are simpler:
```
data Person = name, age, email
Person "Mark" 23 "mark@example.com"
```
The `Person` function constructs `Person` objects that are distinct from other data types. If you
look at the compiled code, you can see that it is simply a way to store each of the parameters along
with the unique name of the data type.

You can also use pattern match expressions:
```
let isSquareRootOfNine = n -> match n | 3 = true | _ = false
match isSquareRootOfNine 3 | true = "Correct" | false = "Incorrect" 
```
*Why is it on one line? It looks so ugly...* Good question, did I mention how it's still early
development and for some reason I didn't think that new lines would be something to implement
early 🤔.

## Constraint system

In many other languages the algebraic data type syntax supports specifying multiple constructors of
each data type, however, in this language it is accomplished slightly differently. Each data
structure can only have a single constructor, but you can use regular let bindings to create
relationships between data structures. For example this is how you might represent colours in
Haskell:
```haskell
data Colour = Red | Green | Blue
```
In my language they would be represented like this:
```
-- Create the Colour data structure. This accepts a single parameter which is the child
-- implementation
data Colour = child

-- Then create a data structure for each of the child colors
data Red
data Green
data Blue

-- Then use let bindings to link them together
let redColourImpl = Colour Red
let greenColourImpl = Colour Green
let blueColourImpl = Colour Blue
```

To write a haskell function that accepted a colour, you might do something like:
```haskell
describeColour :: Colour -> String
describeColour Red = "Bright red"
describeColour Green = "Fresh green"
describeColour Blue = "Subtle blue"
```
In my language it would look something like:
```
let describeColour = implicit Colour colour -> colour -> match colour | Red = "Bright red" | Green = "Fresh green" | Blue = "Subtle blue"
describeColour Red
```
This expression introduces another piece of syntax, implicit parameters, which are the core of how
the constraint system works. Implicit parameters are parameters that you don't supply yourself as
the programmer, but the language needs to find a value for at compile time in order for it not to
throw an error. In this example, the function takes two parameters. One that is implicit and one
that you need to provide called `colour`. By itself, `colour` could be anything at all. It is the
implicit parameter which restricts it to being a child of the `Colour` data structure. The compiler
has to be able to find a variable in the form `Colour _` where the underscore is whatever you
supplied as the `colour` parameter. Here we provided `Red` so the compiler tries to find a variable
with the value `Colour Red`. Luckily we declared one earlier, so the program passes the type
checking stage. If we instead tried to call `describeColour` with the parameter `5`, the compiler
would look for a variable with the value `Colour 5`. When it couldn't find one, it would produce an
error and refuse to compile the code anymore. This is the basic implementation of the constraint
system.

*But this language is so much more verbose, why would any one pick it over Haskell?* Currently the
language is super verbose and obviously that is not convenient. My hope that once the core concepts
have been shown to support many of the type features that are useful, the verbosity can be reduced
by adding a nice helping of syntax sugar onto this fairly savory base. Even though this would add
more syntax to the language, I think having the core flexible would result in a more usable
language. If the syntax sugar doesn't support what you want to represent, you can easily fallback
to the underlying representations which is harder to do in some other languages where the syntax
is very closely related to the internal representation of types.

# Licence

MIT License

Copyright (c) 2020 James Ferguson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
