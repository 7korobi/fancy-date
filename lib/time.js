'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.to_relative_time_distance = exports.to_timer = exports.to_sec = exports.to_msec = exports.to_tempo_by = exports.to_tempo_bare = exports.to_tempo = exports.Tempo = void 0
const SECOND = to_msec('1s')
const MINUTE = to_msec('1m')
const HOUR = to_msec('1h')
const DAY = to_msec('1d')
const WEEK = to_msec('1w')
const MONTH = to_msec('30d')
const YEAR = to_msec('1y')
const INTERVAL = 0x7fffffff // 31bits.
const VALID = 0xfffffffffffff // 52bits.
const has_window = 'undefined' !== typeof window && window !== null
const timezone = has_window ? MINUTE * new Date().getTimezoneOffset() : to_msec('-9h')
const tempo_zero = -new Date(0).getDay() * DAY + timezone
const TIMERS = [
  ['年', 'y', YEAR],
  ['週', 'w', WEEK],
  ['日', 'd', DAY],
  ['時', 'h', HOUR],
  ['分', 'm', MINUTE],
  ['秒', 's', SECOND],
]
const DISTANCE_NAN = [-VALID, INTERVAL, YEAR, '？？？']
const DISTANCE_LONG_AGO = [Infinity, INTERVAL, VALID, '昔']
const DISTANCES = [
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
class Tempo {
  constructor(zero, now_idx, write_at, last_at, next_at, table = null) {
    if (table) {
      this.table = table
    }
    this.zero = zero
    this.write_at = write_at
    this.now_idx = now_idx
    this.last_at = last_at
    this.next_at = next_at
  }
  get size() {
    return this.next_at - this.last_at
  }
  get since() {
    return this.write_at - this.last_at
  }
  get remain() {
    return this.next_at - this.write_at
  }
  get timeout() {
    return this.next_at - this.write_at
  }
  get center_at() {
    return (this.next_at + this.last_at) / 2
  }
  get moderate_at() {
    if (this.now_idx & 1) {
      return this.last_at
    } else {
      return this.next_at
    }
  }
  get deg() {
    return `${Math.floor((360 * this.since) / this.size)}deg`
  }
  is_cover(at) {
    return this.last_at <= at && at < this.next_at
  }
  is_hit(that) {
    return this.last_at <= that.next_at && that.last_at < this.next_at
  }
  succ(n = 1) {
    return this.slide(+n)
  }
  back(n = 1) {
    return this.slide(-n)
  }
  slide_to(n) {
    return this.slide(n - this.now_idx)
  }
  round(sub1, sub2, subf = to_tempo_bare) {
    let { last_at, write_at, next_at, now_idx, size } = this
    ;(() => {
      const do2 = subf(sub1, sub2, last_at)
      if (write_at < do2.center_at) {
        ;({ last_at, size } = this.slide(-1))
        const do3 = subf(sub1, sub2, last_at)
        next_at = do2.center_at
        last_at = do3.center_at
        now_idx--
        return
      }
      const do1 = subf(sub1, sub2, next_at)
      if (do1.center_at <= write_at) {
        ;({ next_at, size } = this.slide(1))
        const do3 = subf(sub1, sub2, next_at)
        last_at = do1.center_at
        next_at = do3.center_at
        now_idx++
        return
      }
      next_at = do1.center_at
      last_at = do2.center_at
    })()
    const zero = last_at - now_idx * size
    return new Tempo(zero, now_idx, write_at, last_at, next_at)
  }
  ceil(sub1, sub2, subf = to_tempo_bare) {
    let { last_at, write_at, next_at, now_idx, size } = this
    const do2 = subf(sub1, sub2, last_at)
    if (write_at < do2.next_at) {
      ;({ last_at, size } = this.slide(-1))
      const do3 = subf(sub1, sub2, last_at)
      next_at = do2.next_at
      last_at = do3.next_at
      now_idx--
    } else {
      const do1 = subf(sub1, sub2, next_at)
      next_at = do1.next_at
      last_at = do2.next_at
    }
    const zero = last_at - now_idx * size
    return new Tempo(zero, now_idx, write_at, last_at, next_at)
  }
  floor(sub1, sub2, subf = to_tempo_bare) {
    let { last_at, write_at, next_at, now_idx, size } = this
    const do2 = subf(sub1, sub2, next_at)
    if (do2.last_at <= write_at) {
      ;({ next_at, size } = this.slide(1))
      const do3 = subf(sub1, sub2, next_at)
      last_at = do2.last_at
      next_at = do3.last_at
      now_idx++
    } else {
      const do1 = subf(sub1, sub2, last_at)
      last_at = do1.last_at
      next_at = do2.last_at
    }
    const zero = last_at - now_idx * size
    return new Tempo(zero, now_idx, write_at, last_at, next_at)
  }
  to_list(step) {
    const a = step.reset(this.last_at)
    const b = step.reset(this.next_at - 1)
    return a.upto(b)
  }
  upto(limit) {
    let p = this
    const ary = []
    while (p.last_at < limit.last_at) {
      ary.push(p)
      p = p.succ()
    }
    return ary
  }
  slide(n) {
    if (this.table) {
      const now_idx = this.now_idx + n
      const idx = modulo(now_idx, this.table.length)
      const new_table_idx = Math.floor(now_idx / this.table.length)
      const now_table_idx = Math.floor(this.now_idx / this.table.length)
      const table_idx_diff = new_table_idx - now_table_idx
      const table_diff = table_idx_diff ? this.table[this.table.length - 1] * table_idx_diff : 0
      const last_at = this.zero + table_diff + (this.table[idx - 1] || 0)
      const next_at = this.zero + table_diff + this.table[idx]
      const write_at = last_at + this.since
      return new Tempo(this.zero, now_idx, write_at, last_at, next_at, this.table)
    } else {
      const size = n * this.size
      return to_tempo_bare(this.size, this.zero, this.write_at + size)
    }
  }
  copy() {
    return new Tempo(this.zero, this.now_idx, this.write_at, this.last_at, this.next_at, this.table)
  }
  reset(now = Date.now()) {
    if (this.table) {
      return to_tempo_by(this.table, this.zero, now)
    } else {
      return to_tempo_bare(this.size, this.zero, now)
    }
  }
  tick() {
    const now = Date.now()
    if (this.next_at <= now) {
      return this.reset(now)
    } else {
      return null
    }
  }
  sleep() {
    return Tempo.sleep([this])
  }
  static join(a, b) {
    if (a.zero != b.zero) {
      throw new Error("can't join.")
    }
    const last_at = Math.min(a.last_at, b.last_at)
    const next_at = Math.max(a.next_at, b.next_at)
    const write_at = (a.write_at + b.write_at) / 2
    const size = next_at - last_at
    return to_tempo_bare(size, last_at, write_at)
  }
  static async sleep(tempos) {
    if (tempos && tempos.length) {
      const o = tempos.reduce((min, o) => (min.timeout < o.timeout ? min : o), {
        timeout: Infinity,
      })
      if (o.timeout < Infinity) {
        return new Promise((ok) => {
          setTimeout(() => {
            ok(o)
          }, o.timeout)
        })
      }
    }
    return new Promise((ok) => ok(null))
  }
}
exports.Tempo = Tempo
const modulo = (a, b) => ((+a % (b = +b)) + b) % b
function to_tempo(size_str, zero_str = '0s', write_at = Date.now()) {
  const size = to_msec(size_str)
  const zero = to_msec(zero_str) + tempo_zero
  return to_tempo_bare(size, zero, write_at)
}
exports.to_tempo = to_tempo
function to_tempo_bare(size, zero, write_at_src) {
  const write_at = Number(write_at_src)
  const now_idx = Math.floor((write_at - zero) / size)
  const last_at = (now_idx + 0) * size + zero
  const next_at = (now_idx + 1) * size + zero
  return new Tempo(zero, now_idx, write_at, last_at, next_at)
}
exports.to_tempo_bare = to_tempo_bare
// バイナリサーチ 高速化はするが、微差なので複雑さのせいで逆に遅いかも？
function to_tempo_by(table, zero, write_at) {
  let scan_at = write_at - zero
  const table_size = table[table.length - 1]
  const table_idx = Math.floor(scan_at / table_size)
  if (table_idx) {
    scan_at -= table_idx * table_size
  }
  let now_idx = table.length
  let top_idx = 0
  let next_at = zero
  while (top_idx < now_idx) {
    const mid_idx = (top_idx + now_idx) >>> 1
    next_at = table[mid_idx]
    if (next_at <= scan_at) {
      top_idx = mid_idx + 1
    } else {
      now_idx = mid_idx
    }
  }
  const last_at = zero + (table[now_idx - 1] || 0)
  next_at = zero + table[now_idx]
  now_idx += table_idx * table.length
  return new Tempo(zero, now_idx, write_at, last_at, next_at, table)
}
exports.to_tempo_by = to_tempo_by
function to_msec(str) {
  return 1000 * to_sec(str)
}
exports.to_msec = to_msec
function to_sec(str) {
  let timeout = 0
  str.replace(
    /(\d+)([ヵ]?([smhdwy秒分時日週月年])[間]?(半$)?)|0/g,
    (full, num_str, fullunit, unit, appendix) => {
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
    }
  )
  return timeout
}
exports.to_sec = to_sec
function to_timer(msec, unit_mode = 1) {
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
exports.to_timer = to_timer
function to_relative_time_distance(msec) {
  if (msec < -VALID || VALID < msec || msec - 0 == NaN) {
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
exports.to_relative_time_distance = to_relative_time_distance
//# sourceMappingURL=time.js.map
