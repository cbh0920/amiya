import type { Context } from '@deepseek-ai/cordis'
import css from './arknights-amiya.module.css'
import { AMIYA_ART } from './amiya-art.ts'
import { applyAmiyaSkin } from './lifecycle.ts'

/** Apply the Rhodes Island / Amiya presentation layer. */
export function apply(ctx: Context): void {
  applyAmiyaSkin(ctx, css, AMIYA_ART)
}
