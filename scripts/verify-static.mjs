#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildFallbackBundle } from './build-fallback.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const testsOnly = process.argv.includes('--tests-only')

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  })
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  if (result.status !== 0) throw new Error(`command failed: node ${args.join(' ')}`)
}

async function collectTextFiles(path) {
  const info = await stat(path)
  if (info.isFile()) return [path]
  const out = []
  for (const entry of await readdir(path)) {
    const child = resolve(path, entry)
    const childInfo = await stat(child)
    if (childInfo.isDirectory()) out.push(...await collectTextFiles(child))
    else if (/\.(?:ts|js|mjs|css|json|ya?ml)$/.test(entry)) out.push(child)
  }
  return out
}

async function verifyMetadata() {
  const pkg = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8'))
  const skin = JSON.parse(await readFile(resolve(repoRoot, 'skin.json'), 'utf8'))
  assert.equal(pkg.name, '@cbh0920/dsh-client-ui-skin-arknights-amiya')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(skin.id, 'arknights-amiya')
  assert.equal(skin.bodyAttr, 'data-dsh-arknights-amiya')
  assert.equal(skin.wiring.id, 'ui-skin-arknights-amiya')
  assert.equal(skin.package, pkg.name)
}

async function verifyNoRuntimeHotlinks() {
  const candidates = [
    ...await collectTextFiles(resolve(repoRoot, 'src')),
    ...await collectTextFiles(resolve(repoRoot, 'lib')),
    resolve(repoRoot, 'package.json'),
    resolve(repoRoot, 'skin.json'),
    resolve(repoRoot, 'cordis.patch.yml'),
  ]
  for (const file of candidates) {
    const text = await readFile(file, 'utf8')
    assert.doesNotMatch(text, /(?:ak\.)?hypergryph\.com/i, `runtime hotlink found in ${file}`)
  }
}

async function verifyBundle() {
  const result = await buildFallbackBundle(repoRoot)
  const client = await readFile(result.client, 'utf8')
  assert.match(client, /window\.__ModuleLoader__\.load/)
  assert.match(client, /exports\.apply\s*=/)
  assert.match(client, /data-dsh-arknights-amiya/)
  run(['--check', result.client])
}

async function main() {
  run(['--experimental-strip-types', '--test', 'tests/lifecycle.node.test.mjs'])
  run(['--test', 'tests/css-contract.node.test.mjs'])
  run(['--test', 'tests/embedded-art.node.test.mjs'])
  run(['--test', 'tests/fallback-build.node.test.mjs'])
  if (testsOnly) return
  await verifyMetadata()
  await verifyBundle()
  await verifyNoRuntimeHotlinks()
  console.log('Static verification passed: lifecycle, CSS contract, embedded Amiya artwork, fallback bundle, metadata, and runtime hotlink checks.')
}

const cliPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (cliPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exitCode = 1
  })
}
