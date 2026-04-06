import * as core from "./core.js"

/**
 * A context contains a mapping of identifiers to entities.
 * Contexts are nested: a context may have a parent context,
 * and lookups will traverse up the chain of parent contexts.
 */
class Context {
  constructor(parent = null) {
    this.parent = parent
    this.bindings = new Map()
  }

  get(name, at) {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)
    } else if (this.parent) {
      return this.parent.get(name, at)
    } else {
      error(`Undefined variable: ${name}`, at)
    }
  }

  set(name, value, at) {
    if (this.bindings.has(name)) {
      error(`Variable already declared: ${name}`, at)
    }
    this.bindings.set(name, value)
  }
}

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

function validateSameType(target, source, at) {
  validate(
    typeOf(target) === typeOf(source),
    `Type mismatch: cannot assign ${typeOf(source)} to ${typeOf(target)}`,
    at,
  )
}

function validateFunction(value, at) {
  validate(
    value.kind === "FunctionObject",
    `Expected a function, but got ${value.kind}`,
    at,
  )
}

export default function translate(match) {
  let context = new Context()

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
      const source = expression.translate()
      const target = core.variable(id.sourceString, typeOf(source))
      context.set(id.sourceString, target, id.source)
      return core.letStmt(target, source)
    },

    Binding(id, _colon, type) {
      const name = id.sourceString
      const typeName = type.sourceString
      validate(
        ["number", "boolean"].includes(typeName),
        `Unknown type: ${typeName}`,
        type.source,
      )
      const resolvedType = { number: "number", boolean: "boolean" }[typeName]
      return { name, type: resolvedType }
    },

    FunDecl(_function, id, _open, params, _close, _eq, expression) {
      const paramList = params.asIteration().children.map((binding) => {
        return binding.translate()
      })
      const funContext = new Context(context)
      for (const param of paramList) {
        const variable = core.variable(param.name, param.type)
        funContext.set(param.name, variable, id.source)
      }
      const previousContext = context
      context = funContext
      const body = expression.translate()
      const func = core.functionObject(id.sourceString, paramList)
      context = previousContext
      context.set(id.sourceString, func, id.source)
      return core.functionDecl(func, body)
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
      return context.get(name, id.source)
    },

    Primary_call(id, _open, args, _close) {
      const func = context.get(id.sourceString, id.source)
      validateFunction(func, id.source)
      const argValues = args
        .asIteration()
        .children.map((arg) => arg.translate())
      if (argValues.length !== func.params.length) {
        error(
          `Expected ${func.params.length} arguments, but got ${argValues.length}`,
          id.source,
        )
      }
      for (let i = 0; i < argValues.length; i++) {
        const expectedType = func.params[i].type
        const actualType = typeOf(argValues[i])
        validate(
          expectedType === actualType,
          `Type mismatch in argument ${i + 1}: expected ${expectedType}, but got ${actualType}`,
          id.source,
        )
      }
      return core.functionCall(func, argValues, "number")
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
