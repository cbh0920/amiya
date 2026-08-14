// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'
import { SKIN_TITLE } from '../src/client/lifecycle.ts'

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.removeAttribute('data-dsh-arknights-amiya')
  document.body.removeAttribute('style')
  document.head.querySelectorAll('link[rel="icon"]').forEach((node) => node.remove())
  document.title = ''
})

describe('Arknights Amiya skin apply', () => {
  it('sets the body scope and injects the three owned chrome layers', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-arknights-amiya')).toBe(true)
    expect(document.querySelector('[data-skin-chrome="backdrop"]')).not.toBeNull()
    expect(document.querySelector('[data-skin-chrome="topbar"]')).not.toBeNull()
    expect(document.querySelector('[data-skin-chrome="statusbar"]')).not.toBeNull()
  })

  it('keeps the backdrop non-interactive', async () => {
    fiber = await mount()
    const backdrop = document.querySelector<HTMLElement>('[data-skin-chrome="backdrop"]')
    expect(backdrop).not.toBeNull()
    expect(backdrop?.style.pointerEvents).toBe('none')
  })

  it('restores owned DOM, body style and original title on dispose', async () => {
    document.title = 'original'
    document.body.style.setProperty('--amiya-art', 'url(before)')
    document.body.style.setProperty('--amiya-scrim', 'before-scrim')
    fiber = await mount()
    expect(document.title).toBe(SKIN_TITLE)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-arknights-amiya')).toBe(false)
    expect(document.querySelectorAll('[data-skin-chrome]').length).toBe(0)
    expect(document.body.style.getPropertyValue('--amiya-art')).toBe('url(before)')
    expect(document.body.style.getPropertyValue('--amiya-scrim')).toBe('before-scrim')
    expect(document.title).toBe('original')
  })

  it('does not overwrite a newer session title on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    document.title = 'Session · Foo'
    await fiber.dispose()
    expect(document.title).toBe('Session · Foo')
  })

  it('updates the scrim when the host theme changes', async () => {
    fiber = await mount()
    const light = document.body.style.getPropertyValue('--amiya-scrim')
    document.body.setAttribute('data-ds-dark-theme', '')
    await Promise.resolve()
    expect(document.body.style.getPropertyValue('--amiya-scrim')).not.toBe(light)
    expect(document.querySelector('[data-skin-chrome="backdrop"]')?.getAttribute('data-theme')).toBe('dark')
  })
})
