import { FixedTempoRule, TableTempoRule, Tempo } from './tempo'

export const SECOND = to_msec('1s')
export const MINUTE = to_msec('1m')
export const HOUR = to_msec('1h')
export const DAY = to_msec('1d')
const WEEK = to_msec('1w')
const MONTH = to_msec('30d')
const YEAR = to_msec('1y')
const INTERVAL = 0x7fffffff // 31bits.
const VALID = 0xfffffffffffff // 52bits.

const has_window = 'undefined' !== typeof window && window !== null
const timezone = has_window ? MINUTE * new Date().getTimezoneOffset() : to_msec('-9h')
const tempo_zero = -new Date(0).getDay() * DAY + timezone

const TIMERS: [string, string, number][] = [
  ['年', 'y', YEAR],
  ['週', 'w', WEEK],
  ['日', 'd', DAY],
  ['時', 'h', HOUR],
  ['分', 'm', MINUTE],
  ['秒', 's', SECOND],
]

type Distance = readonly [limit: number, interval: number, base: number, label: string]

const DISTANCE_NAN: Distance = [-VALID, INTERVAL, YEAR, '？？？']
const DISTANCE_LONG_AGO: Distance = [Infinity, INTERVAL, VALID, '昔']
const DISTANCES: Distance[] = [
  DISTANCE_NAN,
  [-YEAR, INTERVAL, YEAR, '%s年後'],
  [-MONTH, INTERVAL, MONTH, '%sヶ月後'],
  [-WEEK, WEEK, WEEK, '%s週間後'],
  [-DAY, DAY, DAY, '%s日後'],
  [-HOUR, HOUR, HOUR, '%s時間後'],
  [-MINUTE, MINUTE, MINUTE, '%s分後'],
  [-25000, SECOND, SECOND, '%s秒後'],
  [25000, 25000, 25000, '今'],
  [MINUTE, SECOND, SECOND, '%s秒前'],
  [HOUR, MINUTE, MINUTE, '%s分前'],
  [DAY, HOUR, HOUR, '%s時間前'],
  [WEEK, DAY, DAY, '%s日前'],
  [MONTH, WEEK, WEEK, '%s週間前'],
  [YEAR, INTERVAL, MONTH, '%sヶ月前'],
  [VALID, INTERVAL, YEAR, '%s年前'],
  DISTANCE_LONG_AGO,
]

/**
 * Tempo(旧 TempoView。class Tempo は本ファイルから削除され、
 * tempo.ts(旧 tempo-model.ts)の TempoView が Tempo としてリネームされた)は
 * envelope(zero/now_idx/last_at/next_at)+base(write_at)+rule の
 * 組み合わせで succ()/back()/slide() を実現する。
 *
 * round/ceil/to_list/upto(探索を伴う旧 Tempo のメソッド)は、
 * 呼び出し元がゼロ(コードベース内で一切使われていなかった)と確認の上、
 * FloorTempoRule 等の新設計に役割が引き継がれたため移植していない。
 * deg/is_hit/tick/sleep(呼び出し元は同様にゼロだが、単純な式のため
 * 後方互換のために温存)は TempoView 側に移植済み。
 */
export function to_tempo(
  size_str: string,
  zero_str: string = '0s',
  write_at: number | Date = Date.now(),
) {
  const size = to_msec(size_str)
  const zero = to_msec(zero_str) + tempo_zero
  return to_tempo_bare(size, zero, write_at)
}

export function to_tempo_bare(size: number, zero: number, write_at_src: number | Date) {
  const write_at = Number(write_at_src)
  return Tempo.at(new FixedTempoRule(size, zero), { write_at })
}

export function to_tempo_by(table: number[], zero: number, write_at: number) {
  return Tempo.at(new TableTempoRule(table, zero), { write_at })
}

export type DurationOptions = {
  strict?: boolean
}

export function to_msec(str: string, options?: DurationOptions): number {
  return 1000 * to_sec(str, options)
}

export function to_sec(str: string, { strict = false }: DurationOptions = {}): number {
  let timeout = 0
  let consumed = ''
  str.replace(
    /(\d+)(([ヶヵかカケ箇]?月|[smhdwy秒分時日週年])[間]?(半$)?)|0/g,
    (full, num_str: string, _fullunit, unit: string, appendix: string) => {
      consumed += full
      let num = Number(num_str)
      if (!num) return ''
      if ('半' === appendix) num += 0.5

      let unit_size = 0
      switch (unit) {
        case 's':
        case '秒':
          unit_size = 1
          break

        case 'm':
        case '分':
          unit_size = 60
          break

        case 'h':
        case '時':
          unit_size = 3600
          break

        case 'd':
        case '日':
          unit_size = 3600 * 24
          break

        case 'w':
        case '週':
          unit_size = 3600 * 24 * 7
          break

        case '月':
        case 'ヶ月':
        case 'ヵ月':
        case 'か月':
        case 'カ月':
        case 'ケ月':
        case '箇月':
          throw new Error(`variable-length unit 月 is not supported by to_msec: ${str}`)

        case 'y':
        case '年':
          unit_size = 31556925.147
          break
        // 2019 average.

        default:
          throw new Error(`${str} at ${num}${unit}`)
      }
      timeout += num * unit_size
      return ''
    },
  )
  if (strict && consumed !== str) {
    throw new Error(`invalid duration ${str}`)
  }
  return timeout
}

export function to_timer(msec: number, unit_mode: number = 1) {
  let str = ''
  const _limit = TIMERS.length
  for (let at = 0; at < _limit; ++at) {
    const unit = TIMERS[at][unit_mode]
    const base = TIMERS[at][2]
    const idx = Math.floor(msec / base)
    if (idx) {
      msec = msec % base
      str += `${idx}${unit}`
    }
  }
  return str
}

export function to_relative_time_distance(msec: number) {
  if (msec < -VALID || VALID < msec || Number.isNaN(msec)) {
    return DISTANCE_NAN
  }
  const _limit = DISTANCES.length
  for (let at = 0; at < _limit; ++at) {
    const o = DISTANCES[at]
    const limit = o[0]
    if (msec < limit) {
      return o
    }
  }
  return DISTANCE_LONG_AGO
}
