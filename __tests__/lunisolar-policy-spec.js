const {
  DefaultLunisolarPrincipalTermYearPolicy,
  PrincipalTermLunisolarPolicy,
} = require('../lib/phenomena/calendar-policy')
const { lunisolar } = require('../lib/phenomena/lunisolar')

function boundary(index, last_at) {
  return {
    index,
    last_at,
    next_at: last_at + 10,
    source_at: last_at,
    next_source_at: last_at + 10,
    source_kind: 'mean',
  }
}

function syntheticOptions({
  moonPeriod = 100,
  solarPeriod = 100,
  principalTermCount = 1,
  lunarPhase = (_phase, near) => Math.floor(near / moonPeriod) * moonPeriod,
  solarPhase = (_phase, near) => Math.floor(near / solarPeriod) * solarPeriod,
  solarYear = () => 42,
  yearAssignmentPolicy,
} = {}) {
  return {
    moony: { periodMsec: moonPeriod },
    lunarSynodicPeriodMsec: moonPeriod,
    solarPeriodMsec: solarPeriod,
    principalTermCount,
    solarYear,
    geo: [0, 0, 0],
    dayMsec: 1,
    dayZero: 0,
    boundaryToleranceMsec: 0,
    lunarPhase,
    solarPhase,
    yearAssignmentPolicy,
  }
}

describe('PrincipalTermLunisolarPolicy', () => {
  test('assigns month numbers, leap months, and years from principal terms', () => {
    const terms = new Map([
      [0, { index: 0, longitudeDeg: 330, month: 12, at: 5 }],
      [2, { index: 2, longitudeDeg: 0, month: 1, at: 25 }],
      [3, { index: 3, longitudeDeg: 30, month: 2, at: 35 }],
    ])
    const policy = new PrincipalTermLunisolarPolicy(
      (item) => terms.get(item.index),
      (at) => (at < 20 ? 1 : 2),
    )
    const result = policy.assign([
      boundary(0, 0),
      boundary(1, 10),
      boundary(2, 20),
      boundary(3, 30),
    ])

    expect(result.map(({ month, is_leap, year }) => [month, is_leap, year])).toEqual([
      [12, false, 1],
      [12, true, 1],
      [1, false, 2],
      [2, false, 2],
    ])
    expect(result[1].principal_term).toBeUndefined()
    expect(result[2].principal_term.month).toBe(1)
  })

  test('keeps boundary source metadata while assigning civil labels', () => {
    const policy = new PrincipalTermLunisolarPolicy(
      (item) => ({ index: item.index, longitudeDeg: 0, month: 1, at: item.source_at }),
      () => 1,
    )
    const [result] = policy.assign([boundary(7, 100)])
    expect(result).toMatchObject({
      index: 7,
      source_at: 100,
      next_source_at: 110,
      source_kind: 'mean',
      month: 1,
      is_leap: false,
      year: 1,
    })
  })
})

describe('DefaultLunisolarPrincipalTermYearPolicy', () => {
  test('preserves the previous one-term month, leap-month, and year assignments', () => {
    const terms = new Map([
      [0, { index: 0, longitudeDeg: 330, month: 12, at: 5 }],
      [2, { index: 2, longitudeDeg: 0, month: 1, at: 25 }],
      [3, { index: 3, longitudeDeg: 30, month: 2, at: 35 }],
    ])
    const yearOf = (at) => (at < 20 ? 1 : 2)
    const policy = new DefaultLunisolarPrincipalTermYearPolicy(yearOf)
    const result = policy.assign(
      [boundary(0, 0), boundary(1, 10), boundary(2, 20), boundary(3, 30)].map((input) => ({
        ...input,
        principal_terms: terms.has(input.index) ? [terms.get(input.index)] : [],
      })),
      { principalTermCount: 12, yearOf },
    )

    expect(result.map(({ month, is_leap, year }) => [month, is_leap, year])).toEqual([
      [12, false, 1],
      [12, true, 1],
      [1, false, 2],
      [2, false, 2],
    ])
  })
})

describe('lunisolar principal-term year assignment', () => {
  test('retains every term and passes full repeated phase sequences to a custom policy', () => {
    const solarPeriod = 100
    let receivedMonths
    const yearAssignmentPolicy = {
      assign(months, context) {
        receivedMonths = months
        expect(context.principalTermCount).toBe(12)
        expect(typeof context.yearOf).toBe('function')
        return months.map((input) => {
          const selectedMonthTerm = input.principal_terms.find(({ index }) => index === 5)
          const repeatedMonthTermCount = input.principal_terms.filter(
            ({ index }) => index === 5,
          ).length
          return {
            input,
            year: context.yearOf(input.principal_terms[0].at),
            month: selectedMonthTerm.month,
            is_leap: repeatedMonthTermCount > 1,
          }
        })
      },
    }
    const options = syntheticOptions({
      moonPeriod: 1000,
      solarPeriod,
      principalTermCount: 12,
      solarYear: () => 2000,
      solarPhase: (phase, near) => {
        const phaseAt = phase * solarPeriod
        return phaseAt + Math.round((near - phaseAt) / solarPeriod) * solarPeriod
      },
      yearAssignmentPolicy,
    })

    expect(() => lunisolar({ ...options, yearAssignmentPolicy: undefined }, 500)).toThrow(
      'multiple principal terms in one lunisolar month require a custom year assignment policy',
    )
    const date = lunisolar({ ...options, yearAssignmentPolicy }, 500)

    expect(receivedMonths.length).toBeGreaterThan(1)
    expect(receivedMonths.every(({ principal_terms }) => principal_terms.length === 120)).toBe(true)
    expect(date).toMatchObject({ year: 2000, month: 7, is_leap: true })
    expect(date.principal_terms).toHaveLength(120)
    expect(
      date.principal_terms.every(({ index, longitudeDeg, month, at }) => {
        return (
          Number.isInteger(index) &&
          longitudeDeg === (index * 360) / 12 &&
          month === ((index + 1) % 12) + 1 &&
          Number.isFinite(at)
        )
      }),
    ).toBe(true)
    expect(date.principal_terms[0]).toEqual({
      index: 0,
      longitudeDeg: 0,
      month: 2,
      at: 0,
    })
    expect(date.principal_term).toEqual(date.principal_terms[0])
    expect(
      Array.from(
        { length: 12 },
        (_, index) => date.principal_terms.filter((term) => term.index === index).length,
      ),
    ).toEqual(Array(12).fill(10))
    expect(date.principal_terms).toEqual(
      [...date.principal_terms].sort((a, b) => a.at - b.at || a.index - b.index),
    )
  })

  test('includes a term at the interval start, excludes its end, and sorts ties by phase index', () => {
    let receivedMonths
    const yearAssignmentPolicy = {
      assign(months, { principalTermCount }) {
        receivedMonths = months
        return months.map((input, index) => ({
          input,
          year: 3000 + Math.floor(index / principalTermCount),
          month: (index % principalTermCount) + 1,
          is_leap: false,
        }))
      },
    }
    const options = syntheticOptions({
      principalTermCount: 3,
      solarPhase: (_phase, near) => Math.floor(near / 100) * 100,
      yearAssignmentPolicy,
    })

    const date = lunisolar(options, 50)
    const first = receivedMonths.find(({ last_at }) => last_at === 0)
    const next = receivedMonths.find(({ last_at }) => last_at === 100)

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

  test('preserves the existing one-term default month, year, and leap assignment', () => {
    const date = lunisolar(syntheticOptions(), 50)

    expect(date).toMatchObject({
      year: 42,
      month: 1,
      is_leap: false,
      principal_terms: [{ index: 0, longitudeDeg: 0, month: 1, at: 0 }],
      principal_term: { index: 0, longitudeDeg: 0, month: 1, at: 0 },
    })
  })

  test('rejects assignment result length and input identity/order mismatches', () => {
    const options = syntheticOptions()
    expect(() =>
      lunisolar(
        {
          ...options,
          yearAssignmentPolicy: {
            assign: (months) =>
              months.slice(1).map((input) => ({
                input,
                year: 42,
                month: 1,
                is_leap: false,
              })),
          },
        },
        50,
      ),
    ).toThrow('returned')

    expect(() =>
      lunisolar(
        {
          ...options,
          yearAssignmentPolicy: {
            assign: (months) =>
              months.map((input, index) => ({
                input: months[months.length - index - 1],
                year: 42,
                month: 1,
                is_leap: false,
              })),
          },
        },
        50,
      ),
    ).toThrow('input identity/order mismatch')
  })

  test.each([
    [{ year: 42.5 }, 'year label'],
    [{ month: 0 }, 'month label'],
    [{ month: 2 }, 'month label'],
    [{ is_leap: 'false' }, 'leap-month label'],
  ])('rejects invalid assigned labels %p', (override, message) => {
    const options = syntheticOptions()
    expect(() =>
      lunisolar(
        {
          ...options,
          yearAssignmentPolicy: {
            assign: (months) =>
              months.map((input, index) => ({
                input,
                year: 42,
                month: 1,
                is_leap: false,
                ...(index === 0 ? override : {}),
              })),
          },
        },
        50,
      ),
    ).toThrow(`invalid lunisolar ${message}`)
  })
})
