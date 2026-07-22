const { PeriodicCalendarYearPolicy } = require('../lib/phenomena/calendar-policy')
const { Calendar } = require('../lib/sample')

const YEAR_CONTEXT = {
  normalLengthDays: 365,
  leapLengthDays: 366,
}

describe('PeriodicCalendarYearPolicy', () => {
  test('models Gregorian 400-year leap rules', () => {
    const policy = new PeriodicCalendarYearPolicy([4, 100], 400)
    expect([1900, 2000, 2024, 2100, 2400].map((year) => policy.isLeapYear(year))).toEqual([
      false,
      true,
      true,
      false,
      true,
    ])
    expect(policy.resolve(2100, YEAR_CONTEXT)).toMatchObject({
      year: 2100,
      lengthDays: 365,
      is_leap: false,
      kind: 'periodic',
    })
  })

  test('models Julian four-year leap rules', () => {
    const policy = new PeriodicCalendarYearPolicy([], 4)
    expect([1900, 1901, 1904, 1908].map((year) => policy.isLeapYear(year))).toEqual([
      true,
      false,
      true,
      true,
    ])
    expect(policy.resolve(1904, YEAR_CONTEXT)).toMatchObject({
      year: 1904,
      lengthDays: 366,
      is_leap: true,
      kind: 'periodic',
    })
  })

  test('preserves shifted leap cycles', () => {
    const policy = new PeriodicCalendarYearPolicy([], 4, 3)
    expect([0, 1, 2, 3, 4, 7].map((year) => policy.isLeapYear(year))).toEqual([
      false,
      false,
      false,
      true,
      false,
      true,
    ])
  })

  test('is wired into Gregorian and Julian year tables', () => {
    expect(Calendar.Gregorian.table.range.year.slice(0, 5)).toEqual([366, 365, 365, 365, 366])
    expect(Calendar.Gregorian.table.range.year[100]).toBe(365)
    expect(Calendar.Julian.table.range.year.slice(0, 4)).toEqual([366, 365, 365, 365])
  })
})
