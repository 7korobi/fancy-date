import type { Numeral } from './number'
import type {
  LunarApsisKind,
  LunarNodeKind,
  OrbitalModel,
  RotationModel,
  SPOT,
  TIMEZONE,
} from './orbital-model'
import type { LunisolarDate } from './phenomena/lunisolar'
import { Tempo } from './tempo'
import type { SubdivideBase, TempoBase, TempoLabelLike, TempoLike } from './tempo'
export { EarthMoonOrbital, EarthSolarOrbital } from './naoj'
export type { EarthMoonOrbitalOptions, EarthSolarOrbitalOptions } from './naoj'
export { MarsSolarOrbital } from './nasa'
export type { MarsSolarOrbitalOptions } from './nasa'
export { MeanOrbital, MeanRotation, TransformedOrbital, transformOrbital } from './mean'
export type { LunisolarDate, LunisolarPrincipalTerm } from './phenomena/lunisolar'
export type { PreparedSpot, PreparedSpotModels } from './prepare'
export { prepareSpot, prepareSpotModels } from './prepare'
export * from './orbital-model'
export type ERA = readonly [string, number, string?]
export type ERA_WITH_YEAR = readonly [string, number, number]
type ALL_DIC =
  | ALGO_DIC
  | 'D'
  | 'G'
  | 'J'
  | 'Q'
  | 'Y'
  | 'b'
  | 'c'
  | 'd'
  | 'p'
  | 'u'
  | 'w'
  | 'x'
  | 'y'
type ALGO_DIC =
  | 'A'
  | 'B'
  | 'C'
  | 'E'
  | 'F'
  | 'H'
  | 'M'
  | 'N'
  | 'S'
  | 'V'
  | 'Z'
  | 'a'
  | 'd'
  | 'f'
  | 'm'
  | 's'
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
export type TempoDiff = TOKENS<ALL_DIC, number>
export type TempoIdxs = TOKENS<ALL_DIC, number> & {
  G_is_past?: boolean
  M_is_leap: boolean
}
type TempoMonth = {
  is_leap: boolean
}
export type Token = ALL_DIC | 'Zz'
export type Unit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'msec'
type CorePrecision = 'y' | 'M' | 'd' | 'H' | 'm' | 's' | 'S'
export type Precision = CorePrecision | Token
export type SpanLabels = Partial<Record<Token, string>>
export type SpanDirection = '前' | '後'
export type FindOrder = 1 | -1
/**
 * SteppableTempoKey: Tempos の中で succ()/back() 等の遷移操作を実際に
 * 持つフィールドのキーだけを絞り込んだ型。Y/a/b/c/f/Q は TempoLabelLike
 * (遷移操作を持たない)なのでここに含まれない
 * (find() の options.step を誤って周期ラベル側へ向けるのを型で防ぐ)。
 */
export type SteppableTempoKey = {
  [K in keyof Tempos]: Tempos[K] extends TempoLike | undefined ? K : never
}[keyof Tempos]
export type FindOptions = {
  step?: SteppableTempoKey
  order?: FindOrder
  limit?: number
}
export type SpanPart = {
  token: Token
  unit: Unit
  value: number
  label: string
}
export type SpanPartLike = SpanPart | Omit<SpanPart, 'token'>
export type Span = {
  unit: Unit
  value: number
  label: string
  parts?: readonly SpanPart[]
  next_at?: number
  timeout?: number
}
export type SpanOptions = {
  precise?: boolean | Precision
}
export type SpanLike = string | Span | SpanPartLike | readonly SpanPartLike[]
export type Tempos = {
  Zz: Tempo<TempoBase>
  A: Tempo<TempoBase>
  B: Tempo<TempoBase>
  C: Tempo<TempoBase>
  D: Tempo<SubdivideBase>
  E: TempoLike | TempoLabelLike
  F: Tempo<TempoBase>
  G: TempoLike | TempoLabelLike
  H: TempoLike
  J: Tempo<TempoBase>
  M: Tempo<TempoBase> & TempoMonth
  N: Tempo<SubdivideBase> | undefined
  Q: TempoLabelLike
  S: Tempo<SubdivideBase>
  V: TempoLike | TempoLabelLike
  Y: TempoLabelLike
  Z: Tempo<TempoBase>
  a: TempoLabelLike
  b: TempoLabelLike
  c: TempoLabelLike
  d: Tempo<SubdivideBase>
  f: TempoLabelLike
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
type NUMBER_RANGE = [number, number?]
type MEASURE = {
  range: NUMBER_RANGE
  msec: number
}
type FindMatcher = string | RegExp
export type FindCondition =
  | {
      note: FindMatcher
    }
  | {
      [format: string]: FindMatcher
    }
type FindBetween = DateRange
type IIDX = TOKENS<ALL_DIC, Indexer>
type IDIC = IIDX & {
  parse: string
  format: string
  numeral?: Numeral | null
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
}
type ICALC = {
  eras: ERA_WITH_YEAR[]
  idx: TOKENS<ALL_DIC, number>
  zero: TOKENS<ZERO_CALC, number>
  msec: TOKENS<MSEC_CALC, number> & {
    moon?: number
  }
  range: TOKENS<RANGE_CALC, [number, number]>
}
type TOKENS<K extends string, T> = {
  [key in K]: T
}
type IndexFactory = (this: Indexer, s: string) => number
type LabelFactory = (
  list: readonly string[] | null,
  val: TempoLike & {
    is_leap?: boolean
  },
  size: number,
) => string
type IndexerProps =
  | []
  | [number]
  | readonly [readonly string[], readonly string[] | null]
  | readonly [readonly string[], readonly string[] | null, string | readonly string[]]
declare class Indexer {
  tempo?: TempoLabelLike
  list: readonly string[]
  rubys: readonly string[]
  relatives?: string | readonly string[]
  length: number
  zero: number
  regex: string
  regex_o: string
  to_idx: IndexFactory
  to_value: LabelFactory
  to_label: LabelFactory
  to_ruby: LabelFactory
  constructor(arg: IndexerProps)
}
export declare class FancyDate {
  dic: IDIC
  calc: ICALC
  is_table_leap: boolean
  is_table_month: boolean
  strategy: string
  table: {
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
  private _orbital_season_rule?
  private _solar_hour_rule?
  private readonly _lunisolar_cache
  constructor(o?: FancyDate)
  spot(...spot: SPOT): this
  lang(parse: string, format: string): this
  era(era: string, past: string, eras?: readonly ERA[]): this
  calendar(
    start?: (string | number)[],
    leaps?: number[] | null,
    month_divs?: (number | null)[] | null,
    leap_shift?: number,
  ): this
  algo(o: Partial<TOKENS<ALGO_DIC, IndexerProps>>): this
  daily(is_solor?: string | boolean): this
  numeral(numeral?: Numeral | null): this
  numeral_label(numeral?: Numeral | null, ruby?: Numeral | null): this
  private format_number
  private format_numeral_label
  private format_numeral_label_ruby
  labels(labels: SpanLabels): this
  private parse_number
  private number_pattern
  init(): this
  yeary_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  monthry_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  weekly_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  time_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  solar_phase(phase: number, near: number): number
  lunar_phase(phase: number, near: number): number
  lunisolar(utc: number): LunisolarDate
  solar_term(
    utc: number,
    phase: number,
  ): Tempo<{
    write_at: number
  }>
  solar_phase_before(phase: number, utc: number): number
  solar_terms(utc: number): {
    立春: Tempo<{
      write_at: number
    }>
    入梅: Tempo<{
      write_at: number
    }>
    春分: Tempo<{
      write_at: number
    }>
    半夏生: Tempo<{
      write_at: number
    }>
    夏土用: Tempo<{
      write_at: number
    }>
    立夏: Tempo<{
      write_at: number
    }>
    夏至: Tempo<{
      write_at: number
    }>
    秋土用: Tempo<{
      write_at: number
    }>
    立秋: Tempo<{
      write_at: number
    }>
    秋分: Tempo<{
      write_at: number
    }>
    冬土用: Tempo<{
      write_at: number
    }>
    立冬: Tempo<{
      write_at: number
    }>
    冬至: Tempo<{
      write_at: number
    }>
    春土用: Tempo<{
      write_at: number
    }>
    次立春: Tempo<{
      write_at: number
    }>
  }
  succ(utc: DateLike, diff: SpanLike): number
  back(utc: DateLike, diff: SpanLike): number
  parse(tgt: string | TempoIdxs, str?: string): number
  parse_obj(tgt: string | TempoIdxs, str?: string): TempoIdxs
  format(utc: DateLike, str?: string): string
  add(utc: DateLike, span: SpanLike): number
  add_obj(utc: DateLike, span: SpanLike): Tempos
  sub(utc: DateLike, span: SpanLike): number
  sub_obj(utc: DateLike, span: SpanLike): Tempos
  span(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions): string
  span_obj(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions): Span
  parse_span(text: string): Span
  format_span(span: SpanLike, direction?: SpanDirection): Span
  private add_span
  private parse_span_parts
  private disambiguate_span_parts
  private format_span_parts
  private span_parts_of
  private normalize_span_part
  private invert_span
  private parse_span_part
  private span_parse_rows
  private span_target
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
  private step_month
  private resolve_span_week_target
  private normalize_span_target
  private unit_msec
  private find_span_time
  private find_span_time_in_day_direct
  private find_span_month
  private find_span_year_start
  private find_span_time_in_day
  private compare_span_digits
  private interval_for_rank
  private source_since
  private clamp_since
  find(between: FindBetween, conditions: readonly FindCondition[], options?: FindOptions): number[]
  private infer_find_step
  private infer_find_step_from_format
  private find_step_for_token
  private find_step_rank
  private span_between
  private with_span_anchor
  private precise_span
  private next_precise_span_at
  private next_span_at
  private span_parts
  private hierarchical_span_rows
  private token_span_parts
  private span_part_unit
  private span_part_fallback_unit
  private span_part_label
  match_find_condition(utc: number, condition: FindCondition): boolean
  match_find_value(value: string, matcher: FindMatcher): boolean
  private to_utc
  private to_tempos_input
  private is_tempos
  private is_date_range
  private span_args
  private is_span_options
  private is_span_text
  dup(): FancyDate
  def_regex(): void
  def_to_idx(): void
  def_to_label(): void
  def_calc(): void
  def_eras(): void
  def_year_table(): void
  def_month_table(): void
  def_table(): void
  def_idx(): void
  def_zero(): void
  precision(): {
    strategy: string
    year: number[][]
    day: [number, number][]
    leap: number[]
    is_legal_solor: boolean
    is_legal_eto: boolean
    is_legal_ETO: boolean
  }
  noon(
    utc: number,
    day?: TempoLike,
  ): {
    last_at: number
    center_at: number
    T0: Tempo<{
      write_at: number
    }>
    T1: Tempo<{
      write_at: number
    }>
    季節: number
    南中差分: number
    南中時刻: number
    真夜中: number
    zero: number
    write_at: number
    now_idx: number
    next_at: number
    size: number
    since: number
    moderate_at: number
    label?: string
    is_leap?: boolean
    is_cover(at: number): boolean
    succ(n?: number): TempoLike
    back(n?: number): TempoLike
    slide(n: number): TempoLike
    slide_to(n: number): TempoLike
    copy(): TempoLike
    reset(now?: number): TempoLike
  }
  solor(
    utc: number,
    idx?: number,
    solarNoon?: {
      last_at: number
      center_at: number
      T0: Tempo<{
        write_at: number
      }>
      T1: Tempo<{
        write_at: number
      }>
      季節: number
      南中差分: number
      南中時刻: number
      真夜中: number
      zero: number
      write_at: number
      now_idx: number
      next_at: number
      size: number
      since: number
      moderate_at: number
      label?: string
      is_leap?: boolean
      is_cover(at: number): boolean
      succ(n?: number): TempoLike
      back(n?: number): TempoLike
      slide(n: number): TempoLike
      slide_to(n: number): TempoLike
      copy(): TempoLike
      reset(now?: number): TempoLike
    },
  ): import('./orbital-model').SolarObservation
  lunar(utc: number, day?: TempoLike): import('./orbital-model').LunarObservation
  lunar_apsis(kind: LunarApsisKind, near: number): import('./orbital-model').LunarApsis
  lunar_node(kind: LunarNodeKind, near: number): import('./orbital-model').LunarNode
  節句(
    _utc: number,
    _tempos?: Tempos,
  ): {
    カトリック: {
      万聖節: number[]
      万霊節: number[]
    }
    節句: {
      人日: number[]
      初午: (number | undefined)[]
      上巳: number[]
      端午: number[]
      七夕: number[]
      重陽: number[]
    }
    仏教: {
      灌仏会: number[]
      盂蘭盆会: number[]
    }
    風習: {
      小正月: number[]
      十五夜: number[]
      十三夜: number[]
      七五三: number[]
      正月事始め: number[]
    }
  }
  雑節(
    utc: number,
    { Zz, d }?: Tempos,
  ): {
    立春: Tempo<{
      write_at: number
    }>
    立夏: Tempo<{
      write_at: number
    }>
    立秋: Tempo<{
      write_at: number
    }>
    立冬: Tempo<{
      write_at: number
    }>
    冬至: Tempo<{
      write_at: number
    }>
    春分: Tempo<{
      write_at: number
    }>
    夏至: Tempo<{
      write_at: number
    }>
    秋分: Tempo<{
      write_at: number
    }>
    入梅: Tempo<{
      write_at: number
    }>
    半夏生: Tempo<{
      write_at: number
    }>
    春: Tempo<TempoBase>
    夏: Tempo<TempoBase>
    秋: Tempo<TempoBase>
    冬: Tempo<TempoBase>
    春社日: Tempo<{
      write_at: number
    }>
    秋社日: Tempo<{
      write_at: number
    }>
    春土用: Tempo<{
      write_at: number
    }>
    夏土用: Tempo<{
      write_at: number
    }>
    秋土用: Tempo<{
      write_at: number
    }>
    冬土用: Tempo<{
      write_at: number
    }>
    春節分: Tempo<{
      write_at: number
    }>
    夏節分: Tempo<{
      write_at: number
    }>
    秋節分: Tempo<{
      write_at: number
    }>
    冬節分: Tempo<{
      write_at: number
    }>
    節分: Tempo<{
      write_at: number
    }>
    春彼岸: Tempo<TempoBase>
    秋彼岸: Tempo<TempoBase>
    八十八夜: Tempo<{
      write_at: number
    }>
    二百十日: Tempo<{
      write_at: number
    }>
    二百二十日: Tempo<{
      write_at: number
    }>
  }
  雑節_by_phase(utc: number): {
    立春: Tempo<{
      write_at: number
    }>
    立夏: Tempo<{
      write_at: number
    }>
    立秋: Tempo<{
      write_at: number
    }>
    立冬: Tempo<{
      write_at: number
    }>
    冬至: Tempo<{
      write_at: number
    }>
    春分: Tempo<{
      write_at: number
    }>
    夏至: Tempo<{
      write_at: number
    }>
    秋分: Tempo<{
      write_at: number
    }>
    入梅: Tempo<{
      write_at: number
    }>
    半夏生: Tempo<{
      write_at: number
    }>
    春: Tempo<TempoBase>
    夏: Tempo<TempoBase>
    秋: Tempo<TempoBase>
    冬: Tempo<TempoBase>
    春社日: Tempo<{
      write_at: number
    }>
    秋社日: Tempo<{
      write_at: number
    }>
    春土用: Tempo<{
      write_at: number
    }>
    夏土用: Tempo<{
      write_at: number
    }>
    秋土用: Tempo<{
      write_at: number
    }>
    冬土用: Tempo<{
      write_at: number
    }>
    春節分: Tempo<{
      write_at: number
    }>
    夏節分: Tempo<{
      write_at: number
    }>
    秋節分: Tempo<{
      write_at: number
    }>
    冬節分: Tempo<{
      write_at: number
    }>
    節分: Tempo<{
      write_at: number
    }>
    春彼岸: Tempo<TempoBase>
    秋彼岸: Tempo<TempoBase>
    八十八夜: Tempo<{
      write_at: number
    }>
    二百十日: Tempo<{
      write_at: number
    }>
    二百二十日: Tempo<{
      write_at: number
    }>
  }
  to_tempo_by_solor(
    utc: number,
    day: any,
  ): Tempo<{
    write_at: number
  }>
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
  private resolve_orbital_season
  /**
   * resolve_orbital_season() で使う OrbitalPhaseTempoRule を CachedTempoRule
   * で包んで使い回す(D: TempoEnvelope キャッシュ)。実軌道の位相探索は
   * 反復計算を伴うため、season(24節気で約15日幅)の範囲内で write_at を
   * 繰り返し問い合わせる場合(to_table() の日次走査など)、2回目以降は
   * 実際の探索を経ずに直近の envelope を再利用できる。
   */
  private orbital_season_rule
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
  private solar_hour_rule
  note(
    utc: number,
    tempos?: Tempos,
    arg1?: {
      立春: Tempo<{
        write_at: number
      }>
      立夏: Tempo<{
        write_at: number
      }>
      立秋: Tempo<{
        write_at: number
      }>
      立冬: Tempo<{
        write_at: number
      }>
      冬至: Tempo<{
        write_at: number
      }>
      春分: Tempo<{
        write_at: number
      }>
      夏至: Tempo<{
        write_at: number
      }>
      秋分: Tempo<{
        write_at: number
      }>
      入梅: Tempo<{
        write_at: number
      }>
      半夏生: Tempo<{
        write_at: number
      }>
      春: Tempo<TempoBase>
      夏: Tempo<TempoBase>
      秋: Tempo<TempoBase>
      冬: Tempo<TempoBase>
      春社日: Tempo<{
        write_at: number
      }>
      秋社日: Tempo<{
        write_at: number
      }>
      春土用: Tempo<{
        write_at: number
      }>
      夏土用: Tempo<{
        write_at: number
      }>
      秋土用: Tempo<{
        write_at: number
      }>
      冬土用: Tempo<{
        write_at: number
      }>
      春節分: Tempo<{
        write_at: number
      }>
      夏節分: Tempo<{
        write_at: number
      }>
      秋節分: Tempo<{
        write_at: number
      }>
      冬節分: Tempo<{
        write_at: number
      }>
      節分: Tempo<{
        write_at: number
      }>
      春彼岸: Tempo<TempoBase>
      秋彼岸: Tempo<TempoBase>
      八十八夜: Tempo<{
        write_at: number
      }>
      二百十日: Tempo<{
        write_at: number
      }>
      二百二十日: Tempo<{
        write_at: number
      }>
    },
    arg2?: {
      カトリック: {
        万聖節: number[]
        万霊節: number[]
      }
      節句: {
        人日: number[]
        初午: (number | undefined)[]
        上巳: number[]
        端午: number[]
        七夕: number[]
        重陽: number[]
      }
      仏教: {
        灌仏会: number[]
        盂蘭盆会: number[]
      }
      風習: {
        小正月: number[]
        十五夜: number[]
        十三夜: number[]
        七五三: number[]
        正月事始め: number[]
      }
    },
  ): string[]
  to_tempos(utc: number): Tempos
  get_dic(tgt: string, tokens: string[], reg: RegExp): TempoIdxs
  index(src: string, str?: string, _disuse?: number): TempoIdxs
  regex(tokens: any): RegExp
  to_table(
    utc: number,
    bk: string,
    ik: string,
    has_notes?: boolean,
  ): [string, string, string, string, (string[] | undefined)?][]
  parse_by(data: TempoIdxs, diff?: TempoDiff): number
  format_by(tempos: Tempos, str?: string): string
  tree(): (Indexer | (string[] | Indexer[])[])[]
}
