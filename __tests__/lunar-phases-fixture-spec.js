require('../lib/sample')
const { expectMetricsNotWorse, summarizeDifferences } = require('./helpers/naoj-metrics')
const {
  LUNAR_PHASE_DIFF_BASELINE,
  LUNAR_PHASE_DIFF_FIELDS,
  lunarPhaseDifferences,
} = require('./helpers/naoj-differences')
const {
  LUNAR_PHASES,
  NAOJ_LUNAR_PHASE_FIXTURES,
  NAOJ_LUNAR_PHASE_SOURCE,
} = require('./fixtures/lunar-phases-naoj')

function fixtureKey({ year, name, jst }) {
  return `${year}:${name}:${jst}`
}

describe('NAOJ lunar phase fixtures', () => {
  test('source metadata is explicit', () => {
    expect(NAOJ_LUNAR_PHASE_SOURCE.timezone).toBe('JST')
    expect(NAOJ_LUNAR_PHASE_SOURCE.accuracy).toBe('minute')
    expect(Object.keys(NAOJ_LUNAR_PHASE_SOURCE.urls)).toEqual(['2020', '2021', '2024', '2026'])
  })

  test('events have unique keys, phases and parseable JST timestamps', () => {
    const keys = NAOJ_LUNAR_PHASE_FIXTURES.map(fixtureKey)
    expect(new Set(keys).size).toBe(keys.length)
    for (const event of NAOJ_LUNAR_PHASE_FIXTURES) {
      expect(event.phase).toBe(LUNAR_PHASES[event.name])
      expect(Date.parse(event.jst)).not.toBeNaN()
    }
  })

  test('2024 covers all four phase names', () => {
    const names = new Set(
      NAOJ_LUNAR_PHASE_FIXTURES.filter(({ year }) => year === 2024).map(({ name }) => name),
    )
    expect([...names].sort()).toEqual(['上弦', '下弦', '朔', '望'].sort())
  })
})

describe('NAOJ lunar phase conformance target', () => {
  const conformanceTest =
    process.env.FANCY_DATE_RUN_NAOJ_LUNAR_CONFORMANCE === '1' ? test : test.skip

  test('difference metrics do not exceed recorded baseline', () => {
    const metrics = summarizeDifferences(lunarPhaseDifferences(), LUNAR_PHASE_DIFF_FIELDS)
    expectMetricsNotWorse(metrics, LUNAR_PHASE_DIFF_BASELINE)
  })

  conformanceTest('GregorianAstronomical lunar_phase matches published JST minute fixtures', () => {
    const toleranceMinutes = Number(process.env.FANCY_DATE_NAOJ_TOLERANCE_MINUTES ?? 2)
    const misses = lunarPhaseDifferences().filter(
      ({ diffMinutes }) => toleranceMinutes < diffMinutes,
    )

    expect({ count: misses.length, samples: misses.slice(0, 5) }).toEqual({ count: 0, samples: [] })
  })
})
