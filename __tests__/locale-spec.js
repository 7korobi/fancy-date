require('../lib/sample')
const { FancyDate } = require('../lib/fancy-date')
const { Calendar } = require('../lib/sample')
const { listLocales, getLocale, SCRIPT_REGISTRY } = require('../lib/locale-registry')
const { jpn, old_jpn, roman, sanskrit, sizewise } = require('../lib/number')

describe('ロケール登録簿(発見・カタログ)', () => {
  test('listLocales/getLocaleで登録済みロケールを発見できる', () => {
    expect(listLocales().sort()).toEqual(['en', 'ja', 'ko'])
    const ja = getLocale('ja')
    expect(ja.numerals.cardinal).toBe(jpn.漢字)
    expect(ja.numerals.cardinalDigit).toBe(jpn.桁読み)
    expect(ja.numerals.dateRuby.parse(20)).toBe('はつか')
    expect(ja.numerals.countRuby.parse(1)).toBe('ひとつ')
    expect(ja.defaultParseFormat).toBe('y年M月d日')
    expect(getLocale('en').defaultParseFormat).toBe('y/M/d')
    expect(getLocale('en').defaultFormat).toBe('Gy/M/d(E)')
    expect(getLocale('xx')).toBeUndefined()
  })

  test('SCRIPT_REGISTRYはロケールに依存しない記法カタログ', () => {
    expect(SCRIPT_REGISTRY.arabic.parse(2024)).toBe('2024')
    expect(SCRIPT_REGISTRY['roman-upper']).toBe(roman.upper)
    expect(sizewise(jpn.漢字, jpn.桁読み).parse(7, 2)).toBe('〇七')
    expect(sanskrit.latin.parse(21)).toBe('eka viṃśati')
  })

  test('FancyDate.locale()はLocaleEntryの役割名を既存numeral APIへ流し込める', () => {
    const ja = getLocale('ja')
    const calendar = new FancyDate(Calendar.Gregorian)
      .locale(ja, {
        lang: false,
        numeral_text: 'cardinal',
        numeral_label: 'cardinal',
        numeral_label_ruby: 'cardinalRuby',
      })
      .init()
    const utc = Calendar.Gregorian.parse('2024年3月10日')

    expect(calendar.format(utc, 'yo')).toBe('二千廿四')
    expect(calendar.format(utc, 'yr')).toBe('にせんにじゅうよん')
    expect(calendar.format(utc, 'yyyy年')).toBe('二千廿四年')
  })

  test('FancyDate.locale()は未知の数詞役割名を例外にする', () => {
    expect(() =>
      new FancyDate(Calendar.Gregorian).locale(getLocale('ja'), { numeral_ruby: 'missing' }),
    ).toThrow('locale ja has no numeral missing')
  })
})

describe('RomanClock: roman.upper を割り当てたサンプル暦', () => {
  test('時・分がローマ数字で表示される', () => {
    const utc = Calendar.RomanClock.parse('2024年3月10日 14時30分0秒', 'y年M月d日 H時m分s秒')
    expect(Calendar.RomanClock.format(utc, 'H:m')).toBe('XIV:XXX')
  })

  test('ローマ数字には0が無いため、0時0分は数字のまま表示される(記法自体の制約)', () => {
    const utc = Calendar.RomanClock.parse('2024年3月10日 0時0分0秒', 'y年M月d日 H時m分s秒')
    expect(Calendar.RomanClock.format(utc, 'H:m')).toBe('0:0')
  })
})

describe('韓国語Gregorian: Gregorian本文は保ちrubyだけ韓国語にするサンプル暦', () => {
  test('format()はGregorianと同じ本文を返す', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日 14時30分0秒', 'y年M月d日 H時m分s秒')

    expect(Calendar.韓国語Gregorian.format(utc)).toBe(Calendar.Gregorian.format(utc))
  })

  test('format_parts()の数値tokenに韓国語rubyを付ける', () => {
    const utc = Calendar.Gregorian.parse('2024年3月10日 14時30分0秒', 'y年M月d日 H時m分s秒')
    const parts = Calendar.韓国語Gregorian.format_parts(utc)
    const byToken = Object.fromEntries(
      parts.filter((part) => part.token).map((part) => [part.token, part]),
    )

    expect(byToken.y.ruby).toBe('이천이십사')
    expect(byToken.M.ruby).toBe('삼')
    expect(byToken.d.ruby).toBe('십')
    expect(byToken.HH.ruby).toBe('십사')
    expect(byToken.mm.ruby).toBe('삼십')
  })
})
