require('../lib/sample')
const { Calendar } = require('../lib/sample')
const { to_tempo_bare, to_tempo_by } = require('../lib/time')
const { to_tempo_by_solor, solar_terms } = require('../lib/phenomena/solar')
const {
  FixedTempoRule,
  TableTempoRule,
  SubdivideTempoRule,
  MeanLunarPhaseTempoRule,
  SolarDayHourTempoRule,
  OrbitalPhaseTempoRule,
  ObservedLunisolarMonthRule,
  to_tempo_like,
} = require('../lib/tempo-model')

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

describe('tempo-model', () => {
  describe('to_tempo_like', () => {
    test('is an identity conversion (no clone/mutation)', () => {
      const tempo = to_tempo_bare(DAY, ZERO, ZERO + 1000)
      expect(to_tempo_like(tempo)).toBe(tempo)
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
        const parent = { zero: 0, now_idx: year, last_at: parentLastAt(year), next_at: parentLastAt(year + 1) }
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
        const expected = envelopeOf(to_tempo_bare(moonMsec, moonZero, write_at).floor(daySize, dayZero))
        expect(rule.at(write_at)).toEqual(expected)
      }
    })

    // 実コードでは月の遷移は succ()/back() ではなく毎回 to_tempos() の
    // 再解決で行われている(Nn.succ() 等の呼び出しは存在しない)。
    // そのため slide() には比較対象の既存式がなく、ここでは
    // 自己整合性(now_idx がちょうど amount 分進むこと、応じて
    // 時間軸上も進むこと)を確認する。
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

  describe('SolarDayHourTempoRule', () => {
    // 平気法は .daily('Sunny') で不定時法(dic.is_solor)。実際の calc/dic 定数を使う。
    const g = Calendar.平気法
    const { sunny, earthy, geo } = g.dic
    const dayMsec = g.calc.msec.day
    const dayZero = g.calc.zero.day
    const yearMsec = g.calc.msec.year
    const seasonZero = g.calc.zero.season
    const hourLength = g.dic.H.length
    const rule = new SolarDayHourTempoRule(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, hourLength)

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
              to_tempo_by_solor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, hourLength, write_at, day),
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
      let tempo = to_tempo_by_solor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, hourLength, startWriteAt, day)
      let envelope = rule.at(startWriteAt, base)
      for (const amount of [1, 1, 1, -1, 2, -2, 3, -4]) {
        tempo = tempo.slide(amount)
        envelope = rule.slide(envelope, amount, base)
        expect(envelope).toEqual(envelopeOf(tempo))
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

    // now_idx は周期ステップを連続で数えるカウンタ。既存に直接の対応先がないため、
    // 自己整合性(now_idx が amount 分進むこと、経路非依存)を確認する。
    test('slide() advances now_idx by amount and is path independent', () => {
      const base = rule.at(Date.UTC(2024, 5, 1))
      for (const amount of [1, 1, 1, -1, 12, -13, 24, -25]) {
        const next = rule.slide(base, amount)
        expect(next.now_idx).toBe(base.now_idx + amount)
        expect(next.last_at < next.next_at).toBe(true)
        const direct = rule.at(next.last_at + 1)
        expect(direct).toEqual(next)
      }
    })
  })
})

describe('ObservedLunisolarMonthRule', () => {
  // 定気法は usesObservedLunisolar=true(hasSolarEvents(sunny) && hasLunarEvents(moony))なので
  // 実際の lunisolar() 経路を通る。
  const g = Calendar.定気法
  const options = {
    moony: g.dic.moony,
    geo: g.dic.geo,
    dayMsec: g.calc.msec.day,
    dayZero: g.calc.zero.day,
    lunarPhase: (phase, near) => g.lunar_phase(phase, near),
    solarPhase: (phase, near) => g.solar_phase(phase, near),
  }
  const rule = new ObservedLunisolarMonthRule(options)

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

  // 実コードでも月の遷移は succ()/back() ではなく毎回 to_tempos() の再解決で行われているため、
  // slide() には比較対象の既存式がない。閏月をまたぐ可能性のある13ヶ月連続で、
  // 前後の月が隣接している(last_at/next_at が隣接し、隙間ができない)ことを確認する。
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
