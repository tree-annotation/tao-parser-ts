import {parse, unparse} from './mod.ts'
import {assert} from './deps.ts'

Deno.test({
  name: "unparse of parse is identity",
  async fn() {
    const input = await Deno.readTextFile('./test_data/quirky.tao')

    assert(unparse(parse(input)) === input)
  }
})