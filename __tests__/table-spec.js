require('../lib/sample')
const { FancyDate } = require('../lib/fancy-date')
const { Calendar } = require('../lib/sample')
const { to_msec, to_tempo_bare } = require('../lib/time')

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

describe('テーブル', () => {
  test('日間', () => {
    var msec
    msec = g.parse('2020年3月22日')
    expect(
      calendars.map(([c, str]) => {
        return c.time_table(msec).join('/')
      }),
    ).toMatchSnapshot()
  })
  test('週間', () => {
    var msec
    msec = g.parse('2020年3月22日')
    expect(
      calendars.map(([c, str]) => {
        return c.weekly_table(msec).join('/')
      }),
    ).toMatchSnapshot()
  })
  test('月間', () => {
    var msec
    msec = g.parse('2020年3月22日')
    expect(
      calendars.map(([c, str]) => {
        return c.monthry_table(msec).join('/')
      }),
    ).toMatchSnapshot()
  })
  test('年間', () => {
    var msec
    msec = g.parse('2020年3月22日')
    expect(
      calendars.map(([c, str]) => {
        return c.yeary_table(msec).join('/')
      }),
    ).toMatchSnapshot()
  })
})
