import { Tempo } from './time'
export declare type ERA = readonly [string, number, string?]
export declare type ERA_WITH_YEAR = readonly [string, number, number]
export declare type STAR = readonly [null, null, null]
export declare type PLANET = readonly [STAR, ORBITAL, ROTATION]
export declare type SATELLITE = readonly [PLANET, ORBITAL, ROTATION?]
export declare type SPOT = readonly [SATELLITE, number, number, number]
declare type TIMEZONE = readonly [number, number, number]
declare type ORBITAL = readonly [number, number]
declare type ROTATION = readonly [number, number, number]
declare type ALL_DIC =
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
declare type ALGO_DIC =
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
  | 'f'
  | 'm'
  | 's'
declare type MSEC_CALC =
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
declare type RANGE_CALC = 'year' | 'month' | 'hour' | 'minute' | 'second'
declare type ZERO_CALC =
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
declare type TempoDiff = TOKENS<ALL_DIC, number>
declare type TempoIdxs = TOKENS<ALL_DIC, number> & {
  M_is_leap: boolean
}
declare type TempoMonth = {
  is_leap: boolean
}
declare type Tempos = {
  Zz: Tempo
  A: Tempo
  B: Tempo
  C: Tempo
  D: Tempo
  E: Tempo
  F: Tempo
  G: Tempo
  H: Tempo
  J: Tempo
  M: Tempo & TempoMonth
  N: Tempo
  Q: Tempo
  S: Tempo
  V: Tempo
  Y: Tempo
  Z: Tempo
  a: Tempo
  b: Tempo
  c: Tempo
  d: Tempo
  f: Tempo
  m: Tempo
  p: Tempo | undefined
  s: Tempo
  u: Tempo
  w: Tempo
  x: Tempo | undefined
  y: Tempo
}
declare type NUMBER_RANGE = [number, number?]
declare type MEASURE = {
  range: NUMBER_RANGE
  msec: number
}
declare type IIDX = TOKENS<ALL_DIC, Indexer>
declare type IDIC = IIDX & {
  parse: string
  format: string
  sunny: ORBITAL
  moony: ORBITAL
  earthy: ROTATION
  geo: TIMEZONE
  era: string
  eras: ERA[]
  month_divs: number[]
  leaps: number[]
  start: [string, string, number]
  is_solor: boolean
}
declare type ICALC = {
  eras: ERA_WITH_YEAR[]
  idx: TOKENS<ALL_DIC, number>
  zero: TOKENS<ZERO_CALC, number>
  msec: TOKENS<MSEC_CALC, number>
  range: TOKENS<RANGE_CALC, [number, number]>
}
declare type TOKENS<K extends string, T> = {
  [key in K]: T
}
declare type IndexFactory = (this: Indexer, s: string) => number
declare type LabelFactory = (
  list: readonly string[] | null,
  val: Tempo & {
    is_leap: boolean
  },
  size: number
) => string
declare type IndexerProps = [] | [number] | readonly [readonly string[], readonly string[] | null]
declare class Indexer {
  tempo?: Tempo
  list: readonly string[]
  rubys: readonly string[]
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
  constructor(o?: FancyDate)
  spot(...spot: SPOT): this
  lang(parse: string, format: string): this
  era(era: string, past: string, eras?: ERA[]): this
  calendar(
    start?: (string | number)[],
    leaps?: number[] | null,
    month_divs?: (number | null)[] | null
  ): this
  algo(o: Partial<TOKENS<ALGO_DIC, IndexerProps>>): this
  daily(is_solor?: string | boolean): this
  init(): this
  yeary_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  monthry_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  weekly_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  time_table(utc: number): [string, string, string, string, (string[] | undefined)?][]
  succ_index(diff: string): TempoIdxs
  back_index(diff: string): TempoIdxs
  succ_msec(utc: number, diff: string): number
  back_msec(utc: number, diff: string): number
  succ(utc: number, diff: string): number
  back(utc: number, diff: string): number
  slide(utc: number, diff?: TempoDiff): number
  parse(tgt: string, str?: string): number
  format(utc: number, str?: string): string
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
    utc: any,
    { last_at, center_at }?: Tempo
  ): {
    T0: Tempo
    T1: Tempo
    季節: number
    南中差分: number
    南中時刻: number
    真夜中: number
  }
  solor(
    utc: any,
    idx?: number,
    {
      季節,
      南中時刻,
      真夜中,
    }?: {
      T0: Tempo
      T1: Tempo
      季節: number
      南中差分: number
      南中時刻: number
      真夜中: number
    }
  ): {
    K: number
    lat: number
    時角: number
    方向: number
    高度: number
    真夜中: number
    日の出: number
    南中時刻: number
    日の入: number
  }
  節句(
    utc: number,
    { M, d, B, E }?: Tempos
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
    { Zz, u, d }?: Tempos
  ): {
    立春: Tempo
    立夏: Tempo
    立秋: Tempo
    立冬: Tempo
    冬至: Tempo
    春分: Tempo
    夏至: Tempo
    秋分: Tempo
    入梅: Tempo
    半夏生: Tempo
    春: Tempo
    夏: Tempo
    秋: Tempo
    冬: Tempo
    春社日: Tempo
    秋社日: Tempo
    春土用: Tempo
    夏土用: Tempo
    秋土用: Tempo
    冬土用: Tempo
    春節分: Tempo
    夏節分: Tempo
    秋節分: Tempo
    冬節分: Tempo
    節分: Tempo
    春彼岸: Tempo
    秋彼岸: Tempo
    八十八夜: Tempo
    二百十日: Tempo
    二百二十日: Tempo
  }
  to_tempo_by_solor(utc: number, day: any): Tempo
  note(
    utc: number,
    tempos?: Tempos,
    arg1?: {
      立春: Tempo
      立夏: Tempo
      立秋: Tempo
      立冬: Tempo
      冬至: Tempo
      春分: Tempo
      夏至: Tempo
      秋分: Tempo
      入梅: Tempo
      半夏生: Tempo
      春: Tempo
      夏: Tempo
      秋: Tempo
      冬: Tempo
      春社日: Tempo
      秋社日: Tempo
      春土用: Tempo
      夏土用: Tempo
      秋土用: Tempo
      冬土用: Tempo
      春節分: Tempo
      夏節分: Tempo
      秋節分: Tempo
      冬節分: Tempo
      節分: Tempo
      春彼岸: Tempo
      秋彼岸: Tempo
      八十八夜: Tempo
      二百十日: Tempo
      二百二十日: Tempo
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
    }
  ): string[]
  to_tempos(utc: number): Tempos
  get_dic(tgt: string, tokens: string[], reg: RegExp): TempoIdxs
  get_diff(
    src: string,
    f: {
      (num: string | null): number
    }
  ): TempoIdxs
  index(src: string, str?: string, _disuse?: number): TempoIdxs
  regex(tokens: any): RegExp
  to_table(
    utc: number,
    bk: string,
    ik: string,
    has_notes?: boolean
  ): [string, string, string, string, (string[] | undefined)?][]
  parse_by(data: TempoIdxs, diff?: TempoDiff): number
  format_by(tempos: Tempos, str?: string): string
  slide_by(o: Tempos, diff?: TempoDiff): number
  tree(): (Indexer | (string[] | Indexer[])[])[]
}
export {}
