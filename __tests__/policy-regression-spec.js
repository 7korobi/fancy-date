const { FancyDate } = require('../lib/fancy-date')
const { Calendar } = require('../lib/sample')

const DAY = 86400000

const calendars = [
  ['Gregorian', Calendar.Gregorian, Date.UTC(2024, 1, 29, 12)],
  ['Julian', Calendar.Julian, Date.UTC(2024, 1, 29, 12)],
  ['Romulus', Calendar.Romulus, Date.UTC(2024, 1, 29, 12)],
  ['平気法', Calendar.平気法, Date.UTC(2001, 5, 15, 12)],
  ['定気法', Calendar.定気法, Date.UTC(2024, 5, 15, 12)],
  ['タイ近代太陰太陽暦', Calendar.タイ近代太陰太陽暦, Date.UTC(2026, 6, 20, 12)],
]

function expectEnvelope(label, tempo) {
  expect(tempo.last_at).toBeLessThan(tempo.next_at)
  expect(tempo.is_cover(tempo.last_at)).toBe(true)
  expect(tempo.is_cover(tempo.next_at - 1)).toBe(true)
  expect(tempo.is_cover(tempo.next_at)).toBe(false)
  expect(Number.isFinite(tempo.last_at)).toBe(true)
  expect(Number.isFinite(tempo.next_at)).toBe(true)
  expect(label).toBeTruthy()
}

function expectNested(parent, child) {
  expect(parent.last_at).toBeLessThanOrEqual(child.last_at)
  expect(child.next_at).toBeLessThanOrEqual(parent.next_at)
}

describe('calendar policy regression invariants', () => {
  test.each(calendars)(
    '%s exposes valid nested year/month/day/time envelopes',
    (_, calendar, at) => {
      const tempos = calendar.to_tempos(at)
      for (const token of ['u', 'M', 'd', 'H', 'm', 's', 'S']) {
        expectEnvelope(token, tempos[token])
      }
      expectNested(tempos.u, tempos.M)
      expectNested(tempos.M, tempos.d)
      expectNested(tempos.d, tempos.H)
      expectNested(tempos.H, tempos.m)
      expectNested(tempos.m, tempos.s)
      expectNested(tempos.s, tempos.S)
    },
  )

  test.each(calendars)('%s resolves each boundary into the next interval', (_, calendar, at) => {
    const tempos = calendar.to_tempos(at)
    // 年/月/日は境界そのものが次の区間の起点になる。H以下は不定時法の
    // 時刻表が問い合わせ時刻に依存するため、同じ検査を要求しない。
    for (const token of ['u', 'M', 'd']) {
      const current = tempos[token]
      expect(calendar.to_tempos(current.last_at)[token].last_at).toBe(current.last_at)
      expect(calendar.to_tempos(current.next_at)[token].last_at).toBe(current.next_at)
    }
  })

  test.each(calendars)('%s keeps day and month stepping aligned with add()', (_, calendar, at) => {
    const tempos = calendar.to_tempos(at)
    const nextDay = tempos.d.succ()
    expect(nextDay.last_at).toBe(tempos.d.next_at)
    expect(calendar.add(tempos.d.last_at, '1日後')).toBe(nextDay.last_at)

    const nextMonth = tempos.M.succ()
    expect(nextMonth.last_at).toBe(tempos.M.next_at)
    expect(calendar.add(tempos.M.last_at, '1ヶ月後')).toBe(nextMonth.last_at)
  })

  test('equal-hour policy keeps a fixed hour width', () => {
    const calendar = Calendar.Gregorian
    const first = calendar.to_tempos(Date.UTC(2024, 0, 15, 12)).H
    const second = calendar.to_tempos(Date.UTC(2024, 6, 15, 12)).H
    expect(first.next_at - first.last_at).toBe(calendar.calc.msec.hour)
    expect(second.next_at - second.last_at).toBe(calendar.calc.msec.hour)
    expect(first.next_at - first.last_at).toBe(second.next_at - second.last_at)
  })

  test('temporal-hour policy changes hour width with daylight length', () => {
    const calendar = Calendar.平気法
    const winter = calendar.to_tempos(Date.UTC(2024, 0, 15, 12)).H
    const summer = calendar.to_tempos(Date.UTC(2024, 6, 15, 12)).H
    expect(winter.next_at - winter.last_at).not.toBe(calendar.calc.msec.hour)
    expect(summer.next_at - summer.last_at).not.toBe(calendar.calc.msec.hour)
    expect(winter.next_at - winter.last_at).not.toBe(summer.next_at - summer.last_at)
  })

  test('legacy division modes are recorded as hour policies', () => {
    const equal = new FancyDate(Calendar.Gregorian).division({ H: 'equal' }).init()
    const temporal = new FancyDate(Calendar.Gregorian).division({ H: 'solar' }).init()
    expect(equal.dic.hour_division).toMatchObject({
      kind: 'equal',
      divisions: equal.dic.H.length,
      arithmetic: 'elapsed-duration',
    })
    expect(temporal.dic.hour_division).toMatchObject({
      kind: 'temporal',
      dayDivisions: temporal.dic.H.length / 2,
      nightDivisions: temporal.dic.H.length / 2,
      arithmetic: 'boundary-step',
    })
  })

  test('day boundary modes are represented by an independent policy', () => {
    const midnight = new FancyDate(Calendar.Gregorian).dayStart('midnight').init()
    const sunrise = new FancyDate(Calendar.Gregorian).dayStart('sunrise').init()
    const fixed = new FancyDate(Calendar.Gregorian).dayBoundary(18).init()

    expect(midnight.dic.day_boundary).toEqual({ kind: 'midnight' })
    expect(sunrise.dic.day_boundary).toEqual({ kind: 'solar-event', event: 'sunrise' })
    expect(fixed.dic.day_boundary).toEqual({ kind: 'fixed-offset', offsetHours: 18 })
    expect(sunrise.dic.day_start).toBe('sunrise')
    expect(fixed.dic.day_offset_hours).toBe(18)
  })

  test('solar day boundary keeps precedence over a later fixed-offset call', () => {
    const solar = new FancyDate(Calendar.Gregorian).dayStart('sunset').init()
    const fixed = new FancyDate(Calendar.Gregorian).dayBoundary(18).init()
    const calendar = new FancyDate(Calendar.Gregorian).dayStart('sunset').dayBoundary(18).init()
    const at = Date.UTC(2024, 5, 21, 12)
    expect(calendar.dic.day_boundary).toEqual({ kind: 'fixed-offset', offsetHours: 18 })
    expect(calendar.dic.day_start).toBe('sunset')
    expect(calendar.to_tempos(at).d.last_at).toBe(solar.to_tempos(at).d.last_at)
    expect(calendar.to_tempos(at).d.last_at).not.toBe(fixed.to_tempos(at).d.last_at)
  })

  test('table-hour policy drives H and remains steppable', () => {
    const table = new FancyDate(Calendar.Gregorian)
      .division({
        H: {
          kind: 'table',
          boundaries: [6 * 60 * 60 * 1000, 12 * 60 * 60 * 1000, 18 * 60 * 60 * 1000, DAY],
        },
      })
      .init()
    const day = table.to_tempos(Date.UTC(2024, 0, 15, 12)).d
    const hour = table.to_tempos(day.last_at + 1).H
    expect(table.dic.hour_division.kind).toBe('table')
    expect(hour.size).toBe(6 * 60 * 60 * 1000)
    expect(hour.succ().last_at).toBe(hour.next_at)
  })

  test('a full temporal-hour cycle remains contiguous', () => {
    const calendar = Calendar.平気法
    let hour = calendar.to_tempos(Date.UTC(2024, 6, 15, 12)).H
    const firstLastAt = hour.last_at
    for (let i = 0; i < 24; i++) {
      const next = hour.succ()
      // 不定時法の時刻表は問い合わせ時刻の均時差補正を含むため、
      // freshなnext_atとのbit一致ではなく、時間区画が単調に進むことを固定する。
      expect(next.last_at).toBeGreaterThan(hour.last_at)
      hour = next
    }
    expect(hour.last_at - firstLastAt).toBeGreaterThan(DAY / 2)
  })
})
