require('../lib/sample')
const { Calendar } = require('../lib/sample')
const { to_msec } = require('../lib/time')

/**
 * このファイルは FancyDate._lunisolar_cache (観測太陰太陽暦の37ヶ月窓探索
 * 結果のキャッシュ) について、性能改善のために検討・採用した設計と、
 * 比較のうえ採用しなかった実装がどのアクセスパターンで具体的に見劣り
 * したのかを、実行可能な回帰テストとして残すものです。
 *
 * バグ修正について __tests__/*-spec.js に「採用しなかった実装だとこう
 * いう挙動になる」という規定を残すのと同じ考え方を、性能チューニングの
 * 意思決定にも適用しています。ベンチマーク(bun run perf)は壁時計時間を
 * 測るため、CI環境やマシン負荷で数値が揺れて閾値アサーションには向かない
 * (実行時間そのものをテストで固定すると、無関係な環境要因でテストが
 * flaky になる)。そのため、ここでは「本物の37ヶ月窓探索
 * (resolveLunisolar)が何回発生したか」という決定的でマシン非依存な
 * 指標をカウントすることで、キャッシュのヒット/ミス挙動そのものを
 * テストする。
 *
 * ## 採用した設計
 * `_lunisolar_cache: LunisolarDate[]` — MRU(最近使った順)配列、上限は
 * `LUNISOLAR_CACHE_CAPACITY = 16`(src/fancy-date.ts 参照)。
 *
 * ## 比較のうえ採用しなかった実装とその見劣り点
 *
 * 1. **単一スロットキャッシュ**(`LunisolarDate | undefined` 1個だけ)。
 *    `span_obj()`/`add()` は内部で「離れた2つの日時」を交互に問い合わせる
 *    (例: `span_obj({precise})` は `precise_span(from,to)` で from/to を
 *    それぞれ解決した後、`next_precise_span_at(to,...)` で to を
 *    再度問い合わせる)。単一スロットだと直前に解決したのが常に
 *    「もう片方」になるため、A→B→A の3回目の問い合わせが再びミスになり、
 *    本来2回で済む37ヶ月窓探索が3回発生していた
 *    (実測: 定気法の `span_obj({precise:'S'})` で確認)。
 *    → 下記 'A→B→A thrashing' テストで、この単一スロット実装なら
 *    3回ミスするところ、MRU化により2回で済むことを固定する。
 *
 * 2. **MRUサイズ3**(初回のMRU化で採用した値)。この値は
 *    `span_obj`/`add` 自身の内部実装が必要とする最小限(2点の交互問い合わせ
 *    +安全マージン1)から逆算しただけで、呼び出し側アプリケーションの
 *    より広い利用パターン(カレンダーUIの年間ビュー構築後に月を行き来する
 *    等)を考慮していなかった。実測(このファイルの
 *    'full year view then zigzag revisit' と同じシナリオ)では、
 *    サイズ3だと36クエリ中32ミス(24回の再訪問のうち20回、約83%が
 *    キャッシュ効かず)だった。観測太陰太陽暦は1年が12〜13ヶ月
 *    (閏月を含む場合13)なので、「1年分の月+年境界をまたぐ余裕」を
 *    根拠に16へ拡大した。線形走査のコスト(ナノ〜マイクロ秒オーダー)は
 *    37ヶ月窓探索(ミリ秒オーダー)と比べて無視できるため、大きめに
 *    確保するデメリットはほぼない(`bun run perf` で3→16への変更による
 *    劣化が測定誤差の範囲内であることを確認済み)。
 *    → 下記 'full year view then zigzag revisit' テストで、現在のサイズ
 *    (16)なら年間ビュー構築後の再訪問が0ミスで完全にキャッシュされる
 *    ことを固定する。
 *
 * 3. (参考、別ファイルの話) `SolarDayHourTempoRule`(不定時法の時刻解決)
 *    自身にも日単位の内部キャッシュを実装・計測したことがあるが、
 *    noon() の均時差相当の補正が write_at そのものに依存し同日内でも
 *    最大13秒程度ずれると判明したため不採用(詳細は
 *    src/tempo.ts の SolarDayHourTempoRule クラスdocコメント参照)。
 */

// FancyDate.lunisolar() をラップし、キャッシュミス(本物の37ヶ月窓探索
// resolveLunisolar が実際に呼ばれた回数)を数える。private フィールド
// (_lunisolar_cache)への直接アクセスは、TypeScript の private 修飾は
// コンパイル時のみの制約でありコンパイル後の JS では通常のプロパティ
// なので、この .js テストファイルからは問題なく参照できる。
function countLunisolarResolves(calendar, run) {
  let resolves = 0
  const original = calendar.lunisolar.bind(calendar)
  calendar.lunisolar = function (utc) {
    const cache = this._lunisolar_cache
    const hit = cache.some((entry) => entry.last_at <= utc && utc < entry.next_at)
    if (!hit) resolves++
    return original(utc)
  }
  try {
    run()
  } finally {
    calendar.lunisolar = original
  }
  return resolves
}

describe('_lunisolar_cache tuning history (performance spec)', () => {
  test('REJECTED (single-slot cache): span_obj(precise) across 2 distant months must resolve exactly twice, not thrice (A→B→A thrashing)', () => {
    const g = Calendar.定気法
    g._lunisolar_cache.length = 0

    const base = Calendar.Gregorian.parse('2024年3月10日')
    const target =
      Calendar.Gregorian.parse('2025年2月28日') + to_msec('3h') + to_msec('45m') + to_msec('12s') + 345

    const resolves = countLunisolarResolves(g, () => {
      g.span_obj(target, base, { precise: 'S' })
    })

    // 単一スロットキャッシュだった頃は、from→to→to(3クエリ、実質2つの
    // 異なる月)のたびに直前の解決が上書きされ、3回とも本物の探索が
    // 走っていた。MRU化後は2回目の to 問い合わせが1回目の結果を
    // ヒットするため、正しく2回で済む。
    expect(resolves).toBe(2)
  })

  test('REJECTED (MRU size 3): a full year of months built once, then revisited zigzag, must not re-resolve on revisit', () => {
    const g = Calendar.定気法
    g._lunisolar_cache.length = 0

    // カレンダーUIで「1年分の月を構築する(例: yeary_table() 相当)→
    // ユーザーが月を行き来する」という現実的なアクセスパターンを模す。
    // (この収集ループ自体が to_tempos()/M.next_at 経由でキャッシュを
    // 温めてしまうため、収集後に明示的にリセットしてから「初回構築」を
    // 計測する。)
    const monthAnchors = []
    let cursor = g.to_tempos(Date.UTC(2020, 0, 1)).u.last_at
    const yearEnd = g.to_tempos(cursor).u.next_at
    while (cursor < yearEnd) {
      const M = g.to_tempos(cursor).M
      monthAnchors.push(cursor + 12 * to_msec('1h'))
      cursor = M.next_at
    }
    expect(monthAnchors.length).toBeGreaterThanOrEqual(12)
    g._lunisolar_cache.length = 0

    const buildResolves = countLunisolarResolves(g, () => {
      for (const utc of monthAnchors) g.to_tempos(utc)
    })
    // 初回構築は全月が新規解決(キャッシュサイズに関係なく避けられない)。
    expect(buildResolves).toBe(monthAnchors.length)

    // ここでキャッシュはリセットしない。直前の構築で温まったキャッシュが
    // そのまま再訪問フェーズに引き継がれることこそが本テストの検証対象。
    // ジグザグ再訪問(1月→12月→2月→11月→...)は、MRUサイズ3だった頃は
    // 直近3件しか残らず4件目以降を訪問した時点で古い月が押し出され、
    // 再訪問のほとんどがキャッシュミスになっていた(実測:
    // このシナリオで36クエリ中32ミス、うち再訪問24回中20回ミス)。
    // 現在のサイズ(16、観測太陰太陽暦の1年分12〜13ヶ月+境界余裕)なら
    // 1年分の月が全て残るため、再訪問は完全にヒットする。
    const zigzag = []
    for (let i = 0; i < monthAnchors.length; i++) {
      zigzag.push(monthAnchors[i % monthAnchors.length])
      zigzag.push(monthAnchors[(monthAnchors.length - 1 - i) % monthAnchors.length])
    }
    const revisitResolves = countLunisolarResolves(g, () => {
      for (const utc of zigzag) g.to_tempos(utc)
    })
    expect(revisitResolves).toBe(0)
  })
})
