import { describe, it } from "node:test"
import assert from "node:assert"
import parse from "../src/parser.js"

const syntaxChecks = [
  ["print(1)", "print statements"],
  ["let x = 1", "let statements"],
  ["x = 1", "assignment statements"],
  ["if x { print(x) }", "if statements"],
  ["if (x < 2) { print(x) }", "if statements with condition"],
  ["if x { print(x) } let y = 2", "multiple statements"],
  ["if x { print(x) } else { print(y) }", "if-else statements"],
  ["if x { print(x) } else { print(y) x = 1 }", "if-else statements"],
  ["", "empty input"],
  ["print(x < 2)", "comparison expressions"],
  ["while x { print(x) }", "while statements"],
  ["while (x < 2) { print(x) }", "while statements with condition"],
  ["let count = 3 * 22 + 1", "complex expressions"],
  ["print(1 + ((2 * 3)) % x ** 2 ** 5)", "parenthesized expressions"],
  ["print(-5)", "unary expressions"],
  ["print(2 ** 3 ** 2)", "right-associative exponentiation"],
  ["function add(a: number, b: number) = a + b", "function declaration"],
  ["print(add(5, 7))", "function call"],
]

const syntaxErrors = [
  ["print(1", "missing closing parenthesis"],
  ["let x 1", "missing equals sign"],
  ["x = ", "missing expression"],
  ["if x print(x)", "missing braces"],
  ["if { print(x) }", "missing condition"],
  ["if x { print(x) } else", "missing else block"],
  ["let = 1", "missing variable name"],
  ["let 1 = 2", "invalid variable name"],
  ["let if = 1", "'if' is not a variable name"],
  ["print 1)", "missing opening parenthesis"],
  ["let x = print(1)", "invalid statement"],
  ["let else = 1", "'else' is not a variable name"],
  ["let while = 1", "'while' is not a variable name"],
  ["let true = 1", "'true' is not a variable name"],
  ["let false = 1", "'false' is not a variable name"],
  ["ifx { print(x) }", "'if' should be separated from identifier"],
  ["whilex { print(x) }", "'while' should be separated from identifier"],
  ["functionx(a, b) = a + b", "'function' should be separated from identifier"],
  ["print(x < 2 < 5)", "comparison expressions do not associate"],
  ["function add(a, b) = a + b", "parameter without type annotation"],
]

describe("parser", () => {
  for (const [input, scenario] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      const match = parse(input)
      assert(
        match.succeeded(),
        `Expected to parse "${input}" successfully, but got: ${match.message}`,
      )
    })
  }
  for (const [input, scenario] of syntaxErrors) {
    it(`correctly detects the ${scenario} error`, () => {
      assert.throws(
        () => parse(input),
        `Expected parsing "${input}" to throw a syntax error, but it did not.`,
      )
    })
  }
})
