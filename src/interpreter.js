function error(message, at) {
  const prefix = at.getLineAndColumnMessage()
  throw new Error(`${prefix}${message}`)
}

export default function interpret(match) {
  const memory = new Map()

  const grammar = match.matcher.grammar
  const semantics = grammar.createSemantics().addOperation("eval", {
    Program(statements) {
      for (const statement of statements.children) {
        statement.eval()
      }
    },
    PrintStmt(_print, _open, expression, _close) {
      console.log(expression.eval())
    },
    LetStmt(_let, id, _eq, expression) {
      memory.set(id.sourceString, expression.eval())
    },
    IfStmt(_if, expression, _open, statements, _close) {
      if (expression.eval()) {
        for (const statement of statements.children) {
          statement.eval()
        }
      }
    },
    AssignStmt(id, _eq, expression) {
      const name = id.sourceString
      if (!memory.has(name)) {
        error(`Undefined variable: ${name}`, id.source)
      }
      memory.set(name, expression.eval())
    },
    Exp_binary(left, op, right) {
      const x = left.eval()
      const y = right.eval()
      switch (op.sourceString) {
        case "+":
          return x + y
        case "-":
          return x - y
        default:
          error(`Unknown operator: ${op.sourceString}`, op.source)
      }
    },
    Term_binary(left, op, right) {
      const x = left.eval()
      const y = right.eval()
      switch (op.sourceString) {
        case "*":
          return x * y
        case "/":
          return x / y
        case "%":
          return x % y
        default:
          error(`Unknown operator: ${op.sourceString}`, op.source)
      }
    },
    Factor_exponentiation(base, _starStar, exponent) {
      return base.eval() ** exponent.eval()
    },
    Factor_negation(_minus, factor) {
      return -factor.eval()
    },
    Primary_parens(_open, expression, _close) {
      return expression.eval()
    },
    Primary_id(id) {
      const name = id.sourceString
      if (!memory.has(name)) {
        error(`Undefined variable: ${name}`, id.source)
      }
      return memory.get(name)
    },
    num(_digits) {
      return Number(this.sourceString)
    },
    id(_first, _rest) {
      return this.sourceString
    },
  })
  return semantics(match).eval()
}
