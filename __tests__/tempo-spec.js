require('../lib/sample')
const { Calendar } = require('../lib/sample')
const { to_tempo_bare, to_tempo_by } = require('../lib/time')
const { to_tempo_by_solor, solar_terms } = require('../lib/phenomena/solar')
const { lunisolar } = require('../lib/phenomena/lunisolar')
const { mod } = require('../lib/number')
const {
  FixedTempoRule,
  TableTempoRule,
  SubdivideTempoRule,
  FloorTempoRule,
  CyclicDayTempoRule,
  MeanLunarPhaseTempoRule,
  MeanLunisolarMonthRule,
  SolarDayHourTempoRule,
  SolarEventDayTempoRule,
  RealSunsetDayTempoRule,
  OrbitalPhaseTempoRule,
  ObservedLunisolarMonthRule,
  ObservedLunisolarYearRule,
  EraAdjustedTempoRule,
  Tempo,
  envelope_of,
  join,
} = require('../lib/tempo')

const DAY = 86400000
const ZERO = Date.UTC(2000, 0, 1)

function envelopeOf(tempo) {
  return {
    zero: tempo.zero,
    now_idx: tempo.now_idx,
    last_at: tempo.last_at,
    next_at: tempo.next_at,
    table: tempo.table,
  }
}

// 旧 time.ts の Tempo.floor(sub1, sub2, subf=to_tempo_bare)(Tempo への
// 統合に伴いクラスごと削除済み)と同じロジックをテストヘルパーとして
// 複製したもの。FloorTempoRule/MeanLunarPhaseTempoRule(closed-form 計算)を、
// 全く別ロジック(探索ベース)の旧実装とクロスチェックする目的のみに使う
// (本体側に探索系メソッドを復活させるのではなく、テストの独立性を保つため
// テスト側にのみ残す)。
function floorTempo(tempo, sub1, sub2) {
  let { last_at, write_at, next_at, now_idx, size } = tempo
  const do2 = to_tempo_bare(sub1, sub2, next_at)

  if (do2.last_at <= write_at) {
    const slid = tempo.slide(1)
    next_at = slid.next_at
    size = slid.size
    const do3 = to_tempo_bare(sub1, sub2, next_at)
    last_at = do2.last_at
    next_at = do3.last_at
    now_idx++
  } else {
    const do1 = to_tempo_bare(sub1, sub2, last_at)
    last_at = do1.last_at
    next_at = do2.last_at
  }
  const zero = last_at - now_idx * size
  const envelope = { zero, now_idx, last_at, next_at }
  const rule = new FixedTempoRule(size, zero)
  return new Tempo(envelope, { write_at }, rule)
}

// 4年に1回366日、それ以外365日の周期テーブル(累積ms)。to_tempo_by が期待する形。
function buildYearTable() {
  const days = [365, 365, 365, 366]
  const table = []
  let acc = 0
  for (const d of days) {
    acc += d * DAY
    table.push(acc)
  }
  return table
}

describe('tempo', () => {
  describe('join', () => {
    // 旧 time.ts の静的 Tempo.join(a, b)(Tempo への統合に伴いクラスごと
    // 削除済み)と数値的に一致することを確認していた式を、その場でインライン
    // 計算して検証する(phenomena/solar.ts の 雑節_from_terms() が彼岸・
    // 土用・四季の区間を求めるのに使う)。
    test('at() matches the historical Tempo.join() formula for non-adjacent TempoLike intervals sharing the same zero', () => {
      const a = to_tempo_bare(DAY, ZERO, ZERO + 5.5 * DAY)
      const b = to_tempo_bare(DAY, ZERO, ZERO + 8.5 * DAY)
      const last_at = Math.min(a.last_at, b.last_at)
      const next_at = Math.max(a.next_at, b.next_at)
      const write_at = (a.write_at + b.write_at) / 2
      const expected = to_tempo_bare(next_at - last_at, last_at, write_at)
      const actual = join(a, b)
      expect(actual.zero).toBe(expected.zero)
      expect(actual.now_idx).toBe(expected.now_idx)
      expect(actual.last_at).toBe(expected.last_at)
      expect(actual.next_at).toBe(expected.next_at)
      expect(actual.write_at).toBe(expected.write_at)
    })

    test('throws when zero differs', () => {
      const a = to_tempo_bare(DAY, ZERO, ZERO + 100)
      const b = to_tempo_bare(DAY, ZERO + DAY, ZERO + 200)
      expect(() => join(a, b)).toThrow()
    })

    // join() は TempoLike を受け取るため Tempo 同士でも機能することを
    // 確認する。戻り値自体も Tempo(succ()/back()/is_cover() が安全に
    // 使える)であることを確認する。
    test('works with Tempo inputs and returns a steppable Tempo', () => {
      const rule = new FixedTempoRule(DAY, ZERO)
      const a = Tempo.at(rule, { write_at: ZERO + 5.5 * DAY })
      const b = Tempo.at(rule, { write_at: ZERO + 8.5 * DAY })
      const result = join(a, b)
      expect(result.last_at).toBe(Math.min(a.last_at, b.last_at))
      expect(result.next_at).toBe(Math.max(a.next_at, b.next_at))
      expect(result.is_cover(result.write_at)).toBe(true)
      expect(typeof result.succ).toBe('function')
      const next = result.succ()
      expect(next.last_at).toBe(result.next_at)
    })
  })

  describe('FixedTempoRule', () => {
    const size = DAY
    const rule = new FixedTempoRule(size, ZERO)

    test('at() matches to_tempo_bare() across many write_at', () => {
      for (let i = -30; i <= 30; i++) {
        const write_at = ZERO + i * size + 4321
        expect(rule.at(write_at)).toEqual(envelopeOf(to_tempo_bare(size, ZERO, write_at)))
      }
    })

    test('slide() matches chained succ()/back()/slide()', () => {
      const startWriteAt = ZERO + 4321
      let tempo = to_tempo_bare(size, ZERO, startWriteAt)
      let envelope = rule.at(startWriteAt)
      for (const amount of [1, 1, 1, -1, 3, -5, 2, -10]) {
        tempo = tempo.slide(amount)
        envelope = rule.slide(envelope, amount)
        expect(envelope).toEqual(envelopeOf(tempo))
      }
    })
  })

  describe('TableTempoRule', () => {
    const table = buildYearTable()
    const rule = new TableTempoRule(table, ZERO)
    const periodMsec = table[table.length - 1]

    // 実際の呼び出し(to_tempos の drill_down 等)は zero が常に親 Tempo の
    // last_at として再計算されるため、write_at は zero から1周期の範囲に収まる。
    // その現実的な範囲では to_tempo_by とそのまま一致する。
    test('at() matches to_tempo_by() within one period from zero', () => {
      for (let i = 0; i < table.length; i++) {
        const write_at = ZERO + (table[i - 1] || 0) + 100
        expect(rule.at(write_at)).toEqual(envelopeOf(to_tempo_by(table, ZERO, write_at)))
      }
    })

    // 1周期を越えた write_at でも、絶対量として自己整合的であること
    // (周期分だけ単純にずれること)を確認する。
    // (以前は to_tempo_by 自身が now_idx には table_idx を反映するのに
    // last_at/next_at には反映しない食い違いがあった。zero から1周期以内に
    // write_at が収まる呼び出し方しかしていない既存コードでは table_idx が
    // 常に0のため気づかれなかったが、time.ts 側を修正済みなので
    // to_tempo_by() 自身も now は一致する)。
    test('at() stays self-consistent across period boundaries', () => {
      const base = rule.at(ZERO + 100)
      for (let k = -3; k <= 3; k++) {
        const shifted = rule.at(ZERO + k * periodMsec + 100)
        expect(shifted.now_idx).toBe(base.now_idx + k * table.length)
        expect(shifted.last_at).toBe(base.last_at + k * periodMsec)
        expect(shifted.next_at).toBe(base.next_at + k * periodMsec)

        const write_at = ZERO + k * periodMsec + 100
        expect(shifted).toEqual(envelopeOf(to_tempo_by(table, ZERO, write_at)))
      }
    })

    // 1周期の範囲内では既存の Tempo.slide のテーブル分岐と一致する。
    test('slide() matches chained Tempo.slide() while staying within one period', () => {
      const startWriteAt = ZERO + 100
      let tempo = to_tempo_by(table, ZERO, startWriteAt)
      let envelope = rule.at(startWriteAt)
      for (const amount of [1, 1, -1, 2, -1, -2]) {
        tempo = tempo.slide(amount)
        envelope = rule.slide(envelope, amount)
        expect(envelope).toEqual(envelopeOf(tempo))
      }
    })

    // TableTempoRule は zero からの絶対量で計算するため、複数回の slide() の
    // 合計は、1回の slide() と常に一致する(経路非依存)。
    // 以前は Tempo.slide() のテーブル分岐が this.now_idx との差分で table_idx を
    // 計算しており、周期境界を越えて戻ると経路依存の誤差が出た(このテストで
    // 見つかった不整合)。time.ts を修正したので、周期境界を越えて chain した
    // 素の Tempo.slide() も同じく経路非依存になっていることをあわせて確認する。
    test('slide() composes consistently across period boundaries (path independent)', () => {
      const startEnvelope = rule.at(ZERO + 100)
      const steps = [1, 1, 1, 1, -1, -1, -1, -1, -1, 6, -9]

      let chained = startEnvelope
      for (const amount of steps) {
        chained = rule.slide(chained, amount)
      }

      const total = steps.reduce((sum, amount) => sum + amount, 0)
      const direct = rule.slide(startEnvelope, total)

      expect(chained).toEqual(direct)

      let chainedTempo = to_tempo_by(table, ZERO, ZERO + 100)
      for (const amount of steps) {
        chainedTempo = chainedTempo.slide(amount)
      }
      const directTempo = to_tempo_by(table, ZERO, ZERO + 100).slide(total)
      expect(envelopeOf(chainedTempo)).toEqual(envelopeOf(directTempo))
    })
  })

  describe('SubdivideTempoRule', () => {
    // 太陽年を24等分した「二十四節気」相当のサイズ。既存の drill_down() は
    // this.calc.msec.season (= 年サイズ/24) を固定幅として使う。
    const YEAR = 365.25 * DAY
    const SEASON = YEAR / 24
    const rule = new SubdivideTempoRule(SEASON)

    // 親(年)の last_at は年ごとに変わる。実際は Zz = to_tempo_bare(msec.year, zero.season, utc) の last_at。
    function parentLastAt(yearIndex) {
      return yearIndex * YEAR + 54321
    }

    // 既存 drill_down() のテーブル無し分岐は to_tempo_bare(size, base.last_at, at) と同じ式。
    test('at() matches to_tempo_bare(size, parent.last_at, write_at) across many parents', () => {
      for (let year = -2; year <= 2; year++) {
        const parent = {
          zero: 0,
          now_idx: year,
          last_at: parentLastAt(year),
          next_at: parentLastAt(year + 1),
        }
        for (let i = -2; i <= 25; i++) {
          const write_at = parent.last_at + i * SEASON + 100
          const envelope = rule.at(write_at, { write_at, parent })
          expect(envelope).toEqual(envelopeOf(to_tempo_bare(SEASON, parent.last_at, write_at)))
        }
      }
    })

    // 一度 envelope が解決された後の slide() は、zero が envelope 側に保持されるため
    // 既存の Tempo.slide() (非テーブル分岐)と同じ式になり、親をまたいでも成立する。
    test('slide() matches chained Tempo.slide() across parent (year) boundaries', () => {
      const parent = { zero: 0, now_idx: 0, last_at: parentLastAt(0), next_at: parentLastAt(1) }
      const startWriteAt = parent.last_at + 100
      let tempo = to_tempo_bare(SEASON, parent.last_at, startWriteAt)
      let envelope = rule.at(startWriteAt, { write_at: startWriteAt, parent })
      for (const amount of [1, 1, 1, -1, 5, -3, 20, -25, 30]) {
        tempo = tempo.slide(amount)
        envelope = rule.slide(envelope, amount)
        expect(envelope).toEqual(envelopeOf(tempo))
      }
    })
  })

  describe('MeanLunarPhaseTempoRule', () => {
    // 平気法は観測太陰太陽暦を使わない平均月暦。実際の calc 定数をそのまま使う。
    const g = Calendar.平気法
    const moonMsec = g.calc.msec.moon
    const moonZero = g.calc.zero.moon
    const daySize = g.calc.msec.day
    const dayZero = g.calc.zero.day
    const rule = new MeanLunarPhaseTempoRule(moonMsec, moonZero, daySize, dayZero)

    // 既存 to_tempos() の
    // Nn = to_tempo_bare(moon_msec, zero.moon, utc).floor(msec.day, zero.day)
    // と同じ式(月番号割り当て・閘月判定はこの規則の外側の別の関心事なので含まない)。
    // 月境界からわざとずらした位置で総当たりして一致を確認する。
    test('at() matches to_tempo_bare(moon_msec, moon_zero, write_at).floor(day_msec, day_zero)', () => {
      const start = moonZero - 50 * moonMsec
      for (let i = 0; i < 100; i++) {
        const write_at = start + i * moonMsec * 0.97
        const expected = envelopeOf(
          floorTempo(to_tempo_bare(moonMsec, moonZero, write_at), daySize, dayZero),
        )
        expect(rule.at(write_at)).toEqual(expected)
      }
    })

    // この規則自体(生の朔望月境界)は succ()/back() 経由で直接使われない。
    // ただしこれを包む MeanLunisolarMonthRule(下記)は、to_table() の
    // yeary_table() 経由で実際に succ() が呼ばれる(旧実装ではこれが
    // 原因で月の重複が発生していた)。ここでは自己整合性(now_idx が
    // ちょうど amount 分進むこと、応じて時間軸上も進むこと)を確認する。
    test('slide() advances now_idx by amount and stays chronologically consistent', () => {
      const base = rule.at(moonZero + 12345)
      for (const amount of [1, 1, 1, -1, -1, 6, -9, 2]) {
        const next = rule.slide(base, amount)
        expect(next.now_idx).toBe(base.now_idx + amount)
        expect(next.last_at < next.next_at).toBe(true)
        if (amount > 0) {
          expect(next.last_at >= base.last_at).toBe(true)
        } else if (amount < 0) {
          expect(next.last_at <= base.last_at).toBe(true)
        }
        // at() で同じ now_idx を素直に再解決した場合と一致する(経路非依存)。
        const direct = rule.at(next.last_at + 1)
        expect(direct).toEqual(next)
      }
    })
  })

  describe('MeanLunisolarMonthRule', () => {
    // 平気法(観測太陰太陽暦を使わない平均月暦、hasSolarEvents(sunny)=false)。
    // 既存 to_tempos() の resolve_season(等角/SubdivideTempoRule)と
    // 同じものを組み立てて注入する。
    const g = Calendar.平気法
    const seasonRule = new SubdivideTempoRule(g.calc.msec.season)
    const seedZz = Tempo.at(new FixedTempoRule(g.calc.msec.year, g.calc.zero.season), {
      write_at: Date.UTC(1980, 0, 1),
    })
    const ZzEnvelope = envelope_of(seedZz)
    const resolveSeason = (at) => Tempo.at(seasonRule, { write_at: at, parent: ZzEnvelope })
    const rule = new MeanLunisolarMonthRule(
      g.calc.msec.moon,
      g.calc.zero.moon,
      g.calc.msec.day,
      g.calc.zero.day,
      g.dic.Z.length,
      resolveSeason,
    )

    function monthEnvelopeOf(m) {
      return { now_idx: m.now_idx, last_at: m.last_at, next_at: m.next_at, is_leap: !!m.is_leap }
    }

    // 既存 to_tempos().M(この規則を配線した後の実際の値)と、閏月を含む
    // 多年にわたって完全一致することを確認する(規則単体で組み立てた
    // resolveSeason が、実際の配線と同じ結果になることの確認でもある)。
    test('at() matches to_tempos().M across many months (including leap months)', () => {
      let cursor = Date.UTC(1980, 0, 1)
      const end = Date.UTC(2020, 0, 1)
      let compared = 0
      let leapSeen = 0
      while (cursor < end) {
        const M = g.to_tempos(cursor).M
        expect(monthEnvelopeOf(rule.at(cursor))).toEqual(monthEnvelopeOf(M))
        if (M.is_leap) leapSeen++
        compared++
        cursor = M.next_at
      }
      expect(compared).toBeGreaterThan(400)
      expect(leapSeen).toBeGreaterThan(10)
    })

    // 旧実装(素の Tempo に now_idx を上書き)では、succ() が
    // Tempo.slide() の「今の月の実サイズを固定長とみなして write_at + n*size
    // で進める」式を使っており、朔望月の実サイズが月ごとに変動するせいで
    // 稀に「次の月の途中」までしか進まず、同じ月が2回連続することがあった
    // (to_table() の yeary_table()/monthry_table() で実際に確認された不具合)。
    // この規則は now_idx を使わず last_at 基準+moonMsec 定数ステップで
    // slide() するため、この不具合を起こさないことを確認する。
    test('slide() via succ() never repeats the same month (regression for the yeary_table duplicate bug)', () => {
      let current = Tempo.at(rule, { write_at: Date.UTC(1980, 0, 1) })
      let prevKey = null
      for (let i = 0; i < 300; i++) {
        const key = `${current.last_at}_${current.now_idx}_${current.is_leap}`
        expect(key).not.toBe(prevKey)
        prevKey = key
        current = current.succ()
      }
    })

    // succ() で進めた分だけ back() すれば経路非依存でちょうど元に戻ること、
    // また succ() の連鎖が隙間なく(last_at が直前の next_at と一致)
    // 繋がっていることを確認する。
    test('slide() chains gaplessly and succ()/back() are inverses', () => {
      const base = Tempo.at(rule, { write_at: Date.UTC(1980, 0, 1) })
      let cursor = base
      for (let i = 0; i < 40; i++) {
        const next = cursor.succ()
        expect(next.last_at).toBe(cursor.next_at)
        cursor = next
      }
      let back = cursor
      for (let i = 0; i < 40; i++) back = back.back()
      expect(back.now_idx).toBe(base.now_idx)
      expect(back.last_at).toBe(base.last_at)
    })
  })

  describe('FloorTempoRule', () => {
    // Romulus は SeasonTable(is_table_month のみ)。既存 to_tempos() の
    // u = to_tempo_bare(msec.year, zero.spring, utc).floor(msec.day, zero.day)
    // と同じ、切り詰め1段のケース。
    const rg = Calendar.Romulus
    const yearMsec = rg.calc.msec.year
    const springZero = rg.calc.zero.spring
    const rgDaySize = rg.calc.msec.day
    const rgDayZero = rg.calc.zero.day
    const singleRule = new FloorTempoRule(yearMsec, springZero, [
      { size: rgDaySize, zero: rgDayZero },
    ])

    test('at() matches to_tempo_bare(year).floor(day) (single floor step)', () => {
      const start = springZero - 5 * yearMsec
      for (let i = 0; i < 60; i++) {
        const write_at = start + i * yearMsec * 0.37
        const expected = envelopeOf(
          floorTempo(to_tempo_bare(yearMsec, springZero, write_at), rgDaySize, rgDayZero),
        )
        expect(singleRule.at(write_at)).toEqual(expected)
      }
    })

    // 平気法(観測太陰太陽暦を使わない平均月暦)は SolarLunar かつ非観測。既存
    // to_tempos() の
    // u = to_tempo_bare(msec.year, zero.season+msec.season, utc)
    //       .floor(moon_msec, zero.moon)
    //       .floor(msec.day, zero.day)
    // と同じ、切り詰め2段のケース。
    const heiki = Calendar.平気法
    const seasonZero = heiki.calc.zero.season + heiki.calc.msec.season
    const moonMsec = heiki.calc.msec.moon
    const moonZero = heiki.calc.zero.moon
    const heikiDaySize = heiki.calc.msec.day
    const heikiDayZero = heiki.calc.zero.day
    const doubleRule = new FloorTempoRule(yearMsec, seasonZero, [
      { size: moonMsec, zero: moonZero },
      { size: heikiDaySize, zero: heikiDayZero },
    ])

    test('at() matches to_tempo_bare(year).floor(moon).floor(day) (two chained floor steps)', () => {
      const start = seasonZero - 5 * yearMsec
      for (let i = 0; i < 60; i++) {
        const write_at = start + i * yearMsec * 0.41
        const expected = envelopeOf(
          floorTempo(
            floorTempo(to_tempo_bare(yearMsec, seasonZero, write_at), moonMsec, moonZero),
            heikiDaySize,
            heikiDayZero,
          ),
        )
        expect(doubleRule.at(write_at)).toEqual(expected)
      }
    })

    // 実コードでは year(u)の遷移も succ()/back() ではなく毎回 to_tempos() の
    // 再解決で行われている。find({step:'u'}) 経由で外部から呼ばれる可能性は
    // ゼロではないため、MeanLunarPhaseTempoRule と同様に自己整合性を確認する。
    //
    // 検証点は next の「境界ちょうど」ではなく中央付近を使う。floor() の
    // 入れ子境界(この場合は月境界)ちょうど・その近辺で問い合わせると、
    // 「どちらの月に属するか」の判定が既存の Tempo.floor() 自身でも
    // 際どくなる(境界1ms後だけを問い合わせても、月境界との位置関係次第で
    // 既存 to_tempo_bare().floor().floor() 自身の結果も変わりうることを
    // 実測で確認した)。これは FloorTempoRule 固有の不整合ではなく、
    // 入れ子の floor が持つ既存の性質なので、中央付近という
    // 曖昧さの少ない点で比較する。
    test('slide() advances now_idx by amount and stays chronologically consistent', () => {
      const base = doubleRule.at(seasonZero + 54321)
      for (const amount of [1, 1, 1, -1, -1, 4, -7, 2]) {
        const next = doubleRule.slide(base, amount)
        expect(next.now_idx).toBe(base.now_idx + amount)
        expect(next.last_at < next.next_at).toBe(true)
        const middle = next.last_at + (next.next_at - next.last_at) / 2
        const direct = doubleRule.at(middle)
        expect(direct).toEqual(next)
      }
    })
  })

  describe('CyclicDayTempoRule', () => {
    // 既存 to_tempos() の「日不断」トークン(dC60/dC12/dC10/dC7/dC28 等)が
    // `const A = to_tempo_bare(dayMsec, zero, utc); A.now_idx = mod(A.now_idx, length)`
    // のように、いったん生の now_idx を作ってから mod で包み直しているのと
    // 同じ計算になることを確認する。
    const g = Calendar.Gregorian
    const dayMsec = g.calc.msec.day

    test('at() matches to_tempo_bare(day).now_idx = mod(now_idx, length) across period boundaries', () => {
      const zero = g.calc.zero.day60
      const length = g.dic.A.length
      const rule = new CyclicDayTempoRule(dayMsec, zero, length)
      const start = zero - dayMsec * 500
      for (let i = 0; i < 200; i++) {
        const write_at = start + i * dayMsec * 3.7
        const expected = to_tempo_bare(dayMsec, zero, write_at)
        const actual = rule.at(write_at)
        expect(actual.now_idx).toBe(mod(expected.now_idx, length))
        expect(actual.last_at).toBe(expected.last_at)
        expect(actual.next_at).toBe(expected.next_at)
      }
    })

    // TableTempoRule は now_idx 自体が周期をまたいで増え続ける値であることを
    // 前提にしている(年の閏年テーブルなど)ため、この用途にそのまま使うと
    // 周期をまたいだ瞬間に now_idx が table_idx*length 分だけずれてしまう
    // ことを確認しておく(CyclicDayTempoRule が別に必要な理由)。
    test('TableTempoRule (uniform table) does NOT give a wrapped now_idx across period boundaries', () => {
      const zero = g.calc.zero.day60
      const length = g.dic.A.length
      const table = []
      for (let i = 1; i <= length; i++) table.push(i * dayMsec)
      const tableRule = new TableTempoRule(table, zero)
      const write_at = zero + dayMsec * (length * 9 + 3) // 9周期先(table_idx=9)
      const expected = to_tempo_bare(dayMsec, zero, write_at)
      const viaTable = tableRule.at(write_at)
      expect(viaTable.now_idx).not.toBe(mod(expected.now_idx, length))
      expect(viaTable.now_idx).toBe(expected.now_idx) // table_idx を畳まず生のnow_idxを返す
    })

    test('slide() wraps now_idx modulo length and stays path independent', () => {
      const zero = g.calc.zero.day60
      const length = g.dic.A.length
      const rule = new CyclicDayTempoRule(dayMsec, zero, length)
      const base = rule.at(zero + dayMsec * 54.5)
      for (const amount of [1, 1, 1, -1, 12, -13, 24, -25]) {
        const next = rule.slide(base, amount)
        expect(next.now_idx).toBe(mod(base.now_idx + amount, length))
        expect(next.last_at < next.next_at).toBe(true)
        const middle = next.last_at + (next.next_at - next.last_at) / 2
        const direct = rule.at(middle)
        expect(direct).toEqual(next)
      }
    })
  })

  describe('CyclicDayTempoRule for the 社日-style "read wrapped now_idx, then slide()" pattern', () => {
    // phenomena/solar.ts の 雑節_from_terms() 社日計算(C移行前、現状のまま):
    //   const C = to_tempo_bare(dayMsec, zero, write_at)
    //   C.now_idx = mod(C.now_idx, stemLength)
    //   return C.slide(stemLength / 2 - C.now_idx - 1)
    // という「now_idx を書き換えてから slide() する」パターンを、
    // CyclicDayTempoRule + Tempo で置き換えられるかを検証する。
    const dayMsec = DAY
    const zero = ZERO
    const stemLength = 10
    const targetRemainder = stemLength / 2 - 1 // 「戊」相当(十干なら index 4)

    function oldPattern(write_at) {
      // 生の day envelope を算術式で直接計算する(to_tempo_bare 経由だと、
      // その内部実装が Tempo+FixedTempoRule になった今、まさにこの
      // テストが検証したい「now_idx を書き換えた状態で slide() すると
      // FixedTempoRule は last_at 基準の再導出をせず壊れる」という
      // PITFALL を oldPattern 自身が踏んでしまうため、独立した算術式に
      // 留める)。
      const now_idx = Math.floor((write_at - zero) / dayMsec)
      const last_at = now_idx * dayMsec + zero
      const wrapped = mod(now_idx, stemLength)
      const amount = stemLength / 2 - wrapped - 1
      const shiftedLastAt = last_at + amount * dayMsec
      return { last_at: shiftedLastAt, next_at: shiftedLastAt + dayMsec }
    }

    function newPatternViaCyclicDayTempoRule(write_at) {
      const rule = new CyclicDayTempoRule(dayMsec, zero, stemLength)
      const view = Tempo.at(rule, { write_at })
      const amount = stemLength / 2 - view.now_idx - 1
      return view.slide(amount)
    }

    // 基準点の違い(旧: write_at(瞬間)基準でシフト、新: CyclicDayTempoRule.slide()
    // は envelope.last_at(日の開始)を起点に中間点を作って再導出)が、
    // 実際に同じ結果になるかを、日の途中の様々な時刻・様々な曜日位置で
    // 広く検証する。1周期(10日)を超える範囲を使い、0〜9全ての剰余
    // (stemLength個)を必ず踏むことも合わせて確認する。
    test('at() + wrapped now_idx + slide() matches the old to_tempo_bare()-based pattern across all 10 stem remainders', () => {
      const seenRemainders = new Set()
      for (let i = -50; i <= 50; i++) {
        const write_at = zero + i * dayMsec + 12345 // 日の途中の時刻
        const old = oldPattern(write_at)
        const next = newPatternViaCyclicDayTempoRule(write_at)
        expect(next.last_at).toBe(old.last_at)
        expect(next.next_at).toBe(old.next_at)
        seenRemainders.add(mod(Math.floor((write_at - zero) / dayMsec), stemLength))
      }
      expect(seenRemainders.size).toBe(stemLength)
    })

    // 新実装の結果が、実際に「目標剰余(戊相当)」の日に着地していることも
    // 独立に確認する(oldPattern との一致だけでなく、計算の意図自体が
    // 正しいことの検証)。amount=0(既にその日が目標剰余、シフト不要)の
    // ケースも自然にこの範囲に含まれる。
    test('the shifted result always lands exactly on the target remainder day', () => {
      for (let i = -50; i <= 50; i++) {
        const write_at = zero + i * dayMsec + 12345
        const result = newPatternViaCyclicDayTempoRule(write_at)
        const resultRemainder = mod(Math.floor((result.last_at - zero) / dayMsec), stemLength)
        expect(resultRemainder).toBe(targetRemainder)
      }
    })

    // 落とし穴の実証(このまま繰り返さないための記録): FixedTempoRule.slide()
    // は envelope.now_idx + amount を絶対値として直接計算する(last_at
    // からの再導出ではない)。now_idx を mod でラップした状態のenvelopeを
    // FixedTempoRule.slide() に渡すと、ラップ後の小さい値を絶対 now_idx
    // として扱ってしまい、zero(day10Zero相当)付近の全く無関係な日へ
    // 飛んでしまう。CyclicDayTempoRule(last_at 基準の再導出方式)だけが
    // この「now_idx を書き換えてから slide() する」パターンで安全に使える
    // 理由をspecとして残す。
    test('PITFALL (documented so it is not repeated): FixedTempoRule breaks when now_idx is wrapped before slide()', () => {
      const rule = new FixedTempoRule(dayMsec, zero)
      const write_at = zero + 45 * dayMsec + 12345
      const view = Tempo.at(rule, { write_at })
      const wrappedNowIdx = mod(view.now_idx, stemLength)
      view.now_idx = wrappedNowIdx // 旧コードの C.now_idx = mod(...) と同じ上書き操作
      const amount = stemLength / 2 - wrappedNowIdx - 1
      const broken = view.slide(amount)

      const correct = oldPattern(write_at)
      expect(broken.last_at).not.toBe(correct.last_at)
    })
  })

  describe('SolarDayHourTempoRule', () => {
    // 平気法は .division({ H: 'solar' }) で不定時法(dic.is_solor)。実際の calc/dic 定数を使う。
    const g = Calendar.平気法
    const { sunny, earthy, geo } = g.dic
    const dayMsec = g.calc.msec.day
    const dayZero = g.calc.zero.day
    const yearMsec = g.calc.msec.year
    const seasonZero = g.calc.zero.season
    const hourLength = g.dic.H.length
    const rule = new SolarDayHourTempoRule(
      sunny,
      earthy,
      geo,
      dayMsec,
      dayZero,
      yearMsec,
      seasonZero,
      hourLength,
    )

    // 既存 to_tempo_by_solor() と同じ計算になることを、昼夜の長さ差が大きい
    // 夏至・冒至付近の複数日・日内の複数時刻で確認する。
    test('at() matches to_tempo_by_solor() across day/night length extremes', () => {
      for (const seedUtc of [Date.UTC(2024, 5, 21), Date.UTC(2024, 11, 21)]) {
        const baseDay = to_tempo_bare(dayMsec, dayZero, seedUtc)
        for (let d = -2; d <= 2; d++) {
          const day = to_tempo_bare(dayMsec, dayZero, baseDay.last_at + d * dayMsec + 1000)
          for (let h = 0; h < hourLength; h++) {
            const write_at = day.last_at + Math.floor((h + 0.3) * (day.size / hourLength))
            const expected = envelopeOf(
              to_tempo_by_solor(
                sunny,
                earthy,
                geo,
                dayMsec,
                dayZero,
                yearMsec,
                seasonZero,
                hourLength,
                write_at,
                day,
              ),
            )
            const actual = rule.at(write_at, { write_at, day: envelopeOf(day) })
            expect(actual).toEqual(expected)
          }
        }
      }
    })

    // 日内に留まる限り、既存の Tempo.slide() (テーブル分岐)と一致する。
    // （日をまたぐ遷移は天文計算のやり直しが必要なため、この規則の想定外）。
    test('slide() matches chained Tempo.slide() while staying within one day', () => {
      const day = to_tempo_bare(dayMsec, dayZero, Date.UTC(2024, 11, 21) + 1000)
      const startWriteAt = day.last_at + 100
      const base = { write_at: startWriteAt, day: envelopeOf(day) }
      let tempo = to_tempo_by_solor(
        sunny,
        earthy,
        geo,
        dayMsec,
        dayZero,
        yearMsec,
        seasonZero,
        hourLength,
        startWriteAt,
        day,
      )
      let envelope = rule.at(startWriteAt, base)
      for (const amount of [1, 1, 1, -1, 2, -2, 3, -4]) {
        tempo = tempo.slide(amount)
        envelope = rule.slide(envelope, amount, base)
        expect(envelope).toEqual(envelopeOf(tempo))
      }
    })
  })

  describe('SolarEventDayTempoRule', () => {
    const g = Calendar.平気法
    const { sunny, earthy, geo } = g.dic
    const dayMsec = g.calc.msec.day
    const dayZero = g.calc.zero.day
    const yearMsec = g.calc.msec.year
    const seasonZero = g.calc.zero.season
    const sunriseRule = new SolarEventDayTempoRule(
      sunny,
      earthy,
      geo,
      dayMsec,
      dayZero,
      yearMsec,
      seasonZero,
      'sunrise',
    )
    const sunsetRule = new SolarEventDayTempoRule(
      sunny,
      earthy,
      geo,
      dayMsec,
      dayZero,
      yearMsec,
      seasonZero,
      'sunset',
    )
    const legacySunsetRule = new RealSunsetDayTempoRule(
      sunny,
      earthy,
      geo,
      dayMsec,
      dayZero,
      yearMsec,
      seasonZero,
    )

    test('sunset mode matches the legacy RealSunsetDayTempoRule wrapper', () => {
      const parent = envelopeOf(to_tempo_bare(dayMsec * 30, dayZero, Date.UTC(2024, 5, 1)))
      for (const write_at of [Date.UTC(2024, 5, 1), Date.UTC(2024, 5, 1, 18), Date.UTC(2024, 5, 2)]) {
        const base = { write_at, parent }
        expect(sunsetRule.at(write_at, base)).toEqual(legacySunsetRule.at(write_at, base))
      }
    })

    test('sunrise mode uses the actual sunrise as the day boundary', () => {
      const civil = to_tempo_bare(dayMsec, dayZero, Date.UTC(2024, 5, 21))
      const parent = envelopeOf(to_tempo_bare(dayMsec * 30, civil.last_at, civil.last_at + 1))
      const sunrise = g.solor(civil.center_at).日の出
      const before = sunrise - 1000
      const after = sunrise + 1000
      expect(sunriseRule.boundary_at_or_after(before)).toBe(sunrise)
      expect(sunriseRule.at(before, { write_at: before, parent }).next_at).toBe(sunrise)
      expect(sunriseRule.at(after, { write_at: after, parent }).last_at).toBe(sunrise)
    })

    test('sunrise mode advances now_idx by civil day even when sunrise gets earlier', () => {
      const monthStart = to_tempo_bare(dayMsec, dayZero, Date.UTC(2024, 5, 1)).last_at
      const firstSunrise = sunriseRule.boundary_at_or_after(monthStart)
      const parent = {
        zero: monthStart,
        now_idx: 0,
        last_at: firstSunrise,
        next_at: firstSunrise + 30 * dayMsec,
      }
      let current = Tempo.at(sunriseRule, { write_at: firstSunrise + 1000, parent })
      for (let i = 0; i < 25; i++) {
        const next = current.succ()
        expect(next.now_idx).toBe(current.now_idx + 1)
        current = next
      }
    })
  })

  describe('OrbitalPhaseTempoRule', () => {
    // 既存 solar_terms()/雑節_by_phase() と同じ solar_phase()(= sunny.timeOfPhase())
    // を使う。referencePhaseOffset = 2/8 は既存実装と同じ「春分基準のズレ」。
    const g = Calendar.平気法
    const sunny = g.dic.sunny
    const dayMsec = g.calc.msec.day
    const dayZero = g.calc.zero.day
    const rule = new OrbitalPhaseTempoRule(sunny, g.dic.Z.length, 2 / 8)

    // solar_terms() の代表的な二十四節気の項目(雑節ではないもの)と、日単位で完全一致することを確認する。
    // 入梅・半夏生・土用は24等分の目盛りに乗らない雑節なので除外する。
    test('at() matches solar_terms() for the 24 sekki (excluding non-24 雑節)', () => {
      const sekkiPhase = {
        立春: 1 / 8,
        春分: 2 / 8,
        立夏: 3 / 8,
        夏至: 4 / 8,
        立秋: 5 / 8,
        秋分: 6 / 8,
        立冬: 7 / 8,
        次立春: 9 / 8,
      }
      const utc = Date.UTC(2024, 5, 1)
      const terms = solar_terms(sunny, dayMsec, dayZero, utc)
      for (const [name, phase] of Object.entries(sekkiPhase)) {
        const tempo = terms[name]
        const env = rule.at(tempo.write_at)
        const roundedDay = to_tempo_bare(dayMsec, dayZero, env.last_at)
        expect(roundedDay.last_at).toBe(tempo.last_at)
      }
    })

    // now_idx は境界探索で確定した「基準位相からの区間番号」で、0..divisions-1 に
    // mod 済み(ラベル参照が mod なしで list[now_idx] を引くための整合)。
    // 自己整合性(now_idx が amount 分進んだ上で mod divisions されること、経路非依存)を確認する。
    test('slide() advances now_idx by amount modulo divisions and is path independent', () => {
      const divisions = g.dic.Z.length
      const base = rule.at(Date.UTC(2024, 5, 1))
      for (const amount of [1, 1, 1, -1, 12, -13, 24, -25]) {
        const next = rule.slide(base, amount)
        expect(next.now_idx).toBe(mod(base.now_idx + amount, divisions))
        expect(next.last_at < next.next_at).toBe(true)
        const direct = rule.at(next.last_at + 1)
        expect(direct).toEqual(next)
      }
    })
  })
})

describe('ObservedLunisolarMonthRule', () => {
  // 定気法は usesObservedLunisolar=true(hasSolarEvents(sunny) && hasLunarEvents(moony))なので
  // 実際の lunisolar() 経路を通る。resolveMonth はコールバック注入(fancy-date.ts
  // 側では FancyDate.lunisolar() というキャッシュ付き版を注入するが、ここでは
  // 生の lunisolar(options, at) を直接注入して規則単体の正しさを検証する。
  const g = Calendar.定気法
  const options = {
    moony: g.dic.moony,
    geo: g.dic.geo,
    dayMsec: g.calc.msec.day,
    dayZero: g.calc.zero.day,
    lunarPhase: (phase, near) => g.lunar_phase(phase, near),
    solarPhase: (phase, near) => g.solar_phase(phase, near),
  }
  const rule = new ObservedLunisolarMonthRule((at) => lunisolar(options, at), g.calc.msec.moon)

  function monthEnvelopeOf(m) {
    return { now_idx: m.now_idx, last_at: m.last_at, next_at: m.next_at, is_leap: !!m.is_leap }
  }

  // 既存 to_tempos().M(内部で lunisolar() を使う)と、閏月を含む多年にわたって完全一致することを確認する。
  test('at() matches the existing to_tempos().M across many months (including leap months)', () => {
    let cursor = Date.UTC(2000, 0, 1)
    const end = Date.UTC(2040, 0, 1)
    let compared = 0
    while (cursor < end) {
      const M = g.to_tempos(cursor).M
      expect(monthEnvelopeOf(rule.at(cursor))).toEqual(monthEnvelopeOf(M))
      compared++
      cursor = M.next_at
    }
    expect(compared).toBeGreaterThan(400)
  })

  // 実コードでもこの規則を Tempo 配線したことで、月の遷移は succ()/back()
  // (rule.slide() 経由)でも正しく動作するようになった(以前は素の Tempo に
  // now_idx=月番号-1 を上書きしていたため、succ() が Tempo.slide() の非テーブル
  // 分岐(今の月の実サイズを固定長とみなす式)を使い、年境界でリセットされる
  // べき now_idx が単純に+1され続ける実バグがあった。詳細はクラス自身のdoc
  // コメント参照)。閏月をまたぐ可能性のある13ヶ月連続で、前後の月が隣接している
  // (last_at/next_at が隣接し、隙間ができない)ことを確認する。
  test('slide() advances/retreats to adjacent months with no gap, across a leap month', () => {
    const base = rule.at(Date.UTC(2020, 0, 1))

    let cursor = base
    for (let i = 0; i < 13; i++) {
      const next = rule.slide(cursor, 1)
      expect(next.last_at).toBe(cursor.next_at)
      cursor = next
    }

    cursor = base
    for (let i = 0; i < 13; i++) {
      const next = rule.slide(cursor, -1)
      expect(next.next_at).toBe(cursor.last_at)
      cursor = next
    }
  })
})

describe('ObservedLunisolarYearRule', () => {
  // 定気法は usesObservedLunisolar=true なので実際の lunisolar() 経路を通る。
  const g = Calendar.定気法
  const rule = new ObservedLunisolarYearRule((at) => g.lunisolar(at))

  // lunisolar() 自身が返す year/year_start_at/next_year_start_at と
  // 直接一致することを確認する(この規則は lunisolar() の結果を年の
  // envelope として切り出すだけで、探索自体は再実装しない)。
  test('at() matches lunisolar() year boundaries and year number across many years', () => {
    let cursor = Date.UTC(2000, 0, 1)
    const end = Date.UTC(2025, 0, 1)
    let compared = 0
    while (cursor < end) {
      const lunisolar = g.lunisolar(cursor)
      const env = rule.at(cursor)
      expect(env.now_idx).toBe(lunisolar.year)
      expect(env.last_at).toBe(lunisolar.year_start_at)
      expect(env.next_at).toBe(lunisolar.next_year_start_at)
      compared++
      cursor = lunisolar.next_year_start_at
    }
    expect(compared).toBeGreaterThan(20)
  })

  // 実コードでも年の遷移は succ()/back() ではなく毎回 to_tempos() の再解決で
  // 行われているため、slide() には比較対象の既存式がない。隣接する年が
  // 隙間なく(last_at/next_at が隣接)繋がることを確認する。
  test('slide() advances/retreats to adjacent years with no gap', () => {
    const base = rule.at(Date.UTC(2020, 0, 1))

    let cursor = base
    for (let i = 0; i < 10; i++) {
      const next = rule.slide(cursor, 1)
      expect(next.last_at).toBe(cursor.next_at)
      cursor = next
    }

    cursor = base
    for (let i = 0; i < 10; i++) {
      const next = rule.slide(cursor, -1)
      expect(next.next_at).toBe(cursor.last_at)
      cursor = next
    }
  })
})

describe('EraAdjustedTempoRule', () => {
  // 平気法(平均太陰太陽暦、FloorTempoRule内包)。既存 to_tempos() の
  // u(else分岐)と同じ内側規則を組み立てて注入する。定気法(観測太陰太陽暦)の
  // lunisolar() は実天文計算で重いため、規則単体の反復テストは平気法を
  // 主に使う(実際の元号テーブル(北朝元号)自体は両暦共通で、延文/康安/
  // 明治/平成/令和などの実在する改元を全て含む)。
  function heikiInnerRule(g) {
    return new FloorTempoRule(g.calc.msec.year, g.calc.zero.season + g.calc.msec.season, [
      { size: g.calc.msec.moon, zero: g.calc.zero.moon },
      { size: g.calc.msec.day, zero: g.calc.zero.day },
    ])
  }
  function buildRule(g, innerRule) {
    return new EraAdjustedTempoRule(
      innerRule,
      g.calc.msec.year,
      g.table.msec.era,
      g.calc.zero.era,
      g.calc.eras,
    )
  }

  const g = Calendar.平気法
  const rule = buildRule(g, heikiInnerRule(g))

  // 既存 to_tempos().u(この規則を配線した後の実際の値)と、昭和→平成→令和の
  // 実在する改元を含む範囲で完全一致することを確認する。
  test('at() matches to_tempos().u across modern era transitions (昭和→平成→令和)', () => {
    let cursor = Date.UTC(1980, 0, 1)
    const end = Date.UTC(2025, 0, 1)
    let compared = 0
    while (cursor < end) {
      const u = g.to_tempos(cursor).u
      const env = rule.at(cursor)
      expect(env.now_idx).toBe(u.now_idx)
      expect(env.last_at).toBe(u.last_at)
      expect(env.next_at).toBe(u.next_at)
      compared++
      cursor = u.next_at
    }
    expect(compared).toBeGreaterThan(40)
  })

  // 延文→康安(1361-05-12、年の途中での改元)を succ() の連鎖で実際にまたぐ。
  // 元号は年の境界とは無関係に切り替わるのが実際にはほぼ全て(定気法の
  // 元号239件中239件が年途中)なので、境界ちょうどではなく実在する
  // 改元をまたぐ連鎖で検証する。fresh な再導出は write_at 基準で行う
  // (last_at 基準だと since を無視した誤った比較になる、というこの
  // セッションで得た教訓)。
  test('succ() chain matches fresh re-derivation across a real mid-year era transition (延文→康安, 1361-05-12)', () => {
    let cursor = Tempo.at(rule, { write_at: Date.UTC(1355, 0, 1) })
    for (let i = 0; i < 10; i++) {
      const next = cursor.succ()
      const fresh = rule.at(next.write_at)
      expect(next.now_idx).toBe(fresh.now_idx)
      expect(g.to_tempos(next.write_at).u.now_idx).toBe(next.now_idx)
      cursor = next
    }
  })

  // succ() で進めた分だけ back() すれば、改元をまたぐ場合も含めて経路非依存で
  // ちょうど元に戻ることを確認する。
  test('succ()/back() are inverses across a real era transition', () => {
    const base = Tempo.at(rule, { write_at: Date.UTC(1355, 0, 1) })
    let cursor = base
    for (let i = 0; i < 10; i++) cursor = cursor.succ()
    for (let i = 0; i < 10; i++) cursor = cursor.back()
    expect(cursor.now_idx).toBe(base.now_idx)
    expect(cursor.last_at).toBe(base.last_at)
  })

  // def_eras() 自身が table.msec.era を構築する最中(まだ undefined)に
  // this.to_tempos() を呼ぶため、この規則もその状態で呼ばれうる
  // (with_era() 側の対応する防御コメント参照)。eraTable 未設定時は
  // 元号調整前の raw な値をそのまま返すことを確認する。
  test('with_era() bootstrapping guard returns the raw (era-unadjusted) envelope when eraTable is not yet available', () => {
    const inner = heikiInnerRule(g)
    const bootstrapping = new EraAdjustedTempoRule(
      inner,
      g.calc.msec.year,
      undefined,
      g.calc.zero.era,
      g.calc.eras,
    )
    const utc = Date.UTC(2020, 0, 1)
    expect(bootstrapping.at(utc, { write_at: utc })).toEqual(inner.at(utc))
  })
})
