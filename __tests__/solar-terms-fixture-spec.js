require('../lib/sample')
const { Calendar } = require('../lib/sample')
const {
  NAOJ_SOLAR_TERM_FIXTURES,
  NAOJ_SOLAR_TERM_SOURCE,
  SOLAR_LONGITUDE_DEG,
} = require('./fixtures/solar-terms-naoj')

const SOLAR_TERM_NAMES_24 = [
  '春分',
  '清明',
  '穀雨',
  '立夏',
  '小満',
  '芒種',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '処暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '啓蟄',
]

function fixtureKey({ year, name }) {
  return `${year}:${name}`
}

function toPhase({ longitudeDeg }) {
  return longitudeDeg / 360
}

function minuteDiff(a, b) {
  return Math.abs(a - b) / 60000
}

describe('NAOJ solar term fixtures', () => {
  test('source metadata is explicit', () => {
    expect(NAOJ_SOLAR_TERM_SOURCE.timezone).toBe('JST')
    expect(NAOJ_SOLAR_TERM_SOURCE.accuracy).toBe('minute')
    expect(Object.keys(NAOJ_SOLAR_TERM_SOURCE.urls)).toEqual([
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ])
  })

  test('events have unique keys, longitudes and parseable JST timestamps', () => {
    const keys = NAOJ_SOLAR_TERM_FIXTURES.map(fixtureKey)
    expect(new Set(keys).size).toBe(keys.length)
    for (const event of NAOJ_SOLAR_TERM_FIXTURES) {
      expect(event.longitudeDeg).toBe(SOLAR_LONGITUDE_DEG[event.name])
      expect(Date.parse(event.jst)).not.toBeNaN()
    }
  })

  test('2024 covers all 24 solar terms', () => {
    const names = NAOJ_SOLAR_TERM_FIXTURES.filter(({ year }) => year === 2024).map(({ name }) => name)
    expect(SOLAR_TERM_NAMES_24.every((name) => names.includes(name))).toBe(true)
  })
})

describe('NAOJ solar term conformance target', () => {
  const conformanceTest = process.env.FANCY_DATE_RUN_NAOJ_CONFORMANCE === '1' ? test : test.skip

  conformanceTest('GregorianAstronomical solar_phase matches published JST minute fixtures', () => {
    const toleranceMinutes = Number(process.env.FANCY_DATE_NAOJ_TOLERANCE_MINUTES ?? 2)
    const misses = NAOJ_SOLAR_TERM_FIXTURES.map((event) => {
      const expectedAt = Date.parse(event.jst)
      const actualAt = Calendar.GregorianAstronomical.solar_phase(toPhase(event), expectedAt)
      return {
        key: fixtureKey(event),
        expected: event.jst,
        actual: Calendar.GregorianAstronomical.format(actualAt, 'yyyy-MM-dd HH:mm'),
        diffMinutes: minuteDiff(actualAt, expectedAt),
      }
    }).filter(({ diffMinutes }) => toleranceMinutes < diffMinutes)

    expect({ count: misses.length, samples: misses.slice(0, 5) }).toEqual({ count: 0, samples: [] })
  })
})