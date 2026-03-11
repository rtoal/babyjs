import * as fs from "node:fs"
import parse from "./parser.js"
import interpret from "./interpreter.js"

if (process.argv.length < 3) {
  console.error("Usage: baby <file.baby>")
  process.exit(1)
}

try {
  const sourceCode = fs.readFileSync(process.argv[2], "utf-8")
  const match = parse(sourceCode) // if it failed, it would have thrown
  interpret(match)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
