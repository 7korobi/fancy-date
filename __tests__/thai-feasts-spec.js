const api = require('../lib/index')

const { Calendar, thaiBuddhistFeastDates, thaiBuddhistFeastNotes } = api

describe('Thai Buddhist feast projection', () => {
  test('returns labeled local civil dates from the official Thai calendar', () => {
    const feasts = thaiBuddhistFeastDates(Calendar.タイ太陰太陽暦公式, 2567)

    expect(feasts.map(({ id, date, label }) => [id, date, label])).toEqual([
      ['makha-bucha', { year: 2024, month: 2, day: 24 }, 'マーカブーチャー'],
      ['visakha-bucha', { year: 2024, month: 5, day: 22 }, 'ヴィサーカブーチャー'],
      ['asalha-bucha', { year: 2024, month: 7, day: 20 }, 'アーサーンハブーチャー'],
      ['khao-phansa', { year: 2024, month: 7, day: 21 }, '入安居'],
      ['ok-phansa', { year: 2024, month: 10, day: 17 }, '出安居'],
    ])
  })

  test('finds feast notes for a civil-day timestamp and allows label overrides', () => {
    const feasts = thaiBuddhistFeastDates(Calendar.タイ太陰太陽暦公式, 2567, {
      labels: { 'khao-phansa': '雨安居開始' },
    })
    const khaoPhansa = feasts.find(({ id }) => id === 'khao-phansa')

    expect(
      thaiBuddhistFeastNotes(Calendar.タイ太陰太陽暦公式, khaoPhansa.utc, {
        labels: { 'khao-phansa': '雨安居開始' },
      }),
    ).toEqual(['雨安居開始'])
  })
})
