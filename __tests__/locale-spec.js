require('../lib/sample')
const { Calendar } = require('../lib/sample')
const { listLocales, getLocale, SCRIPT_REGISTRY } = require('../lib/locale-registry')
const { jpn, old_jpn, roman, sanskrit, sizewise } = require('../lib/number')

describe('ロケール登録簿(発見・カタログ)', () => {
  test('listLocales/getLocaleで登録済みロケールを発見できる', () => {
    expect(listLocales().sort()).toEqual(['en', 'ja', 'ko'])
    const ja = getLocale('ja')
    expect(ja.numerals.cardinal).toBe(jpn.漢字)
    expect(ja.numerals['cardinal-digit']).toBe(jpn.桁読み)
    expect(ja.numerals['date-reading'].parse(20)).toBe('はつか')
    expect(ja.numerals['count-reading'].parse(1)).toBe('ひとつ')
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
