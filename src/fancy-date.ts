import { hasLunarEvents, hasLunarOrbitEvents, hasSolarEvents } from './orbital-model'
import { mod } from './number'
import type { Numeral } from './number'
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
  SolarDayHourTempoRule,
  SubdivideTempoRule,
  TableTempoRule,
  Tempo,
} from './tempo'
import type { SolarDayHourBase, SubdivideBase, TempoBase, TempoLabelLike, TempoLike } from './tempo'
import { to_tempo_bare } from './time'

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
export type FindOptions = { step?: SteppableTempoKey; order?: FindOrder; limit?: number }
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
const span_anchor = Symbol('span_anchor')
type AnchoredSpan = Span & {
  [span_anchor]?: readonly [from: number, to: number, calendar: FancyDate]
}
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
  sourceDayOfYear: number
  sourceWeekSince: number
  sourceDaySince: number
  sourceHourSince: number
  sourceMinuteSince: number
  sourceSecondSince: number
}
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

const core_tokens = 'GHMSdmpsy'
const main_tokens = 'ABCEFabcfx' + core_tokens
const sub_tokens = 'DJNQVYZuw'
const all_tokens = main_tokens + sub_tokens

const reg_token =
  /([ABCEFHMNQVZabcdfms][or]|([ABCDEFGHJMNQSVYZabcdfmpsuwxy])\2*)|''|'(''|[^'])+('|$)|./g

type NUMBER_RANGE = [number, number?]
type MEASURE = {
  range: NUMBER_RANGE
  msec: number
}

type FindMatcher = string | RegExp
export type FindCondition = { note: FindMatcher } | { [format: string]: FindMatcher }
type FindBetween = DateRange

const DEFAULT_LABELS: Readonly<SpanLabels> = {
  a: '年干支',
  b: '年支',
  c: '年干',
  f: '年九星',
  A: '日干支',
  B: '日支',
  C: '日干',
  E: '曜日',
  F: '日九星',
  V: '宿',
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

type IIDX = TOKENS<ALL_DIC, Indexer>
type IDIC = IIDX & {
  parse: string
  format: string
  numeral?: Numeral | null
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

function to_indexs<T>(zero: T): TOKENS<ALL_DIC, T> {
  let A, a, b, B, c, C, d, D, E, f, F, G, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z
  A =
    B =
    C =
    D =
    E =
    F =
    G =
    H =
    J =
    M =
    N =
    Q =
    S =
    V =
    Y =
    Z =
    a =
    b =
    c =
    d =
    f =
    m =
    p =
    s =
    u =
    w =
    x =
    y =
      zero
  return { A, B, C, D, E, F, G, H, J, M, N, Q, S, V, Y, Z, a, b, c, d, f, m, p, s, u, w, x, y }
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
  dic: IDIC
  calc: ICALC
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

  constructor(o?: FancyDate) {
    if (o) {
      ;({ dic: this.dic, calc: this.calc } = cloneValue(o))
    } else {
      this.dic = {
        parse: 'y年M月d日',
        format: 'Gy年M月d日(E)H時m分s秒',
      } as any
      Object.defineProperty(this.dic, 'labels', {
        configurable: true,
        enumerable: false,
        value: { ...DEFAULT_LABELS },
        writable: true,
      })

      this.calc = {
        eras: [],
        idx: {},
        zero: {},
        msec: {},
        range: {},
      } as any
      ;[...all_tokens].map((key) => (this.dic[key] = new Indexer([])))
    }
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

  algo(o: Partial<TOKENS<ALGO_DIC, IndexerProps>>) {
    for (let key in o) {
      const val = o[key]
      this.dic[key] = new Indexer(val)
    }

    // A B C a b c 日の不断、年の不断を構築
    if (o.C?.[0] instanceof Array && o.B?.[0] instanceof Array) {
      this.dic.c = new Indexer(o.C)
      this.dic.b = new Indexer(o.B)
      this.dic.C.zero = this.dic.B.zero = this.dic.A.zero
      this.dic.c.zero = this.dic.b.zero = this.dic.a.zero
    }

    const { A, B, C, a } = this.dic
    if (C.list && B.list) {
      A.list = a.list = [...Array(A.length)].map((_, idx) => {
        const c = C.list[idx % C.length]
        const b = B.list[idx % B.length]
        return `${c}${b}`
      })
    }

    if (C.rubys && B.rubys) {
      A.rubys = a.rubys = [...Array(a.length)].map((_, idx) => {
        const c = C.rubys[idx % C.length]
        const b = B.rubys[idx % B.length]
        return `${c.replace(/と$/, 'との')}${b}`
      })
    }

    return this
  }

  daily(is_solor: string | boolean = false) {
    this.dic.is_solor = !!is_solor
    return this
  }

  numeral(numeral: Numeral | null = null) {
    this.dic.numeral = numeral
    return this
  }

  labels(labels: SpanLabels) {
    Object.assign(this.dic.labels, labels)
    return this
  }

  private format_number(value: number, size: number, appendix = '') {
    const numeral = this.dic.numeral
    if (numeral) return numeral.parse(value, appendix)
    return `${value}`.padStart(size, '0')
  }

  private parse_number(text: string) {
    const numeric = Number(text)
    if (Number.isFinite(numeric)) return numeric
    const parsed = this.dic.numeral?.to_number?.(text)
    return parsed ?? numeric
  }

  private number_pattern(fallback = '\\d+') {
    const pattern = this.dic.numeral?.regex
    return pattern ? `(?:${pattern}|${fallback})` : fallback
  }

  init() {
    // 暦設定が(再)確定するたびに、直近解決キャッシュを破棄する
    // (古い設定に基づく envelope/lunisolar 結果を持ち越さないため)。
    this._orbital_season_rule = undefined
    this._solar_hour_rule = undefined
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
    return this.format_by(this.to_tempos_input(utc), str)
  }

  add(utc: DateLike, span: SpanLike) {
    return this.add_span(this.to_utc(utc), span)
  }
  add_obj(utc: DateLike, span: SpanLike) {
    return this.to_tempos(this.add(utc, span))
  }
  sub(utc: DateLike, span: SpanLike) {
    return this.add_span(this.to_utc(utc), this.invert_span(span))
  }
  sub_obj(utc: DateLike, span: SpanLike) {
    return this.to_tempos(this.sub(utc, span))
  }
  span(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions) {
    return this.span_obj(to, from, options).label
  }
  span_obj(to: DateLike | DateRange, from?: DateLike | SpanOptions, options: SpanOptions = {}) {
    if (this.is_date_range(to)) {
      const spanOptions = this.is_span_options(from) ? from : options
      return this.span_between(this.to_utc(to[1]), this.to_utc(to[0]), spanOptions)
    }
    if (this.is_span_text(to, from)) return this.parse_span(to)
    const [fromAt, spanOptions] = this.span_args(from, options)
    return this.span_between(this.to_utc(to), fromAt, spanOptions)
  }

  parse_span(text: string): Span {
    const { parts, direction } = this.parse_span_parts(text)
    return this.format_span_parts(parts, direction)
  }

  format_span(span: SpanLike, direction?: SpanDirection): Span {
    const parts = this.span_parts_of(span)
    const activeParts = parts.filter(({ value }) => value)
    const spanDirection = direction ?? (activeParts[0]?.value < 0 ? '後' : '前')
    return this.format_span_parts(parts, spanDirection)
  }

  private add_span(utc: number, span: SpanLike) {
    const anchor = (span as AnchoredSpan)[span_anchor]
    if (anchor?.[1] === utc && anchor[2] === this) return anchor[0]
    const parts = this.span_parts_of(span)
    const target = this.span_target(utc, parts)
    return this.find_span_time(target, utc)
  }

  private parse_span_parts(text: string): { parts: SpanPart[]; direction: SpanDirection } {
    const source = text.trim()
    if (source === '今') return { parts: [], direction: '前' }
    // 前/後 のない表現(例: '1年2ヶ月')は、方向を明示しない「後」扱いとする
    // (README「今後の検討メモ」の文法拡張)。前/後 が付いている場合は
    // 従来通りそちらを解釈する。
    const match = source.match(/^(.*)(前|後)$/)
    const body = match ? match[1] : source
    const direction = (match ? match[2] : '後') as SpanDirection
    if (!body) throw new Error(`invalid relative time ${text}`)
    const sign = direction === '後' ? -1 : 1
    let rest = body
    const parts: SpanPart[] = []
    while (rest) {
      const part = this.parse_span_part(rest, sign)
      if (!part) throw new Error(`invalid relative time ${text}`)
      parts.push(part)
      rest = rest.slice(part.label.length)
    }
    return { parts: this.disambiguate_span_parts(parts), direction }
  }

  private disambiguate_span_parts(parts: SpanPart[]): SpanPart[] {
    if (this.span_part_fallback_unit('d') !== this.span_part_fallback_unit('D')) return parts
    const hasYear = parts.some(({ token }) => token === 'y' || token === 'Y')
    const hasMonth = parts.some(({ token }) => token === 'M')
    if (!hasYear || hasMonth) return parts
    return parts.map((part) => (part.token === 'd' ? { ...part, token: 'D' as Token } : part))
  }

  private format_span_parts(parts: readonly SpanPart[], direction: SpanDirection): Span {
    const activeParts = parts
      .filter(({ value }) => value)
      .map((part) => ({
        ...part,
        label: this.span_part_label(
          part.token,
          Math.abs(part.value),
          this.span_part_fallback_unit(part.token),
        ),
      }))
    if (!activeParts.length) return { unit: 'second', value: 0, label: '今', parts: [] }
    const primary = activeParts[0]
    return {
      unit: primary.unit,
      value: primary.value,
      label: `${activeParts.map(({ label }) => label).join('')}${direction}`,
      parts: activeParts,
    }
  }

  private span_parts_of(span: SpanLike): readonly SpanPart[] {
    const parts = (() => {
      if ('string' === typeof span) return this.parse_span(span).parts ?? []
      if (Array.isArray(span)) return span
      return 'parts' in span ? (span.parts ?? [span]) : [span]
    })()
    return parts.map((part) => this.normalize_span_part(part))
  }

  private normalize_span_part(part: SpanPartLike): SpanPart {
    return 'token' in part ? part : { ...part, token: span_unit_token(part.unit) }
  }

  private invert_span(span: SpanLike): readonly SpanPart[] {
    return this.span_parts_of(span).map(({ token, unit, value, label }) => ({
      token,
      unit,
      value: 0 - value,
      label,
    }))
  }

  private parse_span_part(text: string, sign: number) {
    let best: SpanPart | undefined
    const accept = (token: Token, unit: Unit, count: number, label: string) => {
      if (!label) return
      if (best && best.label.length >= label.length) return
      best = { token, unit, value: count * sign, label }
    }
    const rows = this.span_parse_rows()
    for (const [token, unit, fallbackUnit] of rows) {
      const relatives = this.dic[token]?.relatives
      if ('string' === typeof relatives) {
        const match = text.match(new RegExp(`^(\\d+)${escape_regexp(relatives)}`))
        if (match) accept(token, unit, Number(match[1]), match[0])
      }
      if (relatives instanceof Array) {
        relatives.forEach((label, count) => {
          if (label && text.startsWith(label)) accept(token, unit, count, label)
        })
      }
      const match = text.match(new RegExp(`^(\\d+)${escape_regexp(fallbackUnit)}`))
      if (match) accept(token, unit, Number(match[1]), match[0])
    }
    return best
  }

  private span_parse_rows(): [Token, Unit, string][] {
    return [
      'y',
      'M',
      'd',
      'H',
      'm',
      's',
      'S',
      'Y',
      'w',
      'D',
      'a',
      'b',
      'c',
      'f',
      'A',
      'B',
      'C',
      'E',
      'F',
      'V',
      'N',
      'Q',
      'Z',
      'Zz',
      'u',
    ].map((token) => [
      token as Token,
      this.span_part_unit(token as Token),
      this.span_part_fallback_unit(token as Token),
    ])
  }

  private span_target(utc: number, parts: readonly SpanPart[]) {
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
      sourceDayOfYear: source.D.now_idx,
      sourceWeekSince: source.w.since,
      sourceDaySince: source.d.since,
      sourceHourSince: source.H.since,
      sourceMinuteSince: source.m.since,
      sourceSecondSince: source.s.since,
    }
    for (const { token: spanToken, unit, value } of parts) {
      let token = (spanToken ?? span_unit_token(unit)) as Token
      const amount = 0 - value
      if ('Y' === token) token = 'y'
      if ('D' === token) {
        target.M = 0
        target.M_is_leap = false
        target.d = target.sourceDayOfYear + amount
        target.changedRank = Math.max(target.changedRank, span_rank('d'))
        target.near += amount * this.unit_msec('day')
        continue
      }
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
        throw new Error(`cannot add cyclic span token ${token}`)
      }
      target[token] += amount
      if (token === 'y') target.u += amount
      target.changedRank = Math.max(target.changedRank, span_rank(token))
      target.near += amount * this.unit_msec(unit)
    }
    this.normalize_span_target(target)
    this.resolve_span_week_target(target)
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
    const day = this.to_tempos(month.last_at + dayIndex * this.calc.msec.day).d
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

  find(between: FindBetween, conditions: readonly FindCondition[], options: FindOptions = {}) {
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
    if (!conditions.length) {
      throw new Error('find requires conditions')
    }
    if (options.limit != null && (!Number.isInteger(options.limit) || options.limit < 0)) {
      throw new Error(`invalid limit ${options.limit}`)
    }
    if (!Number.isFinite(to - from) && options.limit == null) {
      throw new Error('unbounded find requires limit')
    }

    const unit = options.step ?? this.infer_find_step(conditions)
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

    const list: number[] = []
    if (order === 1) {
      let tempo = first
      if (tempo.last_at < from) {
        tempo = tempo.succ()
      }
      while (tempo.last_at < to && list.length < limit) {
        if (conditions.every((condition) => this.match_find_condition(tempo.last_at, condition))) {
          list.push(tempo.last_at)
        }
        tempo = tempo.succ()
      }
    } else {
      let tempo = first
      if (to <= tempo.last_at) {
        tempo = tempo.back()
      }
      while (from <= tempo.last_at && list.length < limit) {
        if (conditions.every((condition) => this.match_find_condition(tempo.last_at, condition))) {
          list.push(tempo.last_at)
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
      const candidate = this.find_step_for_token(token[0] as Token)
      if (this.find_step_rank(step) < this.find_step_rank(candidate)) {
        step = candidate
      }
    }
    return step
  }

  private find_step_for_token(token: Token): SteppableTempoKey {
    switch (token) {
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
      case 'A':
      case 'B':
      case 'C':
      case 'E':
      case 'F':
      case 'V':
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
  ): Span {
    if (!Number.isFinite(to - from)) {
      return this.with_span_anchor(from, to, { unit: 'year', value: NaN, label: '？？？' })
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
      const span = this.precise_span(from, to, 's')
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }
    if (fromTempos.H.last_at === toTempos.H.last_at) {
      const span = this.precise_span(from, to, 'm')
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }
    if (fromTempos.d.last_at === toTempos.d.last_at) {
      const span = this.precise_span(from, to, 'H')
      return this.with_span_anchor(from, to, span, this.next_span_at(to, span))
    }

    const parts = this.span_parts(from, to, 'd')
    for (const part of parts) {
      if (part.value) {
        return this.with_span_anchor(
          from,
          to,
          this.format_span_parts([part], part.value < 0 ? '後' : '前'),
          toTempos.d.next_at,
        )
      }
    }
    return this.with_span_anchor(
      from,
      to,
      { unit: 'day', value: 0, label: '今', parts: [] },
      toTempos.s.next_at,
    )
  }

  private with_span_anchor(from: number, to: number, span: Span, next_at?: number) {
    if (Number.isFinite(next_at) && to < next_at!) {
      span.next_at = next_at
      span.timeout = next_at! - to
    }
    Object.defineProperty(span, span_anchor, {
      value: [from, to, this] as const,
      enumerable: false,
    })
    return span
  }

  private precise_span(from: number, to: number, precision: Precision): Span {
    const parts = this.span_parts(from, to, precision)

    return this.format_span_parts(parts, to < from ? '後' : '前')
  }

  private next_precise_span_at(at: number, precision: Precision) {
    return this.to_tempos(at)[precision]?.next_at
  }

  private next_span_at(at: number, span: Span) {
    const token = span.parts?.[0]?.token
    return token ? this.to_tempos(at)[token]?.next_at : undefined
  }

  private span_parts(from: number, to: number, precision: Precision) {
    const [earlier, later] = from <= to ? [from, to] : [to, from]
    const sign = from <= to ? 1 : -1
    const earlierTempos = this.to_tempos(earlier)
    const laterTempos = this.to_tempos(later)
    const rows = this.hierarchical_span_rows(precision, earlierTempos, laterTempos)
    if (!rows) return this.token_span_parts(from, to, precision)
    const rank = rows.findIndex(([token]) => token === precision)
    const diffs = rows.map(([, , , start, end]) => end - start)
    for (let index = Math.min(rank, rows.length - 1); 0 < index; index--) {
      if (0 <= diffs[index] || !Number.isFinite(rows[index][5])) continue
      diffs[index] += rows[index][5]
      diffs[index - 1]--
    }
    return rows
      .slice(0, rank + 1)
      .map(([token, unit, fallbackUnit], index) => {
        const count = Math.abs(diffs[index])
        const unitLabel = this.dic.labels[token] ?? fallbackUnit
        return {
          token,
          unit,
          value: diffs[index] * sign,
          label: this.span_part_label(token, count, unitLabel),
        }
      })
      .filter(({ value }) => value)
  }

  private hierarchical_span_rows(precision: Precision, earlierTempos: Tempos, laterTempos: Tempos) {
    const coreRows: [Token, Unit, string, number, number, number][] = [
      ['y', 'year', '年', earlierTempos.y.now_idx, laterTempos.y.now_idx, Infinity],
      ['M', 'month', 'ヶ月', earlierTempos.M.now_idx, laterTempos.M.now_idx, this.dic.M.length],
      [
        'd',
        'day',
        '日',
        earlierTempos.d.now_idx,
        laterTempos.d.now_idx,
        earlierTempos.M.size / this.calc.msec.day,
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

  private token_span_parts(from: number, to: number, token: Token) {
    const fromTempo = this.to_tempos(from)[token]
    const toTempo = this.to_tempos(to)[token]
    if (!fromTempo || !toTempo) return []
    const value = toTempo.now_idx - fromTempo.now_idx
    return [
      {
        token,
        unit: this.span_part_unit(token),
        value,
        label: this.span_part_label(token, Math.abs(value), this.span_part_fallback_unit(token)),
      },
    ].filter(({ value }) => value)
  }

  private span_part_unit(token: Token): Unit {
    switch (token) {
      case 'y':
      case 'u':
      case 'Y':
      case 'a':
      case 'b':
      case 'c':
      case 'f':
        return 'year'
      case 'M':
      case 'N':
      case 'Q':
        return 'month'
      case 'd':
      case 'D':
      case 'w':
      case 'A':
      case 'B':
      case 'C':
      case 'E':
      case 'F':
      case 'V':
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

  private span_part_label(unit: keyof Tempos, count: number, fallbackUnit: string) {
    const indexer = this.dic[unit]
    const relatives = indexer?.relatives
    if ('string' === typeof relatives) return `${count}${relatives}`
    const label = relatives?.[count]
    return label != null ? label : `${count}${fallbackUnit}`
  }

  match_find_condition(utc: number, condition: FindCondition) {
    return Object.entries(condition).every(([format, matcher]) => {
      if (format === 'note') {
        return this.note(utc).some((note) => this.match_find_value(note, matcher))
      }
      return this.match_find_value(this.format(utc, format), matcher)
    })
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
    return 'string' === typeof to && from == null && (to === '今' || /(?:前|後)$/.test(to))
  }

  dup() {
    return new FancyDate(this)
  }

  def_regex() {
    let A, B, C, D, E, F, G, H, N, Q, S, V, Y, Z
    let a, b, c, d, f, m, p, s, w, x, y
    const number = (fallback?: string) => this.number_pattern(fallback)
    ;(() => {
      A = B = C = E = F = G = H = N = V = Z = a = b = c = f = m = p = s = strategy
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
        F,
        G,
        H,
        J,
        M,
        N,
        Q,
        S,
        V,
        Y,
        Z,
        a,
        b,
        c,
        d,
        f,
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
        indexer.regex = func(indexer.list)
      }
    })()
    ;(() => {
      H = N = Q = V = d = m = s = strategy
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

      const object = { H, M, N, Q, V, Z, d, m, s }

      for (const key in object) {
        const func: RegexFactory = object[key]
        const indexer: Indexer = this.dic[key]
        indexer.regex_o = func(indexer.list)
      }
    })()

    function strategy(list: string[]) {
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
    let A, a, b, B, c, C, D, d, E, f, F, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z
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
      F =
      M =
      V =
      Z =
      a =
      b =
      c =
      d =
      f =
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
      F,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      V,
      Y,
      Z,
      a,
      b,
      c,
      d,
      f,
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
      indexer.to_idx = val
    }
  }

  def_to_label() {
    let A, B, C, E, F, N, Q, S, V, Y, Z
    let a, b, c, d, f, m, p, s, u, w, x, y
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

    function month(cb: LabelFactory): LabelFactory {
      return (list, val, size) => `${val.is_leap ? '閏' : ''}${cb(list, val, size)}`
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
    // ('Gy年M月d日(E)H時m分s秒' 等、M の直後にリテラル「月」が続く)を
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
    A = B = C = E = F = V = Z = a = b = c = f = at(integer(1))
    const object = {
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      V,
      Y,
      Z,
      a,
      b,
      c,
      d,
      f,
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
      indexer.to_value = val
    }

    M = month(at(integer(1)))
    H = N = m = s = at(integer(0))
    A = B = C = E = F = Q = V = Z = a = b = c = d = f = at(integer(1))
    const object1 = { A, B, C, E, F, H, M, N, Q, V, Z, a, b, c, d, f, m, s }
    for (const key in object1) {
      const val: LabelFactory = object1[key]
      const indexer: Indexer = this.dic[key]
      indexer.to_label = val
    }

    const cut = () => ''
    M = month(at(cut))
    A = B = C = E = F = H = N = Q = V = Z = a = b = c = d = f = m = s = at(cut)
    const object2 = { A, B, C, E, F, H, M, N, Q, V, Z, a, b, c, d, f, m, s }
    for (const key in object2) {
      const val: LabelFactory = object2[key]
      const indexer: Indexer = this.dic[key]
      indexer.to_ruby = val
    }
  }

  def_calc() {
    const season = sub_define(this.calc.msec.year, this.dic.Z.length)
    const month = daily_measure(this.calc.msec.year / this.dic.M.length, this.calc.msec.day)
    const week = daily_define(this.dic.E.length * this.calc.msec.day, this.calc.msec.day)

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
      const leap_shift = this.dic.leap_shift || 0
      range.year = []
      for (let idx = 0; idx < period; idx++) {
        const rel_idx = mod(idx - leap_shift, period)
        let is_leap = 0
        for (let mode = 0; mode < leaps.length; mode++) {
          const div = leaps[mode]
          if (rel_idx % div) continue
          is_leap = (!mode as any as number) % 2
        }
        range.year.push(this.calc.range.year[is_leap])
      }
      range.year[mod(leap_shift, period)] = this.calc.range.year[1]
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
    o.Z = (this.dic.Z.length * 1) / 8
    const year = (period || 0) * o.p + o.y
    const year_s = year - o.f
    const year10 = year - o.c
    const year12 = year - o.b
    const year60 = year - o.a
    Object.assign(this.calc.zero, { year10, year12, year60, year_s })
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
    let month = NaN
    let period = NaN

    if (this.is_table_leap) {
      const year_size = Math.floor(this.calc.msec.day * this.table.range.year[this.calc.idx.y])
      month = day - (this.table.msec.month[year_size][this.calc.idx.M - 1] || 0)
      year = month - (this.table.msec.year[this.calc.idx.y - 1] || 0)
      period = year + zero_size('p', 'period')
    } else {
      if (this.is_table_month) {
        month = day - (Object.values(this.table.msec.month)[0][this.calc.idx.M - 1] || 0)
      } else {
        month = day + zero_size('M', 'moon')
      }

      year = month + zero_size('y', 'year')
    }

    // 単純のため平気法。
    const sunny_epoch = this.dic.sunny.epochMsec
    const 啓蟄 = sunny_epoch - (1 / 6 - 1 / 8) * this.dic.Z.length * this.calc.msec.season
    let { last_at } = to_tempo_bare(this.calc.msec.year, 啓蟄, period || year)
    const spring = last_at

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
    const week = day + zero_size('E', 'day')
    const day_9 = day + zero_size('F', 'day')
    const day10 = day + zero_size('C', 'day')
    const day12 = day + zero_size('B', 'day')
    const day60 = day + zero_size('A', 'day')
    const day28 = day + zero_size('V', 'day')
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
      day_9,
      day10,
      day12,
      day28,
      day60,
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
        is_just(this.dic.c.length, this.dic.a.length) &&
        is_just(this.dic.b.length, this.dic.a.length),
      is_legal_ETO:
        is_just(this.dic.C.length, this.dic.A.length) &&
        is_just(this.dic.B.length, this.dic.A.length),
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
    return resolve雑節ByMean(Zz, d, this.calc.msec.day, this.calc.zero.day10, this.dic.C.length)
  }

  雑節_by_phase(utc: number) {
    return resolve雑節ByPhase(
      this.dic.sunny,
      this.calc.msec.day,
      this.calc.zero.day,
      this.calc.zero.day10,
      this.dic.C.length,
      utc,
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

  note(
    utc: number,
    tempos = this.to_tempos(utc),
    arg1 = this.雑節(utc, tempos),
    arg2 = this.節句(utc, tempos),
  ) {
    let k
    const list: string[] = []
    for (k in arg1) {
      const t = arg1[k]
      if (t.is_cover(tempos.d.center_at)) {
        list.push(
          k
            .match(/.(彼岸|社日|節分|土用)|(.+)/)
            .slice(1)
            .join(''),
        )
      }
    }
    for (let root in arg2) {
      const arg3 = arg2[root]
      for (k in arg3) {
        const [M, d, B, E] = arg3[k]
        if (M && M !== tempos.M.now_idx) continue
        if (d && d !== tempos.d.now_idx) continue
        if (B && B !== tempos.B.now_idx) continue
        if (E && E !== tempos.E.now_idx) continue
        list.push(k)
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

    const J = Tempo.at(new FixedTempoRule(this.calc.msec.day, this.calc.zero.jd), {
      write_at: utc,
    }) // ユリウス日

    // season in year_of_planet
    const Zz = Tempo.at(new FixedTempoRule(this.calc.msec.year, this.calc.zero.season), {
      write_at: utc,
    }) // 太陽年
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
    const usesObservedLunisolar =
      !this.is_table_month && hasSolarEvents(this.dic.sunny) && hasLunarEvents(this.dic.moony)
    if (this.dic.moony && moon_msec != null && !usesObservedLunisolar) {
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
      N = Tempo.at(new SubdivideTempoRule(this.calc.msec.day), {
        write_at: utc,
        parent: envelope_of(Nn),
      })
    }

    if (this.is_table_leap) {
      p = Tempo.at(new FixedTempoRule(this.calc.msec.period, this.calc.zero.period), {
        write_at: utc,
      })
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
      u = Tempo.at(new TableTempoRule(this.table.msec.year, this.calc.zero.period), {
        write_at: utc,
      })
      M = Tempo.at(new TableTempoRule(this.table.msec.month[u.size], u.last_at), {
        write_at: utc,
      }) as Tempo<TempoBase> & TempoMonth
      d = Tempo.at(new SubdivideTempoRule(this.calc.msec.day), {
        write_at: utc,
        parent: envelope_of(M),
      })
    } else {
      if (this.is_table_month) {
        u = Tempo.at(
          new FloorTempoRule(this.calc.msec.year, this.calc.zero.spring, [
            { size: this.calc.msec.day, zero: this.calc.zero.day },
          ]),
          { write_at: utc },
        )
        M = Tempo.at(new TableTempoRule(this.table.msec.month[u.size], u.last_at), {
          write_at: utc,
        }) as Tempo<TempoBase> & TempoMonth
        d = Tempo.at(new SubdivideTempoRule(this.calc.msec.day), {
          write_at: utc,
          parent: envelope_of(M),
        })
      } else {
        if (usesObservedLunisolar) {
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
            new EraAdjustedTempoRule(
              new ObservedLunisolarYearRule((at) => this.lunisolar(at)),
              this.calc.msec.year,
              this.table.msec.era,
              this.calc.zero.era,
              this.calc.eras,
            ),
            { write_at: utc },
          )
          M = Tempo.at(new ObservedLunisolarMonthRule((at) => this.lunisolar(at), moon_msec), {
            write_at: utc,
          }) as Tempo<TempoBase> & TempoMonth
          // d(月内日)は M の実区間(last_at)からの経過日数として求まる値
          // (lunisolar.day - 1 と数値的に同じ)。SubdivideTempoRule で
          // 構築すれば、通常の(TempoView)succ()/back() がそのまま安全に
          // 使える(以前は to_tempo_bare()+now_idx上書きの素の Tempo だった
          // ため、succ() が Tempo.slide() の非テーブル分岐で
          // 「calc.zero.day からの絶対日数」を計算してしまい、月内日として
          // 使えない値になっていた。last_at 自体は正しかったため find()/
          // to_table() には実害がなかったが、succ() の戻り値を直接使う
          // 呼び出し元には正しくない値を返していた)。
          d = Tempo.at(new SubdivideTempoRule(this.calc.msec.day), {
            write_at: utc,
            parent: envelope_of(M),
          })
          N = d
        } else if (!Nn || !N) {
          throw new Error('Lunar month calculation requires a satellite orbital period.')
        } else {
          u = Tempo.at(
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
            { write_at: utc },
          )
          M = Nn
          d = N
        }
      }
    }

    // hour minute second  in day
    if (this.dic.is_solor) {
      H = Tempo.at(this.solar_hour_rule(), { write_at: utc, day: envelope_of(d) })
      m = Tempo.at(new SubdivideTempoRule(H.size / this.dic.m.length), {
        write_at: utc,
        parent: envelope_of(H),
      })
    } else {
      H = Tempo.at(new SubdivideTempoRule(this.calc.msec.hour), {
        write_at: utc,
        parent: envelope_of(d),
      })
      m = Tempo.at(new SubdivideTempoRule(this.calc.msec.minute), {
        write_at: utc,
        parent: envelope_of(H),
      })
    }
    const s = Tempo.at(new SubdivideTempoRule(this.calc.msec.second), {
      write_at: utc,
      parent: envelope_of(m),
    })
    const S = Tempo.at(new SubdivideTempoRule(this.calc.msec.msec), {
      write_at: utc,
      parent: envelope_of(s),
    })

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
        // u(年)の元号調整自体は、u を構築した EraAdjustedTempoRule が
        // 内部で行っている(observed-lunisolar/mean-lunisolar 分岐)。
        // is_table_leap/is_table_month 分岐には元号を持つサンプル暦が
        // 存在しないため、u 側の調整は未実装のまま(現状は常に
        // this.calc.eras が空でこの if 自体に入らない)。ここでは
        // G のラベルだけを解決する。
        G.label = era[0]
      }
    }

    const y = u.copy()
    if (y.now_idx < 1) {
      G.label = this.dic.G.list[0] || '紀元前'
      y.now_idx = 1 - y.now_idx
    }
    const x = this.dic.x.tempo

    // u はここまでで確定している(era 調整含む)ので、以降 u の実区間を
    // 参照する箇所(D/Y/a/b/c/f)はすべてこの envelope を使い回す。
    const uEnvelope = envelope_of(u)

    // 年初来番号
    const w0 = Tempo.at(new FixedTempoRule(this.calc.msec.week, this.calc.zero.week), {
      write_at: u.last_at,
    })
    const w = Tempo.at(new SubdivideTempoRule(this.calc.msec.week), {
      write_at: utc,
      parent: envelope_of(w0),
    })
    const D = Tempo.at(new SubdivideTempoRule(this.calc.msec.day), {
      write_at: utc,
      parent: uEnvelope,
    })

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
    const a = cyclic_label(uEnvelope, mod(u.raw_now_idx - this.calc.zero.year60, this.dic.a.length))
    const b = cyclic_label(uEnvelope, mod(u.raw_now_idx - this.calc.zero.year12, this.dic.b.length))
    const c = cyclic_label(uEnvelope, mod(u.raw_now_idx - this.calc.zero.year10, this.dic.c.length))
    const f = cyclic_label(uEnvelope, mod(u.raw_now_idx - this.calc.zero.year_s, this.dic.f.length))

    // 月不断(四半期は月をまたぐため、区間は M(現在の月)のものをそのまま使う。
    // 四半期全体の境界ではない点に注意)
    const Q = cyclic_label(envelope_of(M), Math.floor((4 * M.now_idx) / this.dic.M.length))

    // 日不断(固定 zero からの周期を length で割った余りをラベルにする)
    const A = Tempo.at(
      new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.day60, this.dic.A.length),
      {
        write_at: utc,
      },
    )
    const B = Tempo.at(
      new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.day12, this.dic.B.length),
      {
        write_at: utc,
      },
    )
    const C = Tempo.at(
      new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.day10, this.dic.C.length),
      {
        write_at: utc,
      },
    )
    const F = Tempo.at(
      new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.day_9, this.dic.F.length),
      {
        write_at: utc,
      },
    )

    let E: TempoLike | TempoLabelLike
    let V: TempoLike | TempoLabelLike
    if (this.is_table_leap) {
      // 旧暦では、週は月初にリセットする。
      E = Tempo.at(
        new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.week, this.dic.E.length),
        {
          write_at: utc,
        },
      )
      V = Tempo.at(
        new CyclicDayTempoRule(this.calc.msec.day, this.calc.zero.day28, this.dic.V.length),
        {
          write_at: utc,
        },
      )
    } else {
      // 月/日の位置から直接導く番号であり、固定 zero からの日周期(A/B/C/F や
      // is_table_leap の E/V)とは別の意味付けなので、CyclicDayTempoRule
      // (TempoView) には載せない。この now_idx は日周期の連番ではなく
      // 月/日から都度導く値であり、succ()/back() を正確に実装できない
      // (resolve_orbital_season の Z / mean-lunisolar の Nn と同じ理由)。
      // 実区間は今日(d)そのものなので、d の envelope をそのまま使う。
      const dEnvelope = envelope_of(d)
      E = cyclic_label(dEnvelope, mod(M.now_idx + d.now_idx, this.dic.E.length))
      V = cyclic_label(
        dEnvelope,
        mod([11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9][M.now_idx] + d.now_idx, this.dic.V.length),
      )
    }

    return {
      Zz,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      J,
      M,
      N,
      Q,
      S,
      V,
      Y,
      Z,
      a,
      b,
      c,
      d,
      f,
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

    const iterable = items.slice(1)
    for (let p = 0; p < iterable.length; p++) {
      let s = iterable[p]
      const token = tokens[p]
      const [top] = token
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
    return data
  }

  index(src: string, str = this.dic.parse, _disuse = 0) {
    const tokens = str.match(reg_token)!
    const data = this.get_dic(src, tokens, this.regex(tokens))

    if (data.G_is_past) {
      if (tokens.some((token) => 'y' === token[0])) {
        data.y = 1 - data.y
      }
      if (tokens.some((token) => 'Y' === token[0])) {
        data.Y = 1 - data.Y
      }
      delete data.G_is_past
    }

    if (this.is_table_leap) {
      data.p = Math.floor(data.y / this.dic.p.length)
      data.y = data.y - data.p * this.dic.p.length
    }
    data.c = mod(data.a, this.dic.c.length)
    data.b = mod(data.a, this.dic.b.length)
    data.C = mod(data.A, this.dic.C.length)
    data.B = mod(data.A, this.dic.B.length)
    return data
  }

  regex(tokens) {
    const reg = ['^']
    const escape_regex = (value: string) => value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
    tokens.forEach((token) => {
      const [top, mode] = token
      const dic = this.dic[top]
      if (dic) {
        if (('y' === top || 'Y' === top) && !'or'.includes(mode)) {
          const past = this.dic.G.list[0]
          const prefix = past ? `(?:${escape_regex(past)}|-)?` : '-?'
          reg.push(`(${prefix}${this.number_pattern()})`)
        } else if ('or'.includes(mode)) {
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

    utc += Z * this.calc.msec.season + d * this.calc.msec.day
    const moon_msec = this.calc.msec.moon
    if (this.dic.moony && moon_msec != null) {
      utc += N * moon_msec
    }

    // year section
    if (this.is_table_leap) {
      utc += this.calc.zero.period + p * this.calc.msec.period + (this.table.msec.year[y - 1] || 0)

      year_size = Math.floor(this.calc.msec.day * this.table.range.year[y])
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

      last_at = new FloorTempoRule(moon_msec, this.calc.zero.moon, [
        { size: this.calc.msec.day, zero: this.calc.zero.day },
      ]).at(M_utc).last_at
      utc += last_at - base
    }
    return utc
  }

  format_by(tempos: Tempos, str = this.dic.format) {
    const tokens = str.match(reg_token)!
    const has_era = tokens.some((token) => 'G' === token[0])
    const past = this.dic.G.list[0]
    const signed_year = (year: number, size: number) => {
      if (year < 0) {
        return `-${this.format_number(-year, size)}`
      }
      return this.format_number(year, size)
    }
    return tokens
      .map((token) => {
        const [top, mode] = token
        const val = tempos[top]
        if (val) {
          const dic = this.dic[top]

          switch (mode) {
            case 'r':
              return dic.to_ruby(dic.rubys, val, token.length)
            case 'o':
              return dic.to_label(dic.list, val, token.length)
            default:
              if ('y' === top && !has_era && past && tempos.G?.label === past) {
                return signed_year(1 - val.now_idx, token.length)
              }
              if ('Y' === top) {
                if (has_era && val.now_idx < 1) {
                  return this.format_number(1 - val.now_idx, token.length)
                }
                if (!has_era) {
                  return signed_year(val.now_idx, token.length)
                }
              }
              return dic.to_value(dic.list, val, token.length)
          }
        } else {
          return token
        }
      })
      .join('')
  }

  tree() {
    const { y, M, d, H, m, s, A, B, C, E, F, V, a, b, c, f } = this.dic
    const yyyy = [
      [a, b, c, f, y],
      ['ao ar', 'bo br', 'co cr', 'fo fr', 'Gy'],
    ]
    const eeee = [
      [A, B, C, E, F, V],
      ['Ao Ar', 'Bo Br', 'Co Cr', 'Fo Fr', 'Vo Vr'],
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

function span_unit_token(unit: Unit): keyof TempoDiff {
  switch (unit) {
    case 'year':
      return 'y'
    case 'month':
      return 'M'
    case 'day':
      return 'd'
    case 'hour':
      return 'H'
    case 'minute':
      return 'm'
    case 'second':
      return 's'
    case 'msec':
      return 'S'
  }
}
