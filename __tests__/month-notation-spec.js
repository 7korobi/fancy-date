const { FancyDate } = require('../lib/fancy-date')
const { Calendar } = require('../lib/sample')

const DAY_MSEC = 86400000

function findLeapMonth(calendar) {
  let at = Calendar.Gregorian.parse('2020年1月1日')
  for (let day = 0; day < 400; day++, at += DAY_MSEC) {
    const month = calendar.to_tempos(at).M
    if (month.is_leap) return month
  }
  throw new Error('leap month not found')
}

function findPreviousRegularMonth(calendar, leapMonth) {
  let at = leapMonth.last_at - 400 * DAY_MSEC
  for (let count = 0; count < 24; count++) {
    const month = calendar.to_tempos(at).M
    if (
      month.now_idx === leapMonth.now_idx &&
      !month.is_leap &&
      month.last_at < leapMonth.last_at
    ) {
      return month
    }
    at = month.next_at
  }
  throw new Error('regular month with matching number not found')
}

function parseMonthAlias(calendar, at, token, alias) {
  const format = `Gy年${token}月d日`
  const text = `${calendar.format(at, 'Gy年')}${alias}月${calendar.format(at, 'd日')}`
  const parsedAt = calendar.parse(text, format)
  return { format, parsedAt, text }
}

describe('month notation customization', () => {
  test('formats Mo and Mr independently and canonicalizes explicit aliases', () => {
    const base = Calendar.平気法
    const leapMonth = findLeapMonth(base)
    const regularMonth = findPreviousRegularMonth(base, leapMonth)
    const monthNumber = leapMonth.now_idx + 1
    const monthName = base.format(regularMonth.last_at, 'Mo')
    const rubyName = base.format(regularMonth.last_at, 'Mr')

    const aliases = {
      moRegular: `通常:${monthName}`,
      moLeap: `閏${monthName}`,
      moRegexText: `(${monthName}.*)`,
      mrRegular: `通常:${rubyName}`,
      mrLeap: `うるう${rubyName}`,
      mrRegexText: `${rubyName}(閏)`,
    }
    const calendar = new FancyDate(base)
      .monthNotation({
        Mo: (label, { month, is_leap }) =>
          is_leap ? `閏${month}-${label}` : `通常${month}-${label}`,
        Mr: (label, { month, is_leap }) =>
          is_leap ? `${label}・うるう${month}` : `${label}・通常${month}`,
        aliases: [
          {
            token: 'Mo',
            text: aliases.moRegular,
            month: monthNumber,
            is_leap: false,
          },
          {
            token: 'Mo',
            text: aliases.moLeap,
            month: monthNumber,
            is_leap: true,
          },
          {
            token: 'Mo',
            text: aliases.moRegexText,
            month: monthNumber,
            is_leap: true,
          },
          {
            token: 'Mr',
            text: aliases.mrRegular,
            month: monthNumber,
            is_leap: false,
          },
          {
            token: 'Mr',
            text: aliases.mrLeap,
            month: monthNumber,
            is_leap: true,
          },
          {
            token: 'Mr',
            text: aliases.mrRegexText,
            month: monthNumber,
            is_leap: true,
          },
        ],
      })
      .init()

    expect(calendar.format(regularMonth.last_at, 'Mo')).toBe(`通常${monthNumber}-${monthName}`)
    expect(calendar.format(leapMonth.last_at, 'Mo')).toBe(`閏${monthNumber}-${monthName}`)
    expect(calendar.format(regularMonth.last_at, 'Mr')).toBe(`${rubyName}・通常${monthNumber}`)
    expect(calendar.format(leapMonth.last_at, 'Mr')).toBe(`${rubyName}・うるう${monthNumber}`)

    for (const month of [regularMonth, leapMonth]) {
      for (const token of ['Mo', 'Mr']) {
        const canonical = calendar.format(month.last_at, token)
        const { format, parsedAt } = parseMonthAlias(calendar, month.last_at, token, canonical)
        const parsedMonth = calendar.to_tempos(parsedAt).M

        expect(parsedMonth.now_idx).toBe(monthNumber - 1)
        expect(parsedMonth.is_leap).toBe(!!month.is_leap)
        expect(calendar.format(parsedAt, format)).toBe(calendar.format(month.last_at, format))
      }
    }

    const cases = [
      [regularMonth, 'Mo', aliases.moRegular, false],
      [leapMonth, 'Mo', aliases.moLeap, true],
      [leapMonth, 'Mo', aliases.moRegexText, true],
      [regularMonth, 'Mr', aliases.mrRegular, false],
      [leapMonth, 'Mr', aliases.mrLeap, true],
      [leapMonth, 'Mr', aliases.mrRegexText, true],
    ]
    for (const [month, token, alias, isLeap] of cases) {
      const { format, parsedAt } = parseMonthAlias(calendar, month.last_at, token, alias)
      const parsedMonth = calendar.to_tempos(parsedAt).M

      expect(parsedMonth.now_idx).toBe(monthNumber - 1)
      expect(parsedMonth.is_leap).toBe(isLeap)
      expect(calendar.format(parsedAt, format)).toBe(calendar.format(month.last_at, format))
    }

    expect(calendar.format(leapMonth.last_at, 'M')).toBe(base.format(leapMonth.last_at, 'M'))
    expect(calendar.format(leapMonth.last_at, 'MM')).toBe(base.format(leapMonth.last_at, 'MM'))
  })

  test('throws on ambiguous canonical labels, aliases, and invalid month numbers', () => {
    const base = Calendar.平気法
    const leapMonth = findLeapMonth(base)
    const regularMonth = findPreviousRegularMonth(base, leapMonth)
    const monthName = base.format(regularMonth.last_at, 'Mo')
    const monthNumber = leapMonth.now_idx + 1

    expect(() =>
      new FancyDate(base).monthNotation({
        Mo: (label) => label,
      }),
    ).toThrow(/ambiguous Mo month label/)

    expect(() =>
      new FancyDate(base).monthNotation({
        aliases: [
          {
            token: 'Mo',
            text: monthName,
            month: monthNumber,
            is_leap: true,
          },
        ],
      }),
    ).toThrow(/ambiguous Mo month label/)

    expect(() =>
      new FancyDate(Calendar.Gregorian)
        .monthNotation({
          aliases: [{ token: 'Mo', text: 'extra-month', month: 13, is_leap: false }],
        })
        .init(),
    ).toThrow(/names month 13/)

    expect(() =>
      new FancyDate(Calendar.Gregorian).monthNotation({
        Mr: (_label, { month }) => `m${month}`,
        aliases: [{ token: 'Mr', text: '2', month: 1, is_leap: false }],
      }),
    ).toThrow(/conflicts with numeric month parsing/)

    expect(() =>
      new FancyDate(Calendar.Gregorian)
        .monthNotation({
          aliases: [{ token: 'Mo', text: 'leap-month', month: 2, is_leap: true }],
        })
        .init(),
    ).toThrow(/calendar has no leap months/)
  })

  test('uses escaped, longest-first labels at the format-token boundary', () => {
    const labels = Array.from({ length: 12 }, (_, index) => `m${index + 1}`)
    labels[0] = 'A'
    labels[1] = 'A1'
    const calendar = new FancyDate(Calendar.Gregorian)
      .notation({ M: [labels, null] })
      .monthNotation({ Mo: (label) => label })
      .init()
    const at = Calendar.Gregorian.parse('2024年2月15日')
    const format = 'y年MoMM月d日'
    const text = calendar.format(at, format)
    const parsedAt = calendar.parse(text, format)

    expect(text).toContain('A102月')
    expect(calendar.to_tempos(parsedAt).M.now_idx).toBe(1)
    expect(calendar.format(parsedAt, format)).toBe(text)
  })

  test('preserves legacy leap parsing only when month notation is unconfigured', () => {
    const input = '2024年閏01月1日'
    const format = 'y年Mo月d日'
    const legacyCalendar = new FancyDate(Calendar.Gregorian).init()
    expect(() => legacyCalendar.parse(input, format)).not.toThrow()

    const aliasCalendar = new FancyDate(Calendar.Gregorian)
      .monthNotation({
        aliases: [{ token: 'Mo', text: 'first', month: 1, is_leap: false }],
      })
      .init()
    expect(() => aliasCalendar.parse(input, format)).toThrow(/invalid match/)
    const parsedAlias = aliasCalendar.parse('2024年first月1日', format)
    expect(aliasCalendar.to_tempos(parsedAlias).M.now_idx).toBe(0)

    const formatterCalendar = new FancyDate(Calendar.Gregorian)
      .monthNotation({ Mo: (label) => label })
      .init()
    expect(() => formatterCalendar.parse(input, format)).toThrow(/invalid match/)
  })
})
