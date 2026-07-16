require('../lib/sample')
const { Calendar } = require('../lib/sample')
const { to_msec } = require('../lib/time')
const { lunisolar_month_window_counts } = require('../lib/phenomena/lunisolar')
const { NAOJ_LUNISOLAR_FIXTURES, NAOJ_LUNISOLAR_SOURCE } = require('./fixtures/lunisolar-naoj')

describe('lunisolar month search window', () => {
  const dayMsec = to_msec('1d')
  const options = (monthMsec, solarPeriodMsec) => ({
    moony: { periodMsec: monthMsec },
    solarPeriodMsec,
  })

  test('keeps the historical 18/19 month window for earth-like lunar ratios', () => {
    expect(lunisolar_month_window_counts(options(29.53059 * dayMsec, 365.2422 * dayMsec))).toEqual({
      past: 18,
      future: 19,
    })
  })

  test('widens or narrows the search from the actual moon/year ratio', () => {
    expect(lunisolar_month_window_counts(options(7 * dayMsec, 365 * dayMsec))).toEqual({
      past: 58,
      future: 59,
    })
    expect(lunisolar_month_window_counts(options(100 * dayMsec, 365 * dayMsec))).toEqual({
      past: 9,
      future: 10,
    })
  })
})

describe('NAOJ lunisolar fixtures', () => {
  test('source metadata is explicit', () => {
    expect(NAOJ_LUNISOLAR_SOURCE.timezone).toBe('JST')
    expect(NAOJ_LUNISOLAR_SOURCE.accuracy).toBe('day')
    expect(Object.keys(NAOJ_LUNISOLAR_SOURCE.urls)).toEqual([
      '2023-solar-terms',
      '2023-lunar-phases',
      '2024-solar-terms',
      '2024-lunar-phases',
    ])
  })

  test('GregorianAstronomical lunisolar derives old calendar dates from new moons and principal terms', () => {
    const misses = NAOJ_LUNISOLAR_FIXTURES.map((fixture) => {
      const [year, month, day] = fixture.gregorian.split('-').map(Number)
      const utc = Calendar.GregorianAstronomical.parse(`${year}年${month}月${day}日`)
      const actual = Calendar.GregorianAstronomical.lunisolar(utc)
      return {
        fixture,
        actual: {
          year: actual.year,
          month: actual.month,
          day: actual.day,
          isLeap: actual.is_leap,
          principalLongitudeDeg: actual.principal_term?.longitudeDeg ?? null,
        },
      }
    }).filter(({ fixture, actual }) => {
      return (
        fixture.year !== actual.year ||
        fixture.month !== actual.month ||
        fixture.day !== actual.day ||
        fixture.isLeap !== actual.isLeap ||
        fixture.principalLongitudeDeg !== actual.principalLongitudeDeg
      )
    })
    expect(misses).toEqual([])
  })

  test('定気法 formats lunisolar dates at 天文東京', () => {
    const misses = NAOJ_LUNISOLAR_FIXTURES.map((fixture) => {
      const [year, month, day] = fixture.gregorian.split('-').map(Number)
      const utc = Calendar.GregorianAstronomical.parse(`${year}年${month}月${day}日`)
      const tempos = Calendar.定気法.to_tempos(utc)
      return {
        fixture,
        actual: {
          month: tempos.M.now_idx + 1,
          day: tempos.d.now_idx + 1,
          isLeap: tempos.M.is_leap,
        },
      }
    }).filter(({ fixture, actual }) => {
      return (
        fixture.month !== actual.month ||
        fixture.day !== actual.day ||
        fixture.isLeap !== actual.isLeap
      )
    })
    expect(misses).toEqual([])

    const utc = Calendar.GregorianAstronomical.parse('2024年3月10日')
    expect(Calendar.定気法.format(utc, 'Gy年Mod日')).toBe('令和六年如月一日')
  })

  test('定気法 relative time distance follows lunisolar boundaries', () => {
    const base = Calendar.GregorianAstronomical.parse('2024年3月10日')
    const at = (date) => Calendar.GregorianAstronomical.parse(date)

    expect(Calendar.定気法.span_obj(at('2024年3月9日'), base)).toMatchObject({
      d: -1,
      label: '1日前',
    })
    expect(Calendar.定気法.span_obj(at('2024年4月9日'), base)).toMatchObject({
      M: 1,
      label: '1ヶ月後',
    })
    expect(Calendar.定気法.span_obj(at('2025年3月10日'), base)).toMatchObject({
      y: 1,
      label: '1年後',
    })
    const nextYear = at('2025年2月28日')
    expect(
      Calendar.定気法.span_obj(nextYear + to_msec('3h'), base, {
        precise: 'H',
      }),
    ).toMatchObject({
      y: 1,
      H: 1,
      label: '1年1刻後',
    })
    const nextYearTempos = Calendar.定気法.to_tempos(nextYear)
    expect(
      Calendar.定気法.span_obj(nextYearTempos.m.next_at, base, {
        precise: 'm',
      }),
    ).toMatchObject({
      y: 1,
      m: 1,
      label: '1年半後',
    })
    expect(
      Calendar.定気法.span_obj(
        nextYear + to_msec('3h') + to_msec('45m') + to_msec('12s') + 345,
        base,
        { precise: 'S' },
      ),
    ).toMatchObject({
      y: 1,
      H: 1,
      m: 1,
      s: 1112,
      S: 154,
      label: '1年1刻半1112秒154ミリ秒後',
    })
  })

  test('定気法 adds relative time distance back to a timestamp', () => {
    const base = Calendar.GregorianAstronomical.parse('2024年3月10日')
    const target =
      Calendar.GregorianAstronomical.parse('2025年2月28日') +
      to_msec('3h') +
      to_msec('45m') +
      to_msec('12s') +
      345

    const forward = Calendar.定気法.span_obj(target, base, { precise: 'S' })
    expect(Calendar.定気法.add(base, forward)).toBe(target)

    const backward = Calendar.定気法.span_obj(base, target, { precise: 'S' })
    expect(Calendar.定気法.add(target, backward)).toBe(base)

    const nextDay = Calendar.GregorianAstronomical.parse('2024年3月11日')
    const daySpan = Calendar.定気法.span_obj(nextDay, base)
    expect(Calendar.定気法.add(base, daySpan)).toBe(nextDay)
  })

  test('定気法 parses relative time text for calendar-aware addition', () => {
    const base = Calendar.GregorianAstronomical.parse('2024年3月10日')
    const target =
      Calendar.GregorianAstronomical.parse('2025年2月28日') +
      to_msec('3h') +
      to_msec('45m') +
      to_msec('12s') +
      345

    expect(Calendar.定気法.span_obj('20刻後')).toMatchObject({
      H: 20,
      label: '20刻後',
    })
    const twentyHoursLater = Calendar.定気法.add(base, '20刻後')
    expect(Calendar.定気法.span(twentyHoursLater, base, { precise: 'H' })).toBe('1日8刻後')

    const thirtyHoursAgo = Calendar.定気法.add(base, '30刻前')
    expect(Calendar.定気法.span(thirtyHoursAgo, base, { precise: 'H' })).toBe('2日6刻前')
    expect(Calendar.定気法.add(base, '1年1刻半1112秒154ミリ秒後')).toBe(target)
  })

  test('定気法 span exposes next label update time', () => {
    const base = Calendar.GregorianAstronomical.parse('2024年3月10日')

    const seconds = Calendar.定気法.span_obj(base + to_msec('10s'), base)
    expect(seconds).toMatchObject({
      label: '10秒後',
      next_at: base + to_msec('1s'),
      timeout: to_msec('1s'),
    })

    const nextDay = Calendar.GregorianAstronomical.parse('2024年3月11日')
    const day = Calendar.定気法.span_obj(nextDay, base)
    const dayBoundary = Calendar.定気法.to_tempos(base).d.next_at
    expect(day).toMatchObject({
      label: '1日後',
      next_at: dayBoundary,
      timeout: dayBoundary - base,
    })

    const nextYear = Calendar.GregorianAstronomical.parse('2025年2月28日')
    const precise = Calendar.定気法.span_obj(Calendar.定気法.to_tempos(nextYear).m.next_at, base, {
      precise: 'm',
    })
    const minuteBoundary = Calendar.定気法.to_tempos(base).m.next_at
    expect(precise).toMatchObject({
      label: '1年半後',
      next_at: minuteBoundary,
      timeout: minuteBoundary - base,
    })
  })

  test('定気法 span can use calendar tokens as precision', () => {
    const base = Calendar.GregorianAstronomical.parse('2024年3月10日')
    const nextDay = Calendar.GregorianAstronomical.parse('2024年3月11日')
    const nextYear = Calendar.GregorianAstronomical.parse('2025年2月28日')

    for (const token of ['dC60', 'dC12', 'dC10', 'dC9', 'R6', 'LM27']) {
      const span = Calendar.定気法.span_obj(nextDay, base, { precise: token })
      expect(span).toMatchObject({ precision: token, value: 1 })
      expect(span.label).toMatch(/(?:前|後)$/)
    }

    for (const token of ['yC60', 'yC12', 'yC10', 'yC9']) {
      const span = Calendar.定気法.span_obj(nextYear, base, { precise: token })
      expect(span).toMatchObject({ precision: token, value: 1 })
      expect(span.label).toMatch(/(?:前|後)$/)
    }

    expect(Calendar.定気法.span_obj(nextYear, base, { precise: 'yC60' })).toMatchObject({
      precision: 'yC60',
      value: 1,
      label: '1年干支後',
    })
    expect(Calendar.定気法.span_obj(nextDay, base, { precise: 'dC60' })).toMatchObject({
      precision: 'dC60',
      value: 1,
      label: '1日干支後',
    })
  })
})
