require('../lib/sample')
const { FancyDate } = require('../lib/fancy-date')
const { Calendar } = require('../lib/sample')
const { to_msec, to_tempo_bare } = require('../lib/time')
const format = require('date-fns/format')
const locale = require('date-fns/locale/ja')
const _ = require('lodash')

const utc = Calendar.UTC
const g = Calendar.Gregorian
const fg = Calendar.フランス革命暦
const j = Calendar.Julian
const rg = Calendar.Romulus
const 平気法 = Calendar.平気法
const am = Calendar.アマンタ
const pm = Calendar.プールニマンタ
const b = Calendar.Beat
const mg = Calendar.MarsGregorian
const jg = Calendar.Jupiter

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
    'HH:mm'
  )} 南中時刻.${c.format(南中時刻, 'HH:mm')} 日の入.${c.format(日の入, 'HH:mm')} 方向.${Math.floor(
    方向 / deg_to_rad
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
  return _.sortedUniq(list.sort())
}

const write_at_src = new Date('2018-01-01').getTime()

const earth_msecs = deploy(
  g,
  to_tempo_bare(g.calc.msec.moon, g.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(g.calc.msec.season, g.calc.zero.season, write_at_src).last_at
)

const mars_msecs = deploy(
  mg,
  to_tempo_bare(mg.calc.msec.moon, mg.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(mg.calc.msec.season, mg.calc.zero.season, write_at_src).last_at
)

const jupiter_msecs = deploy(
  jg,
  to_tempo_bare(jg.calc.msec.moon, jg.calc.zero.moon, write_at_src).last_at,
  to_tempo_bare(jg.calc.msec.season, jg.calc.zero.season, write_at_src).last_at
)

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

  test('succ 10/10/10', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.succ(msec, '10年10月10日'))).toEqual('西暦12年12月12日(水)0時0分0秒')
  })

  test('succ 11/11/11', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.succ(msec, '11年11月11日'))).toEqual('西暦14年1月13日(月)0時0分0秒')
  })

  test('back 1/1/1', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.back(msec, '1年1月1日'))).toEqual('西暦1年1月1日(月)0時0分0秒')
  })

  test('back 5/5/5', () => {
    const msec = g.parse('2年2月2日')
    expect(g.format(g.back(msec, '5年5月5日'))).toEqual('紀元前5年8月28日(水)0時0分0秒')
  })

  test('back 10y', () => {
    const msec = g.parse('401年1月1日')
    expect(g.format(g.back(msec, '10年'))).toEqual('西暦391年1月1日(火)0時0分0秒')
  })

  test('parse', () => {
    return
    expect([g.format(g.parse('2000年夏至', 'y年Z'))]).toEqual(['123'])
  })
})

describe('平気法 calculate', () => {
  test('閏月をまたぐback', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    expect([
      平気法.format(ret),
      平気法.format(平気法.parse('明治9年閏文月1日')),
      平気法.format(平気法.back(ret, '1ヶ月')),
      平気法.format(平気法.back(ret, '2ヶ月')),
    ]).toEqual([
      '明治9年文月1日(先勝)暁九ツ',
      '明治9年閏文月1日(先勝)暁九ツ',
      '明治9年水無月1日(赤口)暁九ツ',
      '明治9年皐月1日(大安)暁九ツ',
    ])
  })

  test('閏月をまたぐback 2', () => {
    const tgt = '明治9年文月1日 暁九ツ'
    const ret = 平気法.parse(tgt)

    expect([
      平気法.back(ret, '2ヶ月'),
      平気法.back(ret, '1ヶ月'),
      平気法.back(ret, '1N'), // 閏月
      ret,
      平気法.succ(ret, '1ヶ月'),
    ]).toEqual([
      -2946448800000 - 3 * 2592000000 + 1 * 86400000,
      -2946448800000 - 2 * 2592000000 + 1 * 86400000,
      -2946448800000 - 1 * 2551442889,
      -2946448800000,
      -2946448800000 + 1 * 2592000000,
    ])
  })

  test('base', () => {
    const tgt = '明治9年神無月10日(先勝)暁九ツ'
    const ret = 平気法.parse(tgt)

    expect(平気法.format(ret)).toEqual(tgt)
  })

  test('1月,1年', () => {
    const tgt = '明治10年長月10日 暁九ツ'
    const goal = 平気法.parse(tgt)

    const msec = 平気法.parse('明治10年神無月10日')
    expect([
      平気法.format(平気法.back(msec, '1年')),
      平気法.format(平気法.back(msec, '1月')),
      平気法.format(平気法.succ(msec, '1月')),
      平気法.format(平気法.succ(msec, '1年')),
    ]).toEqual([
      '明治9年神無月10日(先勝)暁九ツ',
      '明治10年長月10日(赤口)暁九ツ',
      '明治10年霜月10日(友引)暁九ツ',
      '明治11年神無月10日(先勝)暁九ツ',
    ])
  })

  test('back 昭和 ⇒ 明治', () => {
    const tgt = '明治10年神無月10日(先勝)暁九ツ'
    const goal = 平気法.parse(tgt)

    const msec = 平気法.parse('昭和10年神無月10日')
    const ret = 平気法.back(msec, '2G')
    expect([(ret - goal) / 86400000, ret - goal, 平気法.format(ret)]).toEqual([0, 0, tgt])
  })

  test('succ 昭和 ⇒ 令和', () => {
    const tgt = '令和10年神無月10日(先勝)暁九ツ'
    const goal = 平気法.parse(tgt)

    const msec = 平気法.parse('昭和10年神無月10日')
    const ret = 平気法.succ(msec, '2G')
    expect([(ret - goal) / 86400000, ret - goal, 平気法.format(ret)]).toEqual([0, 0, tgt])
  })
})

describe('Dr.Stone', () => {
  test('T = 0', () => {
    const msec = g.parse('5738年4月1日')
    const { 日の出 } = g.solor(msec, 6)
    const note = g.note(msec)
    expect(g.format(日の出, `yyyy/MM/dd(E) HH:mm Z ${note}`)).toEqual(
      '5738/04/01(火) 04:20 春分 春'
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
      })
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
        100000000000000,
        10000000000000,
        1556636400000,
        1000000000000,
        100000000000,
        10000000000,
        0,
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
                `Modd日 ${key}`
              )}`
            )
          }
          return result
        })()
        return [..._.flattenDepth(list, 2).sort(), 平気法.note(utc, o, z).join('')]
      })
    ).toMatchSnapshot()
  })

  test('二十四節季と月相', () => {
    const dst = earth_msecs.map(
      (msec) =>
        `${g.format(msec, 'yyyy a-A Z-E HH:mm')} ${平気法.format(
          msec,
          'a-A f-F Z-E Gy年Modd日 Hm ssss秒'
        )}`
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
        100000000000000,
        10000000000000,
        1556636400000,
        1000000000000,
        100000000000,
        10000000000,
        0,
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
                `MM/dd ${key}`
              )}`
            )
          }
          return result
        })()
        return [..._.flattenDepth(list, 2).sort(), g.note(utc, o, z).join('')]
      })
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
      ].join('\n')
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
      ].join('\n')
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
      ].join('\n')
    ).toEqual(
      [
        '紀元前1年04月01日(土)0時0分0秒',
        '西暦1970年04月27日(月)0時0分0秒',
        '西暦1973年03月03日(土)0時0分0秒',
        '西暦2001年09月09日(日)0時0分0秒',
        '西暦2286年11月21日(日)0時0分0秒',
        '西暦5138年11月16日(水)0時0分0秒',
      ].join('\n')
    )
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
        })} ${g.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`
    )
    expect(dst).toMatchSnapshot()
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
          'a-Z-E\tGyy/MMM/dd HH:mm:ss'
        )}`
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
      ].join('\n')
    ).toEqual(
      [
        '西暦194年180月07日(木)05時 乙丑丑乙',
        '西暦172年35月23日(月)09時 癸卯卯癸',
        '西暦168年01月39日(木)00時 己亥亥己',
        '西暦167年255月01日(水)05時 戊戌戌戊',
        '西暦167年248月03日(金)09時 戊戌戌戊',
        '西暦165年80月20日(月)08時 丙申申丙',
        '西暦141年68月35日(木)05時 壬申申壬',
      ].join('\n')
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
          'a-ZZZ-E\tGyy/MMM/dd HH:mm:ss'
        )}`
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
        })} ${fg.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`
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
        })} ${rg.format(msec, 'Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J')}`
    )
    expect(dst).toMatchSnapshot()
  })
})

function __mod__(a, b) {
  a = +a
  b = +b
  return ((a % b) + b) % b
}
