function error(message, at) {
  const prefix = at.getLineAndColumnMessage()
  throw new Error(`${prefix}${message}`)
}

function validate(condition, message, at) {
  if (!condition) {
    error(message, at)
  }
}

function validateBoolean(value, at) {
  validate(
    typeof value === "boolean",
    `Expected a boolean, but got ${typeof value}`,
    at,
  )
}

function validateNumber(value, at) {
  validate(
    typeof value === "number",
    `Expected a number, but got ${typeof value}`,
    at,
  )
}

function validateAlreadyDeclared(memory, name, at) {
  validate(memory.has(name), `Undefined variable: ${name}`, at)
}

function validateNotYetDeclared(memory, name, at) {
  validate(!memory.has(name), `Variable already declared: ${name}`, at)
}

function validateSameType(target, source, at) {
  validate(
    typeof target === typeof source,
    `Type mismatch: cannot assign ${typeof source} to ${typeof target}`,
    at,
  )
}

export default function interpret(match) {
  const memory = new Map()

  const grammar = match.matcher.grammar
  const actions = {
    Program(statements) {
      for (const statement of statements.children) {
        statement.eval()
      }
    },

    PrintStmt(_print, _open, expression, _close) {
      console.log(expression.eval())
    },

    LetStmt(_let, id, _eq, expression) {
      validateNotYetDeclared(memory, id.sourceString, id.source)
      memory.set(id.sourceString, expression.eval())
    },

    IfStmt(_if, expression, _open, statements, _close) {
      const test = expression.eval()
      validateBoolean(test, expression.source)
      if (test) {
        for (const statement of statements.children) {
          statement.eval()
        }
      }
    },

    AssignStmt(id, _eq, expression) {
      const target = id.eval() // Handles the check for undefined variable in Primary_id
      const source = expression.eval()
      validateSameType(target, source, id.source)
      memory.set(id.sourceString, expression.eval())
    },

    Exp_binary(left, op, right) {
      const x = left.eval()
      const y = right.eval()
      validateNumber(x, left.source)
      validateNumber(y, right.source)
      switch (op.sourceString) {
        case "+":
          return x + y
        case "-":
          return x - y
        /* c8 ignore next 2 */
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
        /* c8 ignore next 2 */
        default:
          error(`Unknown operator: ${op.sourceString}`, op.source)
      }
    },

    Factor_exponentiation(base, _starStar, exponent) {
      const x = base.eval()
      const y = exponent.eval()
      validateNumber(x, base.source)
      validateNumber(y, exponent.source)
      return x ** y
    },

    Factor_negation(_minus, factor) {
      const x = factor.eval()
      validateNumber(x, factor.source)
      return -x
    },

    Primary_parens(_open, expression, _close) {
      return expression.eval()
    },

    Primary_id(id) {
      const name = id.sourceString
      validateAlreadyDeclared(memory, name, id.source)
      return memory.get(name)
    },

    num(_digits) {
      return Number(this.sourceString)
    },

    true(_) {
      return true
    },

    false(_) {
      return false
    },
  }
  const semantics = grammar.createSemantics().addOperation("eval", actions)
  return semantics(match).eval()
}
