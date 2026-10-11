const { ERA_VALIDITY_NOTES, 元号 } = require('../lib/sample')

describe('era validity notes', () => {
  test('records source claims for the selected era start data', () => {
    for (const [era, at, sourceTag] of 元号) {
      const hasStartClaim = ERA_VALIDITY_NOTES.some(
        ({ era: noteEra, claim }) =>
          noteEra === era && claim.kind === 'reported-start-date' && claim.at === at,
      )
      const hasPeriodClaim = ERA_VALIDITY_NOTES.some(
        ({ era: noteEra, claim, source }) =>
          noteEra === era &&
          source.id === 'japanese-era-list' &&
          claim.kind === 'reported-start-period',
      )

      if (era === '文中' && sourceTag === '南') {
        expect(hasPeriodClaim).toBe(true)
      } else {
        expect(hasStartClaim).toBe(true)
      }
    }
  })

  test('preserves official-era evidence alongside the secondary list', () => {
    const reiwa = ERA_VALIDITY_NOTES.find(
      ({ era, source }) => era === '令和' && source.id === 'cabinet-office-era-announcements',
    )

    expect(reiwa).toMatchObject({
      era: '令和',
      source: { kind: 'official-publication' },
      claim: {
        kind: 'reported-start-date',
        at: 1556636400000,
        precision: 'day',
      },
    })
  })

  test('keeps competing southern-era dates and source-specific claims separate', () => {
    const kentoNotes = ERA_VALIDITY_NOTES.filter(
      ({ era, claim }) => era === '建徳' && claim.kind === 'reported-start-date',
    )
    const iseNoMaki = kentoNotes.find(({ source }) => source.id === 'ise-no-maki')
    const kentoDates = [...new Set(kentoNotes.map(({ claim }) => claim.at))].sort((a, b) => a - b)

    expect(iseNoMaki.claim.at).toBe(-18929408400000)
    expect(kentoDates).toEqual([-18929408400000, -18921718800000, -18913856400000])
  })

  test('represents uncertain dates and documentary bounds without inventing a start day', () => {
    const bunchuPeriod = ERA_VALIDITY_NOTES.find(
      ({ era, source }) => era === '文中' && source.id === 'japanese-era-list',
    )
    const bunchuBound = ERA_VALIDITY_NOTES.find(
      ({ era, source }) => era === '文中' && source.id === 'kongouji-documents',
    )
    const unconfirmed = ERA_VALIDITY_NOTES.find(
      ({ era, source }) => era === '文中' && source.id === 'shichikan-soshi',
    )
    const disfavored = ERA_VALIDITY_NOTES.find(
      ({ era, source }) => era === '文中' && source.id === 'nancho-hennenki',
    )

    expect(bunchuPeriod?.claim).toEqual({
      kind: 'reported-start-period',
      description: '建徳3年4月（日未確定）',
    })
    expect(bunchuBound?.claim).toEqual({
      kind: 'start-no-later-than',
      at: -18857350800000,
    })
    expect(unconfirmed?.assessment).toBe('unconfirmed')
    expect(disfavored?.assessment).toBe('disfavored')
  })
})
