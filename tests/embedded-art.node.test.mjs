import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'node:test'

const repoRoot = resolve(import.meta.dirname, '..')

test('tracked Amiya artwork is an embedded WebP data URL from the supplied portrait', async () => {
  const art = await readFile(resolve(repoRoot, 'src/client/amiya-art.ts'), 'utf8')
  assert.match(art, /export const AMIYA_ART = 'data:image\/webp;base64,/)
  assert.ok(art.length > 9_000, 'embedded artwork should contain the supplied portrait, not a tiny fallback')
})
