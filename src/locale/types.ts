import type { Numeral } from '../number'

// 推奨語彙: cardinal(基本の位取り数詞) / cardinalDigit(桁列挙数詞) /
// ordinal(序数) / dateRuby(日付専用の読み) / countRuby(日付以外の
// 計数読み)。閉じた enum にはせず、言語ごとに必要な役割(アラビア語の
// 性別ごと、スワヒリ語の名詞クラスごと等)を自由に追加できるようにする。
export type NumeralPurpose = string

export type LocaleEntry = {
  tag: string
  displayName: string
  numerals: Partial<Record<NumeralPurpose, Numeral>>
  vocabulary?: Record<string, unknown>
  // FancyDate.lang(parse, format) にそのまま渡す既定書式。
  defaultParseFormat: string
  defaultFormat: string
  labels?: Record<string, string>
}
