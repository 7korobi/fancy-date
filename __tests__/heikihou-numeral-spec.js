const { Calendar } = require('../lib/sample')
const { jpn, old_jpn } = require('../lib/number')

// 平気法・定気法に、日付(d)の漢字表現・日付のふりがな表現、年(y)の
// 漢字表現・日付以外のふりがな表現を指定した(docs/numeral-design.md 参照)。
// bare の d/y(算用数字)は変更しないまま、do/dr/yo/yr で新しい表現が
// 得られることを確認する。
//
// utc は Calendar.Gregorian.parse() で作る(各暦自身の parse() 経由では
// ないため、太陰太陽暦の月日を直接指定できない——do/dr/yo/yr の値は
// その暦が実際に計算した年/日の値から都度導出して比較する)。
describe.each([
  ['平気法', Calendar.平気法],
  ['定気法', Calendar.定気法],
])('%s: d(日)/y(年)の漢字・ふりがな表現', (_name, c) => {
  test('do/drは、その暦が計算した日付の漢字・ふりがな表現を返す', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const day = Number(c.format(utc, 'd'))

    expect(c.format(utc, 'do')).toBe(jpn.漢字.parse(day))
    expect(c.format(utc, 'dr')).toBe(old_jpn.rubys.語尾('か').parse(day))
  })

  test('bareのdは既存どおり算用数字のまま(退行なし)', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const day = Number(c.format(utc, 'd'))
    expect(c.format(utc, 'd')).toBe(`${day}`)
  })

  test('yo/yrは、その暦が計算した年の漢字・ふりがな表現を返す', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const year = Number(c.format(utc, 'y'))

    expect(c.format(utc, 'yo')).toBe(jpn.漢字.parse(year))
    expect(c.format(utc, 'yr')).toBe(jpn.rubys.parse(year))
  })

  test('bareのyは既存どおり算用数字のまま(退行なし)', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const year = Number(c.format(utc, 'y'))
    expect(c.format(utc, 'y')).toBe(`${year}`)
  })

  test('20日は具体的に廿(合字)/はつかになる(既知の値での確認)', () => {
    // Gregorian 経由で、この暦の day が実際に20になる utc を探して確認する
    // (太陰太陽暦なので Gregorian の日付から直接は決め打てない)。
    let utc = Calendar.Gregorian.parse('2024年1月1日')
    let day = Number(c.format(utc, 'd'))
    for (let i = 0; i < 60 && day !== 20; i++) {
      utc += 86400000
      day = Number(c.format(utc, 'd'))
    }
    expect(day).toBe(20)
    expect(c.format(utc, 'do')).toBe('廿')
    expect(c.format(utc, 'dr')).toBe('はつか')
  })
})
