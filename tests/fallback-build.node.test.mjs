import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { buildFallbackBundle } from '../scripts/build-fallback.mjs'

const root = new URL('..', import.meta.url)

test('fallback builder emits a parseable DSH loader bundle and host entry', async () => {
  const result = await buildFallbackBundle(root)
  const client = await readFile(result.client, 'utf8')
  const host = await readFile(result.host, 'utf8')

  assert.match(client, /window\.__ModuleLoader__\.load/)
  assert.match(client, /exports\.apply\s*=/)
  assert.match(client, /--amiya-yellow/)
  assert.match(client, /data:image\/webp;base64,/)
  assert.doesNotMatch(client, /interface EffectContextLike/)
  assert.doesNotMatch(client, /:\s*EffectContextLike/)
  assert.match(host, /export function apply\(\)/)

  const syntax = spawnSync(process.execPath, ['--check', result.client], { encoding: 'utf8' })
  assert.equal(syntax.status, 0, syntax.stderr)
})
