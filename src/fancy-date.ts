import { mod, parseNumeral, type Numeral } from './number'
import type { LocaleEntry, NumeralPurpose } from './locale-registry'
import { hasLunarEvents, hasLunarOrbitEvents, hasSolarEvents } from './orbital-model'
import type {
  LunarApsisKind,
  LunarNodeKind,
  OrbitalModel,
  RotationModel,
  SPOT,
  TIMEZONE,
} from './orbital-model'
import { lunisolar as resolveLunisolar } from './phenomena/lunisolar'
import type { LunisolarDate } from './phenomena/lunisolar'
import { PeriodicCalendarYearPolicy } from './phenomena/calendar-policy'
import { thai_lunisolar as resolveThaiLunisolar } from './phenomena/thai-lunisolar'
import type { ThaiLunisolarDate, ThaiLunisolarOptions } from './phenomena/thai-lunisolar'
import {
  noon as resolveNoon,
  solor as resolveSolor,
  solar_phase as resolveSolarPhase,
  solar_phase_before as resolveSolarPhaseBefore,
  solar_term as resolveSolarTerm,
  solar_terms as resolveSolarTerms,
  to_tempo_by_solor as resolveTempoBySolor,
  雑節_by_mean as resolve雑節ByMean,
  雑節_by_phase as resolve雑節ByPhase,
} from './phenomena/solar'
import { prepareSpot } from './prepare'
import {
  CachedTempoRule,
  cyclic_label,
  CyclicDayTempoRule,
  envelope_of,
  EraAdjustedTempoRule,
  FixedTempoRule,
  FloorTempoRule,
  MeanLunisolarMonthRule,
  ObservedLunisolarMonthRule,
  ObservedLunisolarYearRule,
  OrbitalPhaseTempoRule,
  SolarEventDayTempoRule,
  SolarDayHourTempoRule,
  StartAlignedTempoRule,
  SubdivideTempoRule,
  TableTempoRule,
  Tempo,
} from './tempo'
import type {
  SolarDayHourBase,
  SolarDayBoundaryEvent,
  SubdivideBase,
  TempoBase,
  TempoEnvelope,
  TempoLabelLike,
  TempoLike,
  TempoRule,
} from './tempo'
import { to_tempo_bare } from './time'

export {
  MEAN_ASTRONOMY,
  MEAN_CALLISTO,
  MEAN_CERES,
  MEAN_CHARON,
  MEAN_DYSNOMIA,
  MEAN_EARTH,
  MEAN_ERIS,
  MEAN_GANYMEDE,
  MEAN_HAUMEA,
  MEAN_HIIAKA,
  MEAN_JUPITER,
  MEAN_MAKEMAKE,
  MEAN_MARS,
  MEAN_MERCURY,
  MEAN_MOON,
  MEAN_NAMAKA,
  MEAN_NEPTUNE,
  MEAN_PLUTO,
  MEAN_SATURN,
  MEAN_SEASON_EPOCH_MSEC,
  MEAN_SUN,
  MEAN_TITAN,
  MEAN_TITANIA,
  MEAN_TRITON,
  MEAN_URANUS,
  MEAN_VENUS,
} from './astronomy-data'
export { EarthMoonOrbital, EarthSolarOrbital } from './naoj'
export type { EarthMoonOrbitalOptions, EarthSolarOrbitalOptions } from './naoj'
export {
  JupiterSolarOrbital,
  KeplerianSolarOrbital,
  MarsSolarOrbital,
  MeanPlanetSolarOrbital,
  MercurySolarOrbital,
  NeptuneSolarOrbital,
  PlanetarySolarEventModel,
  PlutoSolarOrbital,
  SaturnSolarOrbital,
  UranusSolarOrbital,
  VenusSolarOrbital,
} from './nasa'
export type {
  JupiterSolarOrbitalOptions,
  KeplerianSolarOrbitalOptions,
  MarsSolarOrbitalOptions,
  MeanPlanetSolarOrbitalOptions,
  MeanPlanetSolarOrbitalPlanetOptions,
  MercurySolarOrbitalOptions,
  NeptuneSolarOrbitalOptions,
  PlanetarySolarEventModelOptions,
  PlutoSolarOrbitalOptions,
  SaturnSolarOrbitalOptions,
  UranusSolarOrbitalOptions,
  VenusSolarOrbitalOptions,
} from './nasa'
export { MeanOrbital, MeanRotation, TransformedOrbital, transformOrbital } from './mean'
export type { LunisolarDate, LunisolarPrincipalTerm } from './phenomena/lunisolar'
export type {
  CalendarMonthLayout,
  CalendarYearLayout,
  CalendarYearPolicyContext,
  CalendarYearPolicy,
  HourArithmeticPolicy,
  HourDivisionPolicy,
  LunisolarBoundary,
  LunisolarBoundarySource,
  LunisolarLeapDay,
  LunisolarPolicy,
  LunisolarYearContext,
} from './phenomena/calendar-policy'
export { PeriodicCalendarYearPolicy } from './phenomena/calendar-policy'
export { add_civil_days, church_feasts, computus, convert_civil_date } from './phenomena/computus'
export type {
  ChurchFeast,
  ChurchFeastId,
  CivilDate,
  ComputusResult,
  ComputusSystem,
} from './phenomena/computus'
export {
  thai_lunisolar,
  thai_lunisolar_year_length,
  thai_lunisolar_year_type,
} from './phenomena/thai-lunisolar'
export type {
  ThaiLunisolarDate,
  ThaiLunisolarOptions,
  ThaiLunisolarYearType,
} from './phenomena/thai-lunisolar'
export type { PreparedSpot, PreparedSpotModels } from './prepare'
export { prepareSpot, prepareSpotModels } from './prepare'
// export * from はコンパイル時に tslib.__exportStar() という実行時関数呼び出しになり、
// 静的な named export 解析に依存するバンドラで再エクスポート名が undefined になる
// 不具合があった(development-notes.md 参照)。明示的な named export に置き換える。
export {
  bodyProfileOf,
  centerOf,
  hasLunarEvents,
  hasLunarOrbitEvents,
  hasSolarEvents,
  isPlanetSkyBody,
  orbitalOf,
  placePlanet,
  placeSatellite,
  placeStar,
  resolveSkyBody,
  rotationOf,
} from './orbital-model'
export type {
  BodyProfile,
  BodyProfileReference,
  STAR,
  PLANET_TUPLE,
  SATELLITE_TUPLE,
  PlanetPlacement,
  SatellitePlacement,
  PLANET,
  SATELLITE,
  SKY_BODY,
  SPOT,
  TIMEZONE,
  ORBITAL,
  ROTATION,
  PlanetPlacementOptions,
  SatellitePlacementOptions,
  OrbitalModel,
  OrbitalTransformOptions,
  RotationModel,
  ResolvedSkyBody,
  SolarObservationOptions,
  SolarObservation,
  SolarEquatorialCoordinates,
  SolarHorizontalCoordinates,
  SolarPositionModel,
  SolarEventModel,
  LunarObservationOptions,
  LunarObservation,
  LunarEquatorialCoordinates,
  LunarHorizontalCoordinates,
  LunarPositionModel,
  LunarEventModel,
  LunarApsisKind,
  LunarApsis,
  LunarNodeKind,
  LunarNode,
  LunarOrbitEventModel,
} from './orbital-model'

export type ERA = readonly [string, number, string?]
export type ERA_WITH_YEAR = readonly [string, number, number]

type ALL_DIC = ALGO_DIC | 'D' | 'G' | 'J' | 'Q' | 'Y' | 'd' | 'p' | 'u' | 'w' | 'x' | 'y'
type ALGO_DIC = 'E' | 'H' | 'M' | 'N' | 'S' | 'Z' | 'd' | 'm' | 's' | CycleToken

type ALL_CALC =
  | 'season'
  | 'month'
  | 'week'
  | 'period'
  | 'year'
  | 'moon'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'msec'
type MSEC_CALC =
  | 'period'
  | 'year'
  | 'season'
  | 'month'
  | 'moon'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'msec'
type RANGE_CALC = 'year' | 'month' | 'hour' | 'minute' | 'second'
type ZERO_CALC =
  | 'period'
  | 'era'
  | 'year60'
  | 'year12'
  | 'year10'
  | 'year_s'
  | 'spring'
  | 'season'
  | 'moon'
  | 'week'
  | 'day60'
  | 'day28'
  | 'day12'
  | 'day10'
  | 'day_9'
  | 'day'
  | 'jd'

export type TempoDiff = TOKENS<AnyDicToken, number>
export type TempoIdxs = TOKENS<AnyDicToken, number> & {
  G_is_past?: boolean
  M_is_leap: boolean
}
type TempoMonth = {
  is_leap: boolean
}
const year_cycle_tokens = ['yC60', 'yC12', 'yC10', 'yC9'] as const
type YearCycleToken = (typeof year_cycle_tokens)[number]
const day_cycle_tokens = ['dC60', 'dC12', 'dC10', 'dC9', 'dC7', 'dC8', 'dC28'] as const
type DayCycleToken = (typeof day_cycle_tokens)[number]
const calendar_note_tokens = ['R6', 'LM27'] as const
type CalendarNoteToken = (typeof calendar_note_tokens)[number]
const cycle_tokens = [...year_cycle_tokens, ...day_cycle_tokens, ...calendar_note_tokens] as const
type CycleToken = (typeof cycle_tokens)[number]
type WeekCycleToken = Extract<DayCycleToken, 'dC7' | 'dC8' | 'dC10'>
const year_cycle_zero_keys: Record<
  YearCycleToken,
  Extract<ZERO_CALC, 'year60' | 'year12' | 'year10' | 'year_s'>
> = {
  yC60: 'year60',
  yC12: 'year12',
  yC10: 'year10',
  yC9: 'year_s',
}
const day_cycle_zero_keys: Record<
  DayCycleToken,
  Extract<ZERO_CALC, 'day60' | 'day12' | 'day10' | 'day_9' | 'week' | 'day28'>
> = {
  dC60: 'day60',
  dC12: 'day12',
  dC10: 'day10',
  dC9: 'day_9',
  dC7: 'week',
  dC8: 'week',
  dC28: 'day28',
}
const legacy_token_aliases = {
  yC: 'yC60',
  yCS: 'yC10',
  yCB: 'yC12',
  dC: 'dC60',
  dCS: 'dC10',
  dCB: 'dC12',
  a: 'yC60',
  c: 'yC10',
  b: 'yC12',
  A: 'dC60',
  C: 'dC10',
  B: 'dC12',
  dCLM: 'dC28',
} as const
type LegacyTokenAlias = keyof typeof legacy_token_aliases
type AnyDicToken = ALL_DIC | LegacyTokenAlias
export type ContinuousSpanToken =
  | YearCycleToken
  | DayCycleToken
  | 'yC'
  | 'yCS'
  | 'yCB'
  | 'dC'
  | 'dCS'
  | 'dCB'
  | 'a'
  | 'c'
  | 'b'
  | 'A'
  | 'C'
  | 'B'
  | 'dCLM'
export type ContinuousSpanLabel = {
  [Token in ContinuousSpanToken]: { [Key in Token]: string }
}[ContinuousSpanToken]
export type Token = ALL_DIC | 'Zz' | LegacyTokenAlias
export type Unit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'msec'
type CorePrecision = 'y' | 'M' | 'd' | 'H' | 'm' | 's' | 'S'
export type Precision = CorePrecision | Token
export type SpanLabels = Partial<Record<Token, string>>
export type SpanDirection = '前' | '後'
export type FindOrder = 1 | -1
export type FindSpanOrder = FindOrder | 0
export type FindSpanBase = 'at' | 'match'
export type FindSpanCondition = FindCondition | readonly FindCondition[]
/**
 * SteppableTempoKey: Tempos の中で succ()/back() 等の遷移操作を実際に
 * 持つフィールドのキーだけを絞り込んだ型。Y/yC/yCB/yCS/Q は TempoLabelLike
 * (遷移操作を持たない)なのでここに含まれない
 * (find() の options.step を誤って周期ラベル側へ向けるのを型で防ぐ)。
 */
export type SteppableTempoKey = {
  [K in keyof Tempos]: Tempos[K] extends TempoLike | undefined ? K : never
}[keyof Tempos]
export type FindOptions = { step?: SteppableTempoKey; order?: FindOrder; limit?: number }
export type FindSpanOptions = {
  step?: SteppableTempoKey
  order?: FindSpanOrder
  base?: FindSpanBase
}
export type PeriodsOptions = Required<Pick<FindOptions, 'step'>> &
  Pick<FindOptions, 'order' | 'limit'>
export type RichPart = {
  text: string
  ruby?: string
}
export type RichText<Part extends RichPart = RichPart> = readonly Part[]
const span_tokens = ['y', 'M', 'w', 'd', 'H', 'm', 's', 'S'] as const
export type SpanToken = (typeof span_tokens)[number]
export type SpanDiff = Partial<Record<SpanToken, number>>
type SpanDisplay = {
  label: string
  next_at?: number
  timeout?: number
}
/** add()/sub() へ渡せる、暦座標上の差分と表示結果。正数は未来方向。 */
export type Span = SpanDiff & SpanDisplay
/** 加算不能な周期・暦注tokenを precise span として測定した表示結果。 */
export type SpanMeasure = SpanDisplay & {
  precision: SpanMeasurePrecision
  value: number
}
export type SpanResult = Span | SpanMeasure
export type FormatPart = RichPart & {
  /** 元の format token。リテラル片は空文字。例: 'yyyy', 'E', 'dC60o', ''。 */
  token: string
  /** この part が `format()` の出力へ寄与する文字列。全 part の text 連結は format() と一致する。 */
  text: string
  /** HTML ruby 等で使う読み。`r` suffix token 自体では text が読みになるため設定しない。 */
  ruby?: string
}
export type SpanOptions = {
  precise?: boolean | Precision
  at?: DateLike
}
export type SpanMeasurePrecision = Exclude<Precision, SpanToken | 'Y' | 'D'>
export type SpanMeasureOptions = Omit<SpanOptions, 'precise'> & {
  precise: SpanMeasurePrecision
}
export type SpanAddOptions = Omit<SpanOptions, 'precise'> & {
  precise?: boolean | SpanToken | 'Y' | 'D'
}
export type ParseSpanOptions = {
  at?: DateLike
}
export type SpanMsecOptions = {
  at?: DateLike
}
/**
 * 相対日時加算の入力。文字列表現は parse_span() と同じ文法で解釈され、
 * オブジェクトは正数を未来方向とする加算可能tokenの差分だけを持つ。
 */
export type SpanLike = string | SpanDiff
export type SpanSubOperand = SpanLike | ContinuousSpanLabel
const span_anchor = Symbol('span_anchor')
type SpanAnchor = {
  calendar: FancyDate
  at?: number
  msec?: number
}
type AnchoredSpan = Span & {
  [span_anchor]?: SpanAnchor
}
type SpanComponent = { token: SpanToken; value: number }
type SpanTarget = {
  u: number
  y: number
  M: number
  d: number
  H: number
  m: number
  s: number
  S: number
  M_is_leap: boolean
  changedRank: number
  near: number
  week?: number
  sourceWeekSince: number
  sourceDaySince: number
  sourceHourSince: number
  sourceMinuteSince: number
  sourceSecondSince: number
}
export type Tempos = {
  Zz: Tempo<TempoBase>
  dC60: Tempo<TempoBase>
  dC12: Tempo<TempoBase>
  dC10: Tempo<TempoBase>
  dC9: Tempo<TempoBase>
  dC7: Tempo<TempoBase>
  dC8: Tempo<TempoBase>
  dC28: Tempo<TempoBase>
  R6: TempoLabelLike
  LM27: TempoLabelLike
  dC: Tempo<TempoBase>
  dCB: Tempo<TempoBase>
  dCS: Tempo<TempoBase>
  A: Tempo<TempoBase>
  B: Tempo<TempoBase>
  C: Tempo<TempoBase>
  D: Tempo<SubdivideBase>
  E: TempoLike | TempoLabelLike
  G: TempoLike | TempoLabelLike
  H: TempoLike
  J: Tempo<TempoBase>
  M: Tempo<TempoBase> & TempoMonth
  N: Tempo<SubdivideBase> | undefined
  Q: TempoLabelLike
  S: Tempo<SubdivideBase>
  Y: TempoLabelLike
  Z: Tempo<TempoBase>
  yC60: TempoLabelLike
  yC12: TempoLabelLike
  yC10: TempoLabelLike
  yC9: TempoLabelLike
  yC: TempoLabelLike
  yCB: TempoLabelLike
  yCS: TempoLabelLike
  a: TempoLabelLike
  b: TempoLabelLike
  c: TempoLabelLike
  d: Tempo<SubdivideBase>
  m: Tempo<SubdivideBase>
  p: Tempo<TempoBase> | undefined
  s: Tempo<SubdivideBase>
  u: Tempo<TempoBase>
  w: Tempo<SubdivideBase>
  x: TempoLabelLike | undefined
  y: Tempo<TempoBase>
}
type DateLike = number | Tempos | string
type DateRange = readonly [from: DateLike, to: DateLike]

const core_tokens = 'GHMSdmpsy'
const main_tokens = 'Ex' + core_tokens
const sub_tokens = 'DJNQYZuw'
const all_tokens = main_tokens + sub_tokens
const all_dic_tokens = [...all_tokens, ...cycle_tokens] as const
const legacy_token_chars = Object.keys(legacy_token_aliases)
  .filter((token) => token.length === 1)
  .join('')
const regexp_token_chars = all_tokens + legacy_token_chars

const virtual_format_tokens = ['Ha', 'da'] as const
const token_word_formats = [
  ...virtual_format_tokens,
  ...cycle_tokens.flatMap((token) => [`${token}o`, `${token}r`, token]),
  ...Object.keys(legacy_token_aliases).flatMap((token) => [`${token}o`, `${token}r`, token]),
]
  .sort((a, b) => b.length - a.length)
  .join('|')

// y(年)は numeral_label()/numeral_label_ruby() 経由で yo/yr サフィックスを
// 持てるように追加した(FancyDate.def_to_label() 末尾の y 配線を参照)。
// 既存のフォーマット文字列に "yo"/"yr" という並びのリテラルは無い
// (確認済み)ため、この拡張は後方互換。
const reg_token = new RegExp(
  `(${token_word_formats}|[EHMNQZdmsy][or]|([${regexp_token_chars}])\\2*)|''|'(''|[^'])+('|$)|.`,
  'g',
)

function is_legacy_token_alias(token: string): token is LegacyTokenAlias {
  return token in legacy_token_aliases
}

function canonical_token(token: string): string {
  return is_legacy_token_alias(token) ? legacy_token_aliases[token] : token
}

function is_cycle_token(token: string): token is CycleToken {
  return (cycle_tokens as readonly string[]).includes(token)
}

function is_year_cycle_token(token: string): token is YearCycleToken {
  return (year_cycle_tokens as readonly string[]).includes(token)
}

function is_day_cycle_token(token: string): token is DayCycleToken {
  return (day_cycle_tokens as readonly string[]).includes(token)
}

function is_calendar_note_token(token: string): token is CalendarNoteToken {
  return (calendar_note_tokens as readonly string[]).includes(token)
}

function is_continuous_cycle_token(token: string): token is YearCycleToken | DayCycleToken {
  return is_year_cycle_token(token) || is_day_cycle_token(token)
}

function is_continuous_span_token(token: string): token is ContinuousSpanToken {
  return is_continuous_cycle_token(canonical_token(token))
}

function is_span_label_token(token: string) {
  return (all_dic_tokens as readonly string[]).includes(canonical_token(token))
}

function token_base(token: Token): ALL_DIC | 'Zz' {
  return canonical_token(token) as ALL_DIC | 'Zz'
}

function is_span_token(token: string): token is SpanToken {
  return (span_tokens as readonly string[]).includes(token)
}

function define_token_alias<T extends Partial<Record<string, unknown>>>(
  target: T,
  alias: string,
  source: string,
) {
  Object.defineProperty(target, alias, {
    configurable: true,
    enumerable: false,
    value: target[source],
    writable: true,
  })
}

function sync_legacy_token_aliases<T extends Partial<Record<AnyDicToken, unknown>>>(target: T) {
  for (const legacy of Object.keys(legacy_token_aliases) as LegacyTokenAlias[]) {
    define_token_alias(target, legacy, legacy_token_aliases[legacy])
  }
  return target
}

function format_token_parts(
  token: string,
): { top: ALL_DIC | 'Zz'; mode: string; size: number } | null {
  if (token === 'Zz') return { top: 'Zz', mode: '', size: 1 }
  const hasSuffix = token.endsWith('o') || token.endsWith('r')
  const source = hasSuffix ? token.slice(0, -1) : token
  const suffix = hasSuffix ? token.slice(-1) : ''
  const canonicalSource = canonical_token(source)
  if (is_cycle_token(canonicalSource)) {
    return { top: canonicalSource, mode: suffix, size: 1 }
  }
  const [top, mode = ''] = token
  const canonicalTop = top ? canonical_token(top) : top
  if (canonicalTop && is_cycle_token(canonicalTop)) {
    return { top: canonicalTop, mode, size: token.length }
  }
  if (canonicalTop && all_tokens.includes(canonicalTop)) {
    return { top: canonicalTop as ALL_DIC, mode, size: token.length }
  }
  return null
}

type NUMBER_RANGE = [number, number?]
type MEASURE = {
  range: NUMBER_RANGE
  msec: number
}

type FindMatcher = string | RegExp
export type FindCondition = { note: FindMatcher } | { [format: string]: FindMatcher }
type FindBetween = DateRange
const seasonal_note_label_map = Symbol('seasonal_note_label_map')
type SeasonalNoteLabels = Record<string, string>
type SeasonalNoteMap = Record<string, { is_cover(at: number): boolean }> & {
  [seasonal_note_label_map]?: SeasonalNoteLabels
}
type DateNoteGroups = Record<string, Record<string, readonly (number | undefined)[]>>
type NoteProvider = (utc: number, tempos: Tempos) => readonly string[]

const default_zassetsu_note_labels: SeasonalNoteLabels = {
  春彼岸: '彼岸',
  秋彼岸: '彼岸',
  春社日: '社日',
  秋社日: '社日',
  春土用: '土用',
  夏土用: '土用',
  秋土用: '土用',
  冬土用: '土用',
  春節分: '節分',
  夏節分: '節分',
  秋節分: '節分',
  冬節分: '節分',
}

function with_seasonal_note_labels<T extends SeasonalNoteMap>(
  notes: T,
  labels: SeasonalNoteLabels,
): T {
  Object.defineProperty(notes, seasonal_note_label_map, {
    configurable: true,
    enumerable: false,
    value: labels,
  })
  return notes
}

const DEFAULT_LABELS: Readonly<SpanLabels> = {
  yC60: '年干支',
  yC10: '年干',
  yC12: '年支',
  yC9: '年九星',
  dC60: '日干支',
  dC10: '日干',
  dC12: '日支',
  dC9: '日九星',
  dC7: '曜日',
  dC8: '曜日',
  dC28: '宿',
  R6: '六曜',
  LM27: '宿',
  yC: '年干支',
  yCS: '年干',
  yCB: '年支',
  dC: '日干支',
  dCS: '日干',
  dCB: '日支',
  a: '年干支',
  b: '年支',
  c: '年干',
  A: '日干支',
  B: '日支',
  C: '日干',
  E: '曜日',
  N: '月相',
  Q: '四半期',
  Z: '節気',
  Zz: '節気',
  Y: '年',
  y: '年',
  u: '年',
  w: '週',
  D: '日',
  d: '日',
  M: 'ヶ月',
  H: '時間',
  m: '分',
  s: '秒',
  S: 'ミリ秒',
}

const default_span_unit_ruby: Readonly<Record<string, string>> = {
  年: 'ねん',
  ヶ月: 'かげつ',
  週: 'しゅう',
  日: 'にち',
  時間: 'じかん',
  分: 'ふん',
  秒: 'びょう',
  ミリ秒: 'みりびょう',
}

type IIDX = TOKENS<AnyDicToken, Indexer>
type IDIC = IIDX & {
  parse: string
  format: string
  numeral?: Numeral | null
  numeral_text?: Numeral | null
  numeral_ruby?: Numeral | null
  // y(年)のような、notation() の list/rubys(静的配列)が現実的でない
  // 無界の数値トークン向けの、'o'/'r' サフィックス(yo/yr)専用の数詞。
  // bare の y が使う numeral とは独立に設定できる(理由は
  // FancyDate.numeral_label() のコメント参照)。
  numeral_label?: Numeral | null
  numeral_label_ruby?: Numeral | null
  sunny: OrbitalModel
  moony?: OrbitalModel
  earthy: RotationModel
  geo: TIMEZONE
  era: string
  eras: readonly ERA[]
  month_divs: number[]
  leaps: number[]
  leap_shift?: number
  labels: SpanLabels
  start: [string, string, number]
  is_solor: boolean
  day_offset_hours?: number
  day_start?: DayStart
  assignments: AssignmentOptions
  is_dusk: boolean
  observed_lunisolar?: boolean
  observed_lunisolar_solar_year?: LunisolarYearResolver
  thai_official_lunisolar?: boolean
}
export type DivisionOptions = {
  H?: false | 'equal' | 'solar'
}
export type LunisolarYearResolver = (at: number) => number
export type ObservedLunisolarOptions = {
  solarYear?: LunisolarYearResolver
}
type LocaleNumeralRef = Numeral | NumeralPurpose | null | undefined
export type LocaleApplyOptions = {
  lang?: boolean
  labels?: boolean | SpanLabels
  numeral?: LocaleNumeralRef
  numeral_text?: LocaleNumeralRef
  numeral_ruby?: LocaleNumeralRef
  numeral_label?: LocaleNumeralRef
  numeral_label_ruby?: LocaleNumeralRef
}
export type DayStart = 'midnight' | SolarDayBoundaryEvent
export type AssignmentToken = 'd'
export type AssignmentContext<Token extends AssignmentToken = AssignmentToken> = {
  token: Token
  calendar: FancyDate
  dayStart: DayStart
  at: number
  previousAt: number
  nextAt: number
}
export type AssignmentResult =
  | number
  | {
      now_idx: number
      assignment_raw_now_idx?: number
      assignment_flags?: readonly string[]
    }
export type AssignmentRule<Token extends AssignmentToken = AssignmentToken> = (
  dayStart: DayStart,
  context: AssignmentContext<Token>,
) => AssignmentResult
export type AssignmentOptions = Partial<{
  [Token in AssignmentToken]: AssignmentRule<Token> | undefined
}>

const TITHI_ASSIGNMENT_CACHE_CAPACITY = 128

type TithiRawIndexCacheEntry = {
  at: number
  raw: number
}

export function tithi(): AssignmentRule<'d'> {
  const rawIndexCache = new WeakMap<OrbitalModel, TithiRawIndexCacheEntry[]>()
  const rawAt = (moony: OrbitalModel, targetAt: number) => {
    let entries = rawIndexCache.get(moony)
    if (!entries) {
      entries = []
      rawIndexCache.set(moony, entries)
    }
    const hitIndex = entries.findIndex((entry) => entry.at === targetAt)
    if (hitIndex >= 0) {
      const [hit] = entries.splice(hitIndex, 1)
      entries.unshift(hit)
      return hit.raw
    }

    const now_idx = Math.min(29, Math.floor(mod(moony.phaseAt(targetAt), 1) * 30))
    const cycle = Math.floor((targetAt - moony.epochMsec) / moony.periodMsec)
    const raw = cycle * 30 + now_idx
    entries.unshift({ at: targetAt, raw })
    entries.length = Math.min(entries.length, TITHI_ASSIGNMENT_CACHE_CAPACITY)
    return raw
  }

  return (_dayStart, { calendar, at, previousAt, nextAt }) => {
    const moony = calendar.dic.moony
    if (!moony) throw new Error('tithi() assignment requires a satellite orbital model')
    const assignment_raw_now_idx = rawAt(moony, at)
    const now_idx = mod(assignment_raw_now_idx, 30)
    const previous = rawAt(moony, previousAt)
    const next = rawAt(moony, nextAt)
    const assignment_flags = [
      assignment_raw_now_idx === previous ? 'repeated' : undefined,
      assignment_raw_now_idx + 1 < next ? 'skipped' : undefined,
    ].filter((flag): flag is string => !!flag)
    return { now_idx, assignment_raw_now_idx, assignment_flags }
  }
}

type ICALC = {
  eras: ERA_WITH_YEAR[]
  idx: TOKENS<AnyDicToken, number>
  zero: TOKENS<ZERO_CALC, number>
  msec: TOKENS<MSEC_CALC, number> & { moon?: number }
  range: TOKENS<RANGE_CALC, [number, number]>
}

type TOKENS<K extends string, T> = {
  [key in K]: T
}

function calc_set(
  this: FancyDate,
  path: keyof MEASURE,
  o: Partial<TOKENS<ALL_CALC, MEASURE | number>>,
) {
  for (let key in o) {
    const val = o[key]
    if (val == null) {
      delete this.calc[path][key]
      continue
    }
    this.calc[path][key] = val?.[path] || val
  }
}

function sub_define(msec: number, size: number): MEASURE {
  const range: NUMBER_RANGE = [size]
  msec = msec / size
  return { range, msec }
}

function daily_define(msec: number, day: number): MEASURE {
  const range: NUMBER_RANGE = [Math.floor(msec / day)]
  msec = range[0] * day
  return { range, msec }
}

function daily_measure(msec: number, day: number): MEASURE {
  const range: NUMBER_RANGE = [Math.floor(msec / day), Math.ceil(msec / day)]
  return { range, msec }
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }
  if (value instanceof Map) {
    return new Map(value) as T
  }
  if (value && 'object' === typeof value) {
    const clone = Object.create(Object.getPrototypeOf(value))
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor) continue
      if ('value' in descriptor) {
        descriptor.value = cloneValue(descriptor.value)
      }
      Object.defineProperty(clone, key, descriptor)
    }
    return clone
  }
  return value
}

function to_indexs<T>(zero: T): TOKENS<AnyDicToken, T> {
  const data = {} as TOKENS<AnyDicToken, T>
  for (const key of all_dic_tokens) {
    data[key] = zero
  }
  return sync_legacy_token_aliases(data) as TOKENS<AnyDicToken, T>
}

class AssignedTempoRule<
  Base extends TempoBase,
  Token extends AssignmentToken,
> implements TempoRule<Base> {
  constructor(
    private readonly innerRule: TempoRule<Base>,
    private readonly token: Token,
    private readonly calendar: FancyDate,
    private readonly assignment: AssignmentRule<Token>,
    private readonly currentDayStart: () => DayStart,
  ) {}

  private raw_envelope(envelope: TempoEnvelope): TempoEnvelope {
    return {
      ...envelope,
      now_idx: envelope.raw_now_idx ?? envelope.now_idx,
    }
  }

  assign(raw: TempoEnvelope, base: Base): TempoEnvelope {
    const rawEnvelope = this.raw_envelope(raw)
    const previous = this.innerRule.slide(rawEnvelope, -1, base)
    const dayStart = this.currentDayStart()
    const assigned = this.assignment(dayStart, {
      token: this.token,
      calendar: this.calendar,
      dayStart,
      at: rawEnvelope.last_at,
      previousAt: previous.last_at,
      nextAt: rawEnvelope.next_at,
    })
    const now_idx = 'number' === typeof assigned ? assigned : assigned.now_idx
    const assignment_raw_now_idx =
      'number' === typeof assigned ? undefined : assigned.assignment_raw_now_idx
    const assignment_flags = 'number' === typeof assigned ? undefined : assigned.assignment_flags
    if (!Number.isFinite(now_idx)) throw new Error(`invalid assignment index ${now_idx}`)
    return {
      ...rawEnvelope,
      now_idx,
      raw_now_idx: raw.raw_now_idx ?? rawEnvelope.now_idx,
      assignment_raw_now_idx,
      assignment_flags,
    }
  }

  at(write_at: number, base: Base): TempoEnvelope {
    return this.assign(this.innerRule.at(write_at, base), base)
  }

  slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope {
    const rawEnvelope = this.raw_envelope(envelope)
    return this.assign(this.innerRule.slide(rawEnvelope, amount, base), base)
  }
}

const shift_up = function (a, b, size) {
  if (0 <= b && b <= size) {
    return arguments
  }
  a += Math.floor(b / size)
  b = mod(b, size)
  return [a, b]
}

type RegexFactory = (list: readonly string[]) => string
type IndexFactory = (this: Indexer, s: string) => number
type LabelFactory = (
  list: readonly string[] | null,
  val: TempoLike & { is_leap?: boolean },
  size: number,
) => string

type IndexerProps =
  | []
  | [number]
  | readonly [readonly string[], readonly string[] | null]
  | readonly [readonly string[], readonly string[] | null, string | readonly string[]]
class Indexer {
  tempo?: TempoLabelLike
  list: readonly string[] = []
  rubys: readonly string[] = []
  relatives?: string | readonly string[]
  length: number = 0
  zero: number = 0
  regex: string = ''
  regex_o: string = ''
  to_idx: IndexFactory = () => 0
  to_value: LabelFactory = () => ''
  to_label: LabelFactory = () => ''
  to_ruby: LabelFactory = () => ''

  constructor(arg: IndexerProps) {
    const [list, rubys, relatives] = arg
    const [zero] = arg.slice(-1)
    if (list instanceof Array) {
      this.list = list
      this.length = list.length
    }
    if ('number' === typeof list) {
      this.length = list
    }
    if (rubys instanceof Array && rubys.length === this.length) {
      this.rubys = rubys
    }
    if (relatives instanceof Array && relatives.length === this.length) {
      Object.defineProperty(this, 'relatives', {
        configurable: true,
        enumerable: false,
        value: relatives,
        writable: false,
      })
    }
    if ('string' === typeof relatives) {
      Object.defineProperty(this, 'relatives', {
        configurable: true,
        enumerable: false,
        value: relatives,
        writable: false,
      })
    }
    if ('number' === typeof zero) {
      this.zero = zero
    }
  }
}

// _lunisolar_cache(MRU)の上限。span_obj()/add() 自身の内部呼び出し
// (from/to の交互問い合わせ)だけなら2〜3件で足りるが、これは
// FancyDate 自身の内部実装が必要とする最小限に過ぎない。呼び出し側の
// アプリケーションはより広いパターンで同じインスタンス(=同じキャッシュ)を
// 使い回しうる: 前月・当月・次月のグリッド表示だけで3件、そこに
// 「今日」「次の祝日」「1年前の同日」等が加わると容易に超過する。また
// 観測太陰太陽暦は1年が12〜13ヶ月(閏月を含む場合13)なので、
// yeary_table() で1年分を表示した直後にユーザーが個別の月を
// 行き来する(カレンダーUIでの月送りなど)場合、13件保持できれば
// その年の中では再探索が一切発生しない。線形走査のコストは37ヶ月窓
// 探索(ミリ秒オーダー)に比べて無視できる(数十件の比較はナノ秒
// オーダー)ため、大きめに確保しても実害はない。「1年分(最大13)+
// 年境界をまたぐ余裕」を根拠に16件とする。
const LUNISOLAR_CACHE_CAPACITY = 16

export class FancyDate {
  dic!: IDIC
  calc!: ICALC
  is_table_leap!: boolean
  is_table_month!: boolean
  strategy!: string
  table!: {
    range: {
      year: number[]
      month: {
        [key: number]: number[]
      }
    }
    msec: {
      era: number[]
      year: number[]
      period: MEASURE
      month: {
        [key: number]: number[]
      }
    }
  }

  // TempoRule インスタンスの使い回し(D: TempoEnvelope キャッシュ)。
  // to_tempos() のたびに new すると、規則インスタンス内部に持たせた
  // 直近解決キャッシュ(CachedTempoRule 自身の1件キャッシュ)が効かない
  // ため、初回アクセス時に1度だけ構築して保持する。init() 実行時に
  // リセットする(暦の再設定に追従する)。
  private _orbital_season_rule?: CachedTempoRule<TempoBase>
  private _solar_hour_rule?: CachedTempoRule<SolarDayHourBase>
  private _solar_event_day_rule?: CachedTempoRule<SubdivideBase>
  private _solar_event_day_core_rule?: SolarEventDayTempoRule
  // span/add/sub は「離れた2つの日時」を交互に問い合わせる(例:
  // span_obj() は from/to に加えて next_precise_span_at() で to を
  // 再度問い合わせる)。1スロットのキャッシュだと A→B→A の順で
  // 問い合わせた際に B の解決で A のキャッシュが上書きされ、3回目の
  // A の問い合わせが再びキャッシュミスになる(実測: 定気法の
  // span_obj({precise:'S'}) で本来2回で済む37ヶ月窓探索が3回発生して
  // いた)。直近解決した複数ヶ月をMRU(最近使った順)で保持することで
  // このスラッシングを避ける。上限は LUNISOLAR_CACHE_CAPACITY 参照
  // (span_obj/add 自身が必要とする最小限ではなく、呼び出し側アプリの
  // より広い利用パターンを見込んだ値)。
  private readonly _lunisolar_cache: LunisolarDate[] = []

  constructor(base?: FancyDate)
  constructor(build: (calendar: FancyDate) => FancyDate)
  constructor(base: FancyDate | undefined, build: (calendar: FancyDate) => FancyDate)
  constructor(
    baseOrBuild?: FancyDate | ((calendar: FancyDate) => FancyDate),
    build?: (calendar: FancyDate) => FancyDate,
  ) {
    const isBuild = 'function' === typeof baseOrBuild
    const create = isBuild ? baseOrBuild : build
    const base = isBuild ? undefined : baseOrBuild

    // build を渡した場合: build(複製 or 新規).init() を遅延評価する Proxy を返す
    if (create) return FancyDate.lazy(() => create(new FancyDate(base)).init())

    // 即時: base があれば複製、なければ空の暦を生成
    if (base) {
      ;({ dic: this.dic, calc: this.calc } = cloneValue(base))
    } else {
      this.initBlank()
    }
  }

  // 空の暦を初期化する(new FancyDate() 経路)。
  private initBlank() {
    this.dic = {
      parse: 'y年M月d日',
      format: 'Gy年M月d日(E)',
    } as any
    Object.defineProperty(this.dic, 'labels', {
      configurable: true,
      enumerable: false,
      value: { ...DEFAULT_LABELS },
      writable: true,
    })
    Object.defineProperty(this.dic, 'assignments', {
      configurable: true,
      enumerable: false,
      value: {},
      writable: true,
    })

    this.calc = {
      eras: [],
      idx: {},
      zero: {},
      msec: {},
      range: {},
    } as any
    for (const key of all_dic_tokens) {
      this.dic[key] = new Indexer([])
    }
    sync_legacy_token_aliases(this.dic)
  }

  static lazy(create: () => FancyDate): FancyDate {
    let calendar: FancyDate | undefined
    const resolve = () => (calendar ??= create())
    const target = Object.create(FancyDate.prototype) as FancyDate
    return new Proxy(target, {
      get(_target, property) {
        const resolved = resolve()
        const value = Reflect.get(resolved, property)
        return 'function' === typeof value ? value.bind(resolved) : value
      },
      set(_target, property, value) {
        return Reflect.set(resolve(), property, value)
      },
      has(_target, property) {
        return property in resolve()
      },
      ownKeys() {
        return Reflect.ownKeys(resolve())
      },
      getOwnPropertyDescriptor(_target, property) {
        return Object.getOwnPropertyDescriptor(resolve(), property)
      },
      getPrototypeOf() {
        return FancyDate.prototype
      },
    })
  }

  spot(...spot: SPOT) {
    Object.assign(this.dic, prepareSpot(...spot))
    return this
  }

  lang(parse: string, format: string) {
    Object.assign(this.dic, { parse, format })
    return this
  }

  era(era: string, past: string, eras: readonly ERA[] = []) {
    const all_eras = [past, ...eras.map(([s]) => s)]
    this.dic.G = new Indexer([all_eras, null])
    Object.assign(this.dic, { era, eras })
    return this
  }

  calendar(
    start = ['1970-1-1 0:0:0', 'y-M-d H:m:s', 0],
    leaps: number[] | null = null,
    month_divs: (number | null)[] | null = null,
    leap_shift = 0,
  ) {
    Object.assign(this.dic, { month_divs, leaps, start })
    if (leap_shift) {
      this.dic.leap_shift = leap_shift
    }
    return this
  }

  notation(o: Partial<TOKENS<ALGO_DIC | LegacyTokenAlias, IndexerProps>>) {
    const normalized = {} as Partial<TOKENS<ALGO_DIC, IndexerProps>>
    let explicitWeekCycle: WeekCycleToken | undefined
    for (let key in o) {
      const val = o[key]
      const canonical = token_base(key as Token) as ALGO_DIC
      this.dic[canonical] = new Indexer(val)
      normalized[canonical] = val
      if (canonical === 'E') {
        const length = this.dic.E.length
        if (length === 7 || length === 8 || length === 10) {
          const weekCycle = `dC${length}` as WeekCycleToken
          this.dic[weekCycle] = this.dic.E
          explicitWeekCycle = weekCycle
        }
      } else if (canonical === 'dC7' || canonical === 'dC8') {
        explicitWeekCycle = canonical
      } else if (canonical === 'dC10' && !('dC12' in o) && !('dCB' in o)) {
        explicitWeekCycle = canonical
      }
    }
    sync_legacy_token_aliases(this.dic)

    // dC60/dC12/dC10 と yC60/yC12/yC10(日/年の周期ラベル)を構築する。
    // 旧 API の a/c/b/A/C/B 入力は上で canonical token へ正規化済み。
    if (normalized.dC10?.[0] instanceof Array && normalized.dC12?.[0] instanceof Array) {
      this.dic.yC10 = new Indexer(normalized.dC10)
      this.dic.yC12 = new Indexer(normalized.dC12)
      this.dic.dC10.zero = this.dic.dC12.zero = this.dic.dC60.zero
      this.dic.yC10.zero = this.dic.yC12.zero = this.dic.yC60.zero
    }

    const { dC60, dC12, dC10, yC60 } = this.dic
    if (dC10.list.length && dC12.list.length) {
      dC60.list = yC60.list = [...Array(dC60.length)].map((_, idx) => {
        const stem = dC10.list[idx % dC10.length]
        const branch = dC12.list[idx % dC12.length]
        return `${stem}${branch}`
      })
    }

    if (dC10.rubys.length && dC12.rubys.length) {
      dC60.rubys = yC60.rubys = [...Array(yC60.length)].map((_, idx) => {
        const stem = dC10.rubys[idx % dC10.length]
        const branch = dC12.rubys[idx % dC12.length]
        return `${stem.replace(/と$/, 'との')}${branch}`
      })
    }

    define_token_alias(this.dic, 'E', explicitWeekCycle ?? this.week_cycle_token())
    sync_legacy_token_aliases(this.dic)

    return this
  }

  algo(o: Partial<TOKENS<ALGO_DIC | LegacyTokenAlias, IndexerProps>>) {
    return this.notation(o)
  }

  assign(assignments: AssignmentOptions) {
    Object.assign(this.dic.assignments, assignments)
    return this
  }

  locale(locale: LocaleEntry, options: LocaleApplyOptions = {}) {
    const numeral = (ref: LocaleNumeralRef): Numeral | null => {
      if (ref == null) return null
      if ('string' !== typeof ref) return ref
      const value = locale.numerals[ref]
      if (!value) throw new Error(`locale ${locale.tag} has no numeral ${ref}`)
      return value
    }

    if (options.lang !== false) this.lang(locale.defaultParseFormat, locale.defaultFormat)
    if ('numeral' in options) this.numeral(numeral(options.numeral))
    if ('numeral_text' in options) this.numeral_text(numeral(options.numeral_text))
    if ('numeral_ruby' in options) this.numeral_ruby(numeral(options.numeral_ruby))
    if ('numeral_label' in options || 'numeral_label_ruby' in options) {
      this.numeral_label(numeral(options.numeral_label), numeral(options.numeral_label_ruby))
    }
    if (options.labels !== false) {
      if (locale.labels) this.labels(locale.labels)
      if (options.labels && 'object' === typeof options.labels) this.labels(options.labels)
    }
    return this
  }

  observedLunisolar(options: boolean | ObservedLunisolarOptions = true) {
    const enabled = typeof options === 'boolean' ? options : true
    this.dic.observed_lunisolar = enabled
    this.dic.observed_lunisolar_solar_year =
      enabled && typeof options === 'object' ? options.solarYear : undefined
    this._lunisolar_cache.length = 0
    return this
  }

  thaiOfficialLunisolar(enabled = true) {
    this.dic.thai_official_lunisolar = enabled
    this._lunisolar_cache.length = 0
    return this
  }

  thaiLunisolar(utc: number): ThaiLunisolarDate {
    const options: ThaiLunisolarOptions = {
      geo: this.dic.geo,
      dayMsec: this.calc.msec.day,
      dayZero: this.calc.zero.day,
    }
    return resolveThaiLunisolar(options, utc)
  }

  division(options: DivisionOptions) {
    if ('H' in options) {
      const H = options.H
      this.dic.is_solor = H === 'solar'
    }
    return this
  }

  daily(is_solor: string | boolean = false) {
    return this.division({ H: is_solor ? 'solar' : false })
  }

  // 暦日の境界を実時刻の 0 時から offsetHours 時間ずらす(例: 18 なら日没
  // 頃を境界とみなす暦向け)。あくまで固定オフセットであり、季節で日没
  // 時刻が変動する暦には向かない(その場合は dusk()/RealSunsetDayTempoRule
  // 側を使う)。d/N(月内日)の構築規則(day_rule() 参照)にのみ作用し、
  // def_zero() の hour/day/month/year の連鎖には触れない——そこを直接
  // ずらすと month/year の zero 点自体が offsetHours ぶん動いてしまい、
  // 「時刻体系だけが違う」はずの対になる暦(例: オスマン季節時法/
  // アラトゥルカ)の月内日が1日のうち大半でズレる実バグがあった
  // (実測: 固定オフセットの月始点が実時法側と18時間ズレたことで、
  // 1日のうち約75%の時間帯で日番号が食い違っていた)。noon()/solor() の
  // 日の出没計算も this.dic.day_offset_hours の影響を受けない。
  dayBoundary(offsetHours = 0) {
    this.dic.day_offset_hours = offsetHours
    return this
  }

  // 暦日の境界を実際の太陽イベント(日の出/日の入)へ寄せる。
  // dayBoundary() が固定オフセットなのに対し、こちらは実際の太陽イベント
  // 時刻そのものを暦日境界にする。division({ H: 'solar' }) と同様、
  // 極域(66.5度以遠)では成立しないため init() で例外にする。
  dayStart(dayStart: DayStart = 'midnight') {
    if (dayStart === 'midnight') {
      delete this.dic.day_start
    } else {
      this.dic.day_start = dayStart
    }
    this.dic.is_dusk = dayStart === 'sunset'
    this._solar_event_day_rule = undefined
    this._solar_event_day_core_rule = undefined
    return this
  }

  // 実際の(季節で変動する)日没時刻そのものを暦日の境界にする互換 alias。
  // 新規コードでは dayStart('sunset') を使う。
  dusk(is_real_sunset: string | boolean = false) {
    this.dayStart(is_real_sunset ? 'sunset' : 'midnight')
    return this
  }

  numeral(numeral: Numeral | null = null) {
    this.dic.numeral = numeral
    return this
  }

  numeral_text(numeral: Numeral | null = null) {
    this.dic.numeral_text = numeral
    return this
  }

  numeral_ruby(numeral: Numeral | null = null) {
    this.dic.numeral_ruby = numeral
    return this
  }

  // y(年)のように list/rubys の静的配列が現実的でない無界の数値トークン
  // 向けに、'o'/'r' サフィックス(yo/yr)専用の数詞を指定する。bare の y
  // (.numeral() / format_number() 経由)とは独立した状態に持つ——
  // format_number() は H/m/s/S/u/y と D/Q/d/p/w が丸ごと共有しているため、
  // ここを numeral() と同じ状態にしてしまうと yo/yr を機能させるだけの
  // つもりが bare の d/H/m/s まで意図せず巻き込んでしまう(既存の暦の
  // 出力・スナップショットを壊す)。
  numeral_label(numeral: Numeral | null = null, ruby: Numeral | null = null) {
    this.dic.numeral_label = numeral
    this.dic.numeral_label_ruby = ruby
    return this
  }

  private format_number(value: number, size: number) {
    const numeral = this.dic.numeral_text ?? this.dic.numeral
    if (numeral) return parseNumeral(numeral, value, size)
    return `${value}`.padStart(size, '0')
  }

  private format_number_ruby(value: number, size: number) {
    const numeral = this.dic.numeral_ruby
    return numeral ? parseNumeral(numeral, value, size) : ''
  }

  private format_numeral_label(value: number, size: number) {
    const numeral = this.dic.numeral_label
    if (numeral) return parseNumeral(numeral, value, size)
    return `${value}`.padStart(size, '0')
  }

  private format_numeral_label_ruby(value: number, size: number) {
    // 他トークンの 'r' サフィックス(rubys 未設定時)と同じ規約に合わせ、
    // ふりがな用 Numeral が設定されていなければ空文字を返す。
    const numeral = this.dic.numeral_label_ruby
    return numeral ? parseNumeral(numeral, value, size) : ''
  }

  labels(labels: SpanLabels) {
    Object.assign(this.dic.labels, labels)
    return this
  }

  private parse_number(text: string) {
    const numeric = Number(text)
    if (Number.isFinite(numeric)) return numeric
    const parsed = this.dic.numeral?.to_number?.(text)
    return parsed ?? this.dic.numeral_text?.to_number?.(text) ?? numeric
  }

  private number_pattern(fallback = '\\d+') {
    const patterns = [this.dic.numeral?.regex, this.dic.numeral_text?.regex, fallback].filter(
      Boolean,
    )
    return patterns.length === 1 ? patterns[0]! : `(?:${patterns.join('|')})`
  }

  init() {
    // 不定時法(division({ H: 'solar' }))は日の出・日の入りの間隔を等分するため、
    // 極域(概ね北緯/南緯66.5度=極圏以遠)では日の出/日の入りが存在しない
    // 期間が生じ、そもそも成立しない。調査の結果、不定時法を極域に
    // 「正しく拡張する」実例・自然な答えは見当たらなかったため(README/
    // development-notes.md 参照)、黙って退化した値を返すのではなく
    // construction 時点(init())で例外にする。66.5度は「これより先は
    // 確実に不可能」という下限であり、唯一の閾値ではない(手前でも夏至・
    // 冬至付近で退化するケースは残る)。
    if (
      (this.dic.is_solor || this.day_start_event()) &&
      this.dic.geo &&
      66.5 <= Math.abs(this.dic.geo[0])
    ) {
      throw new Error(
        `不定時法(division({ H: 'solar' }))・太陽イベント起点の暦日(dayStart())は極域(緯度${this.dic.geo[0]}度)では成立しません。極圏(66.5度)以遠では日の出・日の入りが存在しない期間が生じ、これらの前提が崩れます。`,
      )
    }

    // 暦設定が(再)確定するたびに、直近解決キャッシュを破棄する
    // (古い設定に基づく envelope/lunisolar 結果を持ち越さないため)。
    this._orbital_season_rule = undefined
    this._solar_hour_rule = undefined
    this._solar_event_day_rule = undefined
    this._solar_event_day_core_rule = undefined
    this._lunisolar_cache.length = 0

    const { sunny, moony, earthy, leaps, month_divs } = this.dic
    const year = daily_measure(sunny.periodMsec, earthy.periodMsec)
    const day = daily_define(earthy.periodMsec, earthy.periodMsec)
    const moon = moony ? daily_measure(moony.periodMsec, earthy.periodMsec) : undefined
    calc_set.call(this, 'range', { year })
    calc_set.call(this, 'msec', { year, moon, day })
    this.is_table_leap = leaps != null
    this.is_table_month = this.is_table_leap || month_divs != null
    this.strategy = leaps != null ? 'SolarTable' : month_divs != null ? 'SeasonTable' : 'SolarLunar'

    this.def_regex()
    this.def_to_idx()
    this.def_to_label()
    this.def_calc()

    this.def_table()
    this.def_idx()
    this.def_zero()

    this.def_eras()
    return this
  }

  yeary_table(utc: number) {
    return this.to_table(utc, 'y', 'M', true)
  }
  monthry_table(utc: number) {
    return this.to_table(utc, 'M', 'd', true)
  }
  weekly_table(utc: number) {
    return this.to_table(utc, 'w', 'd', true)
  }
  time_table(utc: number) {
    return this.to_table(utc, 'd', 'H')
  }

  solar_phase(phase: number, near: number) {
    return resolveSolarPhase(this.dic.sunny, phase, near)
  }

  lunar_phase(phase: number, near: number) {
    if (!this.dic.moony) {
      throw new Error('lunar_phase requires a satellite orbital model')
    }
    return this.dic.moony.timeOfPhase(mod(phase, 1), near)
  }

  lunisolar(utc: number): LunisolarDate {
    // D: TempoEnvelope キャッシュ(MRU、最大 LUNISOLAR_CACHE_CAPACITY 件)。
    // 直近解決した月のいずれかがまだ utc を覆っている
    // (last_at <= utc < next_at)場合、37ヶ月窓の朔・節気探索
    // (lunisolar_months_around)をやり直さず、日番号だけ軽量に再計算する
    // (phenomena/lunisolar.ts の lunisolar() 自身が day/day_start_at を
    // 求める式と同じ式を、キャッシュ済みの月境界に対して適用するだけ)。
    const cache = this._lunisolar_cache
    for (let i = 0; i < cache.length; i++) {
      const cached = cache[i]
      if (cached.last_at <= utc && utc < cached.next_at) {
        // 最近使ったものを先頭に(MRU)。span_obj()/add() のように
        // 「離れた2つの日時」を交互に問い合わせるアクセスパターンで、
        // 1スロットのキャッシュだと A→B→A の3回目が再びキャッシュミス
        // になっていた(実測: 定気法の span_obj({precise:'S'}) で
        // 本来2回で済む探索が3回発生していた)。
        if (i > 0) {
          cache.splice(i, 1)
          cache.unshift(cached)
        }
        const day = to_tempo_bare(this.calc.msec.day, this.calc.zero.day, utc)
        return {
          ...cached,
          day: Math.floor((day.last_at - cached.last_at) / this.calc.msec.day) + 1,
          day_start_at: day.last_at,
        }
      }
    }
    const resolved = resolveLunisolar(
      {
        moony: this.dic.moony,
        solarPeriodMsec: this.dic.sunny.periodMsec,
        principalTermCount: this.dic.M.length || 12,
        solarYear:
          this.dic.observed_lunisolar_solar_year ??
          (this.dic.observed_lunisolar
            ? (at) => to_tempo_bare(this.calc.msec.year, this.calc.zero.season, at).now_idx
            : undefined),
        geo: this.dic.geo,
        dayMsec: this.calc.msec.day,
        dayZero: this.calc.zero.day,
        lunarPhase: (phase, near) => this.lunar_phase(phase, near),
        solarPhase: (phase, near) => this.solar_phase(phase, near),
      },
      utc,
    )
    cache.unshift(resolved)
    cache.length = Math.min(cache.length, LUNISOLAR_CACHE_CAPACITY)
    return resolved
  }

  solar_term(utc: number, phase: number) {
    return resolveSolarTerm(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, utc, phase)
  }

  solar_phase_before(phase: number, utc: number) {
    return resolveSolarPhaseBefore(this.dic.sunny, phase, utc)
  }

  solar_terms(utc: number) {
    return resolveSolarTerms(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, utc)
  }

  succ(utc: DateLike, diff: SpanLike) {
    return this.add(utc, diff)
  }
  back(utc: DateLike, diff: SpanLike) {
    return this.sub(utc, diff)
  }

  parse(tgt: string | TempoIdxs, str?: string) {
    return this.parse_by(this.parse_obj(tgt, str))
  }
  parse_obj(tgt: string | TempoIdxs, str?: string) {
    return 'string' === typeof tgt ? this.index(tgt, str) : cloneValue(tgt)
  }
  format(utc: DateLike, str?: string) {
    return this.format_parts_by(utc, str)
      .map((part) => part.text)
      .join('')
  }
  format_parts(utc: DateLike, str?: string) {
    return this.format_parts_by(utc, str)
  }

  add(utc: DateLike, span: SpanLike) {
    return this.add_span(this.to_utc(utc), span)
  }
  add_obj(utc: DateLike, span: SpanLike) {
    return this.to_tempos(this.add(utc, span))
  }
  sub(utc: DateLike, span: SpanLike) {
    return this.add_span(this.to_utc(utc), this.invert_span_diff(span))
  }
  sub_obj(utc: DateLike, span: SpanLike) {
    return this.to_tempos(this.sub(utc, span))
  }
  span(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions) {
    return this.span_obj(to, from, options).label
  }
  span_obj(to: string, from?: SpanOptions): Span
  span_obj(to: DateLike | DateRange, from: SpanMeasureOptions): SpanMeasure
  span_obj(
    to: DateLike | DateRange,
    from: DateLike | SpanOptions | undefined,
    options: SpanMeasureOptions,
  ): SpanMeasure
  span_obj(
    to: DateLike | DateRange,
    from?: DateLike | SpanAddOptions,
    options?: SpanAddOptions,
  ): Span
  span_obj(
    to: DateLike | DateRange,
    from?: DateLike | SpanOptions,
    options?: SpanOptions,
  ): SpanResult
  span_obj(
    to: DateLike | DateRange,
    from?: DateLike | SpanOptions,
    options: SpanOptions = {},
  ): SpanResult {
    if (this.is_date_range(to)) {
      const spanOptions = this.is_span_options(from) ? from : options
      return this.span_between(this.to_utc(to[1]), this.to_utc(to[0]), spanOptions)
    }
    if (this.is_span_text(to, from)) {
      return this.parse_span(to, this.is_span_options(from) ? from : undefined)
    }
    const [fromAt, spanOptions] = this.span_args(from, options)
    return this.span_between(this.to_utc(to), fromAt, spanOptions)
  }

  parse_span(text: string, options: ParseSpanOptions = {}): Span {
    const { diff, direction } = this.parse_span_diff(text)
    const span = this.format_span_diff(diff, direction)
    if (options.at != null) this.with_span_anchor_at(this.to_utc(options.at), span)
    return span
  }

  format_span(span: SpanLike, direction?: SpanDirection): Span {
    return this.format_span_diff(this.span_diff_of(span), direction)
  }

  format_span_parts(span: SpanLike, direction?: SpanDirection): RichText {
    return this.format_span_render(this.span_diff_of(span), direction).parts
  }

  span_neg(span: SpanLike) {
    const result = this.format_span_diff(this.invert_span_diff(span))
    const at = this.span_anchor_at(span)
    return at == null ? result : this.with_span_anchor_at(at, result)
  }

  span_add(left: SpanLike, right: SpanLike) {
    const result = this.format_span_diff(this.merge_span_diff(left, right))
    const at = this.merge_span_anchor_at(left, right)
    return at == null ? result : this.with_span_anchor_at(at, result)
  }

  span_sub(left: SpanLike, right: SpanLike): Span
  span_sub(left: ContinuousSpanLabel, right: ContinuousSpanLabel): Span
  span_sub(left: SpanSubOperand, right: SpanSubOperand): Span
  span_sub(left: SpanSubOperand, right: SpanSubOperand): Span {
    if (this.is_span_label_operand(left) || this.is_span_label_operand(right)) {
      if (!this.is_span_label_operand(left) || !this.is_span_label_operand(right)) {
        throw new Error('span_sub label operands must use the same continuous cycle')
      }
      const leftLabel = this.continuous_span_label_entry(left)
      const rightLabel = this.continuous_span_label_entry(right)
      if (leftLabel.token !== rightLabel.token) {
        throw new Error('span_sub label operands must use the same continuous cycle')
      }
      return this.span_from_label_values(leftLabel.token, leftLabel.label, rightLabel.label)
    }
    const numericLeft = left as SpanLike
    const numericRight = right as SpanLike
    const result = this.format_span_diff(
      this.merge_span_diff(numericLeft, this.invert_span_diff(numericRight)),
    )
    const at = this.merge_span_anchor_at(numericLeft, numericRight)
    return at == null ? result : this.with_span_anchor_at(at, result)
  }

  /**
   * 連続cycleの2ラベル間を順方向に進む代表Spanを返す。
   * 実時刻差ではなく、cycleの1ステップを対応する年/日の1単位として扱う。
   */
  span_from_labels(token: ContinuousSpanToken, from: string, to: string): Span {
    return this.span_from_label_values(token, to, from)
  }

  private span_from_label_values(
    token: ContinuousSpanToken,
    leftLabel: string,
    rightLabel: string,
  ): Span {
    const canonical = canonical_token(token)
    if (!is_continuous_cycle_token(canonical)) {
      throw new Error(`invalid continuous span token ${token}`)
    }
    const indexer = this.dic[canonical]
    const length = indexer.length
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error(`invalid continuous span token ${token}`)
    }
    const index_of = (label: string) => {
      const index = indexer.to_idx(label)
      if (!Number.isInteger(index) || index < 0 || length <= index) {
        throw new Error(`invalid ${token} label ${label}`)
      }
      return index
    }
    const value = mod(index_of(leftLabel) - index_of(rightLabel), length)
    const base: SpanToken = is_year_cycle_token(canonical) ? 'y' : 'd'
    return this.format_span_diff({ [base]: value })
  }

  private is_span_label_operand(value: SpanSubOperand) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    return Object.entries(value).some(
      ([token, label]) => is_span_label_token(token) && typeof label === 'string',
    )
  }

  private continuous_span_label_entry(value: SpanSubOperand) {
    const entries = Object.entries(value).filter(
      ([token, label]) => is_span_label_token(token) && typeof label === 'string',
    ) as [string, string][]
    if (entries.length !== 1) {
      throw new Error('continuous span label must contain exactly one cycle')
    }
    const [entry] = entries
    const token = canonical_token(entry[0])
    if (!is_continuous_span_token(token)) {
      throw new Error(`invalid continuous span token ${entry[0]}`)
    }
    return { token, label: entry[1] }
  }

  span_msec(span: SpanLike, options: SpanMsecOptions = {}) {
    const anchor = 'string' === typeof span ? undefined : (span as AnchoredSpan)[span_anchor]
    if (anchor?.calendar === this && anchor.msec != null) return anchor.msec
    const at =
      options.at != null
        ? this.to_utc(options.at)
        : anchor?.calendar === this
          ? anchor.at
          : undefined
    if (at == null) throw new Error('span_msec() requires an anchor time')
    return this.add(at, span) - at
  }

  private add_span(utc: number, span: SpanLike) {
    const anchor = 'string' === typeof span ? undefined : (span as AnchoredSpan)[span_anchor]
    if (anchor?.calendar === this && anchor.at === utc && anchor.msec != null)
      return utc + anchor.msec
    const target = this.span_target(utc, this.span_diff_of(span))
    return this.find_span_time(target, utc)
  }

  private parse_span_diff(text: string): { diff: SpanDiff; direction: SpanDirection } {
    const source = text.trim()
    if (source === '今') return { diff: {}, direction: '前' }
    const match = source.match(/^(.*)(前|後)$/)
    const body = match ? match[1] : source
    const direction = (match ? match[2] : '後') as SpanDirection
    if (!body) throw new Error(`invalid relative time ${text}`)
    const sign = direction === '後' ? 1 : -1
    let rest = body
    const components: (SpanComponent & { length: number })[] = []
    while (rest) {
      const component = this.parse_span_component(rest, sign)
      if (!component) throw new Error(`invalid relative time ${text}`)
      components.push(component)
      rest = rest.slice(component.length)
    }
    return { diff: this.components_to_span_diff(components), direction }
  }

  private components_to_span_diff(parts: readonly SpanComponent[]): SpanDiff {
    const diff: SpanDiff = {}
    for (const { token, value } of parts) {
      diff[token] = (diff[token] ?? 0) + value
    }
    return this.normalize_span_diff(diff)
  }

  private span_diff_of(span: SpanLike): SpanDiff {
    if ('string' === typeof span) return this.parse_span_diff(span).diff
    const diff: SpanDiff = {}
    for (const [token, value] of Object.entries(span)) {
      if (token === 'label' || token === 'next_at' || token === 'timeout') continue
      if (!is_span_token(token)) throw new Error(`invalid span token ${token}`)
      if (!Number.isInteger(value)) throw new Error(`invalid span value ${token}=${value}`)
      diff[token] = value
    }
    return this.normalize_span_diff(diff)
  }

  private normalize_span_diff(diff: SpanDiff): SpanDiff {
    const normalized: SpanDiff = {}
    for (const token of span_tokens) {
      const value = diff[token]
      if (value == null || value === 0) continue
      if (!Number.isInteger(value)) throw new Error(`invalid span value ${token}=${value}`)
      normalized[token] = value
    }
    return normalized
  }

  private span_diff_entries(diff: SpanDiff): SpanComponent[] {
    return span_tokens.flatMap((token) => {
      const value = diff[token]
      return value == null || value === 0 ? [] : [{ token, value }]
    })
  }

  private format_span_diff(diff: SpanDiff, direction?: SpanDirection): Span {
    const normalized = this.normalize_span_diff(diff)
    return { ...normalized, label: this.format_span_render(normalized, direction).label }
  }

  private format_span_render(
    diff: SpanDiff,
    direction?: SpanDirection,
  ): { label: string; parts: RichText } {
    const entries = this.span_diff_entries(diff)
    if (!entries.length) return { label: '今', parts: [{ text: '今' }] }
    const parts = entries.map(({ token, value }) => {
      const text = this.span_part_label(token, Math.abs(value), this.span_part_fallback_unit(token))
      const ruby = this.span_part_ruby(token, Math.abs(value), this.span_part_fallback_unit(token))
      return ruby ? { text, ruby } : { text }
    })
    const signs = new Set(entries.map(({ value }) => (value < 0 ? '前' : '後')))
    if (direction || signs.size === 1) {
      const suffix = direction ?? signs.values().next().value!
      const fullParts = [...parts, { text: suffix }]
      return { label: fullParts.map(({ text }) => text).join(''), parts: fullParts }
    }
    const fullParts = entries.flatMap(({ value }, index) => [
      parts[index],
      { text: value < 0 ? '前' : '後' },
    ])
    return { label: fullParts.map(({ text }) => text).join(''), parts: fullParts }
  }

  private format_span_measure(
    precision: SpanMeasurePrecision,
    value: number,
    direction?: SpanDirection,
  ): SpanMeasure {
    if (!value) return { precision, value: 0, label: '今' }
    const token = precision as Token
    const text = this.span_part_label(token, Math.abs(value), this.span_part_fallback_unit(token))
    return {
      precision,
      value,
      label: `${text}${direction ?? (value < 0 ? '前' : '後')}`,
    }
  }

  private invert_span_diff(span: SpanLike): SpanDiff {
    return this.components_to_span_diff(
      this.span_diff_entries(this.span_diff_of(span)).map(({ token, value }) => ({
        token,
        value: 0 - value,
      })),
    )
  }

  private merge_span_diff(left: SpanLike, right: SpanLike): SpanDiff {
    return this.components_to_span_diff([
      ...this.span_diff_entries(this.span_diff_of(left)),
      ...this.span_diff_entries(this.span_diff_of(right)),
    ])
  }

  private span_anchor_at(span: SpanLike) {
    if ('string' === typeof span) return undefined
    const anchor = (span as AnchoredSpan)[span_anchor]
    return anchor?.calendar === this ? anchor.at : undefined
  }

  private merge_span_anchor_at(left: SpanLike, right: SpanLike) {
    const leftAt = this.span_anchor_at(left)
    const rightAt = this.span_anchor_at(right)
    if (leftAt == null) return rightAt
    if (rightAt == null || leftAt === rightAt) return leftAt
    return undefined
  }

  private parse_span_component(text: string, sign: number) {
    let best: (SpanComponent & { length: number }) | undefined
    const accept = (token: SpanToken, count: number, label: string) => {
      if (!label) return
      if (best && best.length >= label.length) return
      best = { token, value: count * sign, length: label.length }
    }
    for (const [token, _unit, fallbackUnit] of this.span_parse_rows()) {
      const relatives = this.dic[token]?.relatives
      if ('string' === typeof relatives) {
        const match = text.match(new RegExp(`^(\\d+)${escape_regexp(relatives)}`))
        if (match) accept(token, Number(match[1]), match[0])
      }
      if (relatives instanceof Array) {
        relatives.forEach((label, count) => {
          if (label && text.startsWith(label)) accept(token, count, label)
        })
      }
      const match = text.match(new RegExp(`^(\\d+)${escape_regexp(fallbackUnit)}`))
      if (match) accept(token, Number(match[1]), match[0])
    }
    return best
  }

  private span_parse_rows(): [SpanToken, Unit, string][] {
    return span_tokens.map((token) => [
      token,
      this.span_part_unit(token),
      this.span_part_fallback_unit(token),
    ])
  }

  private span_target(utc: number, diff: SpanDiff) {
    const source = this.to_tempos(utc)
    const target: SpanTarget = {
      // u は元号内相対年(now_idx)ではなく raw_now_idx(単調な通し番号)で
      // 初期化する。元号を跨ぐ年送りで find_span_year_start() が目標年に
      // 到達できず暴走する不具合(平成31年+1年が「令和32年」まで飛ぶ)の
      // 修正。TempoEnvelope.raw_now_idx のドキュメント参照。
      u: source.u.raw_now_idx,
      y: source.y.now_idx,
      M: source.M.now_idx,
      d: source.d.now_idx,
      H: source.H.now_idx,
      m: source.m.now_idx,
      s: source.s.now_idx,
      S: source.S.now_idx,
      M_is_leap: source.M.is_leap,
      changedRank: -1,
      near: utc,
      sourceWeekSince: source.w.since,
      sourceDaySince: source.d.since,
      sourceHourSince: source.H.since,
      sourceMinuteSince: source.m.since,
      sourceSecondSince: source.s.since,
    }
    const resolvePendingWeek = () => {
      if (target.week == null) return
      this.resolve_span_week_target(target)
      delete target.week
    }
    for (const { token, value: amount } of this.span_diff_entries(diff)) {
      if (target.week != null && token !== 'w') resolvePendingWeek()
      if ('w' === token) {
        target.week = (target.week ?? source.w.now_idx) + amount
        target.changedRank = Math.max(target.changedRank, span_rank('d'))
        target.near += amount * this.dic.E.length * this.unit_msec('day')
        continue
      }
      if ('M' === token) {
        // target.M += amount という単純な番号加算だと、次の月が閏月
        // (is_leap=true、now_idx は前月と同じ)であるケースを一切
        // 考慮できず、閏月をまるごと読み飛ばしてしまう不具合があった
        // (実測: 平気法/定気法とも、閏月を挟む区間で succ('1ヶ月後')を
        // 繰り返すと閏月に一度もヒットしないまま次の月へ進む)。
        // M(Tempo)自身の succ()/back()(MeanLunisolarMonthRule/
        // ObservedLunisolarMonthRule.slide() 経由)は実際の暦上の隣接月を
        // 1つずつ辿るため閏月も正しく経由する。1ヶ月ずつ繰り返すことで
        // これを利用する(amount は通常小さいためコストは問題にならない)。
        const shifted = this.step_month(source.M, amount)
        target.M = shifted.now_idx
        target.M_is_leap = shifted.is_leap
        // 月の移動で年をまたいだ分(閏月の有無によらず正確)を u へ反映する。
        target.u += this.to_tempos(shifted.last_at).u.raw_now_idx - source.u.raw_now_idx
        target.changedRank = Math.max(target.changedRank, span_rank('M'))
        target.near += amount * this.unit_msec('month')
        continue
      }
      if (!is_core_precision(token)) {
        throw new Error(`cannot add span token ${token}`)
      }
      target[token] += amount
      if (token === 'y') target.u += amount
      target.changedRank = Math.max(target.changedRank, span_rank(token))
      target.near += amount * this.unit_msec(this.span_part_unit(token))
    }
    this.normalize_span_target(target)
    resolvePendingWeek()
    return target
  }

  /**
   * source.M から amount 回、実際の隣接月(閏月を含む)を1つずつ辿る。
   *
   * Tempo 自身の succ()/back()(= rule.slide())を連続で使わないのは、
   * TableTempoRule(グレゴリオ暦等、is_table_leap 系の暦の M が使う)の
   * now_idx が「year の zero を起点にした通し番号」であり、mod されずに
   * そのまま蓄積される仕様のため(u(年)には正しい仕様だが、年内で
   * 0-11 にリセットされるべき M にはそのまま流用できない)。実測で
   * M.succ() を11回連鎖させると now_idx が 1→12(本来は次の年の 0)まで
   * 蓄積し、to_tempos() が都度再構築する新鮮な M(必ず 0-11 に収まる)と
   * 食い違って年が余分に1つ進む不具合があった。都度 to_tempos() で
   * 再構築すれば、暦の種類によらず常に正しい年内番号の M が得られる。
   */
  private step_month(
    month: Tempo<TempoBase> & TempoMonth,
    amount: number,
  ): Tempo<TempoBase> & TempoMonth {
    let result = month
    let remaining = amount
    while (remaining > 0) {
      result = this.to_tempos(result.next_at).M
      remaining--
    }
    while (remaining < 0) {
      result = this.to_tempos(result.last_at - 1).M
      remaining++
    }
    return result
  }

  private resolve_span_week_target(target: SpanTarget) {
    if (target.week == null) return
    const yearStart = this.find_span_year_start(target.u, target.near)
    const yearWeek = this.to_tempos(yearStart).w
    const week = yearWeek.slide_to(target.week)
    const at =
      week.last_at + Math.min(Math.max(0, target.sourceWeekSince), Math.max(0, week.size - 1))
    const tempos = this.to_tempos(at)
    target.u = tempos.u.raw_now_idx
    target.y = tempos.y.now_idx
    target.M = tempos.M.now_idx
    target.d = tempos.d.now_idx
    target.M_is_leap = tempos.M.is_leap
    target.near = at
  }

  private normalize_span_target(target: SpanTarget) {
    const carry = (
      token: 'M' | 'H' | 'm' | 's' | 'S',
      parent: 'y' | 'd' | 'H' | 'm' | 's',
      size: number,
    ) => {
      const amount = Math.floor(target[token] / size)
      target[token] = mod(target[token], size)
      target[parent] += amount
    }
    const rank = target.changedRank
    if (span_rank('S') <= rank) carry('S', 's', this.dic.S.length)
    if (span_rank('s') <= rank) {
      carry('s', 'm', this.dic.s.length)
      if (this.dic.is_solor && target.m < 0 && target.s === 0) {
        target.s = this.dic.s.length
        target.m--
      }
    }
    if (span_rank('m') <= rank) carry('m', 'H', this.dic.m.length)
    if (span_rank('H') <= rank) carry('H', 'd', this.dic.H.length)
    if (span_rank('M') <= rank) {
      const years = Math.floor(target.M / this.dic.M.length)
      target.M = mod(target.M, this.dic.M.length)
      target.y += years
      target.u += years
    }
  }

  private unit_msec(unit: Unit) {
    switch (unit) {
      case 'year':
        return this.calc.msec.year
      case 'month':
        return this.calc.msec.month
      case 'day':
        return this.calc.msec.day
      case 'hour':
        return this.calc.msec.hour
      case 'minute':
        return this.calc.msec.minute
      case 'second':
        return this.calc.msec.second
      case 'msec':
        return 1
    }
  }

  private find_span_time(target: SpanTarget, utc: number) {
    if (target.changedRank < 0) return utc
    const month = this.find_span_month(target)
    const dayIndex =
      target.changedRank <= span_rank('M')
        ? Math.min(
            Math.max(target.d, 0),
            Math.max(0, Math.floor(month.size / this.calc.msec.day) - 1),
          )
        : target.d
    // month.last_at + dayIndex*msec.day という単純な等分割は、d/N の構築規則が
    // dusk()/dayBoundary() で置き換わっている暦では正しくない(オフセットぶん
    // ずれる、または実日没は等間隔でない)。resolve_day_start()(parse_by() の
    // 逆方向解決と同じ仕組み)を再利用する——offset=0 の通常の暦では従来と
    // 完全に同じ式になるため、既存の挙動は変えない(実測: 4暦とも
    // add()/sub() が1日早い日付を返す実バグがあったため修正)。
    const day = this.to_tempos(this.resolve_day_start(month.last_at, dayIndex)).d
    if (target.changedRank <= span_rank('d')) {
      return this.clamp_since(day, target.sourceDaySince)
    }
    const direct = this.find_span_time_in_day_direct(day, target)
    if (direct != null) return direct
    return this.find_span_time_in_day(day, target)
  }

  private find_span_time_in_day_direct(day: TempoLike, target: SpanTarget) {
    if (target.changedRank < span_rank('H')) return null
    const firstHour = this.to_tempos(day.last_at).H
    const hour = firstHour.succ(target.H)
    if (hour.now_idx !== target.H) return null

    let at = hour.last_at
    if (target.changedRank < span_rank('m'))
      return at + Math.min(Math.max(0, target.sourceHourSince), Math.max(0, hour.size - 1))

    const minuteSize = hour.size / this.dic.m.length
    if (span_rank('m') <= target.changedRank) at += target.m * (hour.size / this.dic.m.length)
    if (target.changedRank < span_rank('s'))
      return at + Math.min(Math.max(0, target.sourceMinuteSince), Math.max(0, minuteSize - 1))

    if (span_rank('s') <= target.changedRank) at += target.s * this.calc.msec.second
    if (target.changedRank < span_rank('S'))
      return (
        at + Math.min(Math.max(0, target.sourceSecondSince), Math.max(0, this.calc.msec.second - 1))
      )

    if (span_rank('S') <= target.changedRank) at += target.S
    return at
  }

  private find_span_month(target: SpanTarget) {
    const near = this.to_tempos(target.near)
    if (
      near.u.raw_now_idx === target.u &&
      near.M.now_idx === target.M &&
      near.M.is_leap === target.M_is_leap
    ) {
      return near.M
    }

    const yearStart = this.find_span_year_start(target.u, target.near)
    const nextYearStart = this.to_tempos(yearStart).u.next_at
    let cursor = yearStart
    let fallback: (TempoLike & TempoMonth) | undefined
    while (cursor < nextYearStart) {
      const month = this.to_tempos(cursor).M
      if (month.now_idx === target.M) {
        if (month.is_leap === target.M_is_leap) return month
        fallback ??= month
      }
      cursor = month.next_at
    }
    return fallback ?? this.to_tempos(yearStart).M
  }

  // 平均太陰太陽暦の parse 用。中気ベースの近似シード付近から、実際に
  // 表示上の元号年・月番号・閏月フラグが一致する月を選ぶ。
  private find_lunisolar_parse_month(
    seedAt: number,
    eraIndex: number,
    eraYear: number,
    monthIndex: number,
    isLeap: boolean,
  ) {
    let cursor = seedAt - this.calc.msec.year
    const endAt = seedAt + this.calc.msec.year
    let fallback: (TempoLike & TempoMonth) | undefined
    let guard = 0
    while (cursor < endAt && guard++ < 40) {
      const tempos = this.to_tempos(cursor)
      const month = tempos.M
      if (month.now_idx === monthIndex && month.is_leap === isLeap) {
        if (tempos.G.now_idx === eraIndex && tempos.y.now_idx === eraYear) return month
        fallback ??= month
      }
      if (month.next_at <= cursor) break
      cursor = month.next_at
    }
    return fallback ?? this.to_tempos(seedAt).M
  }

  private find_span_year_start(year: number, near: number) {
    // year/tempo.now_idx ではなく tempo.raw_now_idx で比較する。now_idx は
    // 元号ごとに1へリセットされるため、絶対値としての到達判定に使えない
    // (例: 平成31年から令和1年へ進んだだけなのに 31→1 は差分-30に見える)。
    // raw_now_idx は元号を跨いでも単調なので、この探索が正しく収束する。
    let tempo = this.to_tempos(near).u
    while (tempo.raw_now_idx < year) {
      tempo = this.to_tempos(tempo.next_at).u
    }
    while (year < tempo.raw_now_idx) {
      tempo = this.to_tempos(tempo.last_at - this.calc.msec.day).u
    }
    return tempo.last_at
  }

  private find_span_time_in_day(day: TempoLike, target: SpanTarget) {
    let from = day.last_at
    let to = day.next_at
    while (from < to) {
      const at = Math.floor((from + to) / 2)
      const comparison = this.compare_span_digits(this.to_tempos(at), target)
      if (comparison < 0) {
        from = at + 1
      } else {
        to = at
      }
    }
    const tempos = this.to_tempos(from)
    const interval = this.interval_for_rank(tempos, target.changedRank)
    return this.clamp_since(interval, this.source_since(target))
  }

  private compare_span_digits(tempos: Tempos, target: SpanTarget) {
    const rows = [
      [span_rank('H'), tempos.H.now_idx, target.H],
      [span_rank('m'), tempos.m.now_idx, target.m],
      [span_rank('s'), tempos.s.now_idx, target.s],
      [span_rank('S'), tempos.S.now_idx, target.S],
    ] as const
    for (const [rank, actual, expected] of rows) {
      if (target.changedRank < rank) break
      if (actual !== expected) return actual < expected ? -1 : 1
    }
    return 0
  }

  private interval_for_rank(tempos: Tempos, rank: number) {
    if (rank <= span_rank('H')) return tempos.H
    if (rank <= span_rank('m')) return tempos.m
    if (rank <= span_rank('s')) return tempos.s
    return tempos.S
  }

  private source_since(target: SpanTarget) {
    if (target.changedRank <= span_rank('H')) return target.sourceHourSince
    if (target.changedRank <= span_rank('m')) return target.sourceMinuteSince
    if (target.changedRank <= span_rank('s')) return target.sourceSecondSince
    return 0
  }

  private clamp_since(interval: TempoLike, since: number) {
    return interval.last_at + Math.min(Math.max(0, since), Math.max(0, interval.size - 1))
  }

  private find_range(between: FindBetween) {
    const [fromLike, toLike] = between
    const from = this.to_utc(fromLike)
    const to = this.to_utc(toLike)
    // Infinity/-Infinity は無制限範囲の指定として正規の用法(下記 find() の
    // ドキュメント例を参照)なので許容し、NaN だけを個別に弾く。from >= to
    // だけでは NaN 側の取りこぼしがあった(実測: order 既定値の 1 が向く
    // anchor(from)側だけが後段の isFinite チェックで守られており、逆側の
    // to に NaN を渡すと limit 指定時は無言で空配列を返していた)。
    if (from == null || to == null || Number.isNaN(from) || Number.isNaN(to) || from >= to) {
      throw new Error(`invalid range ${from}..${to}`)
    }
    return [from, to] as const
  }

  find(between: FindBetween, conditions: readonly FindCondition[], options: FindOptions = {}) {
    this.find_range(between)
    if (!conditions.length) {
      throw new Error('find requires conditions')
    }
    const unit = options.step ?? this.infer_find_step(conditions)
    return this.find_tempos(between, { ...options, step: unit }, (tempo) =>
      conditions.every((condition) => this.match_find_condition(tempo.last_at, condition)),
    ).map((tempo) => tempo.last_at)
  }

  find_span(
    at: DateLike,
    conditions: FindSpanCondition,
    options: FindSpanOptions = {},
  ): Span | undefined {
    const atUtc = this.to_utc(at)
    if (!Number.isFinite(atUtc)) throw new Error(`invalid timestamp ${atUtc}`)
    const normalizedConditions = Array.isArray(conditions) ? conditions : [conditions]
    if (!normalizedConditions.length) throw new Error('find_span requires conditions')

    const order = options.order ?? 1
    if (order !== -1 && order !== 0 && order !== 1) {
      throw new Error(`invalid order ${order}`)
    }
    const base = options.base ?? 'at'
    if (base !== 'at' && base !== 'match') {
      throw new Error(`invalid span base ${String(base)}`)
    }
    const step = options.step ?? this.infer_find_step(normalizedConditions)
    const current = this.to_tempos(atUtc)[step] as TempoLike | undefined
    if (!current || typeof current.next_at !== 'number' || typeof current.last_at !== 'number') {
      throw new Error(`invalid unit ${String(step)}`)
    }

    const findSide = (side: FindOrder) => {
      const range: FindBetween =
        side === 1 ? [current.next_at, Infinity] : [-Infinity, current.last_at]
      return this.find(range, normalizedConditions, { step, order: side, limit: 1 })[0]
    }
    const future = order === -1 ? undefined : findSide(1)
    const past = order === 1 ? undefined : findSide(-1)
    const match =
      order === 1
        ? future
        : order === -1
          ? past
          : future == null
            ? past
            : past == null
              ? future
              : future - atUtc <= atUtc - past
                ? future
                : past
    if (match == null) return undefined

    const target = base === 'at' ? match : atUtc
    const anchor = base === 'at' ? atUtc : match
    return this.span_obj(target, anchor) as Span
  }

  periods(between: FindBetween, options: PeriodsOptions) {
    return this.find_tempos(between, options)
  }

  private find_tempos(
    between: FindBetween,
    options: PeriodsOptions,
    accept: (tempo: TempoLike) => boolean = () => true,
  ) {
    const [from, to] = this.find_range(between)
    if (options.limit != null && (!Number.isInteger(options.limit) || options.limit < 0)) {
      throw new Error(`invalid limit ${options.limit}`)
    }
    if (!Number.isFinite(to - from) && options.limit == null) {
      throw new Error('unbounded find requires limit')
    }
    const unit = options.step
    const order = options.order ?? 1
    if (order !== 1 && order !== -1) {
      throw new Error(`invalid order ${order}`)
    }
    const limit = options.limit ?? Infinity
    const anchor = order === 1 ? from : to
    if (!Number.isFinite(anchor)) {
      throw new Error(`find requires finite anchor for order ${order}`)
    }
    const first = this.to_tempos(anchor)[unit]
    if (!first || typeof first.succ !== 'function' || typeof first.back !== 'function') {
      throw new Error(`invalid unit ${String(unit)}`)
    }

    const list: TempoLike[] = []
    if (order === 1) {
      let tempo = first
      if (tempo.last_at < from) {
        tempo = tempo.succ()
      }
      while (tempo.last_at < to && list.length < limit) {
        if (accept(tempo)) {
          list.push(tempo)
        }
        tempo = tempo.succ()
      }
    } else {
      let tempo = first
      if (to <= tempo.last_at) {
        tempo = tempo.back()
      }
      while (from <= tempo.last_at && list.length < limit) {
        if (accept(tempo)) {
          list.push(tempo)
        }
        tempo = tempo.back()
      }
    }
    return list
  }

  private infer_find_step(conditions: readonly FindCondition[]): SteppableTempoKey {
    let step: SteppableTempoKey = 'y'
    for (const condition of conditions) {
      for (const format of Object.keys(condition)) {
        const inferred = format === 'note' ? 'd' : this.infer_find_step_from_format(format)
        if (this.find_step_rank(step) < this.find_step_rank(inferred)) {
          step = inferred
        }
      }
    }
    return step
  }

  private infer_find_step_from_format(format: string): SteppableTempoKey {
    let step: SteppableTempoKey = 'y'
    const tokens = format.match(reg_token) ?? []
    for (const token of tokens) {
      const candidate = this.find_step_for_token(
        (format_token_parts(token)?.top ?? token[0]) as Token,
      )
      if (this.find_step_rank(step) < this.find_step_rank(candidate)) {
        step = candidate
      }
    }
    return step
  }

  private find_step_for_token(token: Token): SteppableTempoKey {
    const base = token_base(token)
    if (is_day_cycle_token(base) || is_calendar_note_token(base)) return 'd'
    if (is_year_cycle_token(base)) return 'y'
    switch (base) {
      case 'S':
        return 'S'
      case 's':
        return 's'
      case 'm':
        return 'm'
      case 'H':
        return 'H'
      case 'M':
      case 'N':
      case 'Q':
        return 'M'
      case 'Z':
        return 'Z'
      case 'Zz':
        return 'Zz'
      case 'd':
      case 'D':
      case 'w':
      case 'J':
        return 'd'
      default:
        return 'y'
    }
  }

  private find_step_rank(unit: SteppableTempoKey) {
    switch (unit) {
      case 'S':
        return 8
      case 's':
        return 7
      case 'm':
        return 6
      case 'H':
        return 5
      case 'd':
        return 4
      case 'Z':
        return 3.5
      case 'M':
      case 'N':
        return 3
      case 'Zz':
        return 2
      case 'y':
      default:
        return 1
    }
  }

  private span_between(
    from: number,
    to: number = Date.now(),
    { precise = false }: SpanOptions = {},
  ): SpanResult {
    if (!Number.isFinite(to - from)) {
      return this.with_span_anchor(from, to, { label: '？？？' })
    }
    if (precise) {
      const precision = precise === true ? 's' : precise
      return this.with_span_anchor(
        from,
        to,
        this.precise_span(from, to, precision),
        this.next_precise_span_at(to, precision),
      )
    }
    const fromTempos = this.to_tempos(from)
    const toTempos = this.to_tempos(to)
    if (fromTempos.m.last_at === toTempos.m.last_at) {
      const span = this.format_span_diff(this.span_diff(from, to, 's'))
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }
    if (fromTempos.H.last_at === toTempos.H.last_at) {
      const span = this.format_span_diff(this.span_diff(from, to, 'm'))
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }
    if (fromTempos.d.last_at === toTempos.d.last_at) {
      const span = this.format_span_diff(this.span_diff(from, to, 'H'))
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }

    const first = this.span_diff_entries(this.span_diff(from, to, 'd'))[0]
    if (first) {
      return this.with_span_anchor(
        from,
        to,
        this.format_span_diff({ [first.token]: first.value }),
        toTempos.d.next_at,
      )
    }
    return this.with_span_anchor(from, to, { label: '今' }, toTempos.s.next_at)
  }

  private with_span_anchor<T extends SpanResult>(
    target: number,
    at: number,
    span: T,
    next_at?: number,
  ) {
    if (Number.isFinite(next_at) && at < next_at!) {
      span.next_at = next_at
      span.timeout = next_at! - at
    }
    Object.defineProperty(span, span_anchor, {
      value: { calendar: this, at, msec: target - at } satisfies SpanAnchor,
      enumerable: false,
    })
    return span
  }

  private with_span_anchor_at(at: number, span: Span) {
    Object.defineProperty(span, span_anchor, {
      value: { calendar: this, at } satisfies SpanAnchor,
      enumerable: false,
    })
    return span
  }

  private precise_span(from: number, to: number, precision: Precision): SpanResult {
    if (this.is_addable_span_precision(precision)) {
      return this.format_span_diff(this.span_diff(from, to, precision), to < from ? '後' : '前')
    }
    return this.format_span_measure(
      precision,
      this.span_measure_value(from, to, precision),
      to < from ? '後' : '前',
    )
  }

  private is_addable_span_precision(precision: Precision): precision is SpanToken | 'Y' | 'D' {
    return precision === 'Y' || precision === 'D' || is_span_token(precision)
  }

  private next_precise_span_at(at: number, precision: Precision) {
    return this.to_tempos(at)[precision]?.next_at
  }

  private next_span_at(at: number, span: Span) {
    const token = this.span_diff_entries(span)[0]?.token
    return token ? this.to_tempos(at)[token]?.next_at : undefined
  }

  private span_diff(from: number, to: number, precision: SpanToken | 'Y' | 'D'): SpanDiff {
    const [earlier, later] = from <= to ? [from, to] : [to, from]
    const sign = from <= to ? -1 : 1
    const earlierTempos = this.to_tempos(earlier)
    const laterTempos = this.to_tempos(later)
    const rows = this.hierarchical_span_rows(precision, earlierTempos, laterTempos)
    if (!rows) throw new Error(`invalid span precision ${precision}`)
    const rank = rows.findIndex(([token]) => token === precision)
    const diffs = rows.map(([, , , start, end]) => end - start)
    for (let index = Math.min(rank, rows.length - 1); 0 < index; index--) {
      if (0 <= diffs[index] || !Number.isFinite(rows[index][5])) continue
      diffs[index] += rows[index][5]
      diffs[index - 1]--
    }
    if (precision === 'D') {
      const y = diffs[0] * sign
      const shifted = y ? this.add_span(to, { y }) : to
      const d = this.to_tempos(from).D.now_idx - this.to_tempos(shifted).D.now_idx
      return this.normalize_span_diff({ y, d })
    }
    return this.components_to_span_diff(
      rows
        .slice(0, rank + 1)
        .map(([token], index) => {
          return {
            token: token === 'Y' ? 'y' : (token as SpanToken),
            value: diffs[index] * sign,
          }
        })
        .filter(({ value }) => value),
    )
  }

  private hierarchical_span_rows(precision: Precision, earlierTempos: Tempos, laterTempos: Tempos) {
    const dayIndex = (tempos: Tempos) => tempos.d.raw_now_idx
    const monthDayCount = (tempos: Tempos) => {
      const end = Math.max(tempos.M.last_at, tempos.M.next_at - 1)
      const lastDay = this.to_tempos(end).d
      return Math.max(1, lastDay.raw_now_idx + 1)
    }
    const coreRows: [Token, Unit, string, number, number, number][] = [
      ['y', 'year', '年', earlierTempos.y.now_idx, laterTempos.y.now_idx, Infinity],
      ['M', 'month', 'ヶ月', earlierTempos.M.now_idx, laterTempos.M.now_idx, this.dic.M.length],
      [
        'd',
        'day',
        '日',
        dayIndex(earlierTempos),
        dayIndex(laterTempos),
        monthDayCount(earlierTempos),
      ],
      ['H', 'hour', '時間', earlierTempos.H.now_idx, laterTempos.H.now_idx, this.dic.H.length],
      ['m', 'minute', '分', earlierTempos.m.now_idx, laterTempos.m.now_idx, this.dic.m.length],
      ['s', 'second', '秒', earlierTempos.s.now_idx, laterTempos.s.now_idx, this.dic.s.length],
      ['S', 'msec', 'ミリ秒', earlierTempos.S.now_idx, laterTempos.S.now_idx, this.dic.S.length],
    ]
    if (is_core_precision(precision)) return coreRows
    if ('Y' === precision || 'w' === precision) {
      return [
        ['Y', 'year', '年', earlierTempos.Y.now_idx, laterTempos.Y.now_idx, Infinity],
        [
          'w',
          'day',
          '週',
          earlierTempos.w.now_idx,
          laterTempos.w.now_idx,
          Math.ceil(earlierTempos.y.size / this.calc.msec.week),
        ],
      ] as [Token, Unit, string, number, number, number][]
    }
    if ('D' === precision) {
      return [
        ['y', 'year', '年', earlierTempos.y.now_idx, laterTempos.y.now_idx, Infinity],
        [
          'D',
          'day',
          '日',
          earlierTempos.D.now_idx,
          laterTempos.D.now_idx,
          earlierTempos.y.size / this.calc.msec.day,
        ],
      ] as [Token, Unit, string, number, number, number][]
    }
    return undefined
  }

  private span_measure_value(from: number, to: number, token: SpanMeasurePrecision) {
    const base = token_base(token)
    const fromTempo = this.to_tempos(from)[base]
    const toTempo = this.to_tempos(to)[base]
    if (!fromTempo || !toTempo) return 0
    const raw = fromTempo.now_idx - toTempo.now_idx
    if (!is_year_cycle_token(base) && !is_day_cycle_token(base) && !is_calendar_note_token(base)) {
      return raw
    }
    const direction = from < to ? -1 : 1
    return direction * mod(direction * raw, this.dic[base].length)
  }

  private span_part_unit(token: Token): Unit {
    const base = token_base(token)
    if (is_year_cycle_token(base)) return 'year'
    if (is_day_cycle_token(base) || is_calendar_note_token(base)) return 'day'
    switch (base) {
      case 'y':
      case 'u':
      case 'Y':
        return 'year'
      case 'M':
      case 'N':
      case 'Q':
        return 'month'
      case 'd':
      case 'D':
      case 'w':
        return 'day'
      case 'H':
        return 'hour'
      case 'm':
        return 'minute'
      case 's':
        return 'second'
      case 'S':
      default:
        return 'msec'
    }
  }

  private span_part_fallback_unit(token: Token) {
    return this.dic.labels[token] ?? String(token)
  }

  private span_part_label(token: Token, count: number, fallbackUnit: string) {
    const indexer = this.dic[token_base(token)]
    const relatives = indexer?.relatives
    if ('string' === typeof relatives) return `${count}${relatives}`
    const label = relatives?.[count]
    return label != null ? label : `${count}${fallbackUnit}`
  }

  private span_part_ruby(token: Token, count: number, fallbackUnit: string) {
    const numberRuby = this.format_numeral_label_ruby(count, 0) || this.format_number_ruby(count, 0)
    if (!numberRuby) return undefined
    const relatives = this.dic[token_base(token)]?.relatives
    const unitLabel = 'string' === typeof relatives ? relatives : fallbackUnit
    const unitRuby = default_span_unit_ruby[unitLabel]
    return unitRuby ? `${numberRuby}${unitRuby}` : numberRuby
  }

  match_find_condition(utc: number, condition: FindCondition) {
    return Object.entries(condition).every(([format, matcher]) => {
      if (format === 'note') {
        return this.note(utc).some((note) => this.match_find_value(note, matcher))
      }
      if ('string' === typeof matcher) {
        const matched = this.match_find_token_condition(utc, format, matcher)
        if (matched != null) return matched
      }
      return this.match_find_value(this.format(utc, format), matcher)
    })
  }

  private match_find_token_condition(utc: number, format: string, matcher: string) {
    const tokens = format.match(reg_token)
    if (!tokens || tokens.length !== 1 || tokens[0] !== format) return null
    const parts = format_token_parts(format)
    if (!parts) return null
    if (!['M', 'd', 'H', 'm', 's', 'S'].includes(parts.top)) return null
    try {
      const expected = this.parse_obj(matcher, format)
      const actual = this.to_tempos(utc)[parts.top]
      const expectedIndex = expected[parts.top]
      if (actual == null || 'number' !== typeof expectedIndex) return null
      if (actual.now_idx !== expectedIndex) return false
      if (parts.top === 'M' && actual.is_leap !== !!expected.M_is_leap) return false
      return true
    } catch {
      return null
    }
  }

  match_find_value(value: string, matcher: FindMatcher) {
    if (matcher instanceof RegExp) {
      matcher.lastIndex = 0
      return matcher.test(value)
    }
    return value === matcher
  }

  private to_utc(utc: DateLike) {
    if ('number' === typeof utc) return utc
    if ('string' === typeof utc) return this.parse(utc)
    return utc.d.write_at
  }

  private to_tempos_input(utc: DateLike) {
    return this.is_tempos(utc) ? utc : this.to_tempos(this.to_utc(utc))
  }

  private is_tempos(utc: DateLike): utc is Tempos {
    return (
      !!utc &&
      'object' === typeof utc &&
      typeof (utc as Tempos).d?.last_at === 'number' &&
      typeof (utc as Tempos).M?.last_at === 'number'
    )
  }

  private is_date_range(value: DateLike | DateRange): value is DateRange {
    return Array.isArray(value) && value.length === 2
  }

  private span_args(from: DateLike | SpanOptions | undefined, options: SpanOptions) {
    if (from == null) return [Date.now(), options] as const
    if (this.is_span_options(from)) return [Date.now(), from] as const
    return [this.to_utc(from), options] as const
  }

  private is_span_options(value: DateLike | SpanOptions | undefined): value is SpanOptions {
    return !!value && 'object' === typeof value && !this.is_tempos(value as DateLike)
  }

  private is_span_text(to: DateLike, from: DateLike | SpanOptions | undefined): to is string {
    return (
      'string' === typeof to &&
      (from == null || this.is_span_options(from)) &&
      (to === '今' || /(?:前|後)$/.test(to))
    )
  }

  def_regex() {
    let A, B, C, D, E, G, H, N, Q, S, Y, Z
    let a, b, c, d, m, p, s, w, x, y
    const number = (fallback?: string) => this.number_pattern(fallback)
    ;(() => {
      A = B = C = E = G = H = N = Z = a = b = c = m = p = s = strategy
      const M = () => `(閏?${number()})`
      const u = () => `(${number('[-\\d]+')})`
      D = Q = S = Y = d = w = y = () => `(${number()})`
      const J = (x = () => `(${number('[\\d.]+')})`)
      const object = {
        A,
        B,
        C,
        D,
        E,
        G,
        H,
        J,
        M,
        N,
        Q,
        S,
        Y,
        Z,
        a,
        b,
        c,
        d,
        m,
        p,
        s,
        u,
        w,
        x,
        y,
      }
      for (const key in object) {
        const func: RegexFactory = object[key]
        const indexer: Indexer = this.dic[key]
        if (!indexer) continue
        indexer.regex = func(indexer.list)
      }
      for (const key of cycle_tokens) {
        const indexer: Indexer = this.dic[key]
        indexer.regex = strategy(indexer.list)
      }
    })()
    ;(() => {
      H = N = Q = d = m = s = strategy
      const M = (list: string[]) => {
        // list に null(ロムルス暦の暦外期間ラベルのように、一部の要素だけ
        // ラベルを持ち残りは数値表示にフォールバックさせる設計、
        // sample/locale.ts の ロムルス月ラベル 参照)が混ざる場合、
        // 正規表現全体を1パターンに畳めない(null は join で空文字列に
        // なり、意図しないマッチを生む)ため、パース用正規表現は
        // 素直に数値パターンへフォールバックする。表示(to_label)側は
        // 要素ごとに個別フォールバックできるが、パースは全体で1つの
        // パターンが要るため、この違いを許容する。
        if (list && list.length && list.every((s) => null != s)) {
          if (list.every((s) => 1 === s.length)) {
            return `(閏?[${list.join('')}])`
          }
          if (list.join) {
            return `(閏?(?:${list.join('|')}))`
          }
        }
        return `(閏?${number()})`
      }

      const object = { H, M, N, Q, Z, d, m, s }

      for (const key in object) {
        const func: RegexFactory = object[key]
        const indexer: Indexer = this.dic[key]
        if (!indexer) continue
        indexer.regex_o = func(indexer.list)
      }
      for (const key of cycle_tokens) {
        const indexer: Indexer = this.dic[key]
        indexer.regex_o = strategy(indexer.list)
      }
    })()

    function strategy(list: readonly string[]) {
      if (list && list.length) {
        if (list.every((s) => 1 === s.length)) {
          return `([${list.join('')}])`
        }
        if (list.join) {
          return `(${list.join('|')})`
        }
      }
      return `(${number()})`
    }
  }

  def_to_idx() {
    let A, a, b, B, c, C, D, d, E, H, J, m, M, N, p, Q, s, S, u, w, x, y, Y, Z
    const numeric = (s: string) => this.parse_number(s)
    const G = function (this: Indexer, s: string): number {
      const idx = this.list?.indexOf(s)
      if (-1 < idx) {
        return idx
      } else {
        return numeric(s)
      }
    }
    H =
      N =
      m =
      s =
        function (this: Indexer, s: string): number {
          const idx = this.list?.indexOf(s)
          if (-1 < idx) {
            return idx
          } else {
            return numeric(s)
          }
        }

    A =
      B =
      C =
      E =
      M =
      Z =
      a =
      b =
      c =
      d =
        function (this: Indexer, s: string): number {
          const idx = this.list?.indexOf(s)
          if (-1 < idx) {
            return idx
          } else {
            return numeric(s) - 1
          }
        }
    D = Q = p = w = (s: string): number => numeric(s) - 1
    J = S = u = x = (s: string): number => numeric(s)
    y = Y = (s: string): number => {
      const past = this.dic.G.list[0]
      if (past && s.startsWith(past)) {
        return 1 - numeric(s.slice(past.length))
      }
      if (s.startsWith('-')) {
        return -numeric(s.slice(1))
      }
      return numeric(s)
    }
    const object = {
      A,
      B,
      C,
      D,
      E,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      Y,
      Z,
      a,
      b,
      c,
      d,
      m,
      p,
      s,
      u,
      w,
      x,
      y,
    }
    for (let key in object) {
      const val: IndexFactory = object[key]
      const indexer: Indexer = this.dic[key]
      if (!indexer) continue
      indexer.to_idx = val
    }
    for (const key of cycle_tokens) {
      const indexer: Indexer = this.dic[key]
      indexer.to_idx = A
    }
  }

  def_to_label() {
    let A, B, C, E, N, Q, S, Y, Z
    let a, b, c, d, m, p, s, u, w, x, y
    const integer = (idx: number): LabelFactory => {
      return (_, val, size: number) => this.format_number(val.now_idx + idx, size)
    }

    function at(cb: LabelFactory): LabelFactory {
      return function (list, val, size) {
        if (list) {
          if (val.now_idx != null) {
            const s = list[val.now_idx]
            if (s != null) {
              return s
            }
          }
        }
        return cb(list, val, size)
      }
    }

    function month(cb: LabelFactory, leap = '閏'): LabelFactory {
      return (list, val, size) => `${val.is_leap ? leap : ''}${cb(list, val, size)}`
    }

    const float: LabelFactory = (__, val, size) => {
      const num = Math.trunc(val.now_idx)
      const sub = `${val.now_idx % 1}`.slice(1)
      return this.format_number(num, size) + sub
    }

    const G = (__, val) => val.label
    // M(月、サフィックスなし=to_value)は常に数値のまま(list を見ない)。
    // 一見 at() 経由にして list(月名/暦外ラベル)を反映させたくなるが、
    // 既存の暦定義の多くは .lang() を呼ばずデフォルトの format
    // ('Gy年M月d日(E)' 等、M の直後にリテラル「月」が続く)を
    // そのまま使っており、M が数値ではなく list の月名文字列を返すように
    // なると、その月名の直後に元のリテラル「月」がそのまま残ってしまい
    // 「霧月月1日」のような重複表示になる不具合が実際に起きた
    // (フランス革命暦のデフォルト format で実測、table-spec.js の
    // スナップショットで発覚)。list を使った月名/暦外ラベル表示は
    // 引き続き Mo(to_label、at() 経由)側だけの役割とし、month_divs の
    // null(暦外期間)を持つ暦を新規に定義する場合は、この Mo を使う
    // ように .lang() で明示的に format/parse を設定する
    // (calendars.ts の Romulus 定義参照)。
    let M = month(integer(1))
    let H = (N = m = s = S = Y = u = y = integer(0))
    const D = (Q = d = p = w = integer(1))
    const J = (x = float)
    A = B = C = E = Z = a = b = c = at(integer(1))
    const object = {
      A,
      B,
      C,
      D,
      E,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      Y,
      Z,
      a,
      b,
      c,
      d,
      m,
      p,
      s,
      u,
      w,
      x,
      y,
    }
    for (const key in object) {
      const val: LabelFactory = object[key]
      const indexer: Indexer = this.dic[key]
      if (!indexer) continue
      indexer.to_value = val
    }
    for (const key of cycle_tokens) {
      const indexer: Indexer = this.dic[key]
      indexer.to_value = at(integer(1))
    }

    M = month(at(integer(1)))
    H = N = m = s = at(integer(0))
    A = B = C = E = Q = Z = a = b = c = d = at(integer(1))
    const object1 = { A, B, C, E, H, M, N, Q, Z, a, b, c, d, m, s }
    for (const key in object1) {
      const val: LabelFactory = object1[key]
      const indexer: Indexer = this.dic[key]
      if (!indexer) continue
      indexer.to_label = val
    }
    for (const key of cycle_tokens) {
      const indexer: Indexer = this.dic[key]
      indexer.to_label = at(integer(1))
    }

    const cut = () => ''
    M = month(at(cut), 'うるう')
    A = B = C = E = H = N = Q = Z = a = b = c = d = m = s = at(cut)
    const object2 = { A, B, C, E, H, M, N, Q, Z, a, b, c, d, m, s }
    for (const key in object2) {
      const val: LabelFactory = object2[key]
      const indexer: Indexer = this.dic[key]
      if (!indexer) continue
      indexer.to_ruby = val
    }
    for (const key of cycle_tokens) {
      const indexer: Indexer = this.dic[key]
      indexer.to_ruby = at(cut)
    }

    // y(年)は object/object1/object2 の対象に含めていない(list/rubys の
    // 静的配列が現実的でない無界の数値トークンのため)。'o'/'r' サフィックス
    // (yo/yr)は numeral_label()/numeral_label_ruby() 経由で「漢字表現」
    // 「ふりがな表現」を bare の y(numeral()の挙動のまま)とは独立に
    // 指定できるようにする。
    this.dic.y.to_label = (_list, val, size) => this.format_numeral_label(val.now_idx, size)
    this.dic.y.to_ruby = (_list, val, size) => this.format_numeral_label_ruby(val.now_idx, size)
  }

  private week_cycle_token(): WeekCycleToken {
    const tokens = this.dic.start?.[1]?.match(reg_token) ?? []
    const choices: WeekCycleToken[] = ['dC8', 'dC10', 'dC7']
    for (const choice of choices) {
      if (tokens.some((token) => format_token_parts(token)?.top === choice)) return choice
    }
    for (const choice of choices) {
      if (this.dic.E === this.dic[choice]) return choice
    }
    return 'dC7'
  }

  def_calc() {
    const season = sub_define(this.calc.msec.year, this.dic.Z.length)
    const month = daily_measure(this.calc.msec.year / this.dic.M.length, this.calc.msec.day)
    const weekCycle = this.week_cycle_token()
    const week = daily_define(this.dic[weekCycle].length * this.calc.msec.day, this.calc.msec.day)

    const hour = sub_define(this.calc.msec.day, this.dic.H.length)
    const minute = sub_define(hour.msec, this.dic.m.length)
    const second = sub_define(minute.msec, this.dic.s.length)
    const msec = sub_define(second.msec, second.msec)
    calc_set.call(this, 'range', { season, month, week, hour, minute, second, msec })
    calc_set.call(this, 'msec', { season, month, week, hour, minute, second, msec })
  }

  def_eras() {
    const zero = this.calc.zero.era
    const list: number[] = []
    for (let idx = 0; idx < this.dic.eras.length; idx++) {
      const [title, msec] = this.dic.eras[idx]
      const { u } = this.to_tempos(msec)
      this.calc.eras.push([title, msec, u.now_idx])
      list.push(msec - zero)
    }
    list.push(Infinity)
    this.table.msec.era = list
  }

  def_year_table() {
    const { range, msec } = this.table
    const { day } = this.calc.msec
    const leaps = [...this.dic.leaps]
    let period = leaps.pop()

    if (period) {
      const yearPolicy = new PeriodicCalendarYearPolicy(leaps, period, this.dic.leap_shift || 0)
      range.year = []
      for (let idx = 0; idx < period; idx++) {
        const layout = yearPolicy.resolve(idx, {
          normalLengthDays: this.calc.range.year[0],
          leapLengthDays: this.calc.range.year[1],
        })
        range.year.push(layout.lengthDays)
      }
    } else {
      range.year = [this.calc.range.year[0]]
    }

    msec.year = upto(range.year)
    period = msec.year[msec.year.length - 1]
    calc_set.call(this, 'msec', { period: daily_define(period, day) })

    function upto(src) {
      let x = 0
      return src.map((i) => (x += i * day))
    }
  }

  def_month_table() {
    const { range, msec } = this.table
    const { day } = this.calc.msec

    const years = this.calc.range.year
    let { month_divs } = this.dic

    // auto month table.
    if (!month_divs) {
      month_divs = []
      for (let idx = 0; idx < this.dic.M.length; idx++) {
        month_divs.push(this.calc.range.month[1 - (idx % 2)])
      }
      month_divs[1] = null as any
    }

    let month_sum = 0
    for (let i of month_divs) {
      month_sum += i
    }

    range.month = {}
    for (const size of years) {
      const a = Array.from(month_divs)
      const idx = month_divs.indexOf(null as any)
      a[idx] = size - month_sum
      range.month[size] = a
    }

    msec.month = {}
    for (const size of years) {
      const year_size = Math.floor(day * size)
      msec.month[year_size] = upto(range.month[size])
    }

    function upto(src: number[]) {
      let x = 0
      return src.map((i) => (x += i * day))
    }
  }

  def_table() {
    this.table = {
      range: {},
      msec: {},
    } as any

    if (this.is_table_month) {
      this.def_month_table()
    }

    if (this.is_table_leap) {
      this.def_year_table()
    }
  }

  def_idx() {
    let period = NaN
    if (this.is_table_leap) {
      period = this.dic.leaps[this.dic.leaps.length - 1]
      this.dic.p.length = period || 1
    }

    const o = this.index(...this.dic.start)
    const parsedTokens = new Set(
      (this.dic.start?.[1]?.match(reg_token) ?? []).map((token) => format_token_parts(token)?.top),
    )
    if (parsedTokens.has('u') && !parsedTokens.has('y')) {
      o.y = o.u
    }
    o.Z = (this.dic.Z.length * 1) / 8
    const year = (period || 0) * o.p + o.y
    const yearCycleZeros: Partial<Record<ZERO_CALC, number>> = {}
    for (const token of year_cycle_tokens) {
      yearCycleZeros[year_cycle_zero_keys[token]] = year - o[token]
    }
    Object.assign(this.calc.zero, yearCycleZeros)
    Object.assign(this.calc.idx, o)
  }

  def_zero() {
    const zero_size = (idx_path: ALL_DIC, path: MSEC_CALC) => {
      return 0 - this.calc.idx[idx_path] * this.calc.msec[path]
    }

    const timezone =
      (this.calc.msec.day * (this.dic.geo[2] != null ? this.dic.geo[2] : this.dic.geo[1])) / 360
    // x(タイムゾーン表示)は now_idx にタイムゾーンのオフセット(ms)を
    // そのまま載せるだけの、暦座標としては意味を持たない静的な値。
    // succ()/back() する意味がないため、素の Tempo(this.dic.x.tempo は
    // 以前 Tempo 型だった)ではなく TempoLabelLike にしておく
    // (以前は素の Tempo だったため succ() が Tempo.slide() の式で
    // 意味のない値を返せてしまっていた)。center_at はこの直後でのみ
    // 必要なので、TempoLabelLike には含めずここで直接計算する。
    const rawX = to_tempo_bare(this.calc.msec.hour, -0.5 * this.calc.msec.hour, timezone)
    this.dic.x.tempo = cyclic_label(envelope_of(rawX), timezone)
    const x_center_at = rawX.center_at

    const start_at = this.dic.start[2]
    const zero = start_at - x_center_at

    const second = zero + zero_size('s', 'second')
    const minute = second + zero_size('m', 'minute')
    const hour = minute + zero_size('H', 'hour')
    const day = hour + zero_size('d', 'day')

    let moon = NaN
    let year = NaN
    let springNear = NaN
    let month = NaN
    let period = NaN

    if (this.is_table_leap) {
      const year_size = Math.floor(this.calc.msec.day * this.table.range.year[this.calc.idx.y])
      month = day - (this.table.msec.month[year_size][this.calc.idx.M - 1] || 0)
      year = month - (this.table.msec.year[this.calc.idx.y - 1] || 0)
      springNear = year
      period = year + zero_size('p', 'period')
    } else {
      if (this.is_table_month) {
        month = day - (Object.values(this.table.msec.month)[0][this.calc.idx.M - 1] || 0)
      } else {
        month = day + zero_size('M', 'moon')
      }
      springNear = month + zero_size('y', 'year')

      // 平均太陰太陽暦の月番号は中気から割り当てる暦上のラベルで、
      // 朔望月の単純な通し番号ではない。年 zero に month offset まで
      // 混ぜると、満月基準のプールニマンタのような月相シフト暦で
      // anchor の月日を表示値に合わせた途端、年が1つ進んでしまう。
      year = day + zero_size('y', 'year')
    }

    // 単純のため平気法。
    const sunny_epoch = this.dic.sunny.epochMsec
    const 啓蟄 = sunny_epoch - (1 / 6 - 1 / 8) * this.dic.Z.length * this.calc.msec.season
    let { last_at } = to_tempo_bare(this.calc.msec.year, 啓蟄, period || springNear)
    // SeasonTable は month_divs で年内の月配置を明示する暦なので、年初は
    // calendar() の anchor から逆算した year を使う。ここを太陽年境界へ
    // 丸め直すと、Romulus のように anchor 月日が1日ずれる。
    const spring = this.is_table_month && !this.is_table_leap ? year : last_at

    const 立春 = sunny_epoch + zero_size('Z', 'season')
    ;({ last_at } = to_tempo_bare(this.calc.msec.year, 立春, period || year))
    const season = last_at

    // 元号
    let era = this.dic.eras[0]?.[1] || Infinity
    this.calc.eras = []
    const era_tgt = this.is_table_leap
      ? period + this.table.msec.year[0]
      : season + this.calc.msec.year

    if (era_tgt < era) {
      era = era_tgt
      this.calc.eras = [[this.dic.era, era, 1]]
    }

    if (this.dic.moony) {
      moon = this.dic.moony.epochMsec
    }

    // JD
    const day_utc = day + x_center_at
    const cjd = to_tempo_bare(this.calc.msec.day, day, -210866803200000).center_at
    const jd = to_tempo_bare(this.calc.msec.day, day_utc, -210866803200000).center_at // -2440587.5 * 86400000
    const ld = to_tempo_bare(this.calc.msec.day, day_utc, -12219379200000).last_at //  -141428   * 86400000
    const mjd = to_tempo_bare(this.calc.msec.day, day_utc, -3506716800000).last_at //   -40587   * 86400000

    // 干支、九星、週
    // E/dC60/dC12/dC10/dC28 はいずれも d(暦日)とは別の、独立した日次巡回トークン
    // なので、それぞれ自分自身の idx(anchor でのその token の値)だけを
    // 差し引いてゼロ点を求める必要がある。d で既に -idx.d 日ぶんシフト
    // 済みの `day` を起点にすると、d のシフト分が二重に効いてしまい
    // (実測: 定気法で `format(anchor_epoch, ...)` の A が idx.d + idx.A
    // 日ぶんずれた値になっていた)、anchor 自身の epoch を format() した
    // 結果が anchor 文字列と一致しなくなる。d のシフトを含まない `hour`
    // (anchor 実日の日付境界 = H-index 0 の位置)を起点にする。
    const dayCycleZeros: Partial<Record<ZERO_CALC, number>> = {}
    for (const token of day_cycle_tokens) {
      const zeroKey = day_cycle_zero_keys[token]
      if (zeroKey === 'week') continue
      dayCycleZeros[zeroKey] = hour + zero_size(token, 'day')
    }
    const week = hour + zero_size(this.week_cycle_token(), 'day')
    Object.assign(this.calc.zero, {
      period,
      era,
      week,
      season,
      spring,
      moon,
      day,
      jd,
      ld,
      mjd,
      cjd,
      ...dayCycleZeros,
    })
  }

  precision() {
    const is_just = (x: number, n: number) => n === Math.floor(n / x) * x
    const gaps = [this.calc.msec.year / this.calc.msec.day - this.calc.range.year[0]]
    if (this.dic.leaps) {
      for (let idx = 0; idx < this.dic.leaps.length; idx++) {
        const v = this.dic.leaps[idx]
        let gap = gaps[gaps.length - 1]
        if (idx & 1) {
          gap += 1 / v
        } else {
          gap -= 1 / v
        }
        gaps.push(gap)
      }
    }
    return {
      strategy: this.strategy,
      year: [[this.dic.M.length], this.calc.range.month],
      day: [this.calc.range.hour, this.calc.range.minute, this.calc.range.second],
      leap: gaps.map((i) => parseInt((1 / i) as any)),
      is_legal_solor: is_just(4, this.dic.H.length),
      is_legal_eto:
        is_just(this.dic.yCS.length, this.dic.yC.length) &&
        is_just(this.dic.yCB.length, this.dic.yC.length),
      is_legal_ETO:
        is_just(this.dic.dCS.length, this.dic.dC.length) &&
        is_just(this.dic.dCB.length, this.dic.dC.length),
    }
  }

  /*
http://bakamoto.sakura.ne.jp/buturi/2hinode.pdf
ベクトルで
a1 = e1 * cos(lat/360) + e3 * sin(lat/360)
a2 = e3 * cos(lat/360) - e1 * sin(lat/360)
T = (赤緯, 時角)->
  a1 * sin(赤緯) + cos(赤緯) * (a2 * cos(時角) - e2 * sin(時角))
T = ( lat, 赤緯, 時角 )->
  e1 * ( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) +
  e2 * (-cos(赤緯) * sin(時角)) +
  e3 * ( sin(lat/360) * sin(赤緯) + cos(lat/360) * cos(赤緯) * cos(時角) )

K   = @dic.earthy[2] / 360
高度 = -50/60
時角 = ( lat, 高度, 赤緯 )->
  acos(( sin(高度) - sin(lat/360) * sin(赤緯) ) / cos(lat/360) * cos(赤緯) )
方向 = ( lat, 高度, 赤緯, 時角 )->
  acos(( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) / cos(高度) )
季節 = 春分点からの移動角度
赤緯 = asin( sin(K) * sin(季節) )
赤経 = atan( tan(季節) * cos(K) )
南中時刻 = ->
  正午 + 時角 + ( 赤経 - 季節 ) + 平均値 + timezone
日の出 = ->
  南中時刻 - 時角
日の入 = ->
  南中時刻 + 時角
*/

  // day/solarNoon をデフォルト引数の式(呼び出し時、関数本体より先に評価される)
  // で計算していたため、本体先頭に Number.isFinite ガードを書いても utc が
  // NaN の場合はガードより先に to_tempo_bare(...)/noon(utc) が NaN のまま
  // 実行されてしまい、無意味だった(実測: solor(NaN)/lunar(NaN) は例外にも
  // ならず、日の出・月の出が null(NaN)、K/lat/高度 等は一見有効そうな数値
  // のまま返ってきた)。デフォルト引数を省略可能な仮引数に変え、本体先頭で
  // utc を検証してから day を算出する形に直した。
  noon(utc: number, day?: TempoLike) {
    if (!Number.isFinite(utc)) throw new Error(`invalid timestamp ${utc}`)
    day ??= to_tempo_bare(this.calc.msec.day, this.calc.zero.day, utc)
    return resolveNoon(
      this.dic.sunny,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.msec.year,
      this.calc.zero.season,
      utc,
      day,
    )
  }

  solor(utc: number, idx = 2, solarNoon = this.noon(utc)) {
    return resolveSolor(
      this.dic.sunny,
      this.dic.earthy,
      this.dic.geo,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.msec.year,
      this.calc.zero.season,
      utc,
      idx,
      solarNoon,
    )
  }

  lunar(utc: number, day?: TempoLike) {
    if (!Number.isFinite(utc)) throw new Error(`invalid timestamp ${utc}`)
    if (!hasLunarEvents(this.dic.moony)) {
      throw new Error('lunar requires a satellite orbital model with lunarEvents')
    }
    day ??= to_tempo_bare(this.calc.msec.day, this.calc.zero.day, utc)
    return this.dic.moony.lunarEvents(utc, {
      latitudeDeg: this.dic.geo[0],
      longitudeDeg: this.dic.geo[1],
      timezoneDeg: this.dic.geo[2],
      dayStartUtc: day.last_at,
    })
  }

  lunar_apsis(kind: LunarApsisKind, near: number) {
    if (!hasLunarOrbitEvents(this.dic.moony)) {
      throw new Error('lunar_apsis requires a satellite orbital model with lunarApsis')
    }
    return this.dic.moony.lunarApsis(kind, near)
  }

  lunar_node(kind: LunarNodeKind, near: number) {
    if (!hasLunarOrbitEvents(this.dic.moony)) {
      throw new Error('lunar_node requires a satellite orbital model with lunarNode')
    }
    return this.dic.moony.lunarNode(kind, near)
  }

  節句(_utc: number, _tempos = this.to_tempos(_utc)) {
    // M,d,B,E
    return {
      カトリック: {
        万聖節: [11, 1],
        万霊節: [11, 2],
      },
      節句: {
        人日: [1, 7],
        初午: [2, , 7],
        上巳: [3, 3],
        端午: [5, 5],
        七夕: [7, 7],
        重陽: [9, 9],
      },
      仏教: {
        灌仏会: [4, 8],
        盂蘭盆会: [7, 15],
      },
      風習: {
        小正月: [1, 15],
        十五夜: [8, 15],
        十三夜: [9, 13],
        七五三: [11, 15],
        正月事始め: [12, 13],
      },
    }
  }

  雑節(utc: number, { Zz, d } = this.to_tempos(utc)) {
    if (hasSolarEvents(this.dic.sunny)) return this.雑節_by_phase(utc)
    return with_seasonal_note_labels(
      resolve雑節ByMean(Zz, d, this.calc.msec.day, this.calc.zero.day10, this.dic.dCS.length),
      default_zassetsu_note_labels,
    )
  }

  雑節_by_phase(utc: number) {
    return with_seasonal_note_labels(
      resolve雑節ByPhase(
        this.dic.sunny,
        this.calc.msec.day,
        this.calc.zero.day,
        this.calc.zero.day10,
        this.dic.dCS.length,
        utc,
      ),
      default_zassetsu_note_labels,
    )
  }

  to_tempo_by_solor(utc: number, day) {
    return resolveTempoBySolor(
      this.dic.sunny,
      this.dic.earthy,
      this.dic.geo,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.msec.year,
      this.calc.zero.season,
      this.dic.H.length,
      utc,
      day,
    )
  }

  /**
   * 実軌道(sunny.timeOfPhase)による二十四節気の解決(定気法)。
   * calc.idx.Z = dic.Z.length/8 という既存の zero 設計により、
   * 等角分割の Z.now_idx は解析的な sekkiPhase*dic.Z.length から
   * 常に 1/8 だけずれる。この 1/8 を referencePhaseOffset に使うことで、
   * 実軌道版でも等角版と同じ now_idx 番号(=同じラベル)を維持できる
   * (実測で検証済み: 立春/立夏/夏至/立秋/秋分/立冬/冬至/次立春が一致)。
   *
   * OrbitalPhaseTempoRule.at() は境界探索で確定した idx(0..length-1 に
   * 収まるラベル整合な値)をそのまま now_idx として返すため、ここでの
   * 再計算は不要で、TempoView.at() でそのまま包める
   * (以前はここで now_idx を都度再計算し、素の Tempo にしていた)。
   */
  private resolve_orbital_season(utc: number): Tempo<TempoBase> {
    return Tempo.at(this.orbital_season_rule(), { write_at: utc })
  }

  /**
   * resolve_orbital_season() で使う OrbitalPhaseTempoRule を CachedTempoRule
   * で包んで使い回す(D: TempoEnvelope キャッシュ)。実軌道の位相探索は
   * 反復計算を伴うため、season(24節気で約15日幅)の範囲内で write_at を
   * 繰り返し問い合わせる場合(to_table() の日次走査など)、2回目以降は
   * 実際の探索を経ずに直近の envelope を再利用できる。
   */
  private orbital_season_rule(): CachedTempoRule<TempoBase> {
    return (this._orbital_season_rule ??= new CachedTempoRule(
      new OrbitalPhaseTempoRule(this.dic.sunny, this.dic.Z.length, 1 / 8),
    ))
  }

  /**
   * H(不定時法)で使う SolarDayHourTempoRule を使い回す(D: TempoEnvelope
   * キャッシュ)。この規則自身は日単位の時刻テーブルを内部キャッシュしない
   * (noon() の均時差相当の補正が write_at そのものに依存し、同日内でも
   * 時刻によって最大13秒程度ずれるため、日単位キャッシュは不採用。
   * SolarDayHourTempoRule 自身のdocコメント参照)。ただし同じ日の中で
   * slide()(succ()/back())するだけなら、envelope.table(直前に解決した
   * その日のテーブル)をそのまま使い回して再計算を避ける。CachedTempoRule
   * でも包むことで、同じ時刻(1時間内)への再問い合わせを at() レベルで
   * テーブル再構築ごと省略できる。
   */
  private solar_hour_rule(): CachedTempoRule<SolarDayHourBase> {
    return (this._solar_hour_rule ??= new CachedTempoRule(
      new SolarDayHourTempoRule(
        this.dic.sunny,
        this.dic.earthy,
        this.dic.geo,
        this.calc.msec.day,
        this.calc.zero.day,
        this.calc.msec.year,
        this.calc.zero.season,
        this.dic.H.length,
      ),
    ))
  }

  private day_start_event(): SolarDayBoundaryEvent | undefined {
    const dayStart = this.dic.day_start
    if (dayStart === 'sunrise' || dayStart === 'sunset') return dayStart
    if (this.dic.is_dusk) return 'sunset'
    return undefined
  }

  private current_day_start(): DayStart {
    return this.day_start_event() ?? 'midnight'
  }

  /**
   * d/N(dayStart() による太陽イベント起点の暦日)で使う SolarEventDayTempoRule を
   * 使い回す(D: TempoEnvelope キャッシュ)。solar_hour_rule() と同様、
   * 日をまたぐ遷移だけ天文計算(日の出/日の入探索)のやり直しが必要になる。
   * 束探索の起点(仮の civil day)には calc.zero.day(dusk() の有無に
   * 関わらず常にオフセット無しの実時計基準)を使う。
   *
   * この規則インスタンスは d(実際の暦日)と N(mean太陰太陽暦の月相内日、
   * is_table_leap/is_table_month な暦では d とは無関係の補助トークン)の
   * 両方から共有されうる。CachedTempoRule の cacheKey に parent.last_at を
   * 渡し、同じ write_at でも月の親境界が違う場合はキャッシュを共有しない。
   * 以前は write_at の範囲だけでヒット判定していたため、異なる parent で
   * 呼ばれるとキャッシュ済みの誤った now_idx を返す実バグがあった。
   */
  private solar_event_day_core_rule(): SolarEventDayTempoRule {
    const event = this.day_start_event()
    if (!event) throw new Error('dayStart() is not configured for a solar event')
    return (this._solar_event_day_core_rule ??= new SolarEventDayTempoRule(
      this.dic.sunny,
      this.dic.earthy,
      this.dic.geo,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.msec.year,
      this.calc.zero.season,
      event,
    ))
  }

  private solar_event_day_rule(): CachedTempoRule<SubdivideBase> {
    return (this._solar_event_day_rule ??= new CachedTempoRule(
      this.solar_event_day_core_rule(),
      (base) => base.parent.last_at,
    ))
  }

  private align_day_start_month_start(rawStart: number): number {
    return this.solar_event_day_core_rule().boundary_at_or_after(rawStart)
  }

  private month_rule<Base extends TempoBase>(rule: TempoRule<Base>): TempoRule<Base> {
    return this.day_start_event()
      ? new StartAlignedTempoRule(rule, (rawStart) => this.align_day_start_month_start(rawStart))
      : rule
  }

  private year_rule<Base extends TempoBase>(rule: TempoRule<Base>): TempoRule<Base> {
    return this.day_start_event()
      ? new StartAlignedTempoRule(rule, (rawStart) => this.align_day_start_month_start(rawStart))
      : rule
  }

  // d/N(月内日)を組み立てる規則を dusk()/dayBoundary() の有無で切り替える。
  private day_rule(): TempoRule<SubdivideBase> {
    if (this.day_start_event()) return this.solar_event_day_rule()
    const offset = this.dic.day_offset_hours
      ? (this.dic.day_offset_hours / 24) * this.calc.msec.day
      : 0
    return new SubdivideTempoRule(this.calc.msec.day, offset)
  }

  private fixed_tempo(size: number, zero: number, write_at: number): Tempo<TempoBase> {
    return Tempo.at(new FixedTempoRule(size, zero), { write_at })
  }

  private subdivide_tempo(
    size: number,
    write_at: number,
    parent: TempoEnvelope,
    offset = 0,
  ): Tempo<SubdivideBase> {
    return Tempo.at(new SubdivideTempoRule(size, offset), { write_at, parent })
  }

  private assign_day_tempo(day: Tempo<SubdivideBase>): Tempo<SubdivideBase> {
    const assignment = this.dic.assignments.d
    if (!assignment) return day
    const rule = new AssignedTempoRule(day.rule, 'd', this, assignment, () =>
      this.current_day_start(),
    )
    return new Tempo(rule.assign(envelope_of(day), day.base), day.base, rule)
  }

  note(
    utc: number,
    tempos = this.to_tempos(utc),
    arg1 = this.雑節(utc, tempos),
    arg2 = this.節句(utc, tempos),
  ) {
    const list: string[] = []
    for (const provider of this.note_providers(arg1, arg2)) {
      list.push(...provider(utc, tempos))
    }
    return list
  }

  private note_providers(
    seasonalNotes: SeasonalNoteMap,
    dateNoteGroups: DateNoteGroups,
  ): NoteProvider[] {
    return [
      (_utc, tempos) => this.seasonal_note_labels(seasonalNotes, tempos),
      (_utc, tempos) => this.date_note_labels(dateNoteGroups, tempos),
    ]
  }

  private seasonal_note_labels(notes: SeasonalNoteMap, tempos: Tempos) {
    const list: string[] = []
    const labels = notes[seasonal_note_label_map]
    for (const name in notes) {
      const note = notes[name]
      if (note.is_cover(tempos.d.center_at)) {
        list.push(labels?.[name] ?? name)
      }
    }
    return list
  }

  private date_note_labels(groups: DateNoteGroups, tempos: Tempos) {
    const list: string[] = []
    for (const root in groups) {
      const group = groups[root]
      for (const name in group) {
        const [M, d, B, E] = group[name]
        if (M && M !== tempos.M.now_idx) continue
        if (d && d !== tempos.d.now_idx) continue
        if (B && B !== tempos.B.now_idx) continue
        if (E && E !== tempos.E.now_idx) continue
        list.push(name)
      }
    }
    return list
  }

  to_tempos(utc: number): Tempos {
    let d: Tempo<SubdivideBase>,
      H: TempoLike,
      m: Tempo<SubdivideBase>,
      M: Tempo<TempoBase> & TempoMonth,
      p: Tempo<TempoBase> | undefined,
      u: Tempo<TempoBase>
    // utc == null だけでは NaN(typeof は number なので通り抜ける)を弾けず、
    // 不正な入力が lunisolar() 等の内部探索まで届いてから「failed to
    // resolve lunisolar month」のような無関係な例外で発覚し、原因追跡が
    // 難しくなっていた(実測: 月の出のない日に moon.月の出 が NaN になり、
    // それをそのまま format() へ渡した呼び出し側でこの経路を踏んだ)。
    // 呼び出し側の入力ミスをここで即座に切り分けられるよう、有限数以外は
    // すべて弾く。
    if (!Number.isFinite(utc)) throw new Error(`invalid timestamp ${utc}`)

    const J = this.fixed_tempo(this.calc.msec.day, this.calc.zero.jd, utc) // ユリウス日

    // season in year_of_planet
    const Zz = this.fixed_tempo(this.calc.msec.year, this.calc.zero.season, utc) // 太陽年
    // 実軌道(sunny.timeOfPhase)を持つ場合は定気法(実際の黄経)で二十四節気を解決する。
    // そうでなければ従来通り平気法(等角分割、SubdivideTempoRule)のまま。
    const usesOrbitalSeasons = hasSolarEvents(this.dic.sunny)
    const seasonRule = new SubdivideTempoRule(this.calc.msec.season)
    const ZzEnvelope = envelope_of(Zz)
    const resolve_season = (at: number) =>
      usesOrbitalSeasons
        ? this.resolve_orbital_season(at)
        : Tempo.at(seasonRule, { write_at: at, parent: ZzEnvelope })
    const Z = resolve_season(utc) // 太陽年の二十四節気

    let N: Tempo<SubdivideBase> | undefined
    let Nn: (Tempo<TempoBase> & TempoMonth) | undefined
    const moon_msec = this.calc.msec.moon
    const usesThaiOfficialLunisolar =
      !this.is_table_month && this.dic.thai_official_lunisolar === true
    const usesObservedLunisolar =
      !this.is_table_month &&
      !usesThaiOfficialLunisolar &&
      this.dic.moony != null &&
      (this.dic.observed_lunisolar ||
        (hasSolarEvents(this.dic.sunny) && hasLunarEvents(this.dic.moony)))
    if (
      this.dic.moony &&
      moon_msec != null &&
      !usesObservedLunisolar &&
      !usesThaiOfficialLunisolar
    ) {
      // 今月と中気(平均朔望月+日境界切り詰め+閏月判定 = MeanLunisolarMonthRule)。
      // 閏月判定・月番号は、Z 本体と同じ基準(実軌道 or 平気法)の
      // resolve_season を規則へ注入して内部で解決する。ここだけ等角の
      // ままだと、hasSolarEvents(sunny) な暦で Tempos.Z は実軌道なのに
      // 閏月判定は平気法のまま、という内部矛盾が起きる(実測: 40年間で
      // 閏月判定23ヶ月/496ヶ月、月番号29ヶ月が食い違うため「差が小さく
      // 無視できる」とは言えないと判明した)。
      // now_idx(年内月番号、閏月では前月と同じ)込みで規則が直接返すため
      // TempoView に載せられる(以前は素の Tempo に now_idx を上書きして
      // おり、succ() が Tempo.slide() の「今の月の実サイズを固定長とみなす」
      // 式を使うことで、朔望月の実サイズの月ごとの変動により稀に「次の月の
      // 途中」までしか進まず、to_table() の年間/月間表で同じ月が2回出力
      // される不具合があった)。
      Nn = Tempo.at(
        new MeanLunisolarMonthRule(
          moon_msec,
          this.calc.zero.moon,
          this.calc.msec.day,
          this.calc.zero.day,
          this.dic.Z.length,
          resolve_season,
        ),
        { write_at: utc },
      ) as Tempo<TempoBase> & TempoMonth
      // N はこの時点では常に「月相(朔望月内日)」という d とは独立の意味を
      // 持つ。is_table_leap/is_table_month な暦(M/d は TableTempoRule 系で
      // 別途構築される)では N はあくまで補助的な月相トークンのままなので
      // dusk() を適用しない。is_table_leap でも is_table_month でもない
      // (=最終的に d = N として使われる)場合のみ、N 自身が暦日境界を
      // 表すため dusk() を適用する。
      N = Tempo.at(
        this.is_table_month ? new SubdivideTempoRule(this.calc.msec.day) : this.day_rule(),
        { write_at: utc, parent: envelope_of(Nn) },
      )
    }

    if (this.is_table_leap) {
      p = this.fixed_tempo(this.calc.msec.period, this.calc.zero.period, utc)
      // table.msec.year は def_year_table() で dic.leaps の最後の要素
      // (period)個ぴったりに作られ、dic.p.length も同じ period から
      // 設定される(常に table.msec.year.length === dic.p.length)。
      // そのため TableTempoRule 自身の table_idx による周期またぎ処理
      // (1周期を越えた分は table[length-1]*table_idx で加算する、既存
      // TableTempoRule のドキュメント参照)だけで絶対年が正しく求まり、
      // p.last_at(1周期分だけ再基準化した zero)を使う必要がない。
      // 以前は p.last_at を zero にした上で
      // `u.now_idx += p.now_idx * this.dic.p.length` により絶対年へ
      // 事後変換していたが、TableTempoRule の zero(p.last_at、周期ローカル)
      // と外部で書き換えた now_idx(絶対年)が食い違い、succ()/back()
      // (Tempo.slide() ではなく TableTempoRule.slide() 経由)が
      // 周期をまたぐ年(実質「西暦400年以降の全て」)で全く違う年へ
      // 飛ぶ実バグがあった(実測: Gregorian 2020年→succ()が「4021年」
      // 相当の位置に飛び、find([...],[{y:'2021'}],{step:'y'}) が
      // 該当年を1件も見つけられなかった)。zero を絶対原点
      // (calc.zero.period)に統一することで、この食い違いごと解消する。
      const yearRule = new TableTempoRule(this.table.msec.year, this.calc.zero.period)
      const rawYear = yearRule.at(utc)
      // 表形式月の月テーブルは raw 年境界・raw 年長から選ぶ。dusk() で
      // 公開上の u.last_at/u.next_at を日没へ丸めると u.size は365/366日
      // ちょうどではなくなるため、ここで u.size をキーにしてはいけない。
      const yearSize = rawYear.next_at - rawYear.last_at
      u = Tempo.at(this.year_rule(yearRule), {
        write_at: utc,
      })
      M = Tempo.at(
        this.month_rule(new TableTempoRule(this.table.msec.month[yearSize], rawYear.last_at)),
        {
          write_at: utc,
        },
      ) as Tempo<TempoBase> & TempoMonth
      d = Tempo.at(this.day_rule(), {
        write_at: utc,
        parent: envelope_of(M),
      })
    } else {
      if (this.is_table_month) {
        const yearRule = new FloorTempoRule(this.calc.msec.year, this.calc.zero.spring, [
          { size: this.calc.msec.day, zero: this.calc.zero.day },
        ])
        const rawYear = yearRule.at(utc)
        // 上の is_table_leap 分岐と同じ理由で、月テーブルは補正前の raw 年を
        // 基準に選ぶ。公開上の u はこの後 year_rule() で日没へ丸める。
        const yearSize = rawYear.next_at - rawYear.last_at
        u = Tempo.at(this.year_rule(yearRule), { write_at: utc })
        M = Tempo.at(
          this.month_rule(new TableTempoRule(this.table.msec.month[yearSize], rawYear.last_at)),
          {
            write_at: utc,
          },
        ) as Tempo<TempoBase> & TempoMonth
        d = Tempo.at(this.day_rule(), {
          write_at: utc,
          parent: envelope_of(M),
        })
      } else {
        if (usesThaiOfficialLunisolar) {
          const resolveThaiDate = (at: number) => this.thaiLunisolar(at)
          const averageMonthMsec = moon_msec ?? 29.530589 * this.calc.msec.day
          u = Tempo.at(this.year_rule(new ObservedLunisolarYearRule(resolveThaiDate)), {
            write_at: utc,
          })
          M = Tempo.at(
            this.month_rule(new ObservedLunisolarMonthRule(resolveThaiDate, averageMonthMsec)),
            { write_at: utc },
          ) as Tempo<TempoBase> & TempoMonth
          d = Tempo.at(this.day_rule(), {
            write_at: utc,
            parent: envelope_of(M),
          })
          N = d
        } else if (usesObservedLunisolar) {
          // u(年)は元号調整も含めて EraAdjustedTempoRule で構築する
          // (詳細はクラス自体のdocコメント参照)。M は ObservedLunisolarMonthRule
          // で構築する(内部で this.lunisolar(at) を呼ぶため、u 側の
          // this.lunisolar(utc) 呼び出しとキャッシュを共有し、同じ write_at
          // に対する二重の37ヶ月窓探索にはならない)。
          //
          // 以前は M を素の Tempo(now_idx=月番号-1 を直接コンストラクタへ)
          // として構築していたが、その succ() は Tempo.slide() の非テーブル
          // 分岐(今の月の実サイズを固定長とみなして write_at + n*size で
          // 進める式)を使うため、now_idx が「年境界でリセットされるべき
          // 月番号」であるにも関わらず単純に+1され続ける実バグがあった
          // (実測: 300回 succ() 連鎖のうち298回が fresh 再導出と不一致、
          // last_at も蓄積的にずれていく。find([...],[{d:'1'}],{step:'M'})
          // が63件中2件しか見つけられず、見つかった日付も「0054年」等の
          // 破綻した元号年になっていた)。ObservedLunisolarMonthRule に
          // 配線することで、TempoView 経由の succ()/back() が正しく
          // 年境界でリセットされる。
          u = Tempo.at(
            this.year_rule(
              new EraAdjustedTempoRule(
                new ObservedLunisolarYearRule((at) => this.lunisolar(at)),
                this.calc.msec.year,
                this.table.msec.era,
                this.calc.zero.era,
                this.calc.eras,
              ),
            ),
            { write_at: utc },
          )
          M = Tempo.at(
            this.month_rule(new ObservedLunisolarMonthRule((at) => this.lunisolar(at), moon_msec)),
            {
              write_at: utc,
            },
          ) as Tempo<TempoBase> & TempoMonth
          // d(月内日)は M の実区間(last_at)からの経過日数として求まる値
          // (lunisolar.day - 1 と数値的に同じ)。SubdivideTempoRule で
          // 構築すれば、通常の(TempoView)succ()/back() がそのまま安全に
          // 使える(以前は to_tempo_bare()+now_idx上書きの素の Tempo だった
          // ため、succ() が Tempo.slide() の非テーブル分岐で
          // 「calc.zero.day からの絶対日数」を計算してしまい、月内日として
          // 使えない値になっていた。last_at 自体は正しかったため find()/
          // to_table() には実害がなかったが、succ() の戻り値を直接使う
          // 呼び出し元には正しくない値を返していた)。
          d = Tempo.at(this.day_rule(), {
            write_at: utc,
            parent: envelope_of(M),
          })
          N = d
        } else if (!Nn || !N) {
          throw new Error('Lunar month calculation requires a satellite orbital period.')
        } else {
          u = Tempo.at(
            this.year_rule(
              new EraAdjustedTempoRule(
                new FloorTempoRule(
                  this.calc.msec.year,
                  this.calc.zero.season + this.calc.msec.season,
                  [
                    { size: moon_msec, zero: this.calc.zero.moon },
                    { size: this.calc.msec.day, zero: this.calc.zero.day },
                  ],
                ),
                this.calc.msec.year,
                this.table.msec.era,
                this.calc.zero.era,
                this.calc.eras,
              ),
            ),
            { write_at: utc },
          )
          if (this.dic.is_dusk) {
            M = Tempo.at(
              this.month_rule(
                new MeanLunisolarMonthRule(
                  moon_msec,
                  this.calc.zero.moon,
                  this.calc.msec.day,
                  this.calc.zero.day,
                  this.dic.Z.length,
                  resolve_season,
                ),
              ),
              { write_at: utc },
            ) as Tempo<TempoBase> & TempoMonth
            d = Tempo.at(this.day_rule(), {
              write_at: utc,
              parent: envelope_of(M),
            })
            N = d
          } else {
            M = Nn
            d = N
          }
        }
      }
    }

    d = this.assign_day_tempo(d)

    // hour minute second  in day
    if (this.dic.is_solor) {
      H = Tempo.at(this.solar_hour_rule(), { write_at: utc, day: envelope_of(d) })
      m = this.subdivide_tempo(H.size / this.dic.m.length, utc, envelope_of(H))
    } else {
      H = this.subdivide_tempo(this.calc.msec.hour, utc, envelope_of(d))
      m = this.subdivide_tempo(this.calc.msec.minute, utc, envelope_of(H))
    }
    const s = this.subdivide_tempo(this.calc.msec.second, utc, envelope_of(m))
    const S = this.subdivide_tempo(this.calc.msec.msec, utc, envelope_of(s))

    // def_eras() は常に table.msec.era を([Infinity] だけでも)設定するため
    // 下の分岐は実際にはほぼ必ず通るが、万一 table.msec.era が未設定のまま
    // 呼ばれた場合の保険として、u の実区間をそのまま流用した
    // TempoLabelLike を初期値にしておく(succ()/back() 等は不要な
    // 紀元前ラベル用のプレースホルダーなので、フィールドを持たない
    // `{}` キャストで型を偽ることは避ける)。
    let G: TempoLike | TempoLabelLike = cyclic_label(envelope_of(u), 0)
    if (this.table.msec.era != null) {
      G = Tempo.at(new TableTempoRule(this.table.msec.era, this.calc.zero.era), {
        write_at: utc,
      })
      const era = this.calc.eras[G.now_idx]
      if (era?.[0]) {
        // u(年)の区間自体は通年のままにし、元号年は
        // EraAdjustedTempoRule が era_now_idx として注釈する。
        // is_table_leap/is_table_month 分岐には元号を持つサンプル暦が
        // 存在しないため、u 側の調整は未実装のまま(現状は常に
        // this.calc.eras が空でこの if 自体に入らない)。ここでは
        // G のラベルだけを解決する。
        G.label = era[0]
      }
    }

    const y = u.copy()
    if (u.era_now_idx != null) {
      y.now_idx = u.era_now_idx
    }
    if (y.now_idx < 1) {
      G.label = this.dic.G.list[0] || '紀元前'
      y.now_idx = 1 - y.now_idx
    }
    const x = this.dic.x.tempo

    // u はここまでで確定しているので、以降 u の実区間を
    // 参照する箇所(D/Y/yC60/yC12/yC10/yC9)はすべてこの envelope を使い回す。
    const uEnvelope = envelope_of(u)

    // 年初来番号
    const w0 = this.fixed_tempo(this.calc.msec.week, this.calc.zero.week, u.last_at)
    const w = this.subdivide_tempo(this.calc.msec.week, utc, envelope_of(w0))
    // D(年初来日数)は d(月内日)とは別の関心事(年内の通し日数)なので、
    // dusk()/dayBoundary() の対象にしない(常に実時計 0 時起点のまま)。
    const D = this.subdivide_tempo(this.calc.msec.day, utc, uEnvelope)

    // 年末最終週は、翌年初週の扱いにする。Y はその調整を反映した年ラベル。
    const yearEndsInNextYearsFirstWeek = u.next_at < w.next_at
    const Y = cyclic_label(uEnvelope, u.now_idx + (yearEndsInNextYearsFirstWeek ? 1 : 0))
    if (yearEndsInNextYearsFirstWeek) {
      w.now_idx = 0
    }

    // 年不断(u の実区間はそのままに、干支等の周期ラベルだけ差し替える)
    //
    // year60/year12/year10/year_s(calc.zero)は「初期値文字列をパースした
    // 生の年(元号調整前の絶対年、def_idx()の o.y)」から逆算した zero であり、
    // u.now_idx(元号調整後、元号ごとに1へリセットされる相対年)とは基準が
    // 合わない。元号を持つ暦(平気法/定気法等)でこれを u.now_idx と組み合わせると、
    // 元号を跨ぐたびに干支・九星が無関係な値になる実バグがあった
    // (実測: 平気法 1970-01-01 の年干支が、初期値定義通りの「己酉」ではなく
    // 「甲辰」になっていた)。u.raw_now_idx(元号非依存の絶対年、元号を
    // 持たない暦では now_idx と同じ)を使うことで、元号の有無に関わらず
    // 初期値定義と自己無矛盾になる。
    const yearCycles = {} as Record<YearCycleToken, TempoLabelLike>
    for (const token of year_cycle_tokens) {
      const zero = this.calc.zero[year_cycle_zero_keys[token]]
      yearCycles[token] = cyclic_label(uEnvelope, mod(u.raw_now_idx - zero, this.dic[token].length))
    }
    const { yC60, yC12, yC10, yC9 } = yearCycles

    // 月不断(四半期は月をまたぐため、区間は M(現在の月)のものをそのまま使う。
    // 四半期全体の境界ではない点に注意)
    const Q = cyclic_label(envelope_of(M), Math.floor((4 * M.now_idx) / this.dic.M.length))

    // 日不断(固定 zero からの周期を length で割った余りをラベルにする)
    const dayCycles = {} as Record<DayCycleToken, Tempo<TempoBase>>
    for (const token of day_cycle_tokens) {
      const zero = this.calc.zero[day_cycle_zero_keys[token]]
      dayCycles[token] = Tempo.at(
        new CyclicDayTempoRule(this.calc.msec.day, zero, this.dic[token].length),
        {
          write_at: utc,
        },
      )
    }
    const { dC60, dC12, dC10, dC9, dC7, dC8, dC28 } = dayCycles

    // R6/LM27 は旧暦月日から導く暦注であり、日不断 cycle ではない。
    // 実区間は今日(d)そのものなので、d の envelope を使う。
    const dEnvelope = envelope_of(d)
    const R6 = cyclic_label(
      dEnvelope,
      this.dic.R6.length ? mod(M.now_idx + d.now_idx, this.dic.R6.length) : 0,
    )
    const LM27 = cyclic_label(
      dEnvelope,
      this.dic.LM27.length
        ? mod(
            [11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9][M.now_idx] + d.now_idx,
            this.dic.LM27.length,
          )
        : 0,
    )
    const E = { dC7, dC8, dC10 }[this.week_cycle_token()]

    return {
      Zz,
      dC60,
      dC12,
      dC10,
      dC9,
      dC7,
      dC8,
      dC28,
      R6,
      LM27,
      dC: dC60,
      dCB: dC12,
      dCS: dC10,
      A: dC60,
      B: dC12,
      C: dC10,
      D,
      E,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      Y,
      Z,
      yC60,
      yC12,
      yC10,
      yC9,
      yC: yC60,
      yCB: yC12,
      yCS: yC10,
      a: yC60,
      b: yC12,
      c: yC10,
      d,
      m,
      p,
      s,
      u,
      w,
      x,
      y,
    }
  }

  get_dic(tgt: string, tokens: string[], reg: RegExp) {
    const data = to_indexs(0) as TempoIdxs
    const items = tgt.match(reg)
    if (!items) throw new Error(`invalid match ${tgt} ${reg}`)

    let dayPeriod: number | undefined
    const iterable = items.slice(1)
    for (let p = 0; p < iterable.length; p++) {
      let s = iterable[p]
      const token = tokens[p]
      if (token === 'Ha') {
        dayPeriod = s === '午後' ? 1 : 0
        continue
      }
      if (token === 'da') continue
      const parts = format_token_parts(token)
      if (!parts) continue
      const { top } = parts
      const dic = this.dic[top]
      if (dic) {
        if ('M' === top && '閏' === s[0]) {
          data.M_is_leap = true
          s = s.slice(1)
        }
        if ('G' === top && s === this.dic.G.list[0]) {
          data.G_is_past = true
        }
        data[top] = dic.to_idx(s)
      }
    }
    if (dayPeriod != null) {
      const half = this.dic.H.length / 2
      data.H = mod(data.H, half) + dayPeriod * half
    }
    return data
  }

  index(src: string, str = this.dic.parse, _disuse = 0) {
    const tokens = str.match(reg_token)!
    const data = this.get_dic(src, tokens, this.regex(tokens))

    if (data.G_is_past) {
      if (tokens.some((token) => format_token_parts(token)?.top === 'y')) {
        data.y = 1 - data.y
      }
      if (tokens.some((token) => format_token_parts(token)?.top === 'Y')) {
        data.Y = 1 - data.Y
      }
      delete data.G_is_past
    }

    if (this.is_table_leap) {
      data.p = Math.floor(data.y / this.dic.p.length)
      data.y = data.y - data.p * this.dic.p.length
    }
    const parsedTokens = new Set(tokens.map((token) => format_token_parts(token)?.top))
    if (parsedTokens.has('yC60')) {
      data.yC10 = mod(data.yC60, this.dic.yC10.length)
      data.yC12 = mod(data.yC60, this.dic.yC12.length)
    }
    if (parsedTokens.has('dC60')) {
      data.dC10 = mod(data.dC60, this.dic.dC10.length)
      data.dC12 = mod(data.dC60, this.dic.dC12.length)
    }
    sync_legacy_token_aliases(data)
    return data
  }

  regex(tokens) {
    const reg = ['^']
    const escape_regex = (value: string) => value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
    tokens.forEach((token) => {
      if (token === 'Ha') {
        reg.push('(午前|午後)')
        return
      }
      if (token === 'da') {
        reg.push('(白分|黒分)')
        return
      }
      const parts = format_token_parts(token)
      if (!parts) {
        reg.push(`(${token.replace(/([\[\]().*?])/g, '\\$1')})`)
        return
      }
      const { top, mode } = parts
      const dic = this.dic[top]
      if (dic) {
        const isLabelMode = mode === 'o' || mode === 'r'
        if (('y' === top || 'Y' === top) && !isLabelMode) {
          const past = this.dic.G.list[0]
          const prefix = past ? `(?:${escape_regex(past)}|-)?` : '-?'
          reg.push(`(${prefix}${this.number_pattern()})`)
        } else if (isLabelMode) {
          reg.push(dic.regex_o)
        } else {
          reg.push(dic.regex)
        }
      } else {
        reg.push(`(${token.replace(/([\\\[\]().*?])/g, '\\$1')})`)
      }
    })
    return new RegExp(reg.join(''))
  }

  to_table(utc: number, bk: string, ik: string, has_notes = false) {
    const indexer: Indexer = this.dic[ik]
    let o = this.to_tempos(utc)
    const arg1 = this.雑節(utc, o)
    const arg2 = this.節句(utc, o)
    let { last_at } = o[bk]

    o = this.to_tempos(last_at)
    const anker = o[bk].now_idx
    const list: [string, string, string, string, string[]?][] = []
    while (true) {
      o = this.to_tempos(last_at)
      ;({ last_at } = o[ik].succ())
      if (anker !== o[bk].now_idx) {
        break
      }

      const item = o[ik]
      list.push([
        this.format(last_at),
        indexer.to_value(null, item, 0),
        indexer.to_label(indexer.list, item, 0),
        indexer.to_ruby(indexer.rubys, item, 0),
        has_notes ? this.note(last_at, this.to_tempos(last_at), arg1, arg2) : undefined,
      ])
    }
    return list
  }

  parse_by(data: TempoIdxs, diff: TempoDiff = {} as any) {
    let year_size = NaN
    let last_at = NaN
    let zero = NaN
    if (!data) {
      return NaN
    }
    for (const key of main_tokens) {
      data[key] = (diff[key] || 0) + (data[key] || 0)
    }
    for (const key of sub_tokens) {
      data[key] = diff[key] || 0
    }
    let { M_is_leap, G, p, y, M, d, H, m, s, S, J, D, Y, Z, N, Q, u, w } = data

    let utc = H * this.calc.msec.hour + m * this.calc.msec.minute + s * this.calc.msec.second + S
    const time_of_day = utc

    if (J) {
      return this.calc.zero.jd + J * this.calc.msec.day + utc
    }

    if (D) {
      d += D
    }
    if (w) {
      d += w * this.dic.E.length
    }
    if (Q) {
      M += (Q * this.dic.M.length) / 4
    }
    const era_relative_y = y
    y += this.calc.eras[G][2] - 1
    if (u) {
      y += u
    }
    if (Y) {
      y += Y
    }
    if (G < 0) {
      G = 0
    }
    if (this.calc.eras.length <= G) {
      G = this.calc.eras.length - 1
    }

    ;[m, s] = shift_up(m, s, this.dic.s.length)
    ;[H, m] = shift_up(H, m, this.dic.m.length)
    ;[d, H] = shift_up(d, H, this.dic.H.length)
    if (this.is_table_month) {
      ;[y, M] = shift_up(y, M, this.dic.M.length)
    }
    if (this.is_table_leap) {
      ;[p, y] = shift_up(p, y, this.dic.p.length)
    }

    // d(月内日)の寄与は、is_dusk(dusk())な暦では単純な d*msec.day では
    // 求まらない(月始点からの束探索が要る、下記 resolve_day_start() 参照)。
    // 月始点は year/month section を経ないと確定しないため、d の加算は
    // それらの後まで遅延する。
    utc += Z * this.calc.msec.season
    const moon_msec = this.calc.msec.moon
    if (this.dic.moony && moon_msec != null) {
      utc += N * moon_msec
    }

    // year section
    if (this.is_table_leap) {
      utc += this.calc.zero.period + p * this.calc.msec.period + (this.table.msec.year[y - 1] || 0)

      year_size = Math.floor(this.calc.msec.day * this.table.range.year[y])
    } else if (
      !this.is_table_month &&
      hasSolarEvents(this.dic.sunny) &&
      hasLunarEvents(this.dic.moony)
    ) {
      // 観測太陰太陽暦(定気法など、実軌道モデル)は、to_tempos() 側
      // (ObservedLunisolarYearRule)がグレゴリオ暦の西暦年をそのまま
      // now_idx として使うのに対し、この行の直前で計算した y は
      // 「calc.zero.season 相対の連続 index」という別の数値体系を前提に
      // していた(this.calc.eras[G][2] が平気法のような mean モデルでは
      // その連続 index だが、観測太陰太陽暦モデルではグレゴリオ暦の
      // 西暦年そのものになるため)。両者を混同すると year が実際より
      // 約660年(皇紀のズレ)小さい値になり、`zero + y*msec.year` が
      // 全く無関係な世紀の日付を指してしまう(実測: 定気法.parse(
      // '令和6年3月10日',...) が「貞治3年3月9日」になる。
      // development-notes.md 参照)。
      //
      // ここでは calc.zero.season 相対の index を経由せず、対象の元号
      // (calc.eras[G])自身が実際に開始した msec(this.calc.eras[G][1]、
      // 暦の計算方式に依存しない事実)を起点に、実際の lunisolar() 探索
      // (37ヶ月窓の朔・節気探索)で目標のグレゴリオ暦年へ収束させる。
      // 目標年数(1年=1公転)ぶんの msec を足すだけの近似シードで
      // 十分近い年に着地するため、収束は通常1回で終わる(念のため上限
      // 3回)。
      const eraStartMsec = this.calc.eras[G][1]
      const targetYear = this.lunisolar(eraStartMsec).year + era_relative_y - 1
      let guess = eraStartMsec + (era_relative_y - 1) * this.calc.msec.year
      let resolved = this.lunisolar(guess)
      for (let i = 0; i < 3 && resolved.year !== targetYear; i++) {
        guess += (targetYear - resolved.year) * this.calc.msec.year
        resolved = this.lunisolar(guess)
      }
      last_at = resolved.year_start_at
      year_size = resolved.next_year_start_at - resolved.year_start_at
      utc += last_at
    } else {
      if (this.is_table_month) {
        zero = this.calc.zero.spring
      } else {
        zero = this.calc.zero.season
      }

      // 日境界に切り詰める計算自体は to_tempos() 側で既に FloorTempoRule 化済みの
      // 式と同じ(1段floor)。parse_by()は逆方向(文字列→utc)の変換なので
      // to_tempos() とは別にここで構築する必要があるが、同じ規則を使い回せる。
      const yearEnvelope = new FloorTempoRule(this.calc.msec.year, zero, [
        { size: this.calc.msec.day, zero: this.calc.zero.day },
      ]).at(zero + y * this.calc.msec.year)
      last_at = yearEnvelope.last_at
      year_size = yearEnvelope.next_at - yearEnvelope.last_at
      utc += last_at
    }

    // month section
    if (this.is_table_month) {
      utc += this.table.msec.month[year_size][M - 1] || 0
    } else {
      if (!this.dic.moony || moon_msec == null) {
        throw new Error('Lunar month parsing requires a satellite orbital period.')
      }
      const base = last_at
      const M_utc = M_is_leap
        ? base + this.calc.msec.season * (M * 2 + 2) - moon_msec
        : base + this.calc.msec.season * (M * 2 + 1)
      const seedMonthStart = new FloorTempoRule(moon_msec, this.calc.zero.moon, [
        { size: this.calc.msec.day, zero: this.calc.zero.day },
      ]).at(M_utc).last_at
      const month = this.find_lunisolar_parse_month(
        seedMonthStart,
        G,
        era_relative_y,
        M,
        !!M_is_leap,
      )
      last_at = month.last_at
      utc += last_at - base
    }

    // ここまでの utc は「月の開始 + Z/N の寄与 + 時刻部分」。d(月内日)の
    // 寄与は月の開始が確定した今ここで加算する(dusk() の束探索は月開始を
    // 起点にする必要があるため)。
    const month_start = utc - time_of_day
    return this.resolve_day_start(month_start, d) + time_of_day
  }

  /**
   * parse_by()/find_span_time() 用: 月内日 d の寄与を月の開始(month_start)
   * に加算し、対象の暦日の開始時刻を返す。to_tempos() 側の day_rule() と
   * 対になる逆方向の解決——dusk() な暦は d*msec.day という単純な等分割
   * ではないため(実際の日没時刻は日ごとにわずかに変動する)、
   * SolarEventDayTempoRule('sunset') と同じ束探索で解決する。dayBoundary() は
   * 固定オフセットなので、加算するだけで閉じた式になる。
   *
   * dusk() 側は「d*msec.day の中央」を初期推測にした束探索だが、月始点
   * (month_start)と実際の日没日グリッドの位相は一般に揃っていない
   * (実測: 月始点直後の最初の実日没境界が month_start+0.74日ぶん先に
   * ずれて始まっていた)。この位相ズレを見込まずに単発の推測だけで
   * 決め打つと、d が大きくなるほどではなく最初の1日目からすでに
   * 隣の日境界を誤って掴むことがある(実測: 日付境界がちょうど推測点の
   * 前後で1日分ずれ、parse('...3日',...) が format() で「2日」に化けた)。
   * SolarEventDayTempoRule.at() 自身が返す now_idx(month_start からの
   * floor 経過日数)と目標 d の差分ぶん推測を補正し再解決する、既存の
   * 元号年収束ループ(このメソッドの少し上、観測太陰太陽暦の年逆算)と
   * 同じ「差分フィードバックで少数回のうちに収束させる」方式にする
   * (実測: 通常1回、念のため上限3回)。
   *
   * real_sunset_day_rule()(D: TempoEnvelope キャッシュ付き、to_tempos() の
   * d/N と共有)ではなく、ここだけの使い捨てインスタンスを直接構築する。
   * このメソッドは呼び出しごとに違う month_start(=parent)を渡すため、
   * かつてはキャッシュを共有すると CachedTempoRule が別の呼び出しの
   * parent を誤って使い回す実バグが
   * あった(実測: add()/sub() を同じ暦インスタンスで連続して呼ぶと、
   * 後の呼び出しが前の呼び出しの月始点を引き継いで誤った日付を返した)。
   * 呼び出し頻度は parse()/add()/sub() 1回あたり高々数回で、天文計算
   * キャッシュの再利用による恩恵より正しさを優先する。
   */
  private resolve_day_start(month_start: number, d: number): number {
    const event = this.day_start_event()
    if (!event) {
      const offset = this.dic.day_offset_hours
        ? (this.dic.day_offset_hours / 24) * this.calc.msec.day
        : 0
      return month_start + offset + d * this.calc.msec.day
    }
    const rule = new SolarEventDayTempoRule(
      this.dic.sunny,
      this.dic.earthy,
      this.dic.geo,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.msec.year,
      this.calc.zero.season,
      event,
    )
    const parent: TempoEnvelope = {
      zero: month_start,
      now_idx: 0,
      last_at: month_start,
      next_at: month_start + this.calc.msec.day,
    }
    // d>=0 は、月開始候補そのものではなく、その後に最初に来る日没境界を
    // 1日目の始点にする。バビロニア暦の月初は「朔の瞬間」ではなく、
    // 初見の細い月を確認した夕方の日没後に始まるため、月開始候補から
    // 最初の日没までの短い区間を新月1日目として露出しない。
    // d<0(前の月へ跨って戻る意図的な問い合わせ、find_span_time() 参照)の
    // 場合は guess を常に month_start より前に留める。SolarEventDayTempoRule
    // は now_idx=0 の区間を base.parent.last_at(= month_start)以上に
    // 補正するため(同クラスのdocコメント参照)、d<0 のとき補正後の guess が
    // month_start 以上に振れると now_idx が 0 に飛び、次のループでまた
    // 大きく前へ戻る補正がかかって d に永遠に到達できず発散する実バグが
    // あった(実測: d=-1 が -2 と 0 の間を無限に往復し、収束せず月始点を
    // 返し続けた)。
    const clampGuess = (g: number) => (d < 0 ? Math.min(g, month_start - 1) : g)
    const firstDayStart = d < 0 ? month_start : this.align_day_start_month_start(month_start)
    if (d === 0) return firstDayStart
    let guess = clampGuess(
      d < 0
        ? month_start + (d + 0.5) * this.calc.msec.day
        : firstDayStart + (d + 0.5) * this.calc.msec.day,
    )
    let resolved = rule.at(guess, { write_at: guess, parent })
    for (let i = 0; i < 3 && resolved.now_idx !== d; i++) {
      guess = clampGuess(guess + (d - resolved.now_idx) * this.calc.msec.day)
      resolved = rule.at(guess, { write_at: guess, parent })
    }
    // SolarEventDayTempoRule.at() 自身が now_idx=0 の際に last_at を
    // base.parent.last_at(= month_start)以上に補正済み(同クラスの
    // doc コメント参照)なので、resolved.last_at は常に month_start
    // 以上になる——呼び出し元が to_tempos() で再解決しても前の月に
    // 化けない。
    return resolved.last_at
  }

  private half_label(now_idx: number, length: number, labels: readonly [string, string]) {
    const side = mod(Math.floor((now_idx * 2) / length), 2)
    return labels[side]
  }

  private paksha_label(tempos: Tempos) {
    if (!tempos.N) return ''
    return this.half_label(tempos.N.now_idx, this.dic.N.length || 30, ['白分', '黒分'])
  }

  format_parts_by(utc: DateLike, str = this.dic.format): FormatPart[] {
    const tempos = this.to_tempos_input(utc)
    const tokens = str.match(reg_token)!
    const has_era = tokens.some((token) => 'G' === token[0])
    const past = this.dic.G.list[0]
    const signed_year = (year: number, size: number) => {
      if (year < 0) {
        return `-${this.format_number(-year, size)}`
      }
      return this.format_number(year, size)
    }
    const parts = tokens.map((token) => {
      if (token === 'Ha') {
        return {
          token,
          text: this.half_label(tempos.H.now_idx, this.dic.H.length, ['午前', '午後']),
        }
      }
      if (token === 'da') {
        return { token, text: this.paksha_label(tempos) }
      }
      const parts = format_token_parts(token)
      if (!parts) return { token: '', text: token }
      const { top, mode, size } = parts
      const val = tempos[top]
      if (!val) return { token: '', text: token }

      const dic = this.dic[top]
      const explicitRuby = dic.to_ruby(dic.rubys, val, size)
      const defaultRuby = explicitRuby || this.format_default_part_ruby(top, val, size)
      const withRuby = (text: string, ruby = defaultRuby): FormatPart =>
        ruby ? { token, text, ruby } : { token, text }

      switch (mode) {
        case 'r':
          return { token, text: explicitRuby }
        case 'o':
          return withRuby(dic.to_label(dic.list, val, size), explicitRuby)
        default:
          if ('y' === top && !has_era && past && tempos.G?.label === past) {
            return { token, text: signed_year(1 - val.now_idx, size) }
          }
          if ('Y' === top) {
            if (has_era && val.now_idx < 1) {
              return { token, text: this.format_number(1 - val.now_idx, size) }
            }
            if (!has_era) {
              return { token, text: signed_year(val.now_idx, size) }
            }
          }
          return withRuby(dic.to_value(dic.list, val, size))
      }
    })
    return this.merge_format_part_suffixes(parts)
  }

  private format_default_part_ruby(
    top: ALL_DIC | 'Zz',
    val: { now_idx: number; is_leap?: boolean },
    size: number,
  ) {
    const countFromOne = () => this.format_number_ruby(val.now_idx + 1, size)
    const countFromZero = () => this.format_number_ruby(val.now_idx, size)
    switch (top) {
      case 'M': {
        const ruby = countFromOne()
        return val.is_leap && ruby ? `うるう${ruby}` : ruby
      }
      case 'd':
      case 'D':
      case 'Q':
      case 'p':
      case 'w':
        return countFromOne()
      case 'H':
      case 'm':
      case 's':
      case 'S':
      case 'N':
      case 'Y':
      case 'u':
      case 'y':
        return countFromZero()
      default:
        return ''
    }
  }

  private merge_format_part_suffixes(parts: FormatPart[]): FormatPart[] {
    const result: FormatPart[] = []
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const tokenParts = format_token_parts(part.token)
      const relatives = tokenParts ? this.dic[tokenParts.top]?.relatives : undefined
      const next = parts[i + 1]
      if (
        part.ruby &&
        'string' === typeof relatives &&
        next?.token === '' &&
        next.text.startsWith(relatives)
      ) {
        result.push({ ...part, text: `${part.text}${relatives}` })
        const rest = next.text.slice(relatives.length)
        if (rest) result.push({ token: '', text: rest })
        i++
        continue
      }
      result.push(part)
    }
    return result
  }

  tree() {
    const { y, M, d, H, m, s, dC60, dC12, dC10, E, dC9, dC28, yC60, yC12, yC10, yC9 } = this.dic
    const yyyy = [
      [yC60, yC12, yC10, yC9, y],
      ['yC60o yC60r', 'yC12o yC12r', 'yC10o yC10r', 'yC9o yC9r', 'Gy'],
    ]
    const eeee = [
      [dC60, dC12, dC10, E, dC9, dC28],
      ['dC60o dC60r', 'dC12o dC12r', 'dC10o dC10r', 'Eo Er', 'dC9o dC9r', 'dC28o dC28r'],
    ]
    return [yyyy, M, d, eeee, H, m, s]
  }
}

function escape_regexp(text: string) {
  return text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
}

function span_rank(precision: Precision) {
  return 'yMdHmsS'.indexOf(precision)
}

function is_core_precision(precision: Precision): precision is CorePrecision {
  return 0 <= span_rank(precision)
}
