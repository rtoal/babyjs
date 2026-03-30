import * as core from "./core.js"

function error(message, at) {
  const prefix = at.getLineAndColumnMessage()
  throw new Error(`${prefix}${message}`)
}

function typeOf(value) {
  return value?.type ?? typeof value
}

function validate(condition, message, at) {
  if (!condition) {
    error(message, at)
  }
}

function validateBoolean(value, at) {
  validate(
    typeOf(value) === "boolean",
    `Expected a boolean, but got ${typeOf(value)}`,
    at,
  )
}

function validateNumber(expression, at) {
  const type = typeOf(expression)
  validate(type === "number", `Expected a number, but got ${type}`, at)
}

function validateAlreadyDeclared(context, name, at) {
  validate(context.has(name), `Undefined variable: ${name}`, at)
}

function validateNotYetDeclared(context, name, at) {
  validate(!context.has(name), `Variable already declared: ${name}`, at)
}

function validateSameType(target, source, at) {
  validate(
    typeOf(target) === typeOf(source),
    `Type mismatch: cannot assign ${typeOf(source)} to ${typeOf(target)}`,
    at,
  )
}

export default function translate(match) {
  const context = new Map()

  const grammar = match.matcher.grammar
  const actions = {
    Program(statements) {
      return core.program(statements.children.map((s) => s.translate()))
    },

    PrintStmt(_print, _open, expression, _close) {
      const argument = expression.translate()
      return core.printStmt(argument)
    },

    LetStmt(_let, id, _eq, expression) {
      validateNotYetDeclared(context, id.sourceString, id.source)
      const source = expression.translate()
      const target = core.variable(id.sourceString, typeOf(source))
      context.set(id.sourceString, target)
      return core.letStmt(target, source)
    },

    Block(_open, statements, _close) {
      return statements.children.map((s) => s.translate())
    },

    IfStmt_noelse(_if, expression, block) {
      const test = expression.translate()
      validateBoolean(test, expression.source)
      const consequent = block.translate()
      return core.ifStmt(test, consequent, [])
    },

    IfStmt_else(_if, expression, block1, _else, block2) {
      const test = expression.translate()
      validateBoolean(test, expression.source)
      const consequent = block1.translate()
      const alternate = block2.translate()
      return core.ifStmt(test, consequent, alternate)
    },

    WhileStmt(_while, expression, block) {
      const test = expression.translate()
      validateBoolean(test, expression.source)
      const body = block.translate()
      return core.whileStmt(test, body)
    },

    AssignStmt(id, _eq, expression) {
      const target = id.translate()
      const source = expression.translate()
      validateSameType(target, source, id.source)
      return core.assignStmt(target, source)
    },

    Exp_binary(left, op, right) {
      const x = left.translate()
      const y = right.translate()
      validateNumber(x, left.source)
      validateNumber(y, right.source)
      const operator =
        { "==": "===", "!=": "!==" }[op.sourceString] ?? op.sourceString
      return core.binaryExp(x, operator, y, "boolean")
    },

    Condition_binary(left, op, right) {
      const x = left.translate()
      const y = right.translate()
      validateNumber(x, left.source)
      validateNumber(y, right.source)
      return core.binaryExp(x, op.sourceString, y, "number")
    },

    Term_binary(left, op, right) {
      const x = left.translate()
      const y = right.translate()
      validateNumber(x, left.source)
      validateNumber(y, right.source)
      return core.binaryExp(x, op.sourceString, y, "number")
    },

    Factor_exponentiation(base, _starStar, exponent) {
      const x = base.translate()
      const y = exponent.translate()
      validateNumber(x, base.source)
      validateNumber(y, exponent.source)
      return core.binaryExp(x, "**", y, "number")
    },

    Factor_negation(_minus, factor) {
      const x = factor.translate()
      validateNumber(x, factor.source)
      return core.unaryExp("-", x, "number")
    },

    Primary_parens(_open, expression, _close) {
      return expression.translate()
    },

    Primary_id(id) {
      const name = id.sourceString
      validateAlreadyDeclared(context, name, id.source)
      return context.get(name)
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
  const semantics = grammar.createSemantics().addOperation("translate", actions)
  return semantics(match).translate()
}
