import { describe, it } from "node:test"
import assert from "node:assert"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import * as core from "../src/core.js"

const semanticChecks = [
  ["number variable declaration", "let x = 1"],
  ["boolean true declaration", "let x = true"],
  ["boolean false declaration", "let x = false"],
  ["declare and print", "let x = 1 print(x)"],
  ["number reassignment", "let x = 1 x = 2"],
  ["boolean reassignment", "let x = true x = false"],
  ["print a number literal", "print(1)"],
  ["print true", "print(true)"],
  ["print false", "print(false)"],
  ["multiplication", "print(2 * 3)"],
  ["division", "print(6 / 2)"],
  ["modulo", "print(7 % 3)"],
  ["exponentiation", "print(2 ** 8)"],
  ["negation", "print(-5)"],
  ["addition", "print(1 + 2)"],
  ["subtraction", "print(5 - 3)"],
  ["less than", "print(1 < 2)"],
  ["greater than", "print(2 > 1)"],
  ["equality", "print(1 == 1)"],
  ["inequality", "print(1 != 2)"],
  ["variable in multiplication", "let x = 2 print(x * 3)"],
  ["variable in comparison", "let x = 5 print(x <= 10)"],
  ["if statement with boolean literal", "if true { print(1) }"],
  ["if-else statement", "if false { print(1) } else { print((0)) }"],
  ["while statement", "while false { print(1) }"],
  ["if with comparison condition", "let x = 1 if x < 2 { print(x) }"],
  ["while with comparison condition", "let x = 1 while x < 10 { x = 2 }"],
  ["multiple declarations", "let x = 1 let y = 2"],
  ["variable used in while body", "let x = 1 while false { print(x) }"],
  ["variable used in if body", "let x = 1 if true { print(x) }"],
  ["chained comparisons", "let x = 3 let y = 5 print(x < y)"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["use of undeclared variable", "print(x)", /Undefined variable/],
  [
    "redeclaration of variable",
    "let x = 1 let x = 2",
    /Variable already declared/,
  ],
  ["assign to undeclared variable", "x = 1", /Undefined variable/],
  ["non-boolean condition in if", "if 1 { print(1) }", /Expected a boolean/],
  [
    "non-boolean condition in if-else",
    "if 1 { print(1) } else { print(2) }",
    /Expected a boolean/,
  ],
  [
    "non-boolean condition in while",
    "while 1 { print(1) }",
    /Expected a boolean/,
  ],
  [
    "number variable as if condition",
    "let x = 1 if x { print(x) }",
    /Expected a boolean/,
  ],
  [
    "number variable as while condition",
    "let x = 1 while x { print(x) }",
    /Expected a boolean/,
  ],
  [
    "type mismatch assigning boolean to number variable",
    "let x = 1 x = true",
    /Type mismatch/,
  ],
  [
    "type mismatch assigning number to boolean variable",
    "let x = true x = 1",
    /Type mismatch/,
  ],
  [
    "boolean in multiplication left operand",
    "print(true * 1)",
    /Expected a number/,
  ],
  [
    "boolean in multiplication right operand",
    "print(1 * true)",
    /Expected a number/,
  ],
  ["boolean in division", "print(true / 1)", /Expected a number/],
  ["boolean in modulo", "print(true % 1)", /Expected a number/],
  ["boolean in exponentiation base", "print(true ** 2)", /Expected a number/],
  [
    "boolean in exponentiation exponent",
    "print(2 ** true)",
    /Expected a number/,
  ],
  ["boolean in negation", "print(-true)", /Expected a number/],
  ["boolean in addition left operand", "print(true + 1)", /Expected a number/],
  ["boolean in addition right operand", "print(1 + true)", /Expected a number/],
  ["boolean in subtraction", "print(true - 1)", /Expected a number/],
  ["boolean in less than", "print(true < 1)", /Expected a number/],
  ["boolean in greater than", "print(1 > true)", /Expected a number/],
  ["boolean in equality", "print(true == 1)", /Expected a number/],
  ["boolean in inequality", "print(true != 1)", /Expected a number/],
  [
    "redeclaration in while body",
    "let x = 1 while true { let x = 2 }",
    /Variable already declared/,
  ],
  [
    "redeclaration in if body",
    "let x = 1 if true { let x = 2 }",
    /Variable already declared/,
  ],
  [
    "undeclared variable in binary expression",
    "print(x + 1)",
    /Undefined variable/,
  ],
  ["undeclared variable in comparison", "print(x < 1)", /Undefined variable/],
]

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)))
    })
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern)
    })
  }
  it("produces the expected representation for a trivial program", () => {
    assert.deepEqual(
      analyze(parse("let x = 1")),
      core.program([core.letStmt(core.variable("x", "number"), 1)]),
    )
  })
})
