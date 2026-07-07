const { jpn, old_jpn, kor, arabic, english, roman } = require('../lib/number')

// 屈折確定済み(または appendix 不要な)Numeral について、parse(n) を
// to_number に通すと n に戻ることを [min, max] 全域で機械的に検証する。
// 個別のケース(はつか等)が検証から漏れる事態を、範囲網羅で構造的に防ぐ。
function assertRoundTrips(numeral, min, max) {
  const failures = []
  for (let n = min; n <= max; n++) {
    const text = numeral.parse(n)
    const got = numeral.to_number(text)
    if (got !== n) failures.push(`n=${n} -> parse="${text}" -> to_number=${got}`)
  }
  if (failures.length) {
    throw new Error(
      `round-trip failed for ${failures.length} value(s):\n${failures.slice(0, 10).join('\n')}`,
    )
  }
}

describe('old_jpn.rubys: 語尾ごとの不規則読みと完全往復', () => {
  test('語尾(か): 日付の読み(はつか等)が正しく生成される', () => {
    const dateReading = old_jpn.rubys.語尾('か')
    expect(dateReading.parse(1)).toBe('ついたち')
    expect(dateReading.parse(2)).toBe('ふつか')
    expect(dateReading.parse(3)).toBe('みっか')
    expect(dateReading.parse(4)).toBe('よっか')
    expect(dateReading.parse(6)).toBe('むいか')
    expect(dateReading.parse(7)).toBe('なのか')
    expect(dateReading.parse(8)).toBe('ようか')
    expect(dateReading.parse(10)).toBe('とをか')
    expect(dateReading.parse(20)).toBe('はつか')
    expect(dateReading.parse(30)).toBe('みそか')
  })

  test('語尾(つ): 汎用の計数読み(ひとつ等)が正しく生成される(appendix省略時の破損バグの修正確認)', () => {
    const countReading = old_jpn.rubys.語尾('つ')
    // appendix を省略すると音便コールバックの既定値(tail='つ')が発動せず
    // 「ひとつ」ではなく「ひと」を返していた潜在バグの修正確認。
    expect(countReading.parse(1)).toBe('ひとつ')
    expect(countReading.parse(2)).toBe('ふたつ')
    expect(countReading.parse(9)).toBe('ここのつ')
    expect(countReading.parse(10)).toBe('とを')
    expect(countReading.parse(20)).toBe('はたち')
  })

  test('つくも(99)は削除されたcase文の代わりに例外テーブルで到達可能になる', () => {
    expect(old_jpn.rubys.語尾('か').parse(99)).toBe('つくも')
    expect(old_jpn.rubys.語尾('つ').parse(99)).toBe('つくも')
    // 100(もも)は既存の桁再帰で従来通り到達できる、退行していないことの確認
    expect(old_jpn.rubys.語尾('か').parse(100)).toBe('もも')
  })

  test('bare使用(.語尾()を経由しない)は例外を投げる', () => {
    expect(() => old_jpn.rubys.parse(1)).toThrow(/語尾/)
    expect(() => old_jpn.rubys.regex).toThrow(/語尾/)
    expect(() => old_jpn.rubys.to_number('ひとつ')).toThrow(/語尾/)
  })

  test('完全往復保証: 語尾ごとに独立した逆引きマップで衝突なく往復できる', () => {
    assertRoundTrips(old_jpn.rubys.語尾('か'), 0, 130)
    assertRoundTrips(old_jpn.rubys.語尾('つ'), 0, 130)
    assertRoundTrips(old_jpn.rubys.語尾('たり'), 0, 130)
  })

  test('複数の語尾を同時に使っても互いのキャッシュを汚染しない', () => {
    const ka = old_jpn.rubys.語尾('か')
    const tsu = old_jpn.rubys.語尾('つ')
    // 先に一方の逆引きマップを構築してから、もう一方が正しい値のままか確認する
    expect(ka.to_number('はつか')).toBe(20)
    expect(tsu.to_number('はたち')).toBe(20)
    expect(ka.to_number('はたち')).toBeNull()
    expect(tsu.to_number('はつか')).toBeNull()
  })
})

describe('jpn: appendixに依存しないDICはbareのまま完全往復する(退行なし)', () => {
  test('jpn.漢字/大字/rubys', () => {
    assertRoundTrips(jpn.漢字, 0, 200)
    assertRoundTrips(jpn.大字, 0, 200)
    assertRoundTrips(jpn.rubys, 0, 200)
  })
})

describe('arabic: パススルー', () => {
  test('parse/to_numberが素通しになる', () => {
    expect(arabic.parse(2024)).toBe('2024')
    expect(arabic.to_number('2024')).toBe(2024)
    assertRoundTrips(arabic, 0, 9999)
  })
})

describe('jpn.桁読み: 桁列挙表記(位取りしない)', () => {
  test('西暦4桁年を桁ごとに読み下す', () => {
    expect(jpn.桁読み.parse(2024)).toBe('二〇二四')
    expect(jpn.桁読み.parse(302)).toBe('三〇二')
    expect(jpn.桁読み.to_number('二〇二四')).toBe(2024)
  })

  test('完全往復', () => {
    assertRoundTrips(jpn.桁読み, 0, 9999)
  })
})

describe('english/roman: 完全往復保証の後追い検証', () => {
  test('english.lower/title', () => {
    assertRoundTrips(english.lower, 0, 999)
    assertRoundTrips(english.title, 0, 999)
  })

  test('roman.upper/lower', () => {
    assertRoundTrips(roman.upper, 1, 3999)
    assertRoundTrips(roman.lower, 1, 3999)
  })
})

describe('kor: 漢語系・固有系(format方向のみ、既知の値で確認)', () => {
  test('漢語系(既存DICエンジンを流用)', () => {
    expect(kor.漢語系.parse(1)).toBe('일')
    expect(kor.漢語系.parse(10)).toBe('십')
    expect(kor.漢語系.parse(11)).toBe('십일')
    expect(kor.漢語系.parse(15)).toBe('십오')
    expect(kor.漢語系.parse(20)).toBe('이십')
    expect(kor.漢語系.parse(100)).toBe('백')
    expect(kor.漢語系.parse(101)).toBe('백일')
    expect(kor.漢語系.parse(234)).toBe('이백삼십사')
    expect(kor.漢語系.parse(1000)).toBe('천')
    expect(kor.漢語系.parse(2024)).toBe('이천이십사')
  })

  test('固有系: 基本(縮約なし)', () => {
    expect(kor.固有系.基本.parse(1)).toBe('하나')
    expect(kor.固有系.基本.parse(2)).toBe('둘')
    expect(kor.固有系.基本.parse(10)).toBe('열')
    expect(kor.固有系.基本.parse(20)).toBe('스물')
    expect(kor.固有系.基本.parse(21)).toBe('스물하나')
  })

  test('固有系: 助数詞前(縮約形)', () => {
    // 助数詞の直前に来る最後の語だけが縮約する
    expect(kor.固有系.助数詞前.parse(1)).toBe('한')
    expect(kor.固有系.助数詞前.parse(2)).toBe('두')
    expect(kor.固有系.助数詞前.parse(3)).toBe('세')
    expect(kor.固有系.助数詞前.parse(4)).toBe('네')
    expect(kor.固有系.助数詞前.parse(20)).toBe('스무')
    // 十の位が非ゼロで一の位も非ゼロなら、縮約するのは一の位だけ
    expect(kor.固有系.助数詞前.parse(21)).toBe('스물한')
    // 서른以上の十の位に縮約形はない(調査範囲では確認されなかった)
    expect(kor.固有系.助数詞前.parse(30)).toBe('서른')
  })
})
