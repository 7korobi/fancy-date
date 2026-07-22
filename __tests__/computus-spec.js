const api = require('../lib/index')

const { Calendar, ChurchFeastPolicy, churchFeastDates, churchFeastNotes, computus } = api

describe('church computus', () => {
  test.each([
    [2024, { month: 3, day: 31 }, { month: 3, day: 25 }],
    [2025, { month: 4, day: 20 }, { month: 4, day: 13 }],
    [2026, { month: 4, day: 5 }, { month: 4, day: 2 }],
  ])('calculates Gregorian computus for %s', (year, easter, paschalFullMoon) => {
    expect(computus(year, 'gregorian')).toEqual({
      system: 'gregorian',
      year,
      easter_sunday: { year, ...easter },
      paschal_full_moon: { year, ...paschalFullMoon },
    })
  })

  test.each([
    [2024, { month: 4, day: 22 }, { month: 4, day: 15 }],
    [2025, { month: 4, day: 7 }, { month: 4, day: 4 }],
    [2026, { month: 3, day: 30 }, { month: 3, day: 24 }],
  ])('calculates Julian Paschalion for %s', (year, easter, paschalFullMoon) => {
    expect(computus(year, 'julian')).toEqual({
      system: 'julian',
      year,
      easter_sunday: { year, ...easter },
      paschal_full_moon: { year, ...paschalFullMoon },
    })
  })

  test('returns movable feasts as offsets from Easter and keeps dates sorted', () => {
    expect(api.church_feasts).toBeUndefined()
    const feasts = new ChurchFeastPolicy('gregorian').resolve({ year: 2024 })
    expect(feasts).toHaveLength(12)
    expect(feasts.map(({ id }) => id)).toEqual([
      'epiphany',
      'ash-wednesday',
      'palm-sunday',
      'annunciation',
      'maundy-thursday',
      'good-friday',
      'holy-saturday',
      'easter-sunday',
      'ascension',
      'pentecost',
      'all-saints',
      'christmas',
    ])
    expect(feasts.find(({ id }) => id === 'good-friday').offset_from_easter).toBe(-2)
    expect(feasts.find(({ id }) => id === 'ascension').offset_from_easter).toBe(39)
  })

  test('converts Gregorian computus dates into Gregorian calendar dates and notes', () => {
    const easter = churchFeastDates(Calendar.Gregorian, 2024).find(
      ({ id }) => id === 'easter-sunday',
    )
    expect(Calendar.Gregorian.format(easter.utc, 'y年M月d日')).toBe('2024年3月31日')
    expect(churchFeastNotes(Calendar.Gregorian, easter.utc)).toEqual(['復活祭'])
  })

  test('keeps Julian computus dates distinct from Gregorian civil display', () => {
    const easter = churchFeastDates(Calendar.Julian, 2024, { system: 'julian' }).find(
      ({ id }) => id === 'easter-sunday',
    )
    expect(Calendar.Julian.format(easter.utc, 'y年M月d日')).toBe('2024年4月22日')
    expect(Calendar.Gregorian.format(easter.utc, 'y年M月d日')).toBe('2024年5月5日')
    expect(churchFeastNotes(Calendar.Julian, easter.utc, { system: 'julian' })).toEqual(['復活祭'])
  })

  test('converts Julian computus dates to Gregorian civil dates when requested', () => {
    const easter = churchFeastDates(Calendar.Gregorian, 2024, {
      system: 'julian',
      calendarSystem: 'gregorian',
    }).find(({ id }) => id === 'easter-sunday')
    expect(easter.computus_date).toEqual({ year: 2024, month: 4, day: 22 })
    expect(easter.date).toEqual({ year: 2024, month: 5, day: 5 })
    expect(Calendar.Gregorian.format(easter.utc, 'y年M月d日')).toBe('2024年5月5日')
    expect(
      churchFeastNotes(Calendar.Gregorian, easter.utc, {
        system: 'julian',
        calendarSystem: 'gregorian',
      }),
    ).toEqual(['復活祭'])
  })

  test('allows tradition-specific labels without changing computus dates', () => {
    const easter = churchFeastDates(Calendar.Gregorian, 2024, {
      labels: { 'easter-sunday': '主の復活' },
    }).find(({ id }) => id === 'easter-sunday')
    expect(easter.label).toBe('主の復活')
    expect(easter.date).toEqual({ year: 2024, month: 3, day: 31 })
  })
})
