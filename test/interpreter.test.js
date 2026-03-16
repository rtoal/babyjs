import { describe, it } from "node:test"
import interpret from "../src/interpreter.js"
import parse from "../src/parser.js"
import assert from "node:assert"

describe("interpreter", () => {
  it("evaluates a cool program", () => {
    const sourceCode = `
      print(1) print(2) let x = 5 x = 2
      print((x + 3) ** -2)
      if x { print(x * 1 / 1 % 1 - 0) } `
    const match = parse(sourceCode)
    let output = []
    console.log = (msg) => {
      output.push(msg)
    }
    interpret(match)
    assert.deepStrictEqual(output, [1, 2, 0.04, 0])
  })
  it("should throw an error for undefined variable", () => {
    const sourceCode = `
      print(y)
    `
    const match = parse(sourceCode)
    assert.throws(
      () => interpret(match),
      /Undefined variable: y/,
      "Expected an error for undefined variable, but it did not throw.",
    )
  })
})
