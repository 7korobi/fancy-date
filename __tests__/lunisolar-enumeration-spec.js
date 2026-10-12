const { lunisolar, lunisolar_month_window_counts } = require('../lib/phenomena/lunisolar')

function makeSetup({
  moonPeriod = 10,
  solarPeriod = 100,
  principalTermCount = 1,
  utc = 15,
  phaseOffset = (index) => (index * solarPeriod) / principalTermCount,
  solarPhase,
} = {}) {
  let assignedMonths
  const options = {
    moony: { periodMsec: moonPeriod },
    lunarSynodicPeriodMsec: moonPeriod,
    solarPeriodMsec: solarPeriod,
    principalTermCount,
    geo: [0, 0, 0],
    dayMsec: 1,
    dayZero: 0,
    boundaryToleranceMsec: 0,
    lunarPhase: (_phase, near) => Math.floor(near / moonPeriod) * moonPeriod,
    solarPhase:
      solarPhase ??
      ((phase, near) => {
        const index = Math.round(phase * principalTermCount)
        const offset = phaseOffset(index)
        return offset + Math.round((near - offset) / solarPeriod) * solarPeriod
      }),
    yearAssignmentPolicy: {
      assign(months) {
        assignedMonths = months
        return months.map((input) => ({
          input,
          year: 1,
          month: 1,
          is_leap: false,
        }))
      },
    },
  }
  return {
    options,
    get assignedMonths() {
      return assignedMonths
    },
    resolve() {
      return lunisolar(options, utc)
    },
  }
}

function referenceTermsForMonth(boundary, { solarPeriod, principalTermCount, phaseOffset }) {
  const terms = []
  for (let index = 0; index < principalTermCount; index++) {
    const offset = phaseOffset(index)
    let cycle = Math.ceil((boundary.last_at - offset) / solarPeriod)
    let at = offset + cycle * solarPeriod
    while (at < boundary.next_at) {
      if (boundary.last_at <= at) {
        terms.push({
          index,
          longitudeDeg: (index * 360) / principalTermCount,
          month: ((index + 1) % principalTermCount) + 1,
          at,
        })
      }
      cycle++
      at = offset + cycle * solarPeriod
    }
  }
  return terms.sort((a, b) => a.at - b.at || a.index - b.index)
}

function expectWholeWindowMatchesPerMonthReference(
  setup,
  { solarPeriod, principalTermCount, phaseOffset, utc },
) {
  const date = setup.resolve()
  const months = setup.assignedMonths
  const expected = months.map((month) =>
    referenceTermsForMonth(month, { solarPeriod, principalTermCount, phaseOffset }),
  )

  expect(months.map(({ principal_terms }) => principal_terms)).toEqual(expected)
  for (const month of months) {
    expect(month.principal_terms).toEqual(
      [...month.principal_terms].sort((a, b) => a.at - b.at || a.index - b.index),
    )
  }

  const dateMonth = months.find(({ last_at, next_at }) => last_at <= utc && utc < next_at)
  expect(date.principal_terms).toEqual(dateMonth.principal_terms)
  expect(date.principal_term).toEqual(date.principal_terms[0])
  return { date, months }
}

describe('lunisolar whole-window principal-term enumeration', () => {
  test('matches empty and single-term months against per-month enumeration', () => {
    const period = 100
    const principalTermCount = 1
    const phaseOffset = () => 0
    const setup = makeSetup({
      moonPeriod: 10,
      solarPeriod: period,
      principalTermCount,
      utc: 15,
      phaseOffset,
    })
    const { date, months } = expectWholeWindowMatchesPerMonthReference(setup, {
      solarPeriod: period,
      principalTermCount,
      phaseOffset,
      utc: 15,
    })

    expect(months.some(({ principal_terms }) => principal_terms.length === 0)).toBe(true)
    expect(months.some(({ principal_terms }) => principal_terms.length === 1)).toBe(true)
    expect(date.principal_terms).toEqual([])
    expect(date.principal_term).toBeUndefined()
  })

  test('enumerates repeated phase indices across multiple solar cycles in long months', () => {
    const moonPeriod = 250
    const solarPeriod = 100
    const principalTermCount = 4
    const phaseOffset = (index) => (index * solarPeriod) / principalTermCount
    const setup = makeSetup({
      moonPeriod,
      solarPeriod,
      principalTermCount,
      utc: 600,
      phaseOffset,
    })
    const { date } = expectWholeWindowMatchesPerMonthReference(setup, {
      solarPeriod,
      principalTermCount,
      phaseOffset,
      utc: 600,
    })

    expect(date.principal_terms).toHaveLength(10)
    expect(
      Array.from(
        { length: principalTermCount },
        (_, index) => date.principal_terms.filter((term) => term.index === index).length,
      ),
    ).toEqual([3, 3, 2, 2])
    expect(date.principal_terms[0]).toEqual({
      index: 0,
      longitudeDeg: 0,
      month: 2,
      at: 500,
    })
    expect(date.principal_term).toEqual(date.principal_terms[0])
  })

  test('assigns exact starts to the next month, excludes ends, and orders phase ties stably', () => {
    const moonPeriod = 100
    const solarPeriod = 100
    const principalTermCount = 3
    const phaseOffset = () => 0
    const setup = makeSetup({
      moonPeriod,
      solarPeriod,
      principalTermCount,
      utc: 50,
      phaseOffset,
    })
    const { date, months } = expectWholeWindowMatchesPerMonthReference(setup, {
      solarPeriod,
      principalTermCount,
      phaseOffset,
      utc: 50,
    })
    const first = months.find(({ last_at }) => last_at === 0)
    const next = months.find(({ last_at }) => last_at === 100)

    expect(date.principal_terms.map(({ index, at }) => [index, at])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
    expect(first.principal_terms.map(({ index, at }) => [index, at])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
    expect(first.principal_terms.some(({ at }) => at === first.next_at)).toBe(false)
    expect(next.principal_terms.map(({ index, at }) => [index, at])).toEqual([
      [0, 100],
      [1, 100],
      [2, 100],
    ])
  })
})

describe('lunisolar authoritative solar period validation', () => {
  test('rejects missing and invalid periods at runtime', () => {
    const lunarOnly = { moony: { periodMsec: 10 }, lunarSynodicPeriodMsec: 10 }
    expect(() => lunisolar_month_window_counts(lunarOnly)).toThrow('solarPeriodMsec')

    for (const solarPeriodMsec of [undefined, 0, -1, NaN, Infinity]) {
      expect(() => lunisolar_month_window_counts({ ...lunarOnly, solarPeriodMsec })).toThrow(
        'solarPeriodMsec',
      )
    }

    const setup = makeSetup()
    delete setup.options.solarPeriodMsec
    expect(() => setup.resolve()).toThrow('solarPeriodMsec')
  })

  test('throws when a period hop returns a non-finite event or fails to progress', () => {
    let calls = 0
    const nonFiniteSetup = makeSetup({
      moonPeriod: 1000,
      solarPeriod: 100,
      principalTermCount: 1,
      solarPhase: () => {
        calls++
        return calls === 1 ? 0 : NaN
      },
    })
    expect(() => nonFiniteSetup.resolve()).toThrow('invalid principal term time for phase 0')
    expect(calls).toBe(2)

    const nonProgressSetup = makeSetup({
      moonPeriod: 1000,
      solarPeriod: 100,
      principalTermCount: 1,
      solarPhase: () => 0,
    })
    expect(() => nonProgressSetup.resolve()).toThrow(
      'solar phase failed to advance for principal term 0',
    )
  })
})
