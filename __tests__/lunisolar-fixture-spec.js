require('../lib/sample')
const { Calendar } = require('../lib/sample')
const {
  NAOJ_LUNISOLAR_FIXTURES,
  NAOJ_LUNISOLAR_SOURCE,
} = require('./fixtures/lunisolar-naoj')

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
})
