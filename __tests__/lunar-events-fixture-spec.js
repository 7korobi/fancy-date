require('../lib/sample')
const { expectMetricsNotWorse, summarizeDifferences } = require('./helpers/naoj-metrics')
const {
  LUNAR_EVENT_DIFF_BASELINE,
  LUNAR_EVENT_DIFF_FIELDS,
  lunarEventDifferences,
} = require('./helpers/naoj-differences')
const { NAOJ_LUNAR_EVENT_SOURCE } = require('./fixtures/lunar-events-naoj')

describe('NAOJ lunar event fixtures', () => {
  test('source metadata documents Nagoya location', () => {
    expect(NAOJ_LUNAR_EVENT_SOURCE.timezone).toBe('JST')
    expect(NAOJ_LUNAR_EVENT_SOURCE.latitudeDeg).toBe(35.1667)
    expect(NAOJ_LUNAR_EVENT_SOURCE.longitudeDeg).toBe(136.9167)
    expect(Object.keys(NAOJ_LUNAR_EVENT_SOURCE.urls)).toEqual(['2024-01', '2024-03', '2024-06'])
  })

  test('GregorianAstronomical lunar matches published JST minute fixtures', () => {
    const toleranceMinutes = 2
    const toleranceDegrees = 0.25
    const misses = lunarEventDifferences().filter((miss) => {
      return (
        toleranceMinutes < miss.moonriseMinutes ||
        toleranceMinutes < miss.transitMinutes ||
        toleranceMinutes < miss.moonsetMinutes ||
        toleranceDegrees < miss.moonriseAzimuthDeg ||
        toleranceDegrees < miss.transitAltitudeDeg ||
        toleranceDegrees < miss.moonsetAzimuthDeg
      )
    })
    expect(misses).toEqual([])
  })

  test('difference metrics do not exceed recorded baseline', () => {
    const metrics = summarizeDifferences(lunarEventDifferences(), LUNAR_EVENT_DIFF_FIELDS)
    expectMetricsNotWorse(metrics, LUNAR_EVENT_DIFF_BASELINE)
  })
})
