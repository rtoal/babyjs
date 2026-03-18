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
  ["", "empty input"],
  ["let count = 3 * 22 + 1", "complex expressions"],
  ["print(1 + ((2 * 3)) % x ** 2 ** 5)", "parenthesized expressions"],
]

const syntaxErrors = [
  ["print(1", "missing closing parenthesis"],
  ["let x 1", "missing equals sign"],
  ["x = ", "missing expression"],
  ["if x print(x)", "missing braces"],
  ["if { print(x) }", "missing condition"],
  ["let = 1", "missing variable name"],
  ["let 1 = 2", "invalid variable name"],
  ["let if = 1", "'if' is not a variable name"],
  ["print 1)", "missing opening parenthesis"],
  ["let x = print(1)", "invalid statement"],
  ["ifx { print(x) }", "keyword should be separated from identifier"],
  ["print(x < 2 < 5)", "comparison expressions do not associate"],
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
