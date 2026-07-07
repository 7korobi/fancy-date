import type { Numeral } from './number'
import { arabic, english, jpn, kor, old_jpn, roman } from './number'

// 言語非依存の記法カタログ(ロケールに重複登録しない)。算用数字パス
// スルーやローマ数字のように、特定言語の文法に紐づかない記法はここに
// 一度だけ登録し、暦定義側がどのロケールからでも直接参照できるように
// する(LOCALE_REGISTRY の全エントリへ重複登録すると冗長になるため)。
export const SCRIPT_REGISTRY = {
  arabic,
  'roman-upper': roman.upper,
  'roman-lower': roman.lower,
}

// 推奨語彙: cardinal(基本の位取り数詞) / cardinal-digit(桁列挙数詞) /
// ordinal(序数) / date-reading(日付専用の読み) / count-reading(日付以外の
// 計数読み)。閉じた enum にはせず、言語ごとに必要な役割(アラビア語の
// 性別ごと、スワヒリ語の名詞クラスごと等)を自由に追加できるようにする。
export type NumeralPurpose = string

export type LocaleEntry = {
  tag: string
  displayName: string
  numerals: Partial<Record<NumeralPurpose, Numeral>>
  // FancyDate.lang(parse, format) にそのまま渡す既定書式。
  defaultParseFormat: string
  defaultFormat: string
  labels?: Record<string, string>
}

export const LOCALE_REGISTRY: Record<string, LocaleEntry> = {
  ja: {
    tag: 'ja',
    displayName: '日本語',
    numerals: {
      cardinal: jpn.漢字,
      'cardinal-digit': jpn.桁読み,
      'date-reading': old_jpn.rubys.語尾('か'),
      'count-reading': old_jpn.rubys.語尾('つ'),
    },
    defaultParseFormat: 'y年M月d日',
    defaultFormat: 'Gy年M月d日(E)',
  },
  en: {
    tag: 'en',
    displayName: 'English',
    numerals: {
      cardinal: english.lower,
    },
    defaultParseFormat: 'y/M/d H:m:s',
    defaultFormat: 'Gy/M/d(E) H:m:s',
  },
  ko: {
    tag: 'ko',
    displayName: '한국어',
    numerals: {
      'cardinal-sino': kor.漢語系,
      'cardinal-native': kor.固有系.基本,
      'count-reading-native': kor.固有系.助数詞前,
    },
    defaultParseFormat: 'y년 M월 d일',
    defaultFormat: 'Gy년 M월 d일(E)',
  },
}

export function listLocales(): string[] {
  return Object.keys(LOCALE_REGISTRY)
}

export function getLocale(tag: string): LocaleEntry | undefined {
  return LOCALE_REGISTRY[tag]
}
