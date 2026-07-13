import { kor } from '../number'
import type { LocaleEntry } from './types'

export const koLocale: LocaleEntry = {
  tag: 'ko',
  displayName: '한국어',
  numerals: {
    cardinalSino: kor.漢語系,
    cardinalNative: kor.固有系.基本,
    countNative: kor.固有系.助数詞前,
  },
  defaultParseFormat: 'y년 M월 d일',
  defaultFormat: 'Gy년 M월 d일(E)',
}
