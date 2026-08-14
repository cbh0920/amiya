export const SKIN_TITLE = 'Rhodes Island · DeepSeek Harness'

const BODY_ATTR = 'data-dsh-arknights-amiya'
const STYLE_PROPERTIES = ['--amiya-art', '--amiya-scrim'] as const

const SCRIM_LIGHT = 'linear-gradient(90deg, rgba(16,18,20,0.98) 0%, rgba(16,18,20,0.84) 46%, rgba(16,18,20,0.46) 72%, rgba(16,18,20,0.18) 100%)'
const SCRIM_DARK = 'linear-gradient(90deg, rgba(10,12,14,0.98) 0%, rgba(10,12,14,0.78) 46%, rgba(10,12,14,0.34) 72%, rgba(10,12,14,0.10) 100%)'

const FAVICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  '<rect width="64" height="64" rx="12" fill="#111315"/>',
  '<path d="M32 7 56 32 32 57 8 32Z" fill="none" stroke="#f3c51c" stroke-width="5"/>',
  '<path d="M23 43V20h11.4c7.6 0 11.6 3.2 11.6 9.1 0 4-2 6.7-6 8.1L47 43h-8.6l-6.1-5.1h-2.2V43Zm7.1-10.8h4c3.1 0 4.8-1 4.8-3.1s-1.7-3-4.8-3h-4Z" fill="#f2f2ee"/>',
  '</svg>',
].join('')

export interface EffectContextLike {
  effect(factory: () => (() => void), label?: string): unknown
}

export type SkinClassMap = Record<string, string | undefined>

function className(css: SkinClassMap, name: string): string {
  return css[name] ?? ''
}

function appendText(parent: HTMLElement, classValue: string, text: string): HTMLElement {
  const span = document.createElement('span')
  span.className = classValue
  span.textContent = text
  parent.append(span)
  return span
}

function createBackdrop(css: SkinClassMap): HTMLDivElement {
  const backdrop = document.createElement('div')
  backdrop.className = className(css, 'backdrop')
  backdrop.setAttribute('data-skin-chrome', 'backdrop')
  backdrop.style.setProperty('pointer-events', 'none')
  backdrop.setAttribute('aria-hidden', 'true')

  const identity = document.createElement('div')
  identity.className = className(css, 'backdropIdentity')
  appendText(identity, className(css, 'backdropName'), 'AMIYA')
  appendText(identity, className(css, 'backdropCode'), 'R001 // OPERATOR 03')
  appendText(identity, className(css, 'backdropRhodes'), 'RHODES ISLAND')

  const crosshair = document.createElement('div')
  crosshair.className = className(css, 'crosshair')
  crosshair.setAttribute('aria-hidden', 'true')

  const accent = document.createElement('div')
  accent.className = className(css, 'backdropAccent')
  accent.setAttribute('aria-hidden', 'true')

  backdrop.append(identity, crosshair, accent)
  return backdrop
}

function createTopbar(css: SkinClassMap): HTMLDivElement {
  const bar = document.createElement('div')
  bar.className = className(css, 'topbar')
  bar.setAttribute('data-skin-chrome', 'topbar')

  const mark = document.createElement('span')
  mark.className = className(css, 'topbarMark')
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = '◇'

  const copy = document.createElement('div')
  copy.className = className(css, 'topbarCopy')
  appendText(copy, className(css, 'topbarTitle'), 'RHODES ISLAND // PRTS TERMINAL')
  appendText(copy, className(css, 'topbarMeta'), 'OPERATOR R001 / AMIYA')

  const spacer = document.createElement('span')
  spacer.className = className(css, 'topbarSpacer')

  const status = document.createElement('span')
  status.className = className(css, 'topbarStatus')
  const dot = document.createElement('span')
  dot.className = className(css, 'statusDot')
  dot.setAttribute('aria-hidden', 'true')
  const label = document.createElement('span')
  label.textContent = 'CONNECTED'
  status.append(dot, label)

  bar.append(mark, copy, spacer, status)
  return bar
}

function createStatusbar(css: SkinClassMap): HTMLDivElement {
  const bar = document.createElement('div')
  bar.className = className(css, 'statusbar')
  bar.setAttribute('data-skin-chrome', 'statusbar')

  appendText(bar, className(css, 'statusPrimary'), 'PRTS STATUS')
  appendText(bar, className(css, 'statusCell'), 'NETWORK: ONLINE')
  appendText(bar, className(css, 'statusCell'), 'OPERATOR: AMIYA')

  const spacer = document.createElement('span')
  spacer.className = className(css, 'statusSpacer')
  bar.append(spacer)

  appendText(bar, className(css, 'statusReady'), 'READY')
  return bar
}

export function applyAmiyaSkin(ctx: EffectContextLike, css: SkinClassMap, art: string): void {
  const body = document.body
  const originalTitle = document.title
  const hadBodyAttr = body.hasAttribute(BODY_ATTR)
  const originalBodyAttr = body.getAttribute(BODY_ATTR)
  const previousStyles = new Map<string, string>()
  for (const property of STYLE_PROPERTIES) previousStyles.set(property, body.style.getPropertyValue(property))

  body.setAttribute(BODY_ATTR, '')
  body.style.setProperty('--amiya-art', `url(${JSON.stringify(art)})`)

  const backdrop = createBackdrop(css)
  const topbar = createTopbar(css)
  const statusbar = createStatusbar(css)

  const setThemeScrim = (): void => {
    const dark = body.hasAttribute('data-ds-dark-theme')
    body.style.setProperty('--amiya-scrim', dark ? SCRIM_DARK : SCRIM_LIGHT)
    backdrop.setAttribute('data-theme', dark ? 'dark' : 'light')
  }
  setThemeScrim()

  const observer = new MutationObserver(setThemeScrim)
  observer.observe(body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })

  const favicon = document.createElement('link')
  favicon.setAttribute('rel', 'icon')
  favicon.setAttribute('data-dsh-amiya-favicon', '')
  favicon.setAttribute('href', `data:image/svg+xml;utf8,${encodeURIComponent(FAVICON_SVG)}`)
  document.head.append(favicon)

  document.title = SKIN_TITLE
  body.append(backdrop, topbar, statusbar)

  ctx.effect(() => () => {
    observer.disconnect()
    backdrop.remove()
    topbar.remove()
    statusbar.remove()
    favicon.remove()

    if (hadBodyAttr) body.setAttribute(BODY_ATTR, originalBodyAttr ?? '')
    else body.removeAttribute(BODY_ATTR)

    for (const [property, previous] of previousStyles) {
      if (previous === '') body.style.removeProperty(property)
      else body.style.setProperty(property, previous)
    }

    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-arknights-amiya: Rhodes Island chrome')
}
