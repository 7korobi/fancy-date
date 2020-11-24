import _cloneDeep from 'lodash/cloneDeep'
import _padStart from 'lodash/padStart'

import { Tempo, to_tempo_by, to_tempo_bare } from './time'
import { jpn, old_jpn } from './number'

export type ERA = readonly [string, number, string?]
export type ERA_WITH_YEAR = readonly [string, number, number]
export type STAR = readonly [null, null, null]
export type PLANET = readonly [STAR, ORBITAL, ROTATION]
export type SATELLITE = readonly [PLANET, ORBITAL, ROTATION?]
export type SPOT = readonly [SATELLITE, number, number, number]

type TIMEZONE = readonly [number, number, number]
type ORBITAL = readonly [number, number]
type ROTATION = readonly [number, number, number]

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

type TempoDiff = TOKENS<ALL_DIC, number>
type TempoIdxs = TOKENS<ALL_DIC, number> & {
  M_is_leap: boolean
}
type TempoMonth = {
  is_leap: boolean
}
type TempoDrillDown = {
  length: number
  path: string
}
type Tempos = {
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

const core_tokens = 'GHMSdmpsy'
const main_tokens = 'ABCEFabcfx' + core_tokens
const sub_tokens = 'DJNQVYZuw'
const all_tokens = main_tokens + sub_tokens

const diff_token = /(\d+)(?:([ABCDEFGHJMNQSVYZabcdfmpsuwxy])|[ヶ]?([元年月季節週日時分秒])[間]?([半]?))/g
const reg_token = /([ABCEFHMNQVZabcdfms][or]|([ABCDEFGHJMNQSVYZabcdfmpsuwxy])\2*)|''|'(''|[^'])+('|$)|./g

type NUMBER_RANGE = [number, number?]
type MEASURE = {
  range: NUMBER_RANGE
  msec: number
}

type PI_DIC = Partial<IDIC>
type IIDX = TOKENS<ALL_DIC, Indexer>
type IDIC = IIDX & {
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

type ICALC = {
  eras: ERA_WITH_YEAR[]
  idx: TOKENS<ALL_DIC, number>
  zero: TOKENS<ZERO_CALC, number>
  msec: TOKENS<MSEC_CALC, number>
  range: TOKENS<RANGE_CALC, [number, number]>
}

type TOKENS<K extends string, T> = {
  [key in K]: T
}

const 単位系 = {
  元: 'G',
  年: 'y',
  月: 'M',
  季: 'Z',
  節: 'Z',
  週: 'w',
  日: 'd',
  時: 'H',
  分: 'm',
  秒: 's',
}

function calc_set(
  this: FancyDate,
  path: keyof MEASURE,
  o: Partial<TOKENS<ALL_CALC, MEASURE | number>>
) {
  for (let key in o) {
    const val = o[key]
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

function to_indexs<T>(zero: T): TOKENS<ALL_DIC, T> {
  let A, a, b, B, c, C, d, D, E, f, F, G, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z
  A = B = C = D = E = F = G = H = J = M = N = Q = S = V = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = zero
  return { A, B, C, D, E, F, G, H, J, M, N, Q, S, V, Y, Z, a, b, c, d, f, m, p, s, u, w, x, y }
}

const shift_up = function (a, b, size) {
  if (0 <= b && b <= size) {
    return arguments
  }
  a += Math.floor(b / size)
  b = __mod__(b, size)
  return [a, b]
}

type RegexFactory = (list: readonly string[]) => string
type IndexFactory = (this: Indexer, s: string) => number
type LabelFactory = (
  list: readonly string[] | null,
  val: Tempo & { is_leap: boolean },
  size: number
) => string

type IndexerProps = [] | [number] | readonly [readonly string[], readonly string[] | null]
class Indexer {
  tempo?: Tempo
  list: readonly string[] = []
  rubys: readonly string[] = []
  length: number = 0
  zero: number = 0
  regex: string = ''
  regex_o: string = ''
  to_idx: IndexFactory = () => 0
  to_value: LabelFactory = () => ''
  to_label: LabelFactory = () => ''
  to_ruby: LabelFactory = () => ''

  constructor(arg: IndexerProps) {
    const [list, rubys] = arg
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
    if ('number' === typeof zero) {
      this.zero = zero
    }
  }
}

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

  constructor(o?: FancyDate) {
    if (o) {
      ;({ dic: this.dic, calc: this.calc } = _cloneDeep(o))
    } else {
      this.dic = {
        parse: 'y年M月d日',
        format: 'Gy年M月d日(E)H時m分s秒',
      } as any

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
    const [[[, sunny, earthy], moony], ...geo] = spot
    Object.assign(this.dic, { sunny, moony, earthy, geo })
    return this
  }

  lang(parse: string, format: string) {
    Object.assign(this.dic, { parse, format })
    return this
  }

  era(era: string, past: string, eras: ERA[] = []) {
    const all_eras = [past, ...eras.map(([s]) => s)]
    this.dic.G = new Indexer([all_eras, null])
    Object.assign(this.dic, { era, eras })
    return this
  }

  calendar(
    start = ['1970-1-1 0:0:0', 'y-M-d H:m:s', 0],
    leaps: number[] | null = null,
    month_divs: (number | null)[] | null = null
  ) {
    Object.assign(this.dic, { month_divs, leaps, start })
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
      A.list = a.list = [...Array(A.length)].map((o, idx) => {
        const c = C.list[idx % C.length]
        const b = B.list[idx % B.length]
        return `${c}${b}`
      })
    }

    if (C.rubys && B.rubys) {
      A.rubys = a.rubys = [...Array(a.length)].map((o, idx) => {
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

  init() {
    const { sunny, moony, earthy, leaps, month_divs } = this.dic
    const year = daily_measure(sunny[0], earthy[0])
    const day = daily_define(earthy[0], earthy[0])
    const moon = moony && daily_measure(moony[0], earthy[0])
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

  succ_index(diff: string) {
    return this.get_diff(diff, (n) => Number(n) - 0)
  }
  back_index(diff: string) {
    return this.get_diff(diff, (n) => 0 - Number(n))
  }

  succ_msec(utc: number, diff: string) {
    return this.succ(utc, diff) - utc
  }
  back_msec(utc: number, diff: string) {
    return this.back(utc, diff) - utc
  }

  succ(utc: number, diff: string) {
    return this.slide(utc, this.succ_index(diff))
  }
  back(utc: number, diff: string) {
    return this.slide(utc, this.back_index(diff))
  }
  slide(utc: number, diff?: TempoDiff) {
    return this.slide_by(this.to_tempos(utc), diff)
  }

  parse(tgt: string, str?: string) {
    return this.parse_by(this.index(tgt, str))
  }
  format(utc: number, str?: string) {
    return this.format_by(this.to_tempos(utc), str)
  }

  dup() {
    return new FancyDate(this)
  }

  def_regex() {
    let A, B, C, D, E, F, G, H, N, Q, S, V, Y, Z
    let a, b, c, d, f, m, p, s, w, x, y
    ;(() => {
      A = B = C = E = F = G = H = N = V = Z = a = b = c = f = m = p = s = strategy
      const M = () => '(閏?\\d+)'
      const u = () => '([-\\d]+)'
      D = Q = S = Y = d = w = y = () => '(\\d+)'
      const J = (x = () => '([\\d.]+)')
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
        if (list && list.length) {
          if (list.every((s) => 1 === s.length)) {
            return `(閏?[${list.join('')}])`
          }
          if (list.join) {
            return `(閏?(?:${list.join('|')}))`
          }
        }
        return '(閏?\\d+)'
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
      return '(\\d+)'
    }
  }

  def_to_idx() {
    let A, a, b, B, c, C, D, d, E, f, F, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z
    const G = function (this: Indexer, s: string): number {
      const idx = this.list?.indexOf(s)
      if (-1 < idx) {
        return idx
      } else {
        return (s as any) - 0
      }
    }
    H = N = m = s = function (this: Indexer, s: string): number {
      const idx = this.list?.indexOf(s)
      if (-1 < idx) {
        return idx
      } else {
        return (s as any) - 0
      }
    }

    A = B = C = E = F = M = V = Z = a = b = c = d = f = function (
      this: Indexer,
      s: string
    ): number {
      const idx = this.list?.indexOf(s)
      if (-1 < idx) {
        return idx
      } else {
        return (s as any) - 1
      }
    }
    D = Q = p = w = (s: string): number => (s as any) - 1
    J = S = Y = u = x = y = (s: string): number => (s as any) - 0
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
    function integer(idx: number): LabelFactory {
      return (_, val, size: number) => _padStart(`${val.now_idx + idx}`, size, '0')
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

    function float(__, val, size) {
      const num = parseInt(val.now_idx)
      const sub = `${val.now_idx % 1}`.slice(1)
      return _padStart(`${num}`, size, '0') + sub
    }

    const G = (__, val) => val.label
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
      range.year = []
      for (let idx = 0; idx < period; idx++) {
        let is_leap = 0
        for (let mode = 0; mode < leaps.length; mode++) {
          const div = leaps[mode]
          if (idx % div) continue
          is_leap = ((!mode as any) as number) % 2
        }
        range.year.push(this.calc.range.year[is_leap])
      }
      range.year[0] = this.calc.range.year[1]
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
    const x = (this.dic.x.tempo = to_tempo_bare(
      this.calc.msec.hour,
      -0.5 * this.calc.msec.hour,
      timezone
    ))
    x.now_idx = timezone

    const start_at = this.dic.start[2]
    const zero = start_at - x.center_at

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
    const 啓蟄 = this.dic.sunny[1] - (1 / 6 - 1 / 8) * this.dic.Z.length * this.calc.msec.season
    let { last_at } = to_tempo_bare(this.calc.msec.year, 啓蟄, period || year)
    const spring = last_at

    const 立春 = this.dic.sunny[1] + zero_size('Z', 'season')
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
      moon = this.dic.moony[1]
    }

    // JD
    const day_utc = day + x.center_at
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

  noon(utc, { last_at, center_at } = to_tempo_bare(this.calc.msec.day, this.calc.zero.day, utc)) {
    const { sin, PI } = Math
    const deg_to_day = this.calc.msec.day / 360
    const year_to_rad = (2 * PI) / this.calc.msec.year

    const T0 = to_tempo_bare(this.calc.msec.year, this.calc.zero.season, utc)

    // 南中差分の計算がテキトウになってしまった。あとで検討。
    const 南中差分A = deg_to_day * 2.0 * sin(year_to_rad * T0.since)
    const 南中差分B = deg_to_day * 2.5 * sin(year_to_rad * T0.since * 2 + PI * 0.4)
    const 南中差分 = 南中差分A + 南中差分B

    const 南中時刻 = center_at + 南中差分
    const 真夜中 = last_at + 南中差分

    const T1 = to_tempo_bare(this.calc.msec.year, this.dic.sunny[1], 南中時刻)
    const 季節 = T1.since * year_to_rad

    return { T0, T1, 季節, 南中差分, 南中時刻, 真夜中 }
  }

  solor(utc, idx = 2, { 季節, 南中時刻, 真夜中 } = this.noon(utc)) {
    const days = [
      6, // golden hour end         / golden hour
      -18 / 60, // sunrise bottom edge end / sunset bottom edge start
      -50 / 60, // sunrise top edge start  / sunset top edge end
      -6, // dawn                    / dusk
      -7.36, // 寛政暦 太陽の伏角が7°21′40″
      -12, // nautical dawn           / nautical dusk
      -18, // night end               / night
    ]
    const { asin, acos, atan, sin, cos, tan, PI } = Math
    const deg_to_rad = (2 * PI) / 360
    const rad_to_day = this.calc.msec.day / (2 * PI)

    const 高度 = days[idx] * deg_to_rad
    const K = this.dic.earthy[2] * deg_to_rad
    const lat = this.dic.geo[0] * deg_to_rad

    const 赤緯 = asin(sin(K) * sin(季節))
    const 赤経 = atan(tan(季節) * cos(K))
    const 時角 = acos((sin(高度) - sin(lat) * sin(赤緯)) / (cos(lat) * cos(赤緯)))
    const 方向 = acos((cos(lat) * sin(赤緯) - sin(lat) * cos(赤緯) * cos(時角)) / cos(高度))

    const 日の出 = Math.floor(南中時刻 - 時角 * rad_to_day)
    const 日の入 = Math.floor(南中時刻 + 時角 * rad_to_day)

    return { K, lat, 時角, 方向, 高度, 真夜中, 日の出, 南中時刻, 日の入 }
  }

  節句(utc: number, { M, d, B, E } = this.to_tempos(utc)) {
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

  雑節(utc: number, { Zz, u, d } = this.to_tempos(utc)) {
    const d0 = d.reset(Zz.zero)
    let [
      立春,
      入梅,
      春分,
      半夏生,
      夏土用,
      立夏,
      夏至,
      秋土用,
      立秋,
      秋分,
      冬土用,
      立冬,
      冬至,
      春土用,
      立春2,
    ] = [
      1 / 8,
      80 / 360,
      2 / 8,
      100 / 360,
      13 / 40,
      3 / 8,
      4 / 8,
      23 / 40,
      5 / 8,
      6 / 8,
      33 / 40,
      7 / 8,
      8 / 8,
      43 / 40,
      9 / 8,
    ].map((n) => {
      const now = Zz.last_at + (n - 1 / 8) * Zz.size
      return to_tempo_bare(d.size, d0.last_at, now)
    })

    const [八十八夜, 二百十日, 二百二十日] = [88, 210, 220].map((n) => 立春.succ(n - 1))

    const [春彼岸, 秋彼岸] = [春分, 秋分].map((dd) => {
      return Tempo.join(dd.back(3), dd.succ(3))
    })
    const [春社日, 秋社日] = [春分, 秋分].map((dd) => {
      const C = to_tempo_bare(this.calc.msec.day, this.calc.zero.day10, dd.write_at)
      C.now_idx = __mod__(C.now_idx, this.dic.C.length)
      return C.slide(this.dic.C.length / 2 - C.now_idx - 1)
    })

    const 春 = Tempo.join(立春, 夏土用.back())
    const 夏節分 = 立夏.back()
    const 夏 = Tempo.join(立夏, 秋土用.back())
    const 秋節分 = 立秋.back()
    const 秋 = Tempo.join(立秋, 冬土用.back())
    const 冬節分 = 立冬.back()
    const 冬 = Tempo.join(立冬, 春土用.back())
    const 春節分 = 立春2.back()
    const 節分 = 春節分

    夏土用 = Tempo.join(夏土用, 夏節分)
    秋土用 = Tempo.join(秋土用, 秋節分)
    冬土用 = Tempo.join(冬土用, 冬節分)
    春土用 = Tempo.join(春土用, 立春2)

    return {
      立春,
      立夏,
      立秋,
      立冬,
      冬至,
      春分,
      夏至,
      秋分,
      入梅,
      半夏生,
      春,
      夏,
      秋,
      冬,
      春社日,
      秋社日,
      春土用,
      夏土用,
      秋土用,
      冬土用,
      春節分,
      夏節分,
      秋節分,
      冬節分,
      節分,
      春彼岸,
      秋彼岸,
      八十八夜,
      二百十日,
      二百二十日,
    }
  }

  to_tempo_by_solor(utc: number, day) {
    let idx, end, start
    const { 日の出, 南中時刻, 日の入 } = this.solor(utc, 4, this.noon(utc, day))
    const size = this.dic.H.length / 4

    const list: number[] = []

    let next_at = 0
    let msec = (日の出 - day.last_at) / size
    for (idx = 0, end = 1 * size; idx < end; idx++) {
      next_at += msec
      list.push(Math.floor(next_at))
    }

    next_at = 日の出 - day.last_at
    msec = (日の入 - 日の出) / (2 * size)
    for (start = 1 * size, idx = start, end = 3 * size; idx < end; idx++) {
      next_at += msec
      list.push(Math.floor(next_at))
    }

    next_at = day.size
    msec = (day.next_at - 日の入) / size

    const tails: number[] = []
    for (start = 3 * size, idx = start, end = 4 * size; idx < end; idx++) {
      tails.push(Math.ceil(next_at))
      next_at -= msec
    }
    list.push(...tails.reverse())
    return to_tempo_by(list, day.last_at, utc)
  }

  note(
    utc: number,
    tempos = this.to_tempos(utc),
    arg1 = this.雑節(utc, tempos),
    arg2 = this.節句(utc, tempos)
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
            .join('')
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
    let d: Tempo, H: Tempo, m: Tempo, M: Tempo & TempoMonth, p: Tempo | undefined, u: Tempo
    if (utc == null) throw new Error(`invalid timestamp ${utc}`)

    const drill_down = (base: Tempo, path: MSEC_CALC, at = utc) => {
      let o: Tempo & {
        length: number
        path: string
      }
      const data = this.table.msec[path]
      const table: number[] = data?.[base.size] || data
      if (table) {
        o = to_tempo_by(table, base.last_at, at) as any
      } else {
        const b_size = this.calc.msec[path]
        o = to_tempo_bare(b_size, base.last_at, at) as any
        o.length = base.size / o.size
      }
      o.path = path
      return o
    }

    const to_tempo = (path, write_at = utc) => {
      return to_tempo_bare(this.calc.msec[path], this.calc.zero[path], write_at)
    }

    const J = to_tempo_bare(this.calc.msec.day, this.calc.zero.jd, utc) // ユリウス日

    // season in year_of_planet
    const Zz = to_tempo_bare(this.calc.msec.year, this.calc.zero.season, utc) // 太陽年
    const Z = drill_down(Zz, 'season') // 太陽年の二十四節気

    // 今月と中気
    const Nn = to_tempo_bare(this.calc.msec.moon, this.calc.zero.moon, utc).floor(
      this.calc.msec.day,
      this.calc.zero.day
    ) as Tempo & TempoMonth
    const N = drill_down(Nn, 'day')

    let Zs = drill_down(Zz, 'season', Nn.last_at)
    if (!Nn.is_cover(Zs.moderate_at)) {
      Zs = drill_down(Zz, 'season', Nn.next_at)
      if (!Nn.is_cover(Zs.moderate_at)) {
        Nn.is_leap = true
      }
    }
    Nn.now_idx = __mod__(Zs.now_idx, this.dic.Z.length) >> 1

    if (this.is_table_leap) {
      p = to_tempo('period')
      u = drill_down(p, 'year')
      u.now_idx += p.now_idx * this.dic.p.length
      M = drill_down(u, 'month') as any
      d = drill_down(M, 'day')
    } else {
      if (this.is_table_month) {
        u = to_tempo_bare(this.calc.msec.year, this.calc.zero.spring, utc).floor(
          this.calc.msec.day,
          this.calc.zero.day
        )
        M = drill_down(u, 'month') as any
        d = drill_down(M, 'day')
      } else {
        u = to_tempo_bare(this.calc.msec.year, this.calc.zero.season + this.calc.msec.season, utc)
          .floor(this.calc.msec.moon, this.calc.zero.moon)
          .floor(this.calc.msec.day, this.calc.zero.day)
        M = Nn
        d = N
      }
    }

    // hour minute second  in day
    if (this.dic.is_solor) {
      H = this.to_tempo_by_solor(utc, d)
      const size = H.size / this.dic.m.length
      m = to_tempo_bare(size, H.last_at, utc)
    } else {
      H = drill_down(d, 'hour')
      m = drill_down(H, 'minute')
    }
    const s = drill_down(m, 'second')
    const S = drill_down(s, 'msec')

    let G = {} as Tempo
    if (this.table.msec.era != null) {
      G = to_tempo_by(this.table.msec.era, this.calc.zero.era, utc)
      const era = this.calc.eras[G.now_idx]
      if (era?.[0]) {
        u.now_idx += 1 - era[2]
        G.label = era[0]
      }
    }

    const y = u.copy()
    if (y.now_idx < 1) {
      G.label = '紀元前'
      y.now_idx = 1 - y.now_idx
    }
    const x = this.dic.x.tempo

    // 年初来番号
    const w0 = to_tempo('week', u.last_at)
    const w = drill_down(w0, 'week')
    const D = drill_down(u, 'day')

    const Y = { now_idx: u.now_idx } as Tempo
    if (u.next_at < w.next_at) {
      // 年末最終週は、翌年初週
      Y.now_idx += 1
      w.now_idx = 0
    }

    // 年不断
    const a = { now_idx: __mod__(u.now_idx - this.calc.zero.year60, this.dic.a.length) } as Tempo
    const b = { now_idx: __mod__(u.now_idx - this.calc.zero.year12, this.dic.b.length) } as Tempo
    const c = { now_idx: __mod__(u.now_idx - this.calc.zero.year10, this.dic.c.length) } as Tempo
    const f = { now_idx: __mod__(u.now_idx - this.calc.zero.year_s, this.dic.f.length) } as Tempo

    // 月不断
    const Q = { now_idx: Math.floor((4 * M.now_idx) / this.dic.M.length) } as Tempo

    // 日不断
    const A = to_tempo_bare(this.calc.msec.day, this.calc.zero.day60, utc)
    const B = to_tempo_bare(this.calc.msec.day, this.calc.zero.day12, utc)
    const C = to_tempo_bare(this.calc.msec.day, this.calc.zero.day10, utc)
    const E = to_tempo_bare(this.calc.msec.day, this.calc.zero.week, utc)
    const F = to_tempo_bare(this.calc.msec.day, this.calc.zero.day_9, utc)
    const V = to_tempo_bare(this.calc.msec.day, this.calc.zero.day28, utc)

    A.now_idx = __mod__(A.now_idx, this.dic.A.length)
    B.now_idx = __mod__(B.now_idx, this.dic.B.length)
    C.now_idx = __mod__(C.now_idx, this.dic.C.length)
    F.now_idx = __mod__(F.now_idx, this.dic.F.length)
    if (this.is_table_leap) {
      // 旧暦では、週は月初にリセットする。
      E.now_idx = __mod__(E.now_idx, this.dic.E.length)
      V.now_idx = __mod__(V.now_idx, this.dic.V.length)
    } else {
      E.now_idx = __mod__(M.now_idx + d.now_idx, this.dic.E.length)
      V.now_idx = __mod__(
        [11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9][M.now_idx] + d.now_idx,
        this.dic.V.length
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
      const [top, mode] = token
      const dic = this.dic[top]
      if (dic) {
        if ('M' === top && '閏' === s[0]) {
          data.M_is_leap = true
          s = s.slice(1)
        }
        data[top] = dic.to_idx(s)
      }
    }
    return data
  }

  get_diff(src: string, f: { (num: string | null): number }) {
    const data = to_indexs(0) as TempoIdxs
    src.replace(
      diff_token,
      (
        _full,
        numstr: string | null,
        unit: string | null,
        単位: string | null,
        半: string | null,
        offset: number
      ) => {
        let num = f(numstr)
        if (num) {
          if (単位) {
            if (半) {
              num += 0.5
            }
            unit = 単位系[単位]
          }
          if (unit) {
            data[unit] = num
          }
        }
        return ''
      }
    )
    return data
  }

  index(src: string, str = this.dic.parse, _disuse = 0) {
    const tokens = str.match(reg_token)!
    const data = this.get_dic(src, tokens, this.regex(tokens))

    if (this.is_table_leap) {
      data.p = Math.floor(data.y / this.dic.p.length)
      data.y = data.y - data.p * this.dic.p.length
    }
    data.c = __mod__(data.a, this.dic.c.length)
    data.b = __mod__(data.a, this.dic.b.length)
    data.C = __mod__(data.A, this.dic.C.length)
    data.B = __mod__(data.A, this.dic.B.length)
    return data
  }

  regex(tokens) {
    const reg = ['^']
    tokens.forEach((token) => {
      const [top, mode] = token
      const dic = this.dic[top]
      if (dic) {
        if ('or'.includes(mode)) {
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

    utc += Z * this.calc.msec.season + N * this.calc.msec.moon + d * this.calc.msec.day

    // year section
    if (this.is_table_leap) {
      utc += this.calc.zero.period + p * this.calc.msec.period + (this.table.msec.year[y - 1] || 0)

      year_size = Math.floor(this.calc.msec.day * this.table.range.year[y])
    } else {
      let size: number
      if (this.is_table_month) {
        zero = this.calc.zero.spring
      } else {
        zero = this.calc.zero.season
      }

      ;({ size, last_at } = to_tempo_bare(
        this.calc.msec.year,
        zero,
        zero + y * this.calc.msec.year
      ).floor(this.calc.msec.day, this.calc.zero.day))
      year_size = size
      utc += last_at
    }

    // month section
    if (this.is_table_month) {
      utc += this.table.msec.month[year_size][M - 1] || 0
    } else {
      const base = last_at
      const M_utc = M_is_leap
        ? base + this.calc.msec.season * (M * 2 + 2) - this.calc.msec.moon
        : base + this.calc.msec.season * (M * 2 + 1)

      ;({ last_at } = to_tempo_bare(this.calc.msec.moon, this.calc.zero.moon, M_utc).floor(
        this.calc.msec.day,
        this.calc.zero.day
      ))
      utc += last_at - base
    }
    return utc
  }

  format_by(tempos: Tempos, str = this.dic.format) {
    return str
      .match(reg_token)!
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
              return dic.to_value(dic.list, val, token.length)
          }
        } else {
          return token
        }
      })
      .join('')
  }

  slide_by(o: Tempos, diff?: TempoDiff) {
    const ret = {} as TempoIdxs
    for (let key of main_tokens) {
      const val = o[key]
      if (val) {
        ret[key] = val.now_idx
      }
    }
    ret.p = 0
    ret.M_is_leap = o.M.is_leap
    return this.parse_by(ret, diff)
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

function __mod__(a: number, b: number) {
  a = +a
  b = +b
  return ((a % b) + b) % b
}
