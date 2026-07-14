const {
  MEAN_CERES,
  MEAN_EARTH,
  MEAN_JUPITER,
  MEAN_MARS,
  MEAN_MERCURY,
  MEAN_MOON,
  MEAN_NEPTUNE,
  MEAN_PLUTO,
  MEAN_URANUS,
  MEAN_VENUS,
  MEAN_CALLISTO,
  MEAN_CHARON,
  MEAN_DYSNOMIA,
  MEAN_GANYMEDE,
  MEAN_HIIAKA,
  MEAN_NAMAKA,
  MEAN_TITAN,
  MEAN_TITANIA,
  MEAN_TRITON,
} = require('../lib/astronomy-data')

const MSEC_PER_DAY = 86400000
const HOURS_PER_DAY = 24

function meanSolarDayMsec(siderealRotationHours, seasonalYear) {
  const siderealDay = siderealRotationHours / HOURS_PER_DAY
  return Math.round(Math.abs(1 / (1 / siderealDay - 1 / seasonalYear)) * MSEC_PER_DAY)
}

describe('mean astronomy observer periods', () => {
  test('planet solarDay values are derived from signed sidereal rotation and seasonal year', () => {
    const cases = [
      [MEAN_MERCURY, 1407.5094, 87.969349],
      [MEAN_VENUS, -5832.6, 224.700799],
      [MEAN_JUPITER, 9.9259, 4332.817127523],
      [MEAN_URANUS, -17.24, 30685.4],
      [MEAN_NEPTUNE, 16.11, 60189],
      [MEAN_PLUTO, -153.29352, 90487.277],
      [MEAN_CERES, 9.07417, 1683.146],
    ]
    for (const [entry, siderealRotationHours, seasonalYear] of cases) {
      expect(entry.solarDay[0]).toBe(meanSolarDayMsec(siderealRotationHours, seasonalYear))
      expect(Number.isInteger(entry.solarDay[0])).toBe(true)
    }
  })

  test('Mars solarDay follows the Mars24 model constant used by MarsSolarOrbital', () => {
    expect(MEAN_MARS.solarDay[0]).toBe(88775244)
  })

  test('Earth and Moon intentionally use civil/synodic observer periods', () => {
    expect(MEAN_EARTH.solarDay[0]).toBe(MSEC_PER_DAY)
    expect(MEAN_MOON.solarDay[0]).toBe(MEAN_MOON.orbital[0])
    expect(MEAN_MOON.solarDay[0]).toBe(MEAN_MOON.whiteOrbital[0])
  })

  test('satellite solarDay remains explicit rather than silently copied from orbital period', () => {
    for (const entry of [
      MEAN_CALLISTO,
      MEAN_CHARON,
      MEAN_DYSNOMIA,
      MEAN_GANYMEDE,
      MEAN_HIIAKA,
      MEAN_NAMAKA,
      MEAN_TITAN,
      MEAN_TITANIA,
      MEAN_TRITON,
    ]) {
      expect(entry.solarDay).toBeUndefined()
    }
  })
})
