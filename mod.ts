export type Tao = {tao: Part[]}
type Part = Tree | Op | Note
export type Tree = {tree: Tao}
export type Op = {op: string}
export type Note = {note: string}

const other = {other: 'UNRECOGNIZED'}
type Other = typeof other

type Input = {
  done(): boolean;
  at(symbol: string): boolean;
  next(): string;
  error(name: string): never;
  bound(symbol: string): void;
  unbound(): void;
  atBound(): boolean;
}

export function parse(str: string): Tao {
  const {length} = str
  let position = 0
  const bounds: [number, string][] = []
  const input: Input = {
    done() { return position >= length },
    at(symbol: string) { return str[position] === symbol },
    next() { return str[position++] },
    error(name: string) { throw Error(`ERROR: malformed ${name} at ${position}.`) },
    bound(symbol: string) { bounds.push([position, symbol]) },
    unbound() { bounds.pop() },
    atBound() {
      const {length} = bounds
      if (length > 0) {
        const [position, symbol] = bounds[length - 1]
        if (input.done()) throw Error(
            `ERROR: since ${position} expected "${symbol}" before end of input`
        )
        return input.at(symbol)
      }
      return input.done()
    },
  }
  return tao(input)
}
export function unparse(ast: Tao): string {
  return ast.tao.reduce((acc, next) => acc + unparsePart(next), "")
}
function unparsePart(ast: Part): string {
  if (isTree(ast)) return '[' + unparse(ast.tree) + ']'
  if (isNote(ast)) return ast.note
  if (isOp(ast)) return '`' + ast.op

  throw Error(`Invalid JSON AST of TAO: ${JSON.stringify(ast)}`)
}
export function isTree(ast: Part): ast is Tree {
  return !!(ast as Tree).tree
}
export function isNote(ast: Part): ast is Note {
  return !!(ast as Note).note
}
export function isOp(ast: Part): ast is Op {
  return !!(ast as Op).op
}

function tao(input: Input): Tao {
  const tao = []
  while (true) {
    if (input.atBound()) return {tao}
    let part: Part | Other = tree(input)
    if (part === other) {
      part = op(input)
      if (part === other) part = note(input)
    }
    tao.push(part as Part)
  }
}
function tree(input: Input): Tree | Other {
  if (input.at('[')) {
    input.next()
    input.bound(']')
    const tree = tao(input)
    input.unbound()
    input.next()
    return {tree}
  }
  return other
}
function op(input: Input): Op | Other {
  if (input.at('`')) {
    input.next()
    if (input.done()) input.error('op')
    return {op: input.next()}
  }
  return other
}
function note(input: Input): Note {
  if (meta(input)) input.error('note')
  let note = input.next()
  while (true) {
    if (meta(input) || input.done()) return {note}
    note += input.next()
  }
}

function meta(input: Input): boolean {
  return input.at('[') || input.at('`') || input.at(']')
}