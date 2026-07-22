const { PrincipalTermLunisolarPolicy } = require('../lib/phenomena/calendar-policy')

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
