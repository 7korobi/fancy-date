require('../lib/sample')
const { FancyDate, hasSolarEvents, tithi } = require('../lib/fancy-date')
const { prepareSpot } = require('../lib/fancy-date')
const {
  Calendar,
  mayaHaab,
  mayaLongCount,
  mayaTzolkin,
  panchanga,
  panchangaCandidates,
  panchangaNotes,
  太陽,
  地球,
  天文水星,
  天文金星,
  天文火星,
  天文木星,
  天文土星,
  天文天王星,
  天文海王星,
  天文冥王星,
  木星,
  月,
  東京,
  太歳,
  黒分月,
  黒分月軌道,
} = require('../lib/sample')
const { 天文地球 } = require('../lib/sample/astro')
const { MEAN_MOON } = require('../lib/astronomy-data')
const { to_msec, to_sec, to_tempo_bare } = require('../lib/time')
const { english, jpn, roman } = require('../lib/number')
const {
  JupiterSolarOrbital,
  KeplerianSolarOrbital,
  MarsSolarOrbital,
  MercurySolarOrbital,
  NeptuneSolarOrbital,
  PlutoSolarOrbital,
  SaturnSolarOrbital,
  UranusSolarOrbital,
  VenusSolarOrbital,
} = require('../lib/nasa')
const { format } = require('date-fns')
const { ja: locale } = require('date-fns/locale/ja')

function sortedUniq(list) {
  const result = []
  for (const item of list) {
    if (result[result.length - 1] !== item) {
      result.push(item)
    }
  }
  return result
}

function signedDegreeDiff(actual, expected) {
  return ((((actual - expected + 180) % 360) + 360) % 360) - 180
}

const utc = Calendar.UTC
const g = Calendar.Gregorian
const fg = Calendar.フランス革命暦
const j = Calendar.Julian
const rg = Calendar.Romulus
const ga = Calendar.GregorianAstronomical
const 平気法 = Calendar.平気法
const am = Calendar.アマンタ
const pm = Calendar.プールニマンタ
const amTithi = Calendar.アマンタティティ
const pmTithi = Calendar.プールニマンタティティ
const thai = Calendar.タイ太陰太陽暦
const b = Calendar.Beat
const mg = Calendar.MarsGregorian
const jg = Calendar.Jupiter
const jog = Calendar.JupiterObserved

function mod(value, by) {
  return ((value % by) + by) % by
}

function shiftedMeanOrbital(source, shiftMsec) {
  const [periodMsec, epochMsec] = source
  const phaseEpochMsec = epochMsec + shiftMsec
  return {
    periodMsec,
    epochMsec,
    phaseAt(utc) {
      return mod((utc - phaseEpochMsec) / periodMsec, 1)
    },
    timeOfPhase(phase, near) {
      if (phase < 0 || 1 <= phase) {
        throw new Error(`phase out of range ${phase}`)
      }
      const cycle = Math.round((near - phaseEpochMsec) / periodMsec - phase)
      return phaseEpochMsec + (cycle + phase) * periodMsec
    },
  }
}

function solarShiftCalendar(shiftMsec) {
  const shiftedEarth = [太陽, shiftedMeanOrbital(地球[1], shiftMsec), 地球[2]]
  const shiftedMoon = [shiftedEarth, 月[1], 月[2]]
  return new FancyDate(g).spot(shiftedMoon, 東京[1], 東京[2], 東京[3]).init()
}

const calendars = [
  [utc, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [g, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [fg, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [j, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [rg, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [平気法, 'J Z yC60dC60 yyyy年MM月dd日(R6) Homo ssss:S G'],
  [am, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [pm, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [b, 'J Z yC60-dC60 yyyy年MM月dd日(E) @HHH'],
  [mg, 'J Z yC60-dC60 yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [jg, 'J Z yC60-dC60 yyyy年MMM月dd日(E) HH:mm:ss:SS G'],
]

function to_graph(c, msec, str = 'Gyyyy-MM-dd HH:mm yC60-Z-E') {
  const { PI } = Math
  const deg_to_rad = (2 * PI) / 360
  const { 方向, 時角, 真夜中, 日の出, 南中時刻, 日の入 } = c.solor(msec)
  return `${c.format(msec, str)}  真夜中.${c.format(真夜中, 'HH:mm')} 日の出.${c.format(
    日の出,
    'HH:mm',
  )} 南中時刻.${c.format(南中時刻, 'HH:mm')} 日の入.${c.format(日の入, 'HH:mm')} 方向.${Math.floor(
    方向 / deg_to_rad,
  )} 時角.${Math.floor(時角 / deg_to_rad)}`
}

function deploy(c, moon_zero, season_zero) {
  let list = []
  for (let i = 0; i <= to_msec('5y') / c.calc.msec.moon; ++i) {
    const msec = moon_zero + i * c.calc.msec.moon
    const { last_at, next_at } = c.to_tempos(msec).d
    list.push(last_at - 1)
    list.push(last_at)
    list.push(next_at - 1)
    list.push(next_at)
  }
  for (let i = 0; i <= to_msec('5y') / c.calc.msec.season; ++i) {
    const msec = season_zero + i * c.calc.msec.season
    const { last_at, next_at } = c.to_tempos(msec).d
    list.push(last_at - 1)
    list.push(last_at)
    list.push(next_at - 1)
    list.push(next_at)
  }
  return sortedUniq(list.sort())
}

const write_at_src = new Date('2018-01-01').getTime()

const earth_msecs = deploy(
  g,
  to_tempo_bare(g.calc.msec.moon, g.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(g.calc.msec.season, g.calc.zero.season, write_at_src).last_at,
)

const mars_msecs = deploy(
  mg,
  to_tempo_bare(mg.calc.msec.moon, mg.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(mg.calc.msec.season, mg.calc.zero.season, write_at_src).last_at,
)

const jupiter_msecs = deploy(
  jg,
  to_tempo_bare(jg.calc.msec.moon, jg.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(jg.calc.msec.season, jg.calc.zero.season, write_at_src).last_at,
)

describe('time duration', () => {
  test('to_msec keeps loose parsing by default', () => {
    expect(to_msec('abc')).toBe(0)
    expect(to_msec('1d abc 2h')).toBe(to_msec('1d2h'))
  })

  test('to_msec can reject unconsumed input in strict mode', () => {
    expect(to_msec('1d2h', { strict: true })).toBe(to_msec('1d2h'))
    expect(() => to_msec('abc', { strict: true })).toThrow('invalid duration abc')
    expect(() => to_msec('1d abc 2h', { strict: true })).toThrow('invalid duration 1d abc 2h')
    expect(() => to_sec('1s!', { strict: true })).toThrow('invalid duration 1s!')
  })

  test('to_msec rejects variable-length months', () => {
    expect(() => to_msec('1月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1ヶ月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1ヵ月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1か月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1カ月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1ケ月')).toThrow('variable-length unit 月')
    expect(() => to_msec('1箇月')).toThrow('variable-length unit 月')
  })
})

describe('has_moonrise/has_transit/has_moonset/has_sunrise', () => {
  test('flags NaN fields instead of leaving callers to guess', () => {
    // 定気法で実際に「月の出のない日」が観測された utc(元バグの再現条件)。
    const utc = 1750152477303
    const moon = Calendar.定気法.lunar(utc)
    expect(moon.has_moonrise).toBe(false)
    expect(Number.isNaN(moon.月の出)).toBe(true)
    expect(Number.isNaN(moon.月の出方位)).toBe(true)
    // 月の出がない日でも南中・月の入は独立に成立しうる。
    expect(moon.has_transit).toBe(true)
    expect(moon.has_moonset).toBe(true)
    expect(Number.isNaN(moon.南中時刻)).toBe(false)
    expect(Number.isNaN(moon.月の入)).toBe(false)

    const solor = Calendar.定気法.solor(utc)
    expect(solor.has_sunrise).toBe(true)
    expect(Number.isNaN(solor.日の出)).toBe(false)
  })

  test('is_up_all_day distinguishes polar day from polar night when has_sunrise is false', () => {
    // 北緯78度(スヴァールバル諸島相当)は夏至に白夜、冬至に極夜になる。
    const arctic = new FancyDate(g).spot(月, 78, 15.6, 15).init()
    const summer = arctic.solor(arctic.parse('2024年6月21日'))
    const winter = arctic.solor(arctic.parse('2024年12月21日'))
    expect(summer.has_sunrise).toBe(false)
    expect(summer.is_up_all_day).toBe(true) // 白夜: 終日太陽が沈まない
    expect(winter.has_sunrise).toBe(false)
    expect(winter.is_up_all_day).toBe(false) // 極夜: 終日太陽が昇らない

    // hasSolarEvents を持つ精密モデル(GregorianAstronomical)側でも同様に判定できる。
    const arcticGa = new FancyDate(ga).spot(月, 78, 15.6, 15).init()
    const summerGa = arcticGa.solor(arcticGa.parse('2024年6月21日'))
    expect(summerGa.has_sunrise).toBe(false)
    expect(summerGa.is_up_all_day).toBe(true)
  })

  test("division({ H: 'solar' })(不定時法)は極域(緯度66.5度以遠)では construction 時点で例外になる", () => {
    // 不定時法は日の出・日の入りの間隔を等分する前提のため、日の出/日の入りが
    // 存在しない期間が生じる極域では成立しない(調査結果、development-notes.md 参照)。
    expect(() => new FancyDate(g).spot(月, 78, 15.6, 15).daily('Sunny').init()).toThrow(/極域/)
    expect(() => new FancyDate(g).spot(月, -78, 15.6, 15).daily('Sunny').init()).toThrow(/極域/)
    // 極圏ちょうど(66.5度)も含めて例外にする(下限として扱う)。
    expect(() => new FancyDate(g).spot(月, 66.5, 15.6, 15).daily('Sunny').init()).toThrow(/極域/)

    // 極域でなければ不定時法は従来どおり構築できる
    // (東京: 北緯約35.7度、既存の平気法/定気法サンプルと同じ緯度帯)。
    expect(() => new FancyDate(g).spot(月, 35.7, 139.7, 135).daily('Sunny').init()).not.toThrow()
    // spot()/daily() の呼び出し順が逆でも同様に検出できる。
    expect(() => new FancyDate(g).daily('Sunny').spot(月, 78, 15.6, 15).init()).toThrow(/極域/)
    expect(() => new FancyDate(g).spot(月, 78, 15.6, 15).division({ H: 'solar' }).init()).toThrow(
      /極域/,
    )
    expect(() =>
      new FancyDate(g).spot(月, 35.7, 139.7, 135).division({ H: 'solar' }).init(),
    ).not.toThrow()
    expect(
      new FancyDate(g).division({ H: 'solar' }).spot(月, 35.7, 139.7, 135).init().dic.is_solor,
    ).toBe(true)
    expect(
      new FancyDate(g).division({ H: 'equal' }).spot(月, 35.7, 139.7, 135).init().dic.is_solor,
    ).toBe(false)
    expect(() => new FancyDate(g).spot(月, 78, 15.6, 15).dayStart('sunrise').init()).toThrow(/極域/)
  })

  test("dayStart('sunrise') uses actual sunrise as the civil day boundary", () => {
    const dawn = new FancyDate(g).dayStart('sunrise').init()
    const base = dawn.parse('2024年6月21日')
    const tempos = dawn.to_tempos(base)
    const next = tempos.d.succ().last_at

    expect(dawn.dic.day_start).toBe('sunrise')
    expect(dawn.dic.is_dusk).toBe(false)
    expect(dawn.format(base - 1000, 'yyyy年MM月dd日')).toBe('2024年06月20日')
    expect(dawn.format(base, 'yyyy年MM月dd日')).toBe('2024年06月21日')
    expect(dawn.format(next, 'yyyy年MM月dd日')).toBe('2024年06月22日')
    expect(dawn.add(base, '1日後')).toBe(next)
  })

  test('mean model solor() fills 日の出方位/日の入方位, mirroring 精密モデル within its own precision', () => {
    // g(グレゴリオ暦)は hasSolarEvents を持たない簡易(mean)太陽モデル経路。
    const utc = g.parse('2024年3月20日')
    const mean = g.solor(utc)
    expect(Number.isFinite(mean.日の出方位)).toBe(true)
    expect(Number.isFinite(mean.日の入方位)).toBe(true)
    expect(mean.日の出方位).toEqual(mean.方向)
    expect(mean.日の入方位).toBeCloseTo(2 * Math.PI - mean.日の出方位, 10)

    // 精密モデル(GregorianAstronomical)の実測値と大きく乖離しないことを確認する
    // (平均モデルは1日を通して赤緯一定とみなす近似なので、分点付近で最大
    // 0.5度程度の差は許容する)。
    const precise = ga.solor(ga.parse('2024年3月20日'))
    const toDeg = (rad) => (rad * 180) / Math.PI
    expect(Math.abs(toDeg(mean.日の出方位) - toDeg(precise.日の出方位))).toBeLessThan(0.5)
    expect(Math.abs(toDeg(mean.日の入方位) - toDeg(precise.日の入方位))).toBeLessThan(0.5)

    // 白夜/極夜(has_sunrise=false)では他のイベント系フィールド同様 NaN になる。
    const arctic = new FancyDate(g).spot(月, 78, 15.6, 15).init()
    const arcticSummer = arctic.solor(arctic.parse('2024年6月21日'))
    expect(arcticSummer.has_sunrise).toBe(false)
    expect(Number.isNaN(arcticSummer.日の出方位)).toBe(true)
    expect(Number.isNaN(arcticSummer.日の入方位)).toBe(true)
  })
})

describe('moon phase', () => {
  test('2019/12/26', () => {
    expect(g.format(1577310360000, 'N No Nr')).toEqual('0 朔 さく')
  })

  test('2020/01/06', () => {
    expect(g.format(1578300000000, 'N No Nr')).toEqual('11 上弦 じょうげん')
  })
})

describe('Gregorio calculate', () => {
  test('data', () => {
    expect(g.calc.msec.period).toEqual(12622780800000)
    expect(g.table.msec.year.slice(-1)).toEqual([12622780800000])
  })

  test('rejects non-finite timestamps early', () => {
    expect(() => g.to_tempos(NaN)).toThrow('invalid timestamp NaN')
    expect(() => g.format(NaN, 'yyyy年MM月dd日')).toThrow('invalid timestamp NaN')
    expect(() => g.to_tempos(Infinity)).toThrow('invalid timestamp Infinity')
  })

  test('solor/lunar/noon reject non-finite timestamps instead of returning NaN fields', () => {
    expect(() => g.noon(NaN)).toThrow('invalid timestamp NaN')
    expect(() => g.solor(NaN)).toThrow('invalid timestamp NaN')
    expect(() => ga.lunar(NaN)).toThrow('invalid timestamp NaN')
  })

  test('find rejects NaN on either end of the range, even with a limit', () => {
    const valid = g.parse('2020年1月1日')
    expect(() => g.find([valid, NaN], [{ dC60o: '甲子' }], { limit: 3 })).toThrow(/invalid range/)
    expect(() => g.find([NaN, valid], [{ dC60o: '甲子' }], { order: -1, limit: 3 })).toThrow(
      /invalid range/,
    )
    // Infinity は無制限範囲の正規の用法なので引き続き許容する
    expect(g.find([valid, Infinity], [{ dC60o: '甲子' }], { limit: 1 })).toEqual([1579618800000])
  })

  test('add 10/10/10', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.add(msec, '10年10ヶ月10日後'))).toEqual('西暦12年12月12日(水) 00:00')
  })

  test('add 11/11/11', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.add(msec, '11年11ヶ月11日後'))).toEqual('西暦14年1月13日(月) 00:00')
  })

  test('sub 1/1/1', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.sub(msec, '1年1ヶ月1日後'))).toEqual('西暦1年1月1日(月) 00:00')
  })

  test('sub 5/5/5', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.sub(msec, '5年5ヶ月5日後'))).toEqual('紀元前5年8月28日(水) 00:00')
  })

  test('sub 10y', () => {
    const msec = g.parse('401年1月1日')
    expect(g.format(g.sub(msec, '10年後'))).toEqual('西暦391年1月1日(火) 00:00')
  })

  test('SpanLike text without 前/後 is treated as 後', () => {
    const msec = g.parse('2年2月2日')
    const bare = g.parse_span('1年2ヶ月')
    const withGo = g.parse_span('1年2ヶ月後')
    expect(bare).toEqual(withGo)
    expect(g.format(g.add(msec, '1年2ヶ月'))).toEqual(g.format(g.add(msec, '1年2ヶ月後')))
    // 前/後 が明示されている場合は従来通りそちらが優先される(後扱いにはならない)。
    const withMae = g.parse_span('1年2ヶ月前')
    expect(withMae).not.toEqual(bare)
  })

  test('span anchors preserve at/msec for msec conversion', () => {
    const from = g.parse('2024年1月31日')
    const to = g.parse('2024年3月1日')
    const measured = g.span_obj(to, from)

    expect(g.span_msec(measured)).toBe(to - from)
    expect(g.add(from, measured)).toBe(to)

    const parsed = g.parse_span('1ヶ月後', { at: from })
    expect(g.span_msec(parsed)).toBe(g.add(from, parsed) - from)
    expect(g.span_msec('1ヶ月後', { at: from })).toBe(g.add(from, '1ヶ月後') - from)
    expect(g.span_msec(g.span_obj('1ヶ月後', { at: from }))).toBe(g.add(from, '1ヶ月後') - from)
    expect(() => g.span_msec(g.parse_span('1ヶ月後'))).toThrow(/anchor time/)
  })

  test('symbolic span arithmetic merges only matching tokens and drops stored msec', () => {
    const from = g.parse('2024年1月31日')
    const anchoredMonth = g.parse_span('1ヶ月後', { at: from })
    const doubled = g.span_add(anchoredMonth, '1ヶ月後')

    expect(g.span_neg('3日後').label).toBe('3日前')
    expect(g.span_add('3日後', '1日前').label).toBe('2日後')
    expect(g.span_sub('3日後', '1日後').label).toBe('2日後')
    expect(g.span_add('1ヶ月後', '31日前').label).toBe('1ヶ月後31日前')
    expect(doubled.label).toBe('2ヶ月後')
    expect(g.span_msec(doubled)).toBe(g.add(from, doubled) - from)
    expect(g.span_msec(doubled)).not.toBe(g.span_msec(anchoredMonth))
  })

  test('parse', () => {
    return
    expect([g.format(g.parse('2000年夏至', 'y年Z'))]).toEqual(['123'])
  })

  test('find day cycle in range', () => {
    const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]
    const found = g.find(between, [{ dC60o: '甲子' }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日 dC60o'))).toEqual([
      '2020年01月22日 甲子',
    ])
  })

  test('find note in range', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年4月1日')]
    const found = g.find(between, [{ note: '春分' }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual(['2020年03月20日'])
  })

  test('find with regexp condition', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年10月1日')]
    const found = g.find(between, [{ note: /春分|秋分/ }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual([
      '2020年03月20日',
      '2020年09月19日',
    ])
  })

  test('find can order and limit results', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年10月1日')]
    const found = g.find(between, [{ note: /春分|秋分/ }], { order: -1, limit: 1 })
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual(['2020年09月19日'])
  })

  test('find note follows astronomical solar precision selected by spot()', () => {
    const between = [g.parse('2020年9月18日'), g.parse('2020年9月24日')]
    const found = ga.find(between, [{ note: '秋分' }])
    expect(found.map((utc) => ga.format(utc, 'yyyy年MM月dd日'))).toEqual(['2020年09月22日'])
    expect(ga.note(g.parse('2020年9月22日'))).toContain('秋分')
  })

  test('find supports next and prev style unbounded search with limit', () => {
    const next = g.find([g.parse('2020年1月23日'), Infinity], [{ dC60o: '甲子' }], { limit: 1 })
    expect(next.map((utc) => g.format(utc, 'yyyy年MM月dd日 dC60o'))).toEqual([
      '2020年03月22日 甲子',
    ])

    const prev = g.find([-Infinity, g.parse('2020年3月1日')], [{ dC60o: '甲子' }], {
      order: -1,
      limit: 1,
    })
    expect(prev.map((utc) => g.format(utc, 'yyyy年MM月dd日 dC60o'))).toEqual([
      '2020年01月22日 甲子',
    ])
    expect(() => g.find([g.parse('2020年1月23日'), Infinity], [{ dC60o: '甲子' }])).toThrow(
      /unbounded find requires limit/,
    )
  })

  // order が指すアンカー側(order=1なら from, order=-1なら to)は探索開始点になるため、
  // 無限値を渡すと有効な Tempo を作れない。アンカー側が有限でない場合は明示的にエラーにする。
  test('find throws when the anchor side implied by order is not finite', () => {
    expect(() =>
      g.find([-Infinity, g.parse('2020年3月1日')], [{ dC60o: '甲子' }], { limit: 1 }),
    ).toThrow(/finite anchor/)
    expect(() =>
      g.find([g.parse('2020年1月1日'), Infinity], [{ dC60o: '甲子' }], { order: -1, limit: 1 }),
    ).toThrow(/finite anchor/)
  })

  // JS 利用時は型で守られないため、limit と同様に不正な order を明示的にエラーにする。
  test('find rejects an invalid order value', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年10月1日')]
    expect(() => g.find(between, [{ note: /春分|秋分/ }], { order: 0 })).toThrow(/invalid order/)
    expect(() => g.find(between, [{ note: /春分|秋分/ }], { order: 2 })).toThrow(/invalid order/)
  })

  test('find can override inferred step', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年3月2日')]
    const found = g.find(between, [{ H: '12' }], { step: 'H' })
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日 HH時'))).toEqual([
      '2020年03月01日 12時',
    ])
  })

  // is_table_leap(SolarTable)の u は table.msec.year.length === dic.p.length
  // という不変条件により、絶対原点(calc.zero.period)を直接 zero にすれば
  // TableTempoRule 自身の周期またぎ処理だけで絶対年が求まる。以前は
  // p.last_at(周期ローカルな再基準化点)を zero にした上で
  // `u.now_idx += p.now_idx * dic.p.length` により外部で絶対年へ変換して
  // いたため、TableTempoRule.slide() が「zero は周期ローカルなのに
  // now_idx は絶対年」という食い違いを起こし、西暦400年以降の任意の年で
  // succ()/back() が全く違う年へ飛んでいた(実測: 2020年→succ()が
  // 4021年相当の位置に飛ぶ)。年をまたいだ find の step:'y'/'u' が
  // 該当年を1件も見つけられない、という形で実害があった。
  test('find with step y/u works across a leap-table period boundary (year 400+) — regression for a real date-jumping bug', () => {
    const found = g.find([g.parse('2020年1月1日'), g.parse('2025年1月1日')], [{ y: '2021' }], {
      step: 'y',
    })
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual(['2021年01月01日'])

    const tempos = g.to_tempos(g.parse('2020年1月1日'))
    const next = tempos.u.succ()
    expect(next.now_idx).toBe(2021)
    expect(g.to_tempos(next.last_at).u.now_idx).toBe(2021)
  })

  // Y/yC60/yC12/yC10/yC9/Q は親トークン(u/M)から導かれる周期ラベルで、succ()/back() を
  // 持たない(TempoLabelLike)。TS 経由なら SteppableTempoKey により
  // コンパイル時に弾かれるが、JS 利用時は型で守られないため、実行時にも
  // 明確なエラーになることを確認する。
  test('find rejects a step that only supports label lookup (no succ/back)', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年10月1日')]
    expect(() => g.find(between, [{ note: /春分|秋分/ }], { step: 'a' })).toThrow(/invalid unit a/)
  })

  // cyclic_label() が親の実区間(last_at/next_at)をそのまま流用していることを確認する
  // (now_idx だけを差し替えたラベルであり、独自の区間を持つわけではない)。
  test('cyclic label tokens (Y/yC60/yC12/yC10/yC9/Q) honestly expose the parent envelope span', () => {
    const utc = g.parse('2020年6月15日')
    const tempos = g.to_tempos(utc)
    for (const token of ['Y', 'yC60', 'yC12', 'yC10', 'yC9']) {
      expect(tempos[token].last_at).toBe(tempos.u.last_at)
      expect(tempos[token].next_at).toBe(tempos.u.next_at)
      expect(tempos[token].is_cover(utc)).toBe(true)
      expect(tempos[token].is_cover(tempos.u.last_at - 1)).toBe(false)
    }
    expect(tempos.Q.last_at).toBe(tempos.M.last_at)
    expect(tempos.Q.next_at).toBe(tempos.M.next_at)
    expect(tempos.Q.is_cover(utc)).toBe(true)
  })

  // x(タイムゾーン表示)は now_idx にタイムゾーンのオフセット(ms)をそのまま
  // 載せるだけの、暦座標としては意味を持たない静的な値。以前は素の Tempo に
  // now_idx を上書きしていたため succ()/back() が呼べてしまい、
  // Tempo.slide() の式に沿った無意味な値を黙って返していた。
  // cyclic_label() 化により succ/back 自体が存在しなくなったため、
  // JS 経由でも呼び出しが即座に例外になる(禁止措置として機能する)ことを
  // 確認する。
  test('x (timezone) exposes the fixed offset and forbids succ()/back() (no dangerous stepping)', () => {
    const utc = g.parse('2020年6月15日')
    const tempos = g.to_tempos(utc)
    const expectedTimezone =
      (g.calc.msec.day * (g.dic.geo[2] != null ? g.dic.geo[2] : g.dic.geo[1])) / 360
    expect(tempos.x.now_idx).toBe(expectedTimezone)
    expect(typeof tempos.x.succ).not.toBe('function')
    expect(typeof tempos.x.back).not.toBe('function')
    // x の last_at/next_at はタイムゾーン値自体を to_tempo_bare で
    // 丸めた際の内部的な区間であり、utc(問い合わせた暦日時)側の
    // 時間軸とは無関係(is_cover(utc) で覆えるものではない)。
    // is_cover() 自体が例外を投げず機能することだけ確認する。
    expect(tempos.x.is_cover(expectedTimezone)).toBe(true)
  })
})

describe('平気法 calculate', () => {
  // R6/LM27 は今日(d)の実区間をそのまま使う暦注ラベルであり、d 自体とは別の(月/日から都度導く)now_idx を持つ。
  // last_at/next_at が d と一致し、is_cover() が正しく機能することを確認する。
  test('R6/LM27 honestly expose the current day envelope', () => {
    const utc = 平気法.parse('明治9年文月1日 暁九ツ')
    const tempos = 平気法.to_tempos(utc)
    expect(tempos.R6.last_at).toBe(tempos.d.last_at)
    expect(tempos.R6.next_at).toBe(tempos.d.next_at)
    expect(tempos.R6.is_cover(utc)).toBe(true)
    expect(tempos.R6.is_cover(tempos.d.last_at - 1)).toBe(false)
    expect(tempos.LM27.last_at).toBe(tempos.d.last_at)
    expect(tempos.LM27.next_at).toBe(tempos.d.next_at)
    expect(tempos.LM27.is_cover(utc)).toBe(true)
  })

  test('閏月をまたぐback', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    // 明治9年の月の並びは 皐月→水無月→閏文月→文月(日単位スキャンで確認済み)。
    // 文月から1ヶ月戻すと、水無月を飛ばして閏文月をスキップしてはならず、
    // 隣接する閏文月にヒットするのが正しい。
    expect([
      平気法.format(ret),
      平気法.format(平気法.parse('明治9年閏文月1日')),
      平気法.format(平気法.sub(ret, '1ヶ月後')),
      平気法.format(平気法.sub(ret, '2ヶ月後')),
    ]).toEqual([
      '明治九年文月一日(先勝)暁九ツ',
      '明治九年閏文月一日(先勝)暁九ツ',
      '明治九年閏文月一日(先勝)暁九ツ',
      '明治九年水無月一日(赤口)暁九ツ',
    ])
  })

  test('閏月をまたぐsub/add', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    // 朔望月の実サイズ(29〜30日)で変動するため 30日固定(2592000000ms)の
    // 近似式では表せない。閏文月・水無月それぞれの実サイズ分だけ遡った
    // 実測値(閏月を正しく経由した場合の値)をそのまま期待値にする。
    expect([
      平気法.sub(ret, '2ヶ月後'),
      平気法.sub(ret, '1ヶ月後'),
      ret,
      平気法.add(ret, '1ヶ月後'),
    ]).toEqual([-2951546400000, -2948954400000, -2946448800000, -2943856800000])
  })

  test('閏月を含む年の月初既定表示が同じ月へ往復する', () => {
    const gregorianMonths = ['1985年3月20日', '1996年1月19日', '2012年5月19日', '2020年7月19日']
    for (const gregorian of gregorianMonths) {
      const monthStart = 平気法.to_tempos(g.parse(gregorian)).M.last_at
      const label = 平気法.format(monthStart)
      expect(平気法.format(平気法.parse(label))).toBe(label)
      expect(平気法.parse(label)).toBe(monthStart)
    }
  })

  test('base', () => {
    const tgt = '明治9年神無月10日(先勝)暁九ツ'
    const ret = 平気法.parse(tgt)

    expect(平気法.format(ret)).toEqual('明治九年神無月十日(先勝)暁九ツ')
  })

  test('body placement keeps tuple compatibility', () => {
    expect(地球.body).toMatchObject({ kind: 'physical', name: 'Earth', radiusKm: 6378.137 })
    expect(天文水星.body).toMatchObject({ kind: 'physical', name: 'Mercury', radiusKm: 2439.7 })
    expect(天文金星.body).toMatchObject({ kind: 'physical', name: 'Venus', radiusKm: 6051.8 })
    expect(天文火星.body).toMatchObject({ kind: 'physical', name: 'Mars', radiusKm: 3389.5 })
    expect(天文木星.body).toMatchObject({ kind: 'physical', name: 'Jupiter', radiusKm: 69911 })
    expect(天文土星.body).toMatchObject({ kind: 'physical', name: 'Saturn', radiusKm: 58232 })
    expect(天文天王星.body).toMatchObject({ kind: 'physical', name: 'Uranus', radiusKm: 25362 })
    expect(天文海王星.body).toMatchObject({ kind: 'physical', name: 'Neptune', radiusKm: 24622 })
    expect(天文冥王星.body).toMatchObject({ kind: 'physical', name: 'Pluto', radiusKm: 1188.3 })
    expect(月.body).toMatchObject({ kind: 'physical', name: 'Moon', radiusKm: 1737.4 })
    expect(地球[1]).toBe(地球.orbital)
    expect(地球[2]).toBe(地球.rotation)
    expect(天文水星[1]).toBe(天文水星.orbital)
    expect(天文水星[2]).toBe(天文水星.rotation)
    expect(天文金星[1]).toBe(天文金星.orbital)
    expect(天文金星[2]).toBe(天文金星.rotation)
    expect(天文火星[1]).toBe(天文火星.orbital)
    expect(天文火星[2]).toBe(天文火星.rotation)
    expect(天文木星[1]).toBe(天文木星.orbital)
    expect(天文木星[2]).toBe(天文木星.rotation)
    expect(天文土星[1]).toBe(天文土星.orbital)
    expect(天文土星[2]).toBe(天文土星.rotation)
    expect(天文天王星[1]).toBe(天文天王星.orbital)
    expect(天文天王星[2]).toBe(天文天王星.rotation)
    expect(天文海王星[1]).toBe(天文海王星.orbital)
    expect(天文海王星[2]).toBe(天文海王星.rotation)
    expect(天文冥王星[1]).toBe(天文冥王星.orbital)
    expect(天文冥王星[2]).toBe(天文冥王星.rotation)
    expect(月[0]).toBe(地球)
    expect(月[1]).toBe(月.orbital)
    expect(黒分月[1]).toBe(黒分月軌道)
    expect(黒分月軌道.periodMsec).toBe(MEAN_MOON.whiteOrbital[0])
    expect(黒分月軌道.epochMsec).toBe(MEAN_MOON.whiteOrbital[1] - MEAN_MOON.whiteOrbital[0] / 2)
    expect(黒分月軌道.phaseAt(MEAN_MOON.whiteOrbital[1])).toBe(0.5)
    expect(木星.body).toMatchObject({ kind: 'physical', name: 'Jupiter' })
    expect(太歳.本体).toMatchObject({ kind: 'virtual', name: '太歳' })
    expect(太歳.本体.derivedFrom).toBe(木星)
    expect(太歳.軌道.phaseAt(木星[1][1])).toBe(0)
    expect(太歳.軌道.phaseAt(木星[1][1] + 木星[1][0] / 4)).toBe(0.75)
  })

  test('prepareSpot resolves spot input into calendar internals', () => {
    const prepared = prepareSpot(...東京)
    expect(prepared.geo).toEqual([東京[1], 東京[2], 東京[3]])
    expect(prepared.sunny.periodMsec).toBe(地球[1][0])
    expect(prepared.moony.periodMsec).toBe(月[1][0])
    expect(prepared.earthy.periodMsec).toBe(地球[2][0])
  })

  test('astronomical moon exposes apsides and nodes', () => {
    const near = ga.parse('2024年3月10日')
    const perigee = ga.lunar_apsis('perigee', near)
    const apogee = ga.lunar_apsis('apogee', near)
    const ascending = ga.lunar_node('ascending', near)
    const descending = ga.lunar_node('descending', near)
    const moon = ga.dic.moony

    expect(perigee.kind).toBe('perigee')
    expect(apogee.kind).toBe('apogee')
    expect(perigee.distanceKm).toBeLessThan(
      moon.lunarEquatorial(perigee.at - to_msec('1d')).distanceKm,
    )
    expect(perigee.distanceKm).toBeLessThan(
      moon.lunarEquatorial(perigee.at + to_msec('1d')).distanceKm,
    )
    expect(apogee.distanceKm).toBeGreaterThan(
      moon.lunarEquatorial(apogee.at - to_msec('1d')).distanceKm,
    )
    expect(apogee.distanceKm).toBeGreaterThan(
      moon.lunarEquatorial(apogee.at + to_msec('1d')).distanceKm,
    )

    expect(Math.abs(ascending.latitudeDeg)).toBeLessThan(0.001)
    expect(Math.abs(descending.latitudeDeg)).toBeLessThan(0.001)
    expect(moon.lunarEquatorial(ascending.at - to_msec('12h')).latitudeDeg).toBeLessThan(0)
    expect(moon.lunarEquatorial(ascending.at + to_msec('12h')).latitudeDeg).toBeGreaterThan(0)
    expect(moon.lunarEquatorial(descending.at - to_msec('12h')).latitudeDeg).toBeGreaterThan(0)
    expect(moon.lunarEquatorial(descending.at + to_msec('12h')).latitudeDeg).toBeLessThan(0)
  })

  test('1月,1年', () => {
    const tgt = '明治10年長月10日 暁九ツ'
    const goal = 平気法.parse(tgt)

    const msec = 平気法.parse('明治10年神無月10日')
    expect([
      平気法.format(平気法.sub(msec, '1年後')),
      平気法.format(平気法.sub(msec, '1ヶ月後')),
      平気法.format(平気法.add(msec, '1ヶ月後')),
      平気法.format(平気法.add(msec, '1年後')),
    ]).toEqual([
      '明治九年神無月十日(先勝)暁九ツ',
      '明治十年長月十日(赤口)暁九ツ',
      '明治十年霜月十日(友引)暁九ツ',
      '明治十一年神無月十日(先勝)暁九ツ',
    ])
  })

  test('年干支(a)は元号を跨いでも初期値定義と自己無矛盾(now_idxではなくraw_now_idxで計算する)', () => {
    // 平気法/定気法の calendar() epoch(いずれも 0 = 1970年1月1日)における
    // 年干支は、初期値文字列自体に手動で書かれている(己酉/己酉)。以前は
    // yC60/yC12/yC10/yC9 の計算に u.now_idx(元号調整後、元号ごとに1へリセットされる
    // 相対年)を使っていたため、元号テーブルを持つ暦(平気法/定気法)でだけ
    // epoch 自身の年干支すら再現できていなかった(実測: 平気法が「甲辰」、
    // 定気法が「癸卯」という定義と無関係な値を返していた)。
    //
    // 定気法の初期値は当初「戊申」だったが、これは平気法と同じ起点年
    // (皇紀2629年=西暦1969年)に対する年干支としては1年古い(戊申は
    // 1968年)誤りだった。年干支は暦の計算方式(定気法/平気法)に依存
    // しない実年の事実なので、平気法と同じ己酉に修正済み(実測:
    // 2024年3月10日時点でグレゴリオ暦・平気法が甲辰なのに定気法だけ
    // 癸卯を返していた)。
    //
    // 日干支(A)はここでは検証しない。calendar() の epoch(第3引数)を
    // format() した結果が、多くの暦(Julian/Romulus/平気法/定気法/アマンタ等)
    // で初期値文字列の日付そのものと一致しない別の不整合が見つかっており
    // (タイムゾーン(geo[2]非ゼロ)を持つ暦でのみ発生、原因未特定、
    // 「今後の検討メモ」に追記予定)、utc=0 という特定の瞬間での自己無矛盾
    // 検証は別課題として切り分ける。実日付(2020年1月22日等)での日干支の
    // 暦間一致は次のテストで個別に検証している。
    expect(平気法.format(0, 'a')).toEqual('己酉')
    expect(Calendar.定気法.format(0, 'a')).toEqual('己酉')
  })

  test('年Tempoの区間は一種類で、uは通年、yは元号年ビューとして扱う', () => {
    const heiki = 平気法.to_tempos(0)
    expect(heiki.u.last_at).toBe(heiki.y.last_at)
    expect(heiki.u.next_at).toBe(heiki.y.next_at)
    expect(heiki.u.now_idx).toBe(2629)
    expect(heiki.y.now_idx).toBe(44)
    expect(平気法.format(0, 'u / y / Gy')).toBe('二千六百廿九 / 卌四 / 昭和卌四')

    const teiki = Calendar.定気法.to_tempos(0)
    expect(teiki.u.last_at).toBe(teiki.y.last_at)
    expect(teiki.u.next_at).toBe(teiki.y.next_at)
    expect(teiki.u.now_idx).toBe(1969)
    expect(teiki.y.now_idx).toBe(44)
  })

  test('日干支(A)はグレゴリオ暦・平気法・定気法の間で実日付について一致する', () => {
    // 日干支は暦の計算方式に依存しない実日の事実(60日周期の連続カウント)
    // なので、同じ実日を指していれば暦システムが違っても一致するはず。
    // 平気法は起点値が辛巳(誤)になっており常に+6日(60日周期)、定気法も
    // 辛巳(誤)で常に+23日ずれていた(実測: 2020-01-22/2022-07-04/
    // 2023-11-30/2024-03-10/2025-05-05 の5日で offset が完全に一定)。
    // 起点値をグレゴリオ暦(2020年1月22日=甲子という既知の事実と一致
    // 済み)に合わせて乙亥/戊午に修正済み。
    const 定気法 = Calendar.定気法
    const dates = [
      '2020年1月22日',
      '2022年7月4日',
      '2023年11月30日',
      '2024年3月10日',
      '2025年5月5日',
    ]
    for (const d of dates) {
      // 日境界の揺れを避けるため現地正午で比較する。
      const utc = g.parse(d) + 12 * 3600 * 1000 - 9 * 3600 * 1000
      const gA = g.format(utc, 'A')
      expect(定気法.format(utc, 'A')).toEqual(gA)
      expect(平気法.format(utc, 'A')).toEqual(gA)
    }
  })

  test('年干支(a/b/c)は昭和/平成の元号境界を跨いでも60年周期で正しく連続する', () => {
    let msec = g.parse('1985年1月1日')
    const labels = []
    for (let i = 0; i < 60; i++) {
      labels.push(平気法.format(msec, 'a'))
      msec = 平気法.succ(msec, '1年後')
    }
    // 60種類の年干支が重複なく出現する(順序が乱れていれば重複や欠落が出る)
    expect(new Set(labels).size).toEqual(60)
    // 60年進めると同じ干支に戻る(60年周期であることの直接確認)
    expect(平気法.format(msec, 'a')).toEqual(labels[0])
  })
})

describe('Dr.Stone', () => {
  test('T = 0', () => {
    const msec = g.parse('5738年4月1日')
    const { 日の出 } = g.solor(msec, 6)
    const note = g.note(msec)
    expect(g.format(日の出, `yyyy/MM/dd(E) HH:mm Z ${note}`)).toEqual(
      '5738/04/01(火) 04:20 春分 春',
    )
    expect(msec).toEqual(118914361200000)
    expect(日の出).toEqual(118914376828906)
  })
})

describe('同時性', () => {
  test('春分', () => {
    const msec = g.parse('1年3月22日')
    expect(
      calendars.map(([c, str]) => {
        return c.format(msec, str)
      }),
    ).toMatchSnapshot()
  })
})

describe('平気法', () => {
  test('calc', () => {
    expect(平気法.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(平気法.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(平気法.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(平気法.precision()).toEqual({
      leap: [4],
      year: [[12], [30, 31]],
      day: [[12], [2], [3600]],
      strategy: 'SolarLunar',
      is_legal_solor: true,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(mg.table.month).toMatchSnapshot()
  })

  test('雑節', () => {
    expect(
      [
        100000000000000, 10000000000000, 1556636400000, 1000000000000, 100000000000, 10000000000, 0,
      ].map((utc) => {
        const o = 平気法.to_tempos(utc)
        const z = 平気法.雑節(utc, o)
        const list = (() => {
          const result = []
          for (let key in z) {
            const val = z[key]
            result.push(
              `${平気法.format(val.last_at, 'J Gyy年Modd日')} ～ ${平気法.format(
                val.next_at - 1,
                `Modd日 ${key}`,
              )}`,
            )
          }
          return result
        })()
        return [...list.flat(2).sort(), 平気法.note(utc, o, z).join('')]
      }),
    ).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = earth_msecs.map(
      (msec) =>
        `${g.format(msec, 'yyyy yC60-dC60 Z-E HH:mm')} ${平気法.format(
          msec,
          'yC60-dC60 yC9-dC9 Z-R6 Gy年Modd日 Hm ssss秒',
        )}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

describe('Gregorian', () => {
  test('calc', () => {
    expect(g.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(g.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(g.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(g.precision()).toEqual({
      leap: [4, -128, 456, -3217],
      year: [[12], [30, 31]],
      day: [[24], [60], [60]],
      strategy: 'SolarTable',
      is_legal_solor: true,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(g.table.range.month).toMatchSnapshot()
  })

  test('雑節', () => {
    expect(
      [
        100000000000000, 10000000000000, 1556636400000, 1000000000000, 100000000000, 10000000000, 0,
      ].map((utc) => {
        const o = g.to_tempos(utc)
        const z = g.雑節(utc, o)
        const list = (() => {
          const result = []
          for (let key in z) {
            const val = z[key]
            result.push(
              `${g.format(val.last_at, 'J yyyy/MM/dd')} ～ ${g.format(
                val.next_at - 1,
                `MM/dd ${key}`,
              )}`,
            )
          }
          return result
        })()
        return [...list.flat(2).sort(), g.note(utc, o, z).join('')]
      }),
    ).toMatchSnapshot()
  })

  // 社日(春社日/秋社日)は「十干『戊』に最も近い日」という独立した定義を
  // 持つ(雑節_from_terms() 内部では、春分/秋分の瞬間の十干日から
  // now_idx = mod(rawNowIdx, 10) で「戊からの経過日数」を求め、
  // dCS.slide(stemLength/2 - now_idx - 1) で戊の日へずらすという、
  // 一度構築した Tempo の now_idx を書き換えてから slide() する
  // パターンで計算している)。上のスナップショットテストは
  // 「前回の出力と変わっていないか」しか見ておらず、社日の定義
  // (十干「戊」であること、春分/秋分から±5日以内であること)自体は
  // 独立に検証されていなかった。TempoView 移行前の仕様として、
  // 十干日トークン(dCS)という別の経路を基準に固定する。
  test('社日(春社日/秋社日)は十干「戊」の日を、春分/秋分から±5日以内で指す(平気法/実軌道どちらの経路でも)', () => {
    const dayMsec = g.calc.msec.day
    for (const [cal, resolve雑節] of [
      [平気法, (utc) => 平気法.雑節(utc)],
      [ga, (utc) => ga.雑節_by_phase(utc)],
    ]) {
      let checked = 0
      for (let year = 2000; year < 2040; year++) {
        const utc = Date.UTC(year, 5, 1)
        const z = resolve雑節(utc)
        for (const [key, eqKey] of [
          ['春社日', '春分'],
          ['秋社日', '秋分'],
        ]) {
          const item = z[key]
          const mid = item.last_at + dayMsec / 2
          expect(cal.format(mid, 'dCS')).toBe('戊')
          const diffDays = Math.round((item.last_at - z[eqKey].last_at) / dayMsec)
          expect(diffDays).toBeGreaterThanOrEqual(-5)
          expect(diffDays).toBeLessThanOrEqual(4)
          checked++
        }
      }
      expect(checked).toBe(80)
    }
  })

  test('format', () => {
    const str = 'Gy年MM月dd日(E)HH時 Z'
    expect(
      [
        g.format(100000000000000, str),
        g.format(10000000000000, str),
        g.format(1556636400000, str),
        g.format(1000000000000, str),
        g.format(100000000000, str),
        g.format(10000000000, str),
        g.format(0, str),
        g.format(g.calc.zero.period, str),
      ].join('\n'),
    ).toEqual(
      [
        '西暦5138年11月16日(水)18時 立冬',
        '西暦2286年11月21日(日)02時 小雪',
        '西暦2019年05月01日(水)00時 穀雨',
        '西暦2001年09月09日(日)10時 白露',
        '西暦1973年03月03日(土)18時 雨水',
        '西暦1970年04月27日(月)02時 穀雨',
        '西暦1970年01月01日(木)09時 冬至',
        '紀元前1年01月01日(土)00時 冬至',
      ].join('\n'),
    )
  })

  test('format_parts joins to format() and carries ruby for token parts', () => {
    const utc = g.parse('2024年3月10日')
    const str = 'Gy年MM月dd日(E) dC60o dC60r'
    const parts = g.format_parts(utc, str)
    const tempos = g.to_tempos(utc)
    expect(parts.map((part) => part.text).join('')).toBe(g.format(utc, str))
    expect(g.format_parts_by(utc, str)).toEqual(parts)
    expect(g.format_parts_by(tempos, str)).toEqual(parts)
    expect(
      parts
        .filter((part) => part.token === '')
        .map((part) => part.text)
        .join(''),
    ).toBe('年月日()  ')

    const weekday = parts.find((part) => part.token === 'E')
    expect(weekday).toMatchObject({ token: 'E', text: '日', ruby: 'にち' })

    const sexagenaryDay = parts.find((part) => part.token === 'dC60o')
    expect(sexagenaryDay).toMatchObject({ token: 'dC60o', text: '癸酉', ruby: 'みずのとのとり' })

    const sexagenaryDayRuby = parts.find((part) => part.token === 'dC60r')
    expect(sexagenaryDayRuby).toEqual({ token: 'dC60r', text: 'みずのとのとり' })
  })

  test('cycle tokens use numeric yC/dC names while legacy a/A aliases stay compatible', () => {
    const utc = g.parse('2024年3月10日')
    const legacy = 'a c b A C B'
    const canonical = 'yC60 yC10 yC12 dC60 dC10 dC12'
    const legacyRuby = 'ar cr br Ar Cr Br'
    const canonicalRuby = 'yC60r yC10r yC12r dC60r dC10r dC12r'

    expect(g.format(utc, canonical)).toBe(g.format(utc, legacy))
    expect(g.format(utc, canonicalRuby)).toBe(g.format(utc, legacyRuby))
    expect(g.format_parts(utc, 'yC60o yC60r dC60o dC60r')).toEqual([
      { token: 'yC60o', text: '甲辰', ruby: 'きのえたつ' },
      { token: '', text: ' ' },
      { token: 'yC60r', text: 'きのえたつ' },
      { token: '', text: ' ' },
      { token: 'dC60o', text: '癸酉', ruby: 'みずのとのとり' },
      { token: '', text: ' ' },
      { token: 'dC60r', text: 'みずのとのとり' },
    ])

    const tempos = g.to_tempos(utc)
    expect(tempos.yC60).toBe(tempos.yC)
    expect(tempos.yC10).toBe(tempos.yCS)
    expect(tempos.yC12).toBe(tempos.yCB)
    expect(tempos.dC60).toBe(tempos.dC)
    expect(tempos.dC10).toBe(tempos.dCS)
    expect(tempos.dC12).toBe(tempos.dCB)
    expect(tempos.yC).toBe(tempos.a)
    expect(tempos.yCS).toBe(tempos.c)
    expect(tempos.yCB).toBe(tempos.b)
    expect(tempos.dC).toBe(tempos.A)
    expect(tempos.dCS).toBe(tempos.C)
    expect(tempos.dCB).toBe(tempos.B)

    const parsed = g.index(g.format(utc, canonical), canonical)
    expect(parsed.yC60).toBe(tempos.yC60.now_idx)
    expect(parsed.yC10).toBe(tempos.yC10.now_idx)
    expect(parsed.yC12).toBe(tempos.yC12.now_idx)
    expect(parsed.dC60).toBe(tempos.dC60.now_idx)
    expect(parsed.dC10).toBe(tempos.dC10.now_idx)
    expect(parsed.dC12).toBe(tempos.dC12.now_idx)
    expect(parsed.a).toBe(parsed.yC60)
    expect(parsed.A).toBe(parsed.dC60)
  })

  test('E follows the calendar week cycle while f/F/V are not aliases', () => {
    const utc = g.parse('2024年3月10日')
    const gregorian = g.to_tempos(utc)
    const romulus = rg.to_tempos(utc)
    const french = fg.to_tempos(utc)

    expect(gregorian.E).toBe(gregorian.dC7)
    expect(romulus.E).toBe(romulus.dC8)
    expect(french.E).toBe(french.dC10)

    expect(gregorian.f).toBeUndefined()
    expect(gregorian.F).toBeUndefined()
    expect(gregorian.V).toBeUndefined()
    expect(g.format(utc, 'f F V')).toBe('f F V')
  })

  test('table calendar anchors format back to their declared start values', () => {
    for (const calendar of [j, rg, fg, Calendar.コプト暦]) {
      const [source, format, epoch] = calendar.dic.start
      expect(calendar.format(epoch, format)).toBe(source)
    }
  })

  test('mean lunisolar anchors format back to their declared start values', () => {
    for (const calendar of [am, pm]) {
      const [source, format, epoch] = calendar.dic.start
      expect(calendar.format(epoch, format)).toBe(source)
    }
  })

  test('Thai lunisolar sample uses Buddhist Era year and Thai lunar month labels', () => {
    const [source, format, epoch] = thai.dic.start
    expect(thai.format(epoch, format)).toBe(source)
    expect(thai.format(Date.UTC(2024, 0, 1), 'Gy年Mo d日(dC7)')).toContain('พ.ศ.2567年เดือน')
  })

  test('Japanese lunisolar anchors use the raw year token for calibration', () => {
    for (const calendar of [平気法, Calendar.定気法]) {
      const [source, format, epoch] = calendar.dic.start
      expect(format.startsWith('u年')).toBe(true)
      expect(calendar.format(epoch, format)).toBe(source)
    }
  })

  test('notation() is the expression API while algo() remains a compatibility alias', () => {
    const utc = g.parse('2024年3月10日')
    const start = ['1970年 Thu-斗 庚戌-辛巳', 'y年 dC7-dC28 yC60-dC60', 0]
    const notation = new FancyDate(g)
      .calendar(start, [4, 100, 400], [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
      .notation({ dC7: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']] })
      .init()
    const legacy = new FancyDate(g)
      .calendar(start, [4, 100, 400], [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
      .algo({ dC7: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']] })
      .init()

    expect(notation.format(utc, 'E')).toBe('Sun')
    expect(legacy.format(utc, 'E')).toBe(notation.format(utc, 'E'))
  })

  test('assign() stores token assignment rules separately from notation', () => {
    const utc = g.parse('2024年3月10日')
    const assignment = (dayStart, context) =>
      dayStart === 'sunrise' && context.token === 'd' ? 1 : 0
    const calendar = new FancyDate(g).dayStart('sunrise').assign({ d: assignment }).init()
    const clone = new FancyDate(calendar)

    expect(calendar.dic.assignments.d).toBe(assignment)
    expect(Object.prototype.propertyIsEnumerable.call(calendar.dic, 'assignments')).toBe(false)
    expect(clone.dic.assignments.d).toBe(assignment)
    expect(calendar.format(utc, 'd')).toBe('2')
  })

  test('FancyDate.lazy() defers construction until first use and memoizes it', () => {
    let constructed = 0
    const calendar = FancyDate.lazy(() => {
      constructed++
      return new FancyDate(g).init()
    })

    expect(calendar).toBeInstanceOf(FancyDate)
    expect(constructed).toBe(0)
    expect(calendar.format(0, 'Gy年MM月dd日')).toBe(g.format(0, 'Gy年MM月dd日'))
    expect(constructed).toBe(1)
    expect(calendar.format(g.parse('2024年3月10日'), 'Gy年MM月dd日')).toBe('西暦2024年03月10日')
    expect(constructed).toBe(1)
  })

  test('tithi() assigns d from the lunar phase at the configured dayStart boundary', () => {
    const calendar = new FancyDate(g).dayStart('sunrise').assign({ d: tithi() }).init()
    const base = calendar.parse('2024年6月21日')
    const day = calendar.to_tempos(base).d
    const expected = Math.floor(calendar.dic.moony.phaseAt(day.last_at) * 30)
    const next = day.succ()

    expect(day.now_idx).toBe(expected)
    expect(calendar.format(base, 'd')).toBe(String(expected + 1))
    expect(day.raw_now_idx).toBe(
      new FancyDate(g).dayStart('sunrise').init().to_tempos(base).d.now_idx,
    )
    expect(day.assignment_raw_now_idx % 30).toBe(day.now_idx)
    expect(next.raw_now_idx).toBe(day.raw_now_idx + 1)
    expect(next.assignment_raw_now_idx).toBeGreaterThanOrEqual(day.assignment_raw_now_idx)
    expect(next.last_at).toBe(day.next_at)
  })

  test('assignment context reuses the current day envelope for nextAt', () => {
    const contexts = []
    const calendar = new FancyDate(g)
      .dayStart('sunrise')
      .assign({
        d: (_dayStart, context) => {
          contexts.push(context)
          return 0
        },
      })
      .init()
    const base = calendar.parse('2024年6月21日')
    const day = new FancyDate(g).dayStart('sunrise').init().to_tempos(base).d

    calendar.to_tempos(base)

    expect(contexts[0].at).toBe(day.last_at)
    expect(contexts[0].nextAt).toBe(day.next_at)
  })

  test('tithi() caches raw lunar phase indexes across repeated civil-day queries', () => {
    const calendar = new FancyDate(g).dayStart('sunrise').assign({ d: tithi() }).init()
    const base = calendar.parse('2024年6月21日')
    const moony = calendar.dic.moony
    const phaseAt = moony.phaseAt.bind(moony)
    let calls = 0
    moony.phaseAt = (at) => {
      calls++
      return phaseAt(at)
    }

    const day = calendar.to_tempos(base).d
    const firstCalls = calls
    calendar.to_tempos(base).d
    expect(calls).toBe(firstCalls)

    calendar.to_tempos(day.next_at + 1000).d
    expect(calls).toBe(firstCalls + 1)
  })

  test('tithi() calendars do not leak fractional day counts into span()', () => {
    for (const base of ['2024年3月10日', '2026年7月13日']) {
      const from = g.parse(base)
      const to = amTithi.succ(from, '1日後')
      const label = amTithi.span(to, from, { precise: 'm' })

      expect(label).not.toMatch(/\d+\.\d+日/)
    }
  })

  test('tithi() marks skipped and repeated tithi without other panchanga elements', () => {
    const collectFlags = (calendar, start, days) => {
      let at = start
      const flags = []
      for (let i = 0; i < days; i++) {
        const day = calendar.to_tempos(at).d
        flags.push(...day.assignment_flags)
        at = day.next_at + 1000
      }
      return flags
    }

    expect(collectFlags(amTithi, g.parse('2024年1月1日'), 180)).toContain('skipped')

    const slowMoon = [月[0], [31 * to_msec('1d'), 月[1][1]], 月[2]]
    const repeatedCalendar = new FancyDate(g)
      .spot(slowMoon, 東京[1], 東京[2], 東京[3])
      .dayStart('sunrise')
      .assign({ d: tithi() })
      .init()
    expect(collectFlags(repeatedCalendar, g.parse('2024年1月1日'), 90)).toContain('repeated')
  })

  test('parse → fomat cycle', () => {
    const str = 'Gy年MM月dd日(E)H時m分s秒'
    expect(
      [
        g.format(g.parse('0年4月1日'), str),
        g.format(g.parse('1970年4月27日'), str),
        g.format(g.parse('1973年3月3日'), str),
        g.format(g.parse('2001年9月9日'), str),
        g.format(g.parse('2286年11月21日'), str),
        g.format(g.parse('5138年11月16日'), str),
      ].join('\n'),
    ).toEqual(
      [
        '紀元前1年04月01日(土)0時0分0秒',
        '西暦1970年04月27日(月)0時0分0秒',
        '西暦1973年03月03日(土)0時0分0秒',
        '西暦2001年09月09日(日)0時0分0秒',
        '西暦2286年11月21日(日)0時0分0秒',
        '西暦5138年11月16日(水)0時0分0秒',
      ].join('\n'),
    )
  })

  test('span precise supports week-year and day-of-year hierarchy', () => {
    const from = g.parse('2024年1月1日 0時0分0秒', 'y年M月d日 H時m分s秒')
    const to = g.parse('2025年3月10日 4時5分6秒', 'y年M月d日 H時m分s秒')
    const custom = new FancyDate(g).labels({ w: '週目', dC60: '日巡り' }).init()
    const legacy = new FancyDate(g).labels({ A: '旧日巡り' }).init()

    expect(g.span([from, to], { precise: 'Y' })).toBe('1年後')
    expect(g.span([from, to], { precise: 'w' })).toBe('1年10週後')
    expect(g.span([from, to], { precise: 'D' })).toBe('1年68日後')
    expect(custom.span([from, to], { precise: 'w' })).toBe('1年10週目後')
    expect(custom.span(g.parse('2024年1月2日'), from, { precise: 'dC60' })).toBe('1日巡り後')
    expect(legacy.span(g.parse('2024年1月2日'), from, { precise: 'A' })).toBe('1旧日巡り後')
    expect(custom.parse_span('1日巡り後').parts?.[0]).toMatchObject({
      token: 'dC60',
      unit: 'day',
      value: -1,
      label: '1日巡り',
    })
    expect(
      custom.format_span({ token: 'dC60', unit: 'day', value: -1, label: '1dC60' }).label,
    ).toBe('1日巡り後')
    expect(custom.add(from, '1週目後')).toBe(g.parse('2024年1月8日'))
    expect(() => custom.add(from, '1日巡り後')).toThrow(/cyclic span token dC60/)
  })

  // 上の 'span precise supports week-year and day-of-year hierarchy' は
  // from が1月1日固定のため、日番号(day-of-month)と年内通日(day-of-year)の基準が
  // たまたま一致しており、month をまたいで year もまたぐケースの不具合を検出できていなかった。
  // D/w 精度は年初基準の座標なので、from の月に関係なく year をまたぐ span を正しく再構成する。
  test('span add reconstructs D/w precise spans across a year boundary from a non-January source', () => {
    const from = g.parse('2024年3月15日 0時0分0秒', 'y年M月d日 H時m分s秒')
    const to = g.parse('2025年6月20日 0時0分0秒', 'y年M月d日 H時m分s秒')

    const dSpan = g.parse_span(g.span([from, to], { precise: 'D' }))
    expect(g.format(g.add(from, dSpan), 'yyyy年MM月dd日')).toBe('2025年06月20日')

    const wSpan = g.parse_span(g.span([from, to], { precise: 'w' }))
    expect(g.format(g.add(from, wSpan), 'yyyy年MM月dd日')).toBe('2025年06月20日')
  })

  test('numeral dictionaries format numeric tokens', () => {
    const msec = g.parse('2024年3月10日')
    const kanji = new FancyDate(g).numeral(jpn.漢字).init()
    const englishLower = new FancyDate(g).numeral(english.lower).init()
    const englishTitle = new FancyDate(g).numeral(english.title).init()
    const romanUpper = new FancyDate(g).numeral(roman.upper).init()

    expect(kanji.format(msec, 'y年M月d日')).toBe('二千廿四年三月十日')
    expect(kanji.parse('二千廿四年三月十日')).toBe(msec)

    expect(englishLower.format(msec, 'M/d')).toBe('three/ten')
    expect(englishLower.parse('three/ten', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(englishTitle.format(msec, 'M/d')).toBe('Three/Ten')
    expect(englishTitle.parse('Three/Ten', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(romanUpper.format(msec, 'M/d')).toBe('III/X')
    expect(romanUpper.parse('III/X', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(new FancyDate(g).numeral().init().format(msec, 'yyyy年MM月dd日')).toBe('2024年03月10日')
  })

  test('english numeral regex matches only number words, not arbitrary alphabetic tokens', () => {
    // 以前は [A-Za-z]+ で英字列を無条件に飲み込んでいたため、同じ format
    // 文字列内の元号名・曜日名等、他の英字トークンと衝突しうる不具合が
    // あった。数詞語彙だけに一致することを直接検証する。
    const re = new RegExp(`^(?:${english.lower.regex})$`)
    expect(re.test('three')).toBe(true)
    expect(re.test('twenty-one')).toBe(true)
    expect(re.test('one hundred')).toBe(true)
    // 元号名・曜日名など、数詞語彙に含まれない英単語は一致しない。
    expect(re.test('monday')).toBe(false)
    expect(re.test('ad')).toBe(false)
    expect(re.test('march')).toBe(false)
    // 'seventeen' は 'seven' の接頭辞を含むが、全体が一致し 'seven' で
    // 途中一致してしまわないことを確認する。
    expect('seventeen'.match(new RegExp(`^(?:${english.lower.regex})`))?.[0]).toBe('seventeen')
  })

  test('太陽の動き', () => {
    const dst = earth_msecs.map((msec) => to_graph(g, msec))
    expect(dst).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = earth_msecs.map(
      (msec) =>
        `${format(msec, 'yyyy-MM-dd', { locale })} ${format(msec, 'Y-ww-EEE', {
          locale,
        })} ${g.format(msec, 'Y-ww-E yC60-dC60 Z\tGyyyy/MM/dd HH:mm:ss J')}`,
    )
    expect(dst).toMatchSnapshot()
  })

  test('astronomical phase helper uses high precision model opt-in', () => {
    const term = ga.solar_term(g.parse('2020年3月20日'), 0)
    expect(ga.format(term.last_at, 'yyyy年MM月dd日 HH:mm')).toEqual('2020年03月20日 00:00')
    expect(ga.format(ga.solar_phase(0, g.parse('2020年3月20日')), 'yyyy年MM月dd日 HH:mm')).toEqual(
      '2020年03月20日 12:49',
    )
  })

  test('phase based solar terms preserve mean calendars and auto-select astronomical dates', () => {
    const utc = g.parse('2020年3月22日')
    const mean = g.雑節(utc)
    const terms = ga.solar_terms(utc)
    const auto = ga.雑節(utc)
    const phase = ga.雑節_by_phase(utc)
    expect(ga.format(terms.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月20日')
    expect(g.format(mean.秋分.last_at, 'yyyy年MM月dd日')).toEqual('2020年09月19日')
    expect(ga.format(phase.春分.last_at, 'yyyy年MM月dd日')).toEqual(
      g.format(mean.春分.last_at, 'yyyy年MM月dd日'),
    )
    expect(ga.format(phase.秋分.last_at, 'yyyy年MM月dd日')).toEqual('2020年09月22日')
    expect(ga.format(auto.秋分.last_at, 'yyyy年MM月dd日')).toEqual('2020年09月22日')
  })

  test('custom mean orbital model shifts only explicit phase based solar terms', () => {
    const shifted = solarShiftCalendar(to_msec('2d'))
    const utc = g.parse('2020年3月23日')
    const auto = shifted.雑節(utc)
    const terms = shifted.solar_terms(utc)
    const phase = shifted.雑節_by_phase(utc)

    expect(shifted.dic.sunny.epochMsec).toBe(ga.dic.sunny.epochMsec)
    expect(shifted.calc.zero.season).toBe(ga.calc.zero.season)
    expect(shifted.format(auto.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月20日')
    expect(shifted.format(terms.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月22日')
    expect(shifted.format(phase.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月22日')
  })

  // Z (Tempos.Z) は sunny が solarEvents を持つ(=hasSolarEvents)場合、
  // 等角分割(平気法相当)ではなく実軌道(定気法)の二十四節気で解決される。
  // GregorianAstronomical(ga)は天文東京を使うため対象になり、solar_terms()の
  // 8つの主要な節気(立春/春分/立夏/夏至/立秋/秋分/立冬/冬至)とラベルが一致する。
  test('Z resolves true solar terms (定気法) once sunny exposes solarEvents precision', () => {
    const terms = ga.solar_terms(g.parse('2020年6月1日'))
    for (const name of ['立春', '春分', '立夏', '夏至', '立秋', '秋分', '立冬', '冬至']) {
      expect(ga.format(terms[name].write_at, 'Z')).toBe(name)
    }
  })

  // 旧暦(Nn/N)経路の閘月判定・月番号も、Tempos.Zと同じ基準(hasSolarEvents(sunny))で
  // 切り替わらないと内部矛盾になる(実測: sunnyのみ精密な合成暦では、
  // 40年間のうち閘月判定が23ヶ月/496ヶ月、月番号が29ヶ月で食い違うと判明したため、
  // 「差が小さく無視できる」とは言えない)。
  // sunnyのみ天文精度(平気法の moony はそのまま)にした合成暦で、
  // 既知の閘月判定が実軌道基準に切り替わっていることを確認する。
  test('Nn/Zs leap-month detection also switches to orbital phase alongside Z', () => {
    const testCal = new FancyDate(平気法)
      .spot([天文地球, 月[1], 月[2]], 東京[1], 東京[2], 東京[3])
      .init()
    expect(testCal.dic.sunny.solarEvents || testCal.dic.sunny.timeOfPhase).toBeTruthy()

    // 以前の等角(平気法)ロジックでは mean=false だったが、
    // 実軌道ではこの月が閘月になる(2003-10-24T14:00 付近の月)。
    const leapMonth = testCal.to_tempos(Date.UTC(2003, 10, 1)).M
    expect(leapMonth.is_leap).toBe(true)

    // 以前の等角ロジックでは mean=true だったが、実軌道では通常月(2006-11-19付近)。
    const nonLeapMonth = testCal.to_tempos(Date.UTC(2006, 10, 25)).M
    expect(nonLeapMonth.is_leap).toBeFalsy()
  })

  test('JupiterObserved opts non-earth lunisolar calendars into phase-resolved months', () => {
    const utc = g.parse('2024年3月10日')
    const mean = jg.to_tempos(utc)
    const observed = jog.to_tempos(utc)
    const lunisolar = jog.lunisolar(utc)

    expect(jog.dic.observed_lunisolar).toBe(true)
    expect(jog.dic.M.length).toBe(260)
    expect(lunisolar.principal_term.longitudeDeg).toBeCloseTo(
      (lunisolar.principal_term.index * 360) / jog.dic.M.length,
      10,
    )
    expect(observed.u.now_idx).toBe(mean.u.now_idx)
    expect(lunisolar.year).toBe(observed.u.raw_now_idx)
    expect(observed.M.now_idx + 1).toBe(lunisolar.month)
    expect(observed.d.now_idx + 1).toBe(lunisolar.day)
    expect(observed.M.now_idx).not.toBe(mean.M.now_idx)
  })

  // d(月内日、observed lunisolar 経路)は以前 to_tempo_bare(calc.zero.day,...)+
  // now_idx上書きの素の Tempo だったため、succ() が Tempo.slide() の
  // 非テーブル分岐で「calc.zero.day からの絶対日数」(巨大な値)を
  // 返してしまい、月内日として使えない値になっていた(last_at 自体は
  // 正しかったため find()/to_table() には実害がなかった)。
  // SubdivideTempoRule化により、succ() が「月初からの経過日数」を
  // 一貫して(月をまたいでも)+1し続けることを確認する。
  test('d (observed lunisolar day) succ() correctly continues the day-in-month count (regression for the old zero.day mixup)', () => {
    const tg = Calendar.定気法
    const monthEnd = tg.to_tempos(Date.UTC(2020, 5, 1)).M.next_at
    const utc = monthEnd - 12 * 3600000 // 月の最終日
    const tempos = tg.to_tempos(utc)
    const lunisolar = tg.lunisolar(utc)
    expect(tempos.d.now_idx).toBe(lunisolar.day - 1)

    const next = tempos.d.succ()
    expect(next.now_idx).toBe(tempos.d.now_idx + 1)
    expect(next.last_at).toBe(tempos.d.next_at)
    // 修正前の値(calc.zero.day からの絶対日数)は登場時点で数万〜十万超の
    // 桁になるため、月内日らしい小さい値であることも明示的に確認する。
    expect(next.now_idx).toBeLessThan(32)
  })

  // M(月、observed lunisolar 経路)は以前 M = new Tempo(...) という素の
  // Tempo だったため、succ() が Tempo.slide() の非テーブル分岐(今の月の
  // 実サイズを固定長とみなして write_at + n*size で進める式)を使って
  // いた。now_idx は「月番号-1」(年境界でリセットされるべき値)なのに、
  // この式は単純に+1し続けるだけで年境界のリセットを一切反映しない実バグが
  // あった(実測: 300回 succ() 連鎖のうち298回が fresh 再導出と不一致、
  // now_idx が年をまたいでも12,13,14...と増え続け、last_at も蓄積的に
  // ずれていった)。ObservedLunisolarMonthRule に配線して修正した。
  test('M (observed lunisolar month) succ() correctly resets now_idx across year boundaries (regression for a real bug)', () => {
    const tg = Calendar.定気法
    let current = tg.to_tempos(Date.UTC(1980, 0, 1)).M
    let mismatches = 0
    for (let i = 0; i < 300; i++) {
      const fresh = tg.to_tempos(current.write_at).M
      if (fresh.now_idx !== current.now_idx || fresh.last_at !== current.last_at) {
        mismatches++
      }
      current = current.succ()
    }
    expect(mismatches).toBe(0)
  })

  // 上記バグの実害が実際に公開APIで顕在化していたことの回帰テスト。
  // find(step:'M') は tempo.succ() を連鎖させる実装(to_table() と違い
  // 毎回 to_tempos() で再解決しない)ため、修正前は succ() の壊れた
  // now_idx/last_at をそのまま引きずり、63件見つかるはずの月初一覧が
  // 2件しか見つからず、見つかった日付も元号年が「0054年」のように
  // 破綻していた。
  test('find with step M enumerates observed-lunisolar month starts correctly (regression for a real find() bug)', () => {
    const tg = Calendar.定気法
    const from = tg.to_tempos(Date.UTC(1980, 0, 1)).M.next_at // ちょうど月初から開始する
    const to = Date.UTC(1985, 0, 1)

    const found = tg.find([from, to], [{ d: '1' }], { step: 'M' })

    const expected = []
    let cursor = from
    while (cursor < to) {
      expected.push(cursor)
      cursor = tg.to_tempos(cursor).M.next_at
    }

    expect(found).toEqual(expected)
    expect(found.length).toBeGreaterThan(50)
  })
})

describe('tithi calendar samples', () => {
  test.each([
    ['アマンタティティ', amTithi],
    ['プールニマンタティティ', pmTithi],
  ])(
    '%s assigns d from tithi at sunrise while preserving civil-day movement',
    (_name, calendar) => {
      const utc = g.parse('2024年6月21日')
      const day = calendar.to_tempos(utc).d
      const expected = Math.floor(calendar.dic.moony.phaseAt(day.last_at) * 30)
      const next = day.succ()

      expect(calendar.dic.day_start).toBe('sunrise')
      expect(calendar.dic.assignments.d).toBeDefined()
      expect(hasSolarEvents(calendar.dic.sunny)).toBe(true)
      expect(day.now_idx).toBe(expected)
      expect(day.assignment_raw_now_idx % 30).toBe(day.now_idx)
      expect(next.raw_now_idx).toBe(day.raw_now_idx + 1)
      expect(next.last_at).toBe(day.next_at)
    },
  )
})

describe('Maya', () => {
  test('2012-12-21 GMT correlation anchor', () => {
    const utc = Calendar.UTC.parse('2012年12月21日')
    expect(mayaLongCount(utc)).toBe('13.0.0.0.0')
    expect(mayaTzolkin(utc)).toBe('4 Ajaw')
    expect(mayaHaab(utc)).toBe('3 Kankin')
  })
})

describe('Panchanga helpers', () => {
  test('panchanga() derives tithi, paksha, nakshatra, yoga and karana at the civil day boundary', () => {
    const utc = g.parse('2024年6月21日')
    const value = panchanga(amTithi, utc)

    expect(value.at).toBe(amTithi.to_tempos(utc).d.last_at)
    expect(value.tithi.number).toBeGreaterThanOrEqual(1)
    expect(value.tithi.number).toBeLessThanOrEqual(30)
    expect(value.paksha.name).toMatch(/白分|黒分/)
    expect(value.nakshatra.number).toBeGreaterThanOrEqual(1)
    expect(value.nakshatra.number).toBeLessThanOrEqual(27)
    expect(value.yoga.number).toBeGreaterThanOrEqual(1)
    expect(value.yoga.number).toBeLessThanOrEqual(27)
    expect(value.karana.number).toBeGreaterThanOrEqual(1)
    expect(value.karana.number).toBeLessThanOrEqual(60)
  })

  test('panchangaNotes() matches festival-style derived conditions', () => {
    const utc = g.parse('2024年6月21日')
    const value = panchanga(amTithi, utc)
    const notes = panchangaNotes(amTithi, utc, [
      { name: '今日のティティ', tithi: value.tithi.number },
      { name: '別のティティ', tithi: value.tithi.number === 1 ? 2 : 1 },
      { name: '現在の半月', paksha: value.paksha.name },
    ])

    expect(notes).toContain('今日のティティ')
    expect(notes).toContain('現在の半月')
    expect(notes).not.toContain('別のティティ')
  })

  test('panchangaCandidates() returns civil-day candidates for derived conditions', () => {
    const from = g.parse('2024年6月1日')
    const to = g.parse('2024年7月1日')
    const base = panchanga(amTithi, g.parse('2024年6月21日'))
    const candidates = panchangaCandidates(amTithi, [from, to], { tithi: base.tithi.number })

    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every((at) => from <= at && at < to)).toBe(true)
    expect(candidates.some((at) => at === base.at)).toBe(true)
  })
})

describe('エジプト民用暦', () => {
  test('365日固定の月構成で進む', () => {
    const c = Calendar.エジプト民用暦
    const epoch = c.parse('1年1月1日')

    expect(c.dic.geo).toEqual([30, 31.2, 30])
    expect(
      Calendar.Julian.format(Calendar.Julian.parse('紀元前747年2月26日'), 'Gy年MM月dd日'),
    ).toBe('紀元前747年02月26日')
    expect(Calendar.Julian.format(Calendar.Julian.parse('紀元前747年2月26日'), 'y年M月d日')).toBe(
      '-746年2月26日',
    )
    // 曜日(E)の値は、旧来の def_zero() が d(暦日)自身のシフト分を二重に
    // 差し引いていたバグ修正の影響で変わった(Julian の anchor
    // '1582/10/5(金)...' 自身が示す通り、1582年10月5日は金曜日である
    // ことを確認済み——development-notes.md 参照)。
    expect(Calendar.Julian.format(Calendar.Julian.parse('紀元前747年2月26日'), 'Y-ww-E')).toBe(
      '-746-09-水',
    )
    expect(Calendar.Julian.format(Calendar.Julian.parse('紀元前747年2月26日'), 'GY-ww-E')).toBe(
      '紀元前747-09-水',
    )
    expect(Calendar.Julian.format(Calendar.Julian.parse('-746年2月26日'), 'Gy年MM月dd日')).toBe(
      '紀元前747年02月26日',
    )
    expect(Calendar.Julian.format(epoch + to_msec('12h'), 'Gy年MM月dd日')).toBe(
      '紀元前747年02月26日',
    )
    expect(c.format(epoch, 'Gy年Mod日')).toBe('ナボナサル紀元1年トート1日')
    expect(c.format(epoch + to_msec('359d'), 'Gy年Mod日')).toBe('ナボナサル紀元1年メソリ30日')
    expect(c.format(epoch + to_msec('360d'), 'Gy年Mod日')).toBe('ナボナサル紀元1年余日1日')
    expect(c.format(epoch + to_msec('364d'), 'Gy年Mod日')).toBe('ナボナサル紀元1年余日5日')
    expect(c.format(epoch + to_msec('365d'), 'Gy年Mod日')).toBe('ナボナサル紀元2年トート1日')
  })
})

describe('ローマ・ユリウス時法', () => {
  test('一般的な標準表示は日付までに留め、秒を既定で主張しない', () => {
    const msec = g.parse('2020年3月22日')

    expect(g.format(msec)).toBe('西暦2020年3月22日(日) 00:00')
    for (const calendar of [
      g,
      fg,
      am,
      pm,
      Calendar.バビロニア暦カスプ,
      Calendar.バビロニア暦ベール,
    ]) {
      expect(calendar.format(msec)).not.toContain('秒')
    }
  })

  test('ローマ系時法は本文を数字にし、rubyでラテン文字の読みを示す', () => {
    const msec = g.parse('2020年3月22日')

    for (const calendar of [j, rg]) {
      const text = calendar.format(msec)
      expect(text).toMatch(/\d{2}:\d{2}$/)
      expect(text).not.toContain('hora')
      expect(text).not.toContain('pars minuta')
      expect(text).not.toContain('秒')

      const hour = calendar.format_parts(msec).find((part) => part.token === 'HH')
      const minute = calendar.format_parts(msec).find((part) => part.token === 'mm')
      expect(hour).toMatchObject({ ruby: expect.stringMatching(/^hora [a-z ]+$/) })
      expect(minute).toMatchObject({ ruby: expect.stringMatching(/^pars minuta \d{2}$/) })
      expect(calendar.format(msec, 'Hr')).toContain('hora')
    }
  })

  test('バビロニア暦は時刻制度を主題にするため標準表示に時分を含める', () => {
    const msec = g.parse('2020年3月22日')

    for (const text of [
      Calendar.バビロニア暦カスプ.format(msec),
      Calendar.バビロニア暦ベール.format(msec),
    ]) {
      expect(text).toContain('時')
      expect(text).toContain('分')
      expect(text).not.toContain('秒')
    }
  })

  test('Beatは通常の西暦日付に3桁のSwatch Internet Timeを添える', () => {
    const midnightBmt = Date.parse('2020-03-21T23:00:00Z')
    const noonBmt = Date.parse('2020-03-22T11:00:00Z')

    expect(b.format(midnightBmt)).toBe('西暦2020年3月22日(日) @000')
    expect(b.format(noonBmt)).toBe('西暦2020年3月22日(日) @500')
    expect(b.format(midnightBmt, '@HHH.mm')).toBe('@000.33')
  })

  test('サカ歴は標準の数字本文にサンスクリット転写rubyを付ける', () => {
    const parts = am.format_parts(g.parse('2024年3月10日'), 'Gy年M月d日')
    expect(parts.find((part) => part.token === 'y')).toMatchObject({
      text: expect.any(String),
      ruby: expect.stringContaining('sahasra'),
    })
    expect(parts.find((part) => part.token === 'M')).toMatchObject({
      ruby: expect.stringMatching(/^[a-zāīūṛṝḷḹṃḥṅñṭḍṇśṣ -]+$/),
    })
    expect(parts.find((part) => part.token === 'd')).toMatchObject({
      ruby: expect.stringMatching(/^[a-zāīūṛṝḷḹṃḥṅñṭḍṇśṣ -]+$/),
    })
  })

  test('漢数字Gregorianは桁数指定で桁読み、指定なしで通常の漢数字を使う', () => {
    const c = Calendar.漢数字Gregorian
    const utc = g.parse('2024年3月7日 5時6分0秒', 'y年M月d日 H時m分s秒')

    expect(c.format(utc, 'y年M月d日 H時m分')).toBe('二千廿四年三月七日 五時六分')
    expect(c.format(utc, 'yyyy年MM月dd日 HH:mm')).toBe('二〇二四年〇三月〇七日 〇五:〇六')
  })
})

describe('コプト暦', () => {
  test('3 mod 4 年を閏年として余日6日を持つ', () => {
    const c = Calendar.コプト暦
    const common = c.parse('1738年1月1日')
    const leap = c.parse('1739年1月1日')

    expect(c.dic.geo).toEqual([31.2, 29.9, 30])
    expect(c.format(common + to_msec('364d'), 'Gy年Mod日')).toBe('コプト暦1738年ナシー5日')
    expect(c.format(common + to_msec('365d'), 'Gy年Mod日')).toBe('コプト暦1739年トウト1日')
    expect(c.format(leap + to_msec('364d'), 'Gy年Mod日')).toBe('コプト暦1739年ナシー5日')
    expect(c.format(leap + to_msec('365d'), 'Gy年Mod日')).toBe('コプト暦1739年ナシー6日')
    expect(c.format(leap + to_msec('366d'), 'Gy年Mod日')).toBe('コプト暦1740年トウト1日')
  })
})

describe('火星', () => {
  test('NASA style Mars solar model resolves solar season phases', () => {
    const mars = new MarsSolarOrbital()
    const near = g.parse('2024年1月1日')
    const at = mars.timeOfPhase(0, near)
    expect(Math.abs(mars.phaseAt(at))).toBeLessThan(0.001)
    expect(Math.abs(at - near)).toBeLessThan(mars.periodMsec / 2)

    const planet = MarsSolarOrbital.planet(太陽, { body: { name: 'Mars' } })
    expect(planet.body).toMatchObject({ name: 'Mars' })
    expect(planet[1]).toBe(planet.orbital)
    expect(planet[2]).toBe(planet.rotation)
    expect(天文火星.orbital).toBeInstanceOf(MarsSolarOrbital)
  })

  test('planetary solar event models resolve local sun events', () => {
    const near = g.parse('2024年1月1日')
    for (const orbital of [
      new MarsSolarOrbital(),
      new MercurySolarOrbital(),
      new VenusSolarOrbital(),
      new JupiterSolarOrbital(),
      new SaturnSolarOrbital(),
      new UranusSolarOrbital(),
      new NeptuneSolarOrbital(),
      new PlutoSolarOrbital(),
    ]) {
      expect(hasSolarEvents(orbital)).toBe(true)
      const events = orbital.solarEvents(near, { latitudeDeg: 0, longitudeDeg: 0, timezoneDeg: 0 })
      expect(events.has_sunrise).toBe(true)
      expect(Number.isFinite(events.日の出)).toBe(true)
      expect(Number.isFinite(events.南中時刻)).toBe(true)
      expect(Number.isFinite(events.日の入)).toBe(true)
      expect(events.日の出).toBeLessThan(events.南中時刻)
      expect(events.南中時刻).toBeLessThan(events.日の入)
    }
  })

  test('mean planetary solar models expose mean season phases and sample placements', () => {
    for (const [Model, planet] of [
      [MercurySolarOrbital, 天文水星],
      [VenusSolarOrbital, 天文金星],
      [JupiterSolarOrbital, 天文木星],
      [SaturnSolarOrbital, 天文土星],
      [UranusSolarOrbital, 天文天王星],
      [NeptuneSolarOrbital, 天文海王星],
      [PlutoSolarOrbital, 天文冥王星],
    ]) {
      const orbital = new Model()
      expect(orbital.phaseAt(Model.vernalEquinoxEpochMsec)).toBe(0)
      expect(planet.orbital).toBeInstanceOf(Model)
    }
  })

  test('Keplerian solar models use non-linear solar longitude instead of linear mean longitude', () => {
    for (const [Model, thresholdDeg] of [
      [MercurySolarOrbital, 1],
      [VenusSolarOrbital, 0.05],
      [PlutoSolarOrbital, 1],
    ]) {
      const orbital = new Model()
      const at = Model.vernalEquinoxEpochMsec + Model.meanTropicalYearMsec / 4
      expect(orbital).toBeInstanceOf(KeplerianSolarOrbital)
      expect(orbital.phaseAt(Model.vernalEquinoxEpochMsec)).toBe(0)
      expect(Math.abs(signedDegreeDiff(orbital.solarLongitudeDeg(at), 90))).toBeGreaterThan(
        thresholdDeg,
      )
    }
  })

  test('calc', () => {
    expect(mg.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(mg.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(mg.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(mg.precision()).toEqual({
      leap: [1, -2, -3, -3],
      year: [[20], [33, 34]],
      day: [[24], [60], [60]],
      strategy: 'SolarTable',
      is_legal_solor: true,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(mg.table.month).toMatchSnapshot()
  })

  test('太陽の動き', () => {
    const dst = mars_msecs.map((msec) => to_graph(mg, msec))
    expect(dst).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = mars_msecs.map(
      (msec) =>
        `${format(msec, 'yyyy-MM-dd HH:mm', { locale })}\t${g.format(msec, 'a-Z-E')} ${mg.format(
          msec,
          'a-Z-E\tGyy/MMM/dd HH:mm:ss',
        )}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

describe('木星', () => {
  test('calc', () => {
    expect(jg.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(jg.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(jg.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(jg.precision()).toEqual({
      leap: [2],
      year: [[260], [40, 41]],
      day: [[10], [60], [60]],
      strategy: 'SolarLunar',
      is_legal_solor: false,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(jg.table.month).toMatchSnapshot()
  })

  test('format', () => {
    const str = 'Gy年MM月dd日(E)HH時 abc'
    expect(
      [
        jg.format(10000000000000, str),
        jg.format(1556636400000, str),
        jg.format(10000000000, str),
        jg.format(0, str),
        jg.format(-10000000000, str),
        jg.format(-1000000000000, str),
        jg.format(-10000000000000, str),
      ].join('\n'),
    ).toEqual(
      [
        '西暦194年180月07日(日)05時 乙丑丑乙',
        '西暦172年35月23日(金)02時 癸卯卯癸',
        '西暦168年01月39日(日)05時 己亥亥己',
        '西暦167年255月01日(日)07時 戊戌戌戊',
        '西暦167年248月03日(日)09時 戊戌戌戊',
        '西暦165年80月21日(木)02時 丙申申丙',
        '西暦141年69月35日(日)09時 壬申申壬',
      ].join('\n'),
    )
  })

  test('太陽の動き', () => {
    const dst = jupiter_msecs.map((msec) => to_graph(jg, msec, 'Gyy-MMM-dd HH:mm a-ZZZ-E'))
    expect(dst).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = jupiter_msecs.map(
      (msec) =>
        `${format(msec, 'yyyy-MM-dd HH:mm', { locale })}\t${g.format(msec, 'a-Z-E')} ${jg.format(
          msec,
          'a-ZZZ-E\tGyy/MMM/dd HH:mm:ss',
        )}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

describe('フランス革命歴', () => {
  test('calc', () => {
    expect(fg.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(fg.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(fg.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(fg.precision()).toEqual({
      leap: [4, -128, 456, -3217],
      year: [[13], [28, 29]],
      day: [[10], [100], [100]],
      strategy: 'SolarTable',
      is_legal_solor: false,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(fg.table.range.month).toMatchSnapshot()
  })

  test('太陽の動き', () => {
    const dst = earth_msecs.map((msec) => to_graph(fg, msec))
    expect(dst).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = earth_msecs.map(
      (msec) =>
        `${format(msec, 'yyyy-MM-dd', { locale })} ${format(msec, 'Y-ww-EEE', {
          locale,
        })} ${fg.format(msec, 'Y-ww-E yC60-dC60 Z\tGyyyy/MM/dd HH:mm:ss J')}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

describe('ロムルス歴', () => {
  test('calc', () => {
    expect(rg.calc).toMatchSnapshot()
  })
  test('dic', () => {
    expect(rg.dic).toMatchSnapshot()
  })
  test('table', () => {
    expect(rg.table).toMatchSnapshot()
  })

  test('precision', () => {
    expect(rg.precision()).toEqual({
      leap: [4],
      year: [[11], [33, 34]],
      day: [[24], [60], [60]],
      strategy: 'SeasonTable',
      is_legal_solor: true,
      is_legal_eto: true,
      is_legal_ETO: true,
    })
    expect(rg.table.range.month).toMatchSnapshot()
  })

  test('太陽の動き', () => {
    const dst = earth_msecs.map((msec) => to_graph(rg, msec))
    expect(dst).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = earth_msecs.map(
      (msec) =>
        `${format(msec, 'yyyy-MM-dd', { locale })} ${format(msec, 'Y-ww-EEE', {
          locale,
        })} ${rg.format(msec, 'Y-ww-E yC60-dC60 Z\tGyyyy/MM/dd HH:mm:ss J')}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

function __mod__(a, b) {
  a = +a
  b = +b
  return ((a % b) + b) % b
}
