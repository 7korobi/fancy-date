const { Calendar } = require('../lib/sample')
const {
  ThaiModernLunisolarYearPolicy,
  thai_lunisolar_year_length,
  thai_lunisolar_year_type,
} = require('../lib/phenomena/thai-lunisolar')
const { ThaiBuddhistFeastPolicy } = require('../lib/index')
const {
  THAI_OFFICIAL_DATE_FIXTURES,
  THAI_OFFICIAL_SOURCE,
  THAI_OFFICIAL_YEAR_FIXTURES,
} = require('./fixtures/thai-lunisolar-official')

const DAY = 86400000
const official = Calendar.タイ太陰太陽暦公式

function at(iso) {
  return Date.parse(iso)
}

function monthsOf(year) {
  const date = official.thaiLunisolar(at(`${year}-01-01T00:00:00Z`))
  const months = []
  let cursor = date.year_start_at
  while (cursor < date.next_year_start_at) {
    const month = official.thaiLunisolar(cursor)
    months.push({
      month: month.month,
      isLeap: month.is_leap,
      days: (month.next_at - month.last_at) / DAY,
    })
    cursor = month.next_at
  }
  return months
}

describe('official Thai lunisolar rules', () => {
  test('resolves the Thai year layout through the shared year policy contract', () => {
    const policy = new ThaiModernLunisolarYearPolicy()
    expect(
      policy.resolve(2024, {}).months.map(({ month, days, is_leap }) => [month, days, is_leap]),
    ).toEqual([
      [1, 29, false],
      [2, 30, false],
      [3, 29, false],
      [4, 30, false],
      [5, 29, false],
      [6, 30, false],
      [7, 29, false],
      [8, 30, false],
      [9, 29, false],
      [10, 30, false],
      [11, 29, false],
      [12, 30, false],
    ])
    expect(policy.resolve(2025, {}).lengthDays).toBe(355)
    expect(policy.resolve(2026, {}).months.filter(({ month }) => month === 8)).toEqual([
      { index: 7, month: 8, days: 30, is_leap: false },
      { index: 8, month: 8, days: 30, is_leap: true },
    ])
  })

  test('keeps source metadata and representative year fixtures', () => {
    expect(THAI_OFFICIAL_SOURCE.url).toMatch(/PyThaiNLP/)
    expect(THAI_OFFICIAL_SOURCE.portUrl).toMatch(/touchiep/)
    expect(THAI_OFFICIAL_YEAR_FIXTURES.map(({ year }) => year)).toEqual([2024, 2025, 2026])
    expect(
      THAI_OFFICIAL_YEAR_FIXTURES.map(({ year, type, length }) => [
        thai_lunisolar_year_type(year),
        thai_lunisolar_year_length(year),
        type,
        length,
      ]),
    ).toEqual([
      ['normal', 354, 'normal', 354],
      ['intercalary-day', 355, 'intercalary-day', 355],
      ['intercalary-month', 384, 'intercalary-month', 384],
    ])
  })

  test('continues the arithmetic rule beyond the validated reference range', () => {
    for (const year of [2461, 2462, 2500, 3000]) {
      const date = official.thaiLunisolar(Date.UTC(year, 0, 1, 12))
      const length = thai_lunisolar_year_length(year)
      expect([354, 355, 384]).toContain(length)
      expect(date.year).toBe(year + 543)
      expect(date.next_year_start_at - date.year_start_at).toBe(length * DAY)
    }
    expect(thai_lunisolar_year_type(2462)).toBe('normal')
    expect(thai_lunisolar_year_type(2500)).toBe('intercalary-day')
  })

  test('keeps the historical lower bound explicit', () => {
    expect(() => thai_lunisolar_year_type(1902)).toThrow(/1903 and later/)
  })

  test('projects Buddhist lunar feasts into local civil dates', () => {
    const policy = new ThaiBuddhistFeastPolicy({
      lunar: {
        geo: official.dic.geo,
        dayMsec: official.calc.msec.day,
        dayZero: official.calc.zero.day,
      },
    })
    const feasts = policy.resolve({ year: 2567 })

    expect(
      feasts.map(({ id, date, lunar_month, lunar_day }) => [id, date, lunar_month, lunar_day]),
    ).toEqual([
      ['makha-bucha', { year: 2024, month: 2, day: 24 }, 3, 15],
      ['visakha-bucha', { year: 2024, month: 5, day: 22 }, 6, 15],
      ['asalha-bucha', { year: 2024, month: 7, day: 20 }, 8, 15],
      ['khao-phansa', { year: 2024, month: 7, day: 21 }, 8, 16],
      ['ok-phansa', { year: 2024, month: 10, day: 17 }, 11, 15],
    ])
    for (const feast of feasts) {
      const date = official.thaiLunisolar(feast.utc + 12 * 60 * 60 * 1000)
      expect([date.year, date.month, date.day, date.is_leap]).toEqual([
        feast.thai_year,
        feast.lunar_month,
        feast.lunar_day,
        feast.is_leap_month,
      ])
    }
  })

  test('moves Asalha and Khao Phansa to the repeated 8th month', () => {
    const policy = new ThaiBuddhistFeastPolicy({
      lunar: {
        geo: official.dic.geo,
        dayMsec: official.calc.msec.day,
        dayZero: official.calc.zero.day,
      },
    })
    expect(
      policy
        .resolve({ year: 2569 })
        .map(({ id, date, is_leap_month, lunar_day }) => [id, date, is_leap_month, lunar_day]),
    ).toEqual([
      ['makha-bucha', { year: 2026, month: 2, day: 2 }, false, 15],
      ['visakha-bucha', { year: 2026, month: 5, day: 1 }, false, 15],
      ['asalha-bucha', { year: 2026, month: 7, day: 29 }, true, 15],
      ['khao-phansa', { year: 2026, month: 7, day: 30 }, true, 16],
      ['ok-phansa', { year: 2026, month: 10, day: 26 }, false, 15],
    ])
  })

  test('classifies normal, intercalary-day, and intercalary-month years', () => {
    expect(thai_lunisolar_year_type(2024)).toBe('normal')
    expect(thai_lunisolar_year_type(2025)).toBe('intercalary-day')
    expect(thai_lunisolar_year_type(2026)).toBe('intercalary-month')
    expect(thai_lunisolar_year_length(2024)).toBe(354)
    expect(thai_lunisolar_year_length(2025)).toBe(355)
    expect(thai_lunisolar_year_length(2026)).toBe(384)
  })

  test('adds the official day to month 7 only in an intercalary-day year', () => {
    expect(monthsOf(2025)).toEqual([
      { month: 1, isLeap: false, days: 29 },
      { month: 2, isLeap: false, days: 30 },
      { month: 3, isLeap: false, days: 29 },
      { month: 4, isLeap: false, days: 30 },
      { month: 5, isLeap: false, days: 29 },
      { month: 6, isLeap: false, days: 30 },
      { month: 7, isLeap: false, days: 30 },
      { month: 8, isLeap: false, days: 30 },
      { month: 9, isLeap: false, days: 29 },
      { month: 10, isLeap: false, days: 30 },
      { month: 11, isLeap: false, days: 29 },
      { month: 12, isLeap: false, days: 30 },
    ])
  })

  test('repeats month 8 in an intercalary-month year', () => {
    const months = monthsOf(2026)
    expect(months).toHaveLength(13)
    expect(months.filter(({ month }) => month === 8)).toEqual([
      { month: 8, isLeap: false, days: 30 },
      { month: 8, isLeap: true, days: 30 },
    ])
    expect(months.reduce((total, { days }) => total + days, 0)).toBe(384)
  })

  test('matches published Thai dates at the 2026 month 8/8 boundary', () => {
    const fixture = THAI_OFFICIAL_DATE_FIXTURES[1]
    const firstDay = at(fixture.iso)
    const date = official.thaiLunisolar(firstDay)
    expect(official.format(firstDay, 'y-M-d')).toBe('2569-閏8-1')
    expect([date.year, date.month, date.day, date.is_leap]).toEqual([
      fixture.year,
      fixture.month,
      fixture.day,
      fixture.isLeap,
    ])
    expect(official.to_tempos(firstDay).M.is_leap).toBe(true)
    expect(official.to_tempos(firstDay).d.now_idx).toBe(0)
  })

  test('keeps the official 1970 anchor used by the reference implementation', () => {
    const fixture = THAI_OFFICIAL_DATE_FIXTURES[0]
    const date = official.thaiLunisolar(at(fixture.iso))
    expect([date.year, date.month, date.day, date.is_leap]).toEqual([
      fixture.year,
      fixture.month,
      fixture.day,
      fixture.isLeap,
    ])
    expect(official.format(date.day_start_at, 'y-M-d')).toBe('2513-1-24')
  })
})
