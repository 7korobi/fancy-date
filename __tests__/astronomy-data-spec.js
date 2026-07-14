const {
  MEAN_CERES,
  MEAN_EARTH,
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

function meanSolarDayMsec(siderealDay, seasonalYear) {
  return Math.round(Math.abs(1 / (1 / siderealDay - 1 / seasonalYear)) * MSEC_PER_DAY)
}

describe('mean astronomy observer periods', () => {
  test('planet solarDay values are derived from signed sidereal rotation and seasonal year', () => {
    const cases = [
      [MEAN_MERCURY, 58.646225, 87.969349],
      [MEAN_VENUS, -243.025, 224.700799],
      [MEAN_URANUS, -17.24 / 24, 30685.4],
      [MEAN_NEPTUNE, 16.11 / 24, 60189],
      [MEAN_PLUTO, -6.38723, 90487.277],
      [MEAN_CERES, 9.07417 / 24, 1683.146],
    ]
    for (const [entry, siderealDay, seasonalYear] of cases) {
      expect(entry.solarDay[0]).toBe(meanSolarDayMsec(siderealDay, seasonalYear))
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
