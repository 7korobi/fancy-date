import { english } from '../number'
import type { LocaleEntry } from './types'

export const enLocale: LocaleEntry = {
  tag: 'en',
  displayName: 'English',
  numerals: {
    cardinal: english.lower,
  },
  defaultParseFormat: 'y/M/d',
  defaultFormat: 'Gy/M/d(E)',
}
