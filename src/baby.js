import * as fs from "node:fs"
import { inspect } from "node:util"
import stringify from "graph-stringify"
import parse from "./parser.js"
import translate from "./translator.js"

if (process.argv.length < 3) {
  console.error("Usage: baby <file.baby>")
  process.exit(1)
}

try {
  const sourceCode = fs.readFileSync(process.argv[2], "utf-8")
  const match = parse(sourceCode) // if it failed, it would have thrown
  const representation = translate(match)
  console.log(stringify(representation, "kind"))
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
