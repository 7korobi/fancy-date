const { Calendar } = require('../lib/sample')

// バビロニア暦(カスプ/ベール)・オスマン帝国の時刻制度(季節時法/アラトゥルカ)の
// サンプル暦(docs/development-notes.md 参照)。いずれも日没起点の暦日境界は
// 実装していない(既知の制約、development-notes.md/calendars.ts のコメント参照)。
describe.each([
  ['バビロニア暦カスプ', Calendar.バビロニア暦カスプ],
  ['バビロニア暦ベール', Calendar.バビロニア暦ベール],
  ['オスマン季節時法', Calendar.オスマン季節時法],
  ['アラトゥルカ', Calendar.アラトゥルカ],
])('%s', (_name, c) => {
  test('parse/format が往復する', () => {
    const utc = c.parse('5年3月10日', 'y年M月d日')
    expect(c.format(utc, 'y年M月d日')).toBe('5年3月10日')
  })
})

describe('バビロニア暦', () => {
  test('カスプ/ベールは月構造(月名・閏月機構)を共有する', () => {
    const utc = Calendar.Gregorian.parse('2024年6月21日')
    const kaspu = Calendar.バビロニア暦カスプ.format(utc, 'Gy年Mo月d日')
    const beru = Calendar.バビロニア暦ベール.format(utc, 'Gy年Mo月d日')
    // 年月日・元号・月名は時刻体系に依存しないので一致するはず
    expect(kaspu).toBe(beru)
  })

  test('月名がバビロニアの月名(ニサンヌ等)になる', () => {
    const utc = Calendar.バビロニア暦カスプ.parse('1年1月1日', 'y年M月d日')
    expect(Calendar.バビロニア暦カスプ.format(utc, 'Mo')).toBe('ニサンヌ')
  })

  test('ベールは1日=12等分(2時間ごと)の等時法になる', () => {
    const b = Calendar.バビロニア暦ベール
    expect(b.dic.H.length).toBe(12)
    expect(b.dic.is_solor).toBe(false)
    // 等時法なので、6時間(実時間)進めると3ベール(12分割の1/4)進む
    // (12分割の周回をまたぐ場合があるので mod 12 で比較する)
    const utc = Calendar.Gregorian.parse('2024年6月21日')
    const h0 = Number(b.format(utc, 'H'))
    const h1 = Number(b.format(utc + 6 * 3600000, 'H'))
    expect((h1 - h0 + 12) % 12).toBe(3)
  })

  test('カスプは不定時法(季節で日の出・日の入りに基づき昼夜が伸縮)になる', () => {
    const kaspu = Calendar.バビロニア暦カスプ
    expect(kaspu.dic.is_solor).toBe(true)
    // 北緯32.5度は極域ガード(66.5度)の対象外なので construction 自体は成功する
    expect(() => kaspu.dup().init()).not.toThrow()
  })

  test('北緯32.5度は不定時法の極域ガードに抵触しない', () => {
    expect(Math.abs(Calendar.バビロニア暦カスプ.dic.geo[0])).toBeLessThan(66.5)
  })
})

describe('オスマン帝国の時刻制度', () => {
  test('季節時法とアラトゥルカは日付構造(ユリウス暦ベース)を共有する', () => {
    const utc = Calendar.Gregorian.parse('2024年6月21日')
    const seasonal = Calendar.オスマン季節時法.format(utc, 'y年M月d日')
    const alaturka = Calendar.アラトゥルカ.format(utc, 'y年M月d日')
    expect(seasonal).toBe(alaturka)
  })

  test('季節時法は不定時法、アラトゥルカは等時法(24時間制)', () => {
    expect(Calendar.オスマン季節時法.dic.is_solor).toBe(true)
    expect(Calendar.アラトゥルカ.dic.is_solor).toBe(false)
    expect(Calendar.アラトゥルカ.dic.H.length).toBe(24)
  })

  test('イスタンブール(北緯41度)は不定時法の極域ガードに抵触しない', () => {
    expect(Math.abs(Calendar.オスマン季節時法.dic.geo[0])).toBeLessThan(66.5)
  })
})
