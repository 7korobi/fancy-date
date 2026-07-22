const {
  Calendar,
  JapaneseFixedDateNotePolicy,
  ReligiousFixedDateNotePolicy,
  SolarTermPolicy,
  ZassetsuPolicy,
} = require('../lib/index')

describe('seasonal calendar note policies', () => {
  test('resolves mean and observed solar terms through one policy contract', () => {
    const utc = Calendar.Gregorian.parse('2020年3月22日')
    const meanTempos = Calendar.平気法.to_tempos(utc)
    const mean = new SolarTermPolicy('mean').resolve({
      kind: 'mean',
      Zz: meanTempos.Zz,
      d: meanTempos.d,
    })
    const observed = new SolarTermPolicy('observed').resolve({
      kind: 'observed',
      sunny: Calendar.GregorianAstronomical.dic.sunny,
      dayMsec: Calendar.GregorianAstronomical.calc.msec.day,
      dayZero: Calendar.GregorianAstronomical.calc.zero.day,
      utc,
    })

    expect(Object.keys(mean)).toHaveLength(15)
    expect(Object.keys(observed)).toEqual(Object.keys(mean))
    expect(mean.春分.last_at).toBeLessThan(mean.春分.next_at)
    expect(Calendar.GregorianAstronomical.format(observed.春分.last_at, 'yyyy年MM月dd日')).toBe(
      '2020年03月20日',
    )
  })

  test('composes zassetsu from a resolved term set', () => {
    const calendar = Calendar.平気法
    const utc = Calendar.Gregorian.parse('2020年3月22日')
    const tempos = calendar.to_tempos(utc)
    const terms = new SolarTermPolicy('mean').resolve({ kind: 'mean', Zz: tempos.Zz, d: tempos.d })
    const notes = new ZassetsuPolicy().resolve({
      terms,
      dayMsec: calendar.calc.msec.day,
      day10Zero: calendar.calc.zero.day10,
      stemLength: calendar.dic.dCS.length,
    })

    expect(notes.春分.last_at).toBe(terms.春分.last_at)
    expect(notes.春社日).toBeDefined()
    expect(notes.八十八夜).toBeDefined()
  })

  test('resolves fixed date notes through a dedicated policy', () => {
    const notes = new JapaneseFixedDateNotePolicy().resolve(undefined)
    const religious = new ReligiousFixedDateNotePolicy().resolve(undefined)

    expect(notes.節句.七夕).toEqual([7, 7])
    expect(notes.風習.七五三).toEqual([11, 15])
    expect(notes.カトリック).toBeUndefined()
    expect(religious.カトリック.万聖節).toEqual([11, 1])
    expect(religious.仏教.灌仏会).toEqual([4, 8])
    expect(Calendar.Gregorian.節句().仏教.灌仏会).toEqual([4, 8])
  })
})
