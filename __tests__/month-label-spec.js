const { FancyDate } = require('../lib/fancy-date')
const {
  Calendar,
  タイ太陰月名,
  タイ太陰月名RTGS,
  和風月名,
  和風月名かな,
} = require('../lib/sample')
const { jpn } = require('../lib/number')

function expectMonthRoundTrip(calendar, at, format) {
  const month = calendar.to_tempos(at).M
  const text = calendar.format(month.last_at, format)
  const parsed = calendar.to_tempos(calendar.parse(text, format)).M

  expect(parsed.now_idx).toBe(month.now_idx)
  expect(parsed.is_leap).toBe(month.is_leap)
  expect(calendar.format(calendar.parse(text, format), format)).toBe(text)
}

describe('month label parsing', () => {
  test('M keeps numeric parsing and Mo/Mr use configured Thai month labels', () => {
    const numericCalendar = new FancyDate(Calendar.Gregorian).init()
    const at = Calendar.Gregorian.parse('2024年6月21日')
    expectMonthRoundTrip(numericCalendar, at, 'y/M/d')

    const calendar = Calendar.タイ太陰太陽暦
    const month = calendar.to_tempos(at).M
    const monthLabel = `${month.is_leap ? '閏' : ''}${タイ太陰月名[month.now_idx]}`
    const monthRuby = `${month.is_leap ? 'うるう' : ''}${タイ太陰月名RTGS[month.now_idx]}`

    expect(calendar.format(at, 'Mo')).toBe(monthLabel)
    expect(calendar.format(at, 'Mr')).toBe(monthRuby)
    expectMonthRoundTrip(calendar, at, 'y年Mo月d日')
    expectMonthRoundTrip(calendar, at, 'y年Mr月d日')
  })

  test('global and token ruby numeral setters rebuild each initialized parser', () => {
    const calendar = new FancyDate(Calendar.Gregorian).init().numeral_ruby(jpn.rubys)
    const tokenNumeral = {
      parse: (value) => `month-${value}`,
      regex: 'month-\\d+',
      to_number: (text) => Number(text.slice('month-'.length)),
    }
    const tokenCalendar = new FancyDate(Calendar.Gregorian)
      .init()
      .token_numeral_ruby('M', tokenNumeral)
    const at = Calendar.Gregorian.parse('2024年3月15日')
    const format = 'y/Mr/d'
    const text = calendar.format(at, format)
    const tokenText = tokenCalendar.format(at, format)

    expect(text).toBe('2024/さん/15')
    expect(tokenText).toBe('2024/month-3/15')
    expect(calendar.parse(text, format)).toBe(at)
    expect(tokenCalendar.parse(tokenText, format)).toBe(at)
    expect(calendar.format(calendar.parse(text, format), format)).toBe(text)
    expect(tokenCalendar.format(tokenCalendar.parse(tokenText, format), format)).toBe(tokenText)
  })

  test('Mo keeps numeric fallback when a month label list contains null', () => {
    const calendar = Calendar.Romulus
    let at = Calendar.Gregorian.parse('2024年1月1日')
    for (let day = 0; day < 400 && calendar.to_tempos(at).M.now_idx >= 10; day++) {
      at += 86400000
    }
    const month = calendar.to_tempos(at).M
    const expected = `${month.is_leap ? '閏' : ''}${String(month.now_idx + 1).padStart(2, '0')}`

    expect(month.now_idx).toBeLessThan(10)
    expect(calendar.format(at, 'Mo')).toBe(expected)
    expectMonthRoundTrip(calendar, at, 'y年Mo月d日')
  })

  test('Mr round-trips a Japanese leap-month name and MM keeps numeric width', () => {
    const calendar = Calendar.平気法
    let at = Calendar.Gregorian.parse('2020年1月1日')
    for (let day = 0; day < 400 && !calendar.to_tempos(at).M.is_leap; day++) {
      at += 86400000
    }
    const month = calendar.to_tempos(at).M
    const monthStart = month.last_at

    expect(month.is_leap).toBe(true)
    expect(calendar.format(monthStart, 'Mo')).toBe(`閏${和風月名[month.now_idx]}`)
    expect(calendar.format(monthStart, 'Mr')).toBe(`うるう${和風月名かな[month.now_idx]}`)
    expectMonthRoundTrip(calendar, monthStart, 'Gy年Mr月d日')

    const numericCalendar = new FancyDate(calendar).init().token_numeral_text('M', {
      parse: (value, size = 0) => `${value}`.padStart(size, '0'),
      regex: '\\d+',
      to_number: Number,
    })
    const numericLabel = numericCalendar.format(monthStart, 'MM')
    expect(numericLabel).toBe(`閏${String(month.now_idx + 1).padStart(2, '0')}`)

    const format = 'Gy年MM月d日'
    const text = numericCalendar.format(monthStart, format)
    const parsedAt = numericCalendar.parse(text, format)
    const parsed = numericCalendar.to_tempos(parsedAt).M
    expect(parsed.now_idx).toBe(month.now_idx)
    expect(parsed.is_leap).toBe(true)
    expect(numericCalendar.format(parsedAt, format)).toBe(text)
  })
})
