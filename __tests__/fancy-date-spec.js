require('../lib/sample')
const { FancyDate } = require('../lib/fancy-date')
const { prepareSpot } = require('../lib/fancy-date')
const {
  Calendar,
  mayaHaab,
  mayaLongCount,
  mayaTzolkin,
  太陽,
  地球,
  木星,
  月,
  東京,
  太歳,
  天文,
  黒分月,
  黒分月軌道,
} = require('../lib/sample')
const { to_msec, to_sec, to_tempo_bare } = require('../lib/time')
const { english, jpn, roman } = require('../lib/number')
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

const utc = Calendar.UTC
const g = Calendar.Gregorian
const fg = Calendar.フランス革命暦
const j = Calendar.Julian
const rg = Calendar.Romulus
const ga = Calendar.GregorianAstronomical
const 平気法 = Calendar.平気法
const am = Calendar.アマンタ
const pm = Calendar.プールニマンタ
const b = Calendar.Beat
const mg = Calendar.MarsGregorian
const jg = Calendar.Jupiter

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
  return g.dup().spot(shiftedMoon, 東京[1], 東京[2], 東京[3]).init()
}

const calendars = [
  [utc, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [g, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [fg, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [j, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [rg, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [平気法, 'J Z aA yyyy年MM月dd日(E) Homo ssss:S G'],
  [am, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [pm, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [b, 'J Z a-A yyyy年MM月dd日(E) @H.m'],
  [mg, 'J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G'],
  [jg, 'J Z a-A yyyy年MMM月dd日(E) HH:mm:ss:SS G'],
]

function to_graph(c, msec, str = 'Gyyyy-MM-dd HH:mm a-Z-E') {
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

  test('add 10/10/10', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.add(msec, '10年10ヶ月10日後'))).toEqual('西暦12年12月12日(水)0時0分0秒')
  })

  test('add 11/11/11', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.add(msec, '11年11ヶ月11日後'))).toEqual('西暦14年1月13日(月)0時0分0秒')
  })

  test('sub 1/1/1', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.sub(msec, '1年1ヶ月1日後'))).toEqual('西暦1年1月1日(月)0時0分0秒')
  })

  test('sub 5/5/5', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.sub(msec, '5年5ヶ月5日後'))).toEqual('紀元前5年8月28日(水)0時0分0秒')
  })

  test('sub 10y', () => {
    const msec = g.parse('401年1月1日')
    expect(g.format(g.sub(msec, '10年後'))).toEqual('西暦391年1月1日(火)0時0分0秒')
  })

  test('parse', () => {
    return
    expect([g.format(g.parse('2000年夏至', 'y年Z'))]).toEqual(['123'])
  })

  test('find day cycle in range', () => {
    const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]
    const found = g.find('d', between, [{ Ao: '甲子' }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日 Ao'))).toEqual(['2020年01月22日 甲子'])
  })

  test('find note in range', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年4月1日')]
    const found = g.find('d', between, [{ note: '春分' }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual(['2020年03月20日'])
  })

  test('find with regexp condition', () => {
    const between = [g.parse('2020年3月1日'), g.parse('2020年10月1日')]
    const found = g.find('d', between, [{ note: /春分|秋分/ }])
    expect(found.map((utc) => g.format(utc, 'yyyy年MM月dd日'))).toEqual([
      '2020年03月20日',
      '2020年09月19日',
    ])
  })
})

describe('平気法 calculate', () => {
  test('閏月をまたぐback', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    expect([
      平気法.format(ret),
      平気法.format(平気法.parse('明治9年閏文月1日')),
      平気法.format(平気法.sub(ret, '1ヶ月後')),
      平気法.format(平気法.sub(ret, '2ヶ月後')),
    ]).toEqual([
      '明治9年文月1日(先勝)暁九ツ',
      '明治9年閏文月1日(先勝)暁九ツ',
      '明治9年水無月1日(赤口)暁九ツ',
      '明治9年皐月1日(大安)暁九ツ',
    ])
  })

  test('閏月をまたぐsub/add', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    expect([
      平気法.sub(ret, '2ヶ月後'),
      平気法.sub(ret, '1ヶ月後'),
      ret,
      平気法.add(ret, '1ヶ月後'),
    ]).toEqual([
      -2946448800000 - 3 * 2592000000 + 1 * 86400000,
      -2946448800000 - 2 * 2592000000 + 1 * 86400000,
      -2946448800000,
      -2946448800000 + 1 * 2592000000,
    ])
  })

  test('base', () => {
    const tgt = '明治9年神無月10日(先勝)暁九ツ'
    const ret = 平気法.parse(tgt)

    expect(平気法.format(ret)).toEqual(tgt)
  })

  test('body placement keeps tuple compatibility', () => {
    expect(地球.body).toMatchObject({ kind: 'physical', name: 'Earth', radiusKm: 6378.137 })
    expect(月.body).toMatchObject({ kind: 'physical', name: 'Moon', radiusKm: 1737.4 })
    expect(地球[1]).toBe(地球.orbital)
    expect(地球[2]).toBe(地球.rotation)
    expect(月[0]).toBe(地球)
    expect(月[1]).toBe(月.orbital)
    expect(黒分月[1]).toBe(黒分月軌道)
    expect(黒分月軌道.periodMsec).toBe(天文.月.白分軌道[0])
    expect(黒分月軌道.epochMsec).toBe(天文.月.白分軌道[1] - 天文.月.白分軌道[0] / 2)
    expect(黒分月軌道.phaseAt(天文.月.白分軌道[1])).toBe(0.5)
    expect(木星.body).toMatchObject({ kind: 'physical', name: 'Jupiter' })
    expect(太歳.本体).toMatchObject({ kind: 'virtual', name: '太歳' })
    expect(太歳.本体.derivedFrom).toBe(天文.木星)
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
      '明治9年神無月10日(先勝)暁九ツ',
      '明治10年長月10日(赤口)暁九ツ',
      '明治10年霜月10日(友引)暁九ツ',
      '明治11年神無月10日(先勝)暁九ツ',
    ])
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
        `${g.format(msec, 'yyyy a-A Z-E HH:mm')} ${平気法.format(
          msec,
          'a-A f-F Z-E Gy年Modd日 Hm ssss秒',
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

  test('numeral dictionaries format numeric tokens', () => {
    const msec = g.parse('2024年3月10日')
    const kanji = g.dup().numeral(jpn.漢字).init()
    const englishLower = g.dup().numeral(english.lower).init()
    const englishTitle = g.dup().numeral(english.title).init()
    const romanUpper = g.dup().numeral(roman.upper).init()

    expect(kanji.format(msec, 'y年M月d日')).toBe('二千廿四年三月十日')
    expect(kanji.parse('二千廿四年三月十日')).toBe(msec)

    expect(englishLower.format(msec, 'M/d')).toBe('three/ten')
    expect(englishLower.parse('three/ten', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(englishTitle.format(msec, 'M/d')).toBe('Three/Ten')
    expect(englishTitle.parse('Three/Ten', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(romanUpper.format(msec, 'M/d')).toBe('III/X')
    expect(romanUpper.parse('III/X', 'M/d')).toBe(g.parse('3月10日', 'M月d日'))

    expect(g.dup().numeral().init().format(msec, 'yyyy年MM月dd日')).toBe('2024年03月10日')
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
        })} ${g.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`,
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

  test('phase based solar terms preserve mean calendar and expose astronomical dates', () => {
    const utc = g.parse('2020年3月22日')
    const mean = g.雑節(utc)
    const terms = ga.solar_terms(utc)
    const phase = ga.雑節_by_phase(utc)
    expect(ga.format(terms.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月20日')
    expect(g.format(mean.秋分.last_at, 'yyyy年MM月dd日')).toEqual('2020年09月19日')
    expect(ga.format(phase.春分.last_at, 'yyyy年MM月dd日')).toEqual(
      g.format(mean.春分.last_at, 'yyyy年MM月dd日'),
    )
    expect(ga.format(phase.秋分.last_at, 'yyyy年MM月dd日')).toEqual('2020年09月22日')
  })

  test('custom orbital model shifts only opt-in phase based solar terms', () => {
    const shifted = solarShiftCalendar(to_msec('2d'))
    const utc = g.parse('2020年3月23日')
    const mean = shifted.雑節(utc)
    const terms = shifted.solar_terms(utc)
    const phase = shifted.雑節_by_phase(utc)

    expect(shifted.dic.sunny.epochMsec).toBe(ga.dic.sunny.epochMsec)
    expect(shifted.calc.zero.season).toBe(ga.calc.zero.season)
    expect(shifted.format(mean.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月20日')
    expect(shifted.format(terms.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月22日')
    expect(shifted.format(phase.春分.last_at, 'yyyy年MM月dd日')).toEqual('2020年03月22日')
  })
})

describe('Maya', () => {
  test('2012-12-21 GMT correlation anchor', () => {
    const utc = Calendar.UTC.parse('2012年12月21日')
    expect(mayaLongCount(utc)).toBe('13.0.0.0.0')
    expect(mayaTzolkin(utc)).toBe('4 Ajaw')
    expect(mayaHaab(utc)).toBe('3 Kankin')
  })
})

describe('火星', () => {
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
      leap: [1, -7, 73, -1554],
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
      leap: [1],
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
        '西暦194年180月07日(木)05時 乙丑丑乙',
        '西暦172年35月23日(月)09時 癸卯卯癸',
        '西暦168年01月39日(木)00時 己亥亥己',
        '西暦167年255月01日(水)05時 戊戌戌戊',
        '西暦167年248月03日(金)09時 戊戌戌戊',
        '西暦165年80月20日(月)08時 丙申申丙',
        '西暦141年68月35日(木)05時 壬申申壬',
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
        })} ${fg.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`,
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
        })} ${rg.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`,
    )
    expect(dst).toMatchSnapshot()
  })
})

function __mod__(a, b) {
  a = +a
  b = +b
  return ((a % b) + b) % b
}
