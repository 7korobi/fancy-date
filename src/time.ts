class Tempo {
  table: number[]
  zero: number
  write_at: number
  now_idx: number
  last_at: number
  next_at: number
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
  get size() { return this.next_at - this.last_at }
  get since() { return this.write_at - this.last_at}
  get remain() { return this.next_at - this.write_at }
  get timeout() { return this.next_at - this.write_at }
};

function to_msec (str: string): number {
  return 1000 * to_sec(str);
};

function to_sec (str: string): number {
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

function to_tempo_bare (size: number, zero: number, write_at: number) {
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
function to_tempo_by (table: number[], zero: number, write_at: number) {
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

export {
  Tempo,
  to_msec,
  to_sec,
  to_tempo_bare,
  to_tempo_by
}