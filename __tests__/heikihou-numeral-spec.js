const { Calendar } = require('../lib/sample')
const { jpn, old_jpn } = require('../lib/number')

// 平気法・定気法に、日付(d)と年(y)の漢字本文、日付のふりがな表現、
// 年の日付以外のふりがな表現を指定した(docs/numeral-design.md 参照)。
// bare の d/y も標準表示では漢数字になり、do/dr/yo/yr は明示辞書を
// 引き続き使うことを確認する。
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
    const day = c.to_tempos(utc).d.now_idx + 1

    expect(c.format(utc, 'do')).toBe(jpn.漢字.parse(day))
    expect(c.format(utc, 'dr')).toBe(old_jpn.rubys.語尾('か').parse(day))
  })

  test('bareのdは漢数字本文になる', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const day = c.to_tempos(utc).d.now_idx + 1
    expect(c.format(utc, 'd')).toBe(jpn.漢字.parse(day))
  })

  test('yo/yrは、その暦が計算した年の漢字・ふりがな表現を返す', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const year = c.to_tempos(utc).y.now_idx

    expect(c.format(utc, 'yo')).toBe(jpn.漢字.parse(year))
    expect(c.format(utc, 'yr')).toBe(jpn.rubys.parse(year))
  })

  test('bareのyは漢数字本文になる', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日')
    const year = c.to_tempos(utc).y.now_idx
    expect(c.format(utc, 'y')).toBe(jpn.漢字.parse(year))
  })

  test('20日は具体的に廿(合字)/はつかになる(既知の値での確認)', () => {
    // Gregorian 経由で、この暦の day が実際に20になる utc を探して確認する
    // (太陰太陽暦なので Gregorian の日付から直接は決め打てない)。
    let utc = Calendar.Gregorian.parse('2024年1月1日')
    let day = c.to_tempos(utc).d.now_idx + 1
    for (let i = 0; i < 60 && day !== 20; i++) {
      utc += 86400000
      day = c.to_tempos(utc).d.now_idx + 1
    }
    expect(day).toBe(20)
    expect(c.format(utc, 'do')).toBe('廿')
    expect(c.format(utc, 'dr')).toBe('はつか')
  })

  test('format_partsは日付接尾辞をruby対象の本文へ含める', () => {
    let utc = Calendar.Gregorian.parse('2024年1月1日')
    let day = c.to_tempos(utc).d.now_idx + 1
    for (let i = 0; i < 90 && day !== 24; i++) {
      utc += 86400000
      day = c.to_tempos(utc).d.now_idx + 1
    }
    expect(day).toBe(24)
    expect(c.format_parts(utc, 'd日')).toEqual([
      { token: 'd', text: `${jpn.漢字.parse(24)}日`, ruby: old_jpn.rubys.語尾('か').parse(24) },
    ])
  })

  test('閏月のrubyはうるうになる', () => {
    let utc = Calendar.Gregorian.parse('2020年1月1日')
    for (let i = 0; i < 400 && !c.to_tempos(utc).M.is_leap; i++) {
      utc += 86400000
    }
    const part = c.format_parts(utc, 'Mo')[0]
    expect(part.text.startsWith('閏')).toBe(true)
    expect(part.ruby?.startsWith('うるう')).toBe(true)
    expect(part.ruby?.startsWith('閏')).toBe(false)
  })
})
