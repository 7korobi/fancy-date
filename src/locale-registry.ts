import { enLocale } from './locale/en'
import { jaLocale } from './locale/ja'
import { koLocale } from './locale/ko'
import { SCRIPT_REGISTRY } from './locale/scripts'
import type { LocaleEntry } from './locale/types'

export { enLocale, jaLocale, koLocale, SCRIPT_REGISTRY }
export type { LocaleEntry, NumeralPurpose } from './locale/types'

export const LOCALE_REGISTRY: Record<string, LocaleEntry> = {
  [jaLocale.tag]: jaLocale,
  [enLocale.tag]: enLocale,
  [koLocale.tag]: koLocale,
}

export function listLocales(): string[] {
  return Object.keys(LOCALE_REGISTRY)
}

export function getLocale(tag: string): LocaleEntry | undefined {
  return LOCALE_REGISTRY[tag]
}
