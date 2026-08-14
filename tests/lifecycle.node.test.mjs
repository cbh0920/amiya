import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { applyAmiyaSkin, SKIN_TITLE } from '../src/client/lifecycle.ts'

class FakeStyle {
  #values = new Map()
  setProperty(name, value) { this.#values.set(name, String(value)) }
  getPropertyValue(name) { return this.#values.get(name) ?? '' }
  removeProperty(name) { const old = this.getPropertyValue(name); this.#values.delete(name); return old }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = ownerDocument
    this.children = []
    this.parentNode = null
    this.attributes = new Map()
    this.dataset = {}
    this.style = new FakeStyle()
    this.className = ''
    this.textContent = ''
    this.innerHTML = ''
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this
      this.children.push(node)
    }
  }
  remove() {
    if (!this.parentNode) return
    const index = this.parentNode.children.indexOf(this)
    if (index >= 0) this.parentNode.children.splice(index, 1)
    this.parentNode = null
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value))
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value)
    this.ownerDocument?._notifyAttribute(this, name)
  }
  removeAttribute(name) {
    this.attributes.delete(name)
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)]
    this.ownerDocument?._notifyAttribute(this, name)
  }
  hasAttribute(name) { return this.attributes.has(name) }
  getAttribute(name) { return this.attributes.get(name) ?? null }
  querySelectorAll(selector) {
    const out = []
    const visit = (node) => {
      for (const child of node.children) {
        if (matches(child, selector)) out.push(child)
        visit(child)
      }
    }
    visit(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
}

class FakeDocument {
  constructor() {
    this._observers = new Set()
    this.body = new FakeElement('body', this)
    this.head = new FakeElement('head', this)
    this.title = ''
  }
  createElement(tag) { return new FakeElement(tag, this) }
  querySelectorAll(selector) { return [...this.head.querySelectorAll(selector), ...this.body.querySelectorAll(selector)] }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
  _notifyAttribute(target, attributeName) {
    for (const observer of this._observers) observer._notify(target, attributeName)
  }
}

class FakeMutationObserver {
  constructor(callback) { this.callback = callback; this.target = null; this.filter = null; this.connected = true }
  observe(target, options) {
    this.target = target
    this.filter = options?.attributeFilter ?? null
    target.ownerDocument._observers.add(this)
  }
  disconnect() {
    this.connected = false
    this.target?.ownerDocument._observers.delete(this)
  }
  _notify(target, attributeName) {
    if (!this.connected || target !== this.target) return
    if (this.filter && !this.filter.includes(attributeName)) return
    this.callback([{ type: 'attributes', target, attributeName }], this)
  }
}

function dataKey(attribute) {
  return attribute.slice(5).split('-').map((part, index) => index === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('')
}

function matches(el, selector) {
  const dataEquals = /^\[data-([a-z0-9-]+)="([^"]+)"\]$/.exec(selector)
  if (dataEquals) return el.getAttribute(`data-${dataEquals[1]}`) === dataEquals[2]
  const dataPresence = /^\[data-([a-z0-9-]+)\]$/.exec(selector)
  if (dataPresence) return el.hasAttribute(`data-${dataPresence[1]}`)
  if (selector === 'link[rel="icon"]') return el.tagName === 'LINK' && el.getAttribute('rel') === 'icon'
  return false
}

function createCtx() {
  let disposer
  return {
    ctx: {
      effect(factory) { disposer = factory() },
    },
    dispose() { disposer?.(); disposer = undefined },
  }
}

const css = new Proxy({}, { get: (_target, prop) => String(prop) })
const art = 'data:image/svg+xml;utf8,%3Csvg%2F%3E'
let harness

beforeEach(() => {
  globalThis.document = new FakeDocument()
  globalThis.MutationObserver = FakeMutationObserver
  harness = createCtx()
})

afterEach(() => {
  harness?.dispose()
  delete globalThis.document
  delete globalThis.MutationObserver
})

test('apply owns the body scope, chrome, title, and non-interactive backdrop', () => {
  document.title = 'original'
  applyAmiyaSkin(harness.ctx, css, art)

  assert.equal(document.body.hasAttribute('data-dsh-arknights-amiya'), true)
  assert.ok(document.querySelector('[data-skin-chrome="backdrop"]'))
  assert.ok(document.querySelector('[data-skin-chrome="topbar"]'))
  assert.ok(document.querySelector('[data-skin-chrome="statusbar"]'))
  assert.equal(document.querySelector('[data-skin-chrome="backdrop"]').style.getPropertyValue('pointer-events'), 'none')
  assert.equal(document.title, SKIN_TITLE)
})

test('dispose removes owned DOM and restores pre-existing styles and title', () => {
  document.title = 'original'
  document.body.style.setProperty('--amiya-art', 'url(before)')
  document.body.style.setProperty('--amiya-scrim', 'before-scrim')
  applyAmiyaSkin(harness.ctx, css, art)
  harness.dispose()

  assert.equal(document.body.hasAttribute('data-dsh-arknights-amiya'), false)
  assert.equal(document.querySelectorAll('[data-skin-chrome]').length, 0)
  assert.equal(document.body.style.getPropertyValue('--amiya-art'), 'url(before)')
  assert.equal(document.body.style.getPropertyValue('--amiya-scrim'), 'before-scrim')
  assert.equal(document.title, 'original')
})

test('dispose does not overwrite a session title that replaced the skin title', () => {
  document.title = 'original'
  applyAmiyaSkin(harness.ctx, css, art)
  document.title = 'Session · Foo'
  harness.dispose()
  assert.equal(document.title, 'Session · Foo')
})

test('dark theme mutations update the owned scrim without duplicating chrome', () => {
  applyAmiyaSkin(harness.ctx, css, art)
  const backdrop = document.querySelector('[data-skin-chrome="backdrop"]')
  const lightScrim = document.body.style.getPropertyValue('--amiya-scrim')
  const count = document.querySelectorAll('[data-skin-chrome]').length

  document.body.setAttribute('data-ds-dark-theme', '')

  assert.notEqual(document.body.style.getPropertyValue('--amiya-scrim'), lightScrim)
  assert.equal(backdrop.dataset.theme, 'dark')
  assert.equal(document.querySelectorAll('[data-skin-chrome]').length, count)
})

test('dispose disconnects the observer so later theme changes do not rewrite styles', () => {
  applyAmiyaSkin(harness.ctx, css, art)
  harness.dispose()
  document.body.style.setProperty('--amiya-scrim', 'after-dispose')
  document.body.setAttribute('data-ds-dark-theme', '')
  assert.equal(document.body.style.getPropertyValue('--amiya-scrim'), 'after-dispose')
})
