export function program(body) {
  return { kind: "Program", body }
}

export function printStmt(argument) {
  return {
    kind: "PrintStatement",
    arguments: [argument],
  }
}

export function variable(name, type) {
  return {
    kind: "Variable",
    name,
    type,
  }
}

export function functionDecl(fun, body) {
  return {
    kind: "FunctionDeclaration",
    function: fun,
    body,
  }
}

export function functionObject(name, params) {
  return {
    kind: "FunctionObject",
    name,
    params,
  }
}

export function functionCall(callee, args, type) {
  return {
    kind: "FunctionCall",
    callee,
    arguments: args,
    type,
  }
}
export function letStmt(variable, initializer) {
  return {
    kind: "LetStatement",
    variable,
    initializer,
  }
}

export function assignStmt(target, source) {
  return {
    kind: "AssignStatement",
    target,
    source,
  }
}

export function ifStmt(test, consequent, alternate) {
  return {
    kind: "IfStatement",
    test,
    consequent,
    alternate,
  }
}

export function whileStmt(test, body) {
  return {
    kind: "WhileStatement",
    test,
    body,
  }
}

export function binaryExp(left, operator, right, type) {
  return {
    kind: "BinaryExpression",
    operator,
    left,
    right,
    type,
  }
}

export function unaryExp(operator, argument, type) {
  return {
    kind: "UnaryExpression",
    operator,
    argument,
    type,
  }
}
