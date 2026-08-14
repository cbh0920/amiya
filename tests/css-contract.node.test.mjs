import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const css = await readFile(new URL('../src/client/arknights-amiya.module.css', import.meta.url), 'utf8')

const requiredTokens = [
  '--amiya-bg-0: #101214',
  '--amiya-bg-1: #171a1d',
  '--amiya-surface-dark: rgba(24, 28, 31, 0.82)',
  '--amiya-surface-light: #e4e5e1',
  '--amiya-text: #f2f2ee',
  '--amiya-text-muted: #92999f',
  '--amiya-yellow: #f3c51c',
  '--amiya-cyan: #55c7d8',
  '--amiya-danger: #d45649',
]

test('defines the approved Rhodes Island visual tokens', () => {
  for (const token of requiredTokens) assert.ok(css.includes(token), `missing ${token}`)
})

test('styles only beneath the Amiya body scope and supports dark host theme', () => {
  assert.match(css, /body\[data-dsh-arknights-amiya\]/)
  assert.match(css, /body\[data-dsh-arknights-amiya\]\[data-ds-dark-theme\]/)
  const selectorLines = css.split('\n').map((line) => line.trim()).filter((line) => line.endsWith('{') && !line.startsWith('@') && !line.startsWith('from') && !line.startsWith('to') && !/^\d+%/.test(line))
  for (const line of selectorLines) {
    assert.ok(line.includes('body[data-dsh-arknights-amiya]'), `unscoped selector: ${line}`)
  }
})

test('keeps the backdrop non-interactive and lets artwork enter the chat surface', () => {
  assert.match(css, /\.backdrop[^{]*\{[^}]*pointer-events:\s*none/s)
  assert.match(css, /\[id=['"]root['"]\][^{]*\{[^}]*rgba\(/s)
  assert.match(css, /--dsw-alias-bg-base:\s*rgba\(/)
})

test('keeps the supplied portrait vertically centered so Amiya face stays visible', () => {
  assert.match(css, /background-position:\s*0 0,\s*0 0,\s*center,\s*right center/)
  assert.doesNotMatch(css, /right(?:\s+-?\d+px)?\s+bottom/)
})

test('covers composer, buttons and markdown code surfaces', () => {
  assert.match(css, /textarea/)
  assert.match(css, /input/)
  assert.match(css, /button/)
  assert.match(css, /\bpre\b/)
  assert.match(css, /--dsw-alias-markdown-code-block/)
  assert.match(css, /--dsw-specific-sidebar-fill/)
})

test('implements every approved responsive tier for the VS Code + DSH layout', () => {
  assert.match(css, /@media\s*\(min-width:\s*1200px\)/)
  assert.match(css, /@media\s*\(min-width:\s*720px\)\s*and\s*\(max-width:\s*1199px\)/)
  assert.match(css, /@media\s*\(min-width:\s*560px\)\s*and\s*\(max-width:\s*719px\)/)
  assert.match(css, /@media\s*\(max-width:\s*559px\)/)
})

test('honors reduced-motion preferences', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})
