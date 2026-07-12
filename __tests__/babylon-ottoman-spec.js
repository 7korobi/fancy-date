const { Calendar } = require('../lib/sample')
const { FancyDate } = require('../lib/fancy-date')

// バビロニア暦(カスプ/ベール)・オスマン帝国の時刻制度(季節時法/アラトゥルカ)の
// サンプル暦(docs/development-notes.md 参照)。いずれも日没起点の暦日境界を
// 実装している: カスプ/オスマン季節時法は dusk()(実際の日没時刻、季節で
// 変動)、ベール/アラトゥルカは dayBoundary()(固定オフセット)。
//
// 対になる2暦(カスプ/ベール、季節時法/アラトゥルカ)は月構造(月名・
// 閏月機構)を共有するが、暦日の境界自体は「固定18時」と「実際の日没」
// という別の基準を使うため、両者が数分〜数時間ずれる時間帯(1日のうち
// ごく一部)では日番号が一致しない。「日付構造を共有する」系のテストは
// この境界付近を避けた時刻(UTC+20時間、各地のタイムゾーン・季節を通して
// 安全な日中の時刻になることを実測で確認済み)を使う。
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

  test('月内の複数の日で parse/format が往復する(日没起点の束探索・固定オフセットとも)', () => {
    for (let d = 1; d <= 12; d++) {
      const str = `5年3月${d}日`
      const utc = c.parse(str, 'y年M月d日')
      expect(c.format(utc, 'y年M月d日')).toBe(str)
    }
  })

  test('月初の1日目は日没境界から始まり、d.succ() と add() が同じ2日目へ進む', () => {
    const base = c.parse('5年3月1日', 'y年M月d日')
    const tempos = c.to_tempos(base)
    const next = tempos.d.succ().last_at
    const beforeFirstDay = tempos.d.last_at - 1000
    expect(c.format(tempos.d.last_at, 'y年M月d日')).toBe('5年3月1日')
    if (c.dic.is_dusk) {
      expect(c.format(beforeFirstDay, 'y年M月d日')).not.toBe('5年3月1日')
      expect(c.to_tempos(beforeFirstDay).d.now_idx).toBeGreaterThan(0)
    }
    expect(c.format(next, 'y年M月d日')).toBe('5年3月2日')
    expect(c.add(base, '1日後')).toBe(next)
    expect(c.format(c.add(base, '1日後'), 'y年M月d日')).toBe('5年3月2日')
  })

  test('dusk() 暦の年初は月初・日初と同じ日没境界から始まる', () => {
    if (!c.dic.is_dusk) return
    const base = c.parse('5年1月1日', 'y年M月d日')
    const tempos = c.to_tempos(base)
    const beforeYear = tempos.u.last_at - 1000
    expect(tempos.u.last_at).toBe(tempos.M.last_at)
    expect(tempos.u.last_at).toBe(tempos.d.last_at)
    expect(c.format(tempos.u.last_at, 'y年M月d日')).toBe('5年1月1日')
    expect(c.format(beforeYear, 'y年M月d日')).not.toBe('5年1月1日')
    expect(c.to_tempos(beforeYear).u.raw_now_idx).toBe(tempos.u.raw_now_idx - 1)
  })

  test('dusk() かつ表形式月の暦では最後の月末が次年境界に接続する', () => {
    if (!c.dic.is_dusk || !c.is_table_month) return
    const lastMonth = c.to_tempos(c.parse('5年12月1日', 'y年M月d日'))
    const nextYear = c.to_tempos(lastMonth.M.next_at)
    expect(lastMonth.M.next_at).toBe(lastMonth.u.next_at)
    expect(c.format(lastMonth.M.next_at, 'y年M月d日')).toBe('6年1月1日')
    expect(nextYear.u.raw_now_idx).toBe(lastMonth.u.raw_now_idx + 1)
    expect(nextYear.M.now_idx).toBe(0)
    expect(nextYear.d.now_idx).toBe(0)
    expect(nextYear.u.last_at).toBe(nextYear.M.last_at)
    expect(nextYear.M.last_at).toBe(nextYear.d.last_at)
  })

  test('add()/sub() の日送りが d.succ()/d.back() の実際の値と一致する', () => {
    // find_span_time() が month.last_at + dayIndex*msec.day という単純な
    // 等分割で d を求めていたため、dusk()/dayBoundary() な暦では
    // add()/sub() が1日早い日付を返す実バグがあった(development-notes.md
    // 参照)。d.succ()/d.back()(暦日そのものの遷移)を正とし、これと
    // add()/sub() の結果が一致することを確認する。
    const base = c.parse('5年3月10日', 'y年M月d日')
    const tempos = c.to_tempos(base)
    for (const n of [1, 3, 7]) {
      expect(c.add(base, `${n}日後`)).toBe(tempos.d.succ(n).last_at)
      expect(c.sub(base, `${n}日後`)).toBe(tempos.d.back(n).last_at)
    }
  })
})

// 対になる2暦(カスプ/ベール、季節時法/アラトゥルカ)を、境界付近を避けた
// 安全な時刻で比較する共通ヘルパー。UTC+20時間(Gregorian の現地深夜0時
// から20時間後)は、季節・地点(バビロニア/イスタンブール)を通して
// 「固定18時」「実際の日没」いずれの境界も過ぎた後の日中になることを
// 実測で確認済み(development-notes.md 参照)。
const safe_instant = (dateStr) => Calendar.Gregorian.parse(dateStr, 'y年M月d日') + 20 * 3600000

describe('バビロニア暦', () => {
  test('カスプ/ベールは月構造(月名・閏月機構)を共有する', () => {
    const utc = safe_instant('2024年6月21日')
    const kaspu = Calendar.バビロニア暦カスプ.format(utc, 'Gy年Mo月d日')
    const beru = Calendar.バビロニア暦ベール.format(utc, 'Gy年Mo月d日')
    // 年月日・元号・月名は時刻体系に依存しないので一致するはず
    expect(kaspu).toBe(beru)
  })

  test('日没(カスプ)と固定18時(ベール)の境界がずれる時間帯では日番号が食い違う', () => {
    // 2024年6月20日、バビロニア(北緯32.5度)の実際の日没はおよそ16:11 UTC。
    // ベールの固定境界(18:00 現地=15:00 UTC)より後、カスプの実日没より
    // 前の狭い時間帯(15:00〜16:11 UTC)だけ、両者の暦日番号が1日ずれる
    // (実測で確認済み)。日没起点の暦日境界が実際に機能している証拠。
    const utc = Date.parse('2024-06-20T15:30:00Z')
    const kaspu = Calendar.バビロニア暦カスプ.format(utc, 'd')
    const beru = Calendar.バビロニア暦ベール.format(utc, 'd')
    expect(Number(beru) - Number(kaspu)).toBe(1)
  })

  test('月名がバビロニアの月名(ニサンヌ等)になる', () => {
    const utc = Calendar.バビロニア暦カスプ.parse('1年1月1日', 'y年M月d日')
    expect(Calendar.バビロニア暦カスプ.format(utc, 'Mo')).toBe('ニサンヌ')
  })

  test('月初の標準表示が閏月を含む範囲で同じ表示へ戻る', () => {
    for (const c of [Calendar.バビロニア暦カスプ, Calendar.バビロニア暦ベール]) {
      let cursor = Calendar.Gregorian.parse('1980年1月1日')
      const end = Calendar.Gregorian.parse('2025年1月1日')
      while (cursor < end) {
        const month = c.to_tempos(cursor).M
        const label = c.format(month.last_at)
        expect(c.format(c.parse(label))).toBe(label)
        cursor = month.next_at
      }
    }
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
    expect(() => new FancyDate(kaspu).init()).not.toThrow()
  })

  test('北緯32.5度は不定時法の極域ガードに抵触しない', () => {
    expect(Math.abs(Calendar.バビロニア暦カスプ.dic.geo[0])).toBeLessThan(66.5)
  })
})

describe('オスマン帝国の時刻制度', () => {
  test('季節時法とアラトゥルカは日付構造(ユリウス暦ベース)を共有する', () => {
    const utc = safe_instant('2024年6月21日')
    const seasonal = Calendar.オスマン季節時法.format(utc, 'y年M月d日')
    const alaturka = Calendar.アラトゥルカ.format(utc, 'y年M月d日')
    expect(seasonal).toBe(alaturka)
  })

  test('日没(季節時法)と固定18時(アラトゥルカ)の境界がずれる時間帯では日番号が食い違う', () => {
    // 2024年6月20日、イスタンブール(北緯41度)の実際の日没はおよそ19:47
    // 現地(17:47 UTC)。アラトゥルカの固定境界(18:00 現地=16:00 UTC)の
    // 方が季節時法の実日没より早いため、16:00〜17:47 UTC の間だけ
    // アラトゥルカが1日先行する(実測で確認済み)。
    const utc = Date.parse('2024-06-20T17:00:00Z')
    const seasonal = Calendar.オスマン季節時法.format(utc, 'd')
    const alaturka = Calendar.アラトゥルカ.format(utc, 'd')
    expect(Number(alaturka) - Number(seasonal)).toBe(1)
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

describe('日没起点の暦日境界', () => {
  test('dusk()/dayBoundary() のフラグが暦ごとに正しく設定される', () => {
    expect(Calendar.バビロニア暦カスプ.dic.is_dusk).toBe(true)
    expect(Calendar.バビロニア暦カスプ.dic.day_start).toBe('sunset')
    expect(Calendar.バビロニア暦ベール.dic.is_dusk).toBe(false)
    expect(Calendar.バビロニア暦ベール.dic.day_start).toBeUndefined()
    expect(Calendar.バビロニア暦ベール.dic.day_offset_hours).toBe(18)
    expect(Calendar.オスマン季節時法.dic.is_dusk).toBe(true)
    expect(Calendar.オスマン季節時法.dic.day_start).toBe('sunset')
    expect(Calendar.アラトゥルカ.dic.is_dusk).toBe(false)
    expect(Calendar.アラトゥルカ.dic.day_start).toBeUndefined()
    expect(Calendar.アラトゥルカ.dic.day_offset_hours).toBe(18)
  })

  test.each([
    ['バビロニア暦カスプ', Calendar.バビロニア暦カスプ],
    ['バビロニア暦ベール', Calendar.バビロニア暦ベール],
    ['オスマン季節時法', Calendar.オスマン季節時法],
    ['アラトゥルカ', Calendar.アラトゥルカ],
  ])('%s は数ヶ月分の日送りで日番号が飛ばず、月頭以外で重複しない', (_name, c) => {
    // dusk()(実日没の束探索)・dayBoundary()(固定オフセット)いずれも、
    // 実日長のわずかな伸縮(dusk())や月頭との位相ズレ(いずれも)を
    // now_idx の算出で丸め処理する必要があり、丸め方式を誤ると同じ日付が
    // 2回出力される、または1日飛ばされる実バグがあった(development-notes.md
    // 参照)。
    //
    // dusk() 暦は月境界も実日没へ丸め上げるため、月初直前の短い区間は
    // 前月末として扱われる。dayBoundary() 暦は固定オフセットを d/N の
    // 構築規則だけに適用するため、月頭の切り詰め区間だけ now_idx=0 が
    // 重複しうる。このテストはその固定オフセット側の例外だけを許容し、
    // それ以外の欠番・重複(now_idx が1ずつ増える、または新しい月で0に
    // リセットする、という不変条件が崩れるケース)を検出する。
    let utc = c.parse('5年1月1日', 'y年M月d日')
    let prevIdx = null
    for (let i = 0; i < 90; i++) {
      const idx = c.to_tempos(utc).d.now_idx
      if (prevIdx !== null) {
        if (idx === prevIdx) {
          expect(idx).toBe(0)
        } else if (idx !== 0) {
          expect(idx).toBe(prevIdx + 1)
        }
      }
      prevIdx = idx
      utc = c.to_tempos(utc).d.next_at + 3600000
    }
  })

  test.each([
    ['バビロニア暦ベール', Calendar.バビロニア暦ベール],
    ['アラトゥルカ', Calendar.アラトゥルカ],
  ])('%s は月頭直後の区間でも0日目以下の不正な日番号を出さない', (_name, c) => {
    // dayBoundary(18) は固定オフセットなので、月頭からオフセット分の区間は
    // 毎月確実にこの「切り詰め前」区間になる(dusk() の実日没は季節依存で
    // 毎月発生するとは限らないため、確実に再現できるこの2暦だけを対象にする)。
    // 月頭のごく直後を狙って d.now_idx が負にならないことを確認する
    // (development-notes.md 参照、以前は "-1" が format() で "0日" という
    // 不正な表示になり、その文字列を parse() し直すと前の月に化ける実バグが
    // あった)。
    let utc = c.parse('5年1月1日', 'y年M月d日')
    for (let i = 0; i < 12; i++) {
      const t = c.to_tempos(utc)
      const probe = t.M.last_at + 1000
      const probed = c.to_tempos(probe)
      expect(probed.d.now_idx).toBeGreaterThanOrEqual(0)
      expect(Number(c.format(probe, 'd'))).toBeGreaterThanOrEqual(1)
      utc = t.M.next_at + 3600000
    }
  })
})
