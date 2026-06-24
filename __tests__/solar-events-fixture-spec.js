require('../lib/sample')
const { expectMetricsNotWorse, summarizeDifferences } = require('./helpers/naoj-metrics')
const {
  SOLAR_EVENT_DIFF_BASELINE,
  SOLAR_EVENT_DIFF_FIELDS,
  solarEventDifferences,
} = require('./helpers/naoj-differences')
const { NAOJ_SOLAR_EVENT_SOURCE } = require('./fixtures/solar-events-naoj')

describe('NAOJ solar event fixtures', () => {
  test('source metadata documents Nagoya location', () => {
    expect(NAOJ_SOLAR_EVENT_SOURCE.timezone).toBe('JST')
    expect(NAOJ_SOLAR_EVENT_SOURCE.latitudeDeg).toBe(35.1667)
    expect(NAOJ_SOLAR_EVENT_SOURCE.longitudeDeg).toBe(136.9167)
    expect(Object.keys(NAOJ_SOLAR_EVENT_SOURCE.urls)).toEqual(['2024-03', '2024-06', '2024-12'])
  })

  test('GregorianAstronomical solor matches published JST minute fixtures', () => {
    const toleranceMinutes = 1
    const toleranceDegrees = 0.15
    const misses = solarEventDifferences().filter((miss) => {
      return (
        toleranceMinutes < miss.sunriseMinutes ||
        toleranceMinutes < miss.transitMinutes ||
        toleranceMinutes < miss.sunsetMinutes ||
        toleranceDegrees < miss.sunriseAzimuthDeg ||
        toleranceDegrees < miss.transitAltitudeDeg ||
        toleranceDegrees < miss.sunsetAzimuthDeg
      )
    })
    expect(misses).toEqual([])
  })

  test('difference metrics do not exceed recorded baseline', () => {
    const metrics = summarizeDifferences(solarEventDifferences(), SOLAR_EVENT_DIFF_FIELDS)
    expectMetricsNotWorse(metrics, SOLAR_EVENT_DIFF_BASELINE)
  })
})
