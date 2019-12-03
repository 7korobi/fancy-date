
const SECOND = to_msec("1s")
const MINUTE = to_msec("1m")
const HOUR   = to_msec("1h")
const DAY    = to_msec("1d")
const WEEK   = to_msec("1w")
const MONTH = to_msec("30d")
const YEAR  = to_msec( "1y")
const INTERVAL =   0x7fffffff // 31bits.
const VALID = 0xfffffffffffff // 52bits.

const has_window = "undefined" !== typeof window && window !== null
const timezone = has_window ? ( MINUTE * new Date().getTimezoneOffset()) : to_msec("-9h")
const tempo_zero = (- new Date(0).getDay() ) * DAY + timezone

const TIMERS: [string, string, number][] = [
  [ "年", "y", YEAR   ],
  [ "週", "w", WEEK   ],
  [ "日", "d", DAY    ],
  [ "時", "h", HOUR   ],
  [ "分", "m", MINUTE ],
  [ "秒", "s", SECOND ],
]

const DISTANCE_NAN = [        -VALID, INTERVAL,   YEAR, "？？？"]
const DISTANCE_LONG_AGO = [ Infinity, INTERVAL,  VALID,    "昔"]
const DISTANCES = [
  DISTANCE_NAN,
  [    -YEAR, INTERVAL,   YEAR, "%s年後"],
  [   -MONTH, INTERVAL,  MONTH, "%sヶ月後"],
  [    -WEEK,     WEEK,   WEEK, "%s週間後"],
  [     -DAY,      DAY,    DAY, "%s日後"],
  [    -HOUR,     HOUR,   HOUR, "%s時間後"],
  [  -MINUTE,   MINUTE, MINUTE, "%s分後"],
  [   -25000,   SECOND, SECOND, "%s秒後"],
  [    25000,    25000,  25000, "今"],
  [   MINUTE,   SECOND, SECOND, "%s秒前"],
  [     HOUR,   MINUTE, MINUTE, "%s分前"],
  [      DAY,     HOUR,   HOUR, "%s時間前"],
  [     WEEK,      DAY,    DAY, "%s日前"],
  [    MONTH,     WEEK,   WEEK, "%s週間前"],
  [     YEAR, INTERVAL,  MONTH, "%sヶ月前"],
  [    VALID, INTERVAL,   YEAR, "%s年前"],
  DISTANCE_LONG_AGO,
]

export class Tempo {
  table: number[]
  zero: number
  write_at: number
  now_idx: number
  last_at: number
  next_at: number
  get size() { return this.next_at - this.last_at }
  get since() { return this.write_at - this.last_at }
  get remain() { return this.next_at - this.write_at }
  get timeout() { return this.next_at - this.write_at }
  get moderate_at() {
    if (this.now_idx & 1) {
      return this.last_at
    } else {
      return this.next_at
    }
  }

  mod_bare(sub_size: number, sub_zero: number): Tempo {
    let { last_at, write_at, next_at, now_idx, size, zero } = this
    const do2 = to_tempo_bare(sub_size, sub_zero, next_at)

    if ( do2.last_at <= write_at ) {
      const do3 = to_tempo_bare(sub_size, sub_zero, next_at + size)
      last_at = do2.last_at
      next_at = do3.last_at
      now_idx++
    } else {
      const do1 = to_tempo_bare(sub_size, sub_zero, last_at)
      last_at = do1.last_at
      next_at = do2.last_at
    }
    return new Tempo(
      zero,
      now_idx,
      write_at,
      last_at,
      next_at
    )
  }

  copy() { return this.dup() }
  dup(): Tempo {
    const now = new Date().getTime()
    if ( this.table ) {
      return to_tempo_by(this.table, this.zero, now)
    } else {
      return to_tempo_bare(this.size, this.zero, now)
    }
  }

  async sleep() {
    const { timeout } = this
    return new Promise((ok, ng) => {
      setTimeout(() => {
        ok(timeout);
      }, timeout);
    })
  }

  constructor(zero: number, now_idx: number, write_at: number, last_at: number, next_at: number, table: number[] = null) {
    if ( table ) {
      this.table = table
    }
    this.zero = zero
    this.write_at = write_at

    this.now_idx = now_idx
    this.last_at = last_at
    this.next_at = next_at
  }
};

export function to_tempo(size_str: string, zero_str: string = "0s", write_at: number | Date = new Date()) {
  const size = to_msec(size_str)
  const zero = to_msec(zero_str) + tempo_zero
  return to_tempo_bare(size, zero, Number(write_at))
}

export function to_tempo_bare(size: number, zero: number, write_at: number) {
  const now_idx = Math.floor((write_at - zero) / size);
  const last_at = (now_idx + 0) * size + zero;
  const next_at = (now_idx + 1) * size + zero;

  return new Tempo(
    zero,
    now_idx,
    write_at,
    last_at,
    next_at
  )
}

// バイナリサーチ 高速化はするが、微差なので複雑さのせいで逆に遅いかも？
export function to_tempo_by(table: number[], zero: number, write_at: number) {
  const scan_at = write_at - zero
  let now_idx = -1
  let next_at = zero
  let last_at = -Infinity

  if (!( scan_at < 0 )) {
    let top_idx = 0;
    now_idx = table.length;

    while (top_idx < now_idx) {
      const mid_idx = ( top_idx + now_idx ) >>> 1;
      next_at = table[mid_idx];

      if (next_at <= scan_at) {
        top_idx = mid_idx + 1;
      } else {
        now_idx = mid_idx;
      }
    }

    next_at = table[now_idx] || Infinity;
    last_at = table[now_idx - 1] || 0;
    next_at += zero;
    last_at += zero;
  }

  return new Tempo(
    zero,
    now_idx,
    write_at,
    last_at,
    next_at,
    table
  )
};


export function to_msec (str: string): number {
  return 1000 * to_sec(str);
};

export function to_sec (str: string): number {
  let timeout = 0;
  str.replace(/(\d+)([ヵ]?([smhdwy秒分時日週月年])[間]?(半$)?)|0/g, (full, num_str: string, fullunit, unit: string, appendix: string) => {
    let num = Number(num_str);
    if (! num ) { return null }
    if ('半' === appendix) { num += 0.5 }

    timeout += num * (() => {
      switch (unit) {
        case "s":
        case "秒":
          return 1;

        case "m":
        case "分":
          return 60;

        case "h":
        case "時":
          return 3600;

        case "d":
        case "日":
          return 3600 * 24;

        case "w":
        case "週":
          return 3600 * 24 * 7;

        case "y":
        case "年":
          return 31556925.147;
        // 2019 average.

        default:
          throw new Error(`${str} at ${num}${unit}`);
      }
    })();
  });
  return timeout;
};

export function to_timer(msec: number, unit_mode: number = 1) {
  let str = ""
  const _limit = TIMERS.length
  for(let at = 0; at < _limit; ++at) {
    const unit = TIMERS[at][unit_mode]
    const base = TIMERS[at][2]
    const idx = Math.floor( msec / base )
    if (idx) {
      msec = msec % base
      str += `${idx}${unit}`
    }
  }
  return str
}

export function to_relative_time_distance( msec: number ) {
  if ( msec < -VALID || VALID < msec || msec - 0 == NaN ) { return DISTANCE_NAN }
  const _limit = DISTANCES.length
  for(let at = 0; at < _limit; ++at) {
    const o = DISTANCES[at]
    const limit = o[0]
    if ( msec < limit ) { return o }
  }
  return DISTANCE_LONG_AGO
}
