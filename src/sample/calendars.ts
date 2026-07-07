import { FancyDate } from '../fancy-date'
import type { PLANET } from '../fancy-date'
import { jpn, mod, old_jpn, roman } from '../number'
import { localTimezoneDeg } from '../time'
import { 北朝元号 } from './eras'
import {
  七曜,
  七曜かな,
  九星,
  九星かな,
  九星rev,
  九星かなrev,
  二十七宿,
  二十七宿かな,
  二十八宿,
  二十八宿かな,
  二十四節季,
  二十四節季かな,
  六曜,
  六曜かな,
  十干,
  十干かな,
  十二支,
  十二支かな,
  和風月名,
  和風月名かな,
  ロムルス月ラベルラテン語,
  ロムルス月ラベルラテン語かな,
  マヤツォルキン,
  マヤハアブ,
  マヤハアブ日,
  エジプト月名,
  コプト月名,
  月相,
  月相かな,
  時鐘,
  時鐘かな,
} from './locale'
import {
  Alexandria,
  Cairo,
  London,
  Madurai,
  Paris,
  Romus,
  Jaypore,
  zürich,
  カリスト,
  太陽,
  天文東京,
  東京,
  火星,
  月,
} from './astro'

// ---  -  I  L -OP R TUVWX -
// --- efghijkl no qr t v   z

const g = new FancyDate()
  .spot(...London)
  .era('西暦', '紀元前')
  .calendar(
    ['1970年 木-斗 庚戌-辛巳', 'y年 E-V a-A', 0],
    [4, 100, 400],
    [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  )
  .algo({
    M: [12],
    H: [24],
    m: [60],
    s: [60],

    N: [月相, 月相かな],

    E: [七曜, 七曜かな],
    V: [二十八宿, 二十八宿かな],
    Z: [二十四節季, 二十四節季かな],

    a: [60],
    A: [60],
    B: [十二支, 十二支かな],
    C: [十干, 十干かな],
  })
  .init()

const UTC = g
const Gregorian = g
  .dup()
  .spot(...東京)
  .init()

const GregorianAstronomical = g
  .dup()
  .spot(...天文東京)
  .init()

/**
 * LocalGregorian: ブラウザ(実行環境)のタイムゾーンを反映した「現地グレゴリオ暦」。
 *
 * Gregorian は東京固定(spot(...東京))のため、そのまま使うと東京以外の
 * タイムゾーンでは「今日」「今週」の区切りがズレる。Gregorian は
 * daily('Sunny')(日の出・日の入りに基づく不定時法)を使っていないため
 * 緯度・経度には依存せず、タイムゾーンだけ差し替えれば動的に「現地版」を
 * 作れる(dup().spot(...) は fancy-date が「同じ暦を別地点/別タイムゾーンで
 * 複製する」ために元々用意している機構)。
 *
 * timezoneDeg(経度換算)は localTimezoneDeg() が実行環境から算出する
 * (ブラウザ以外では東京 UTC+9 を既定値とする)。
 */
const LocalGregorian = Gregorian.dup().spot(月, 0, 0, localTimezoneDeg()).init()

const Julian = g
  .dup()
  .spot(...Romus)
  .calendar(
    ['1582/10/5(金) 壬午-甲戌', 'y/M/d(E) a-A', g.parse('1582年10月15日')!],
    [4],
    [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  )
  .init()

const アマンタ = g
  .dup()
  .spot(...Madurai)
  .era('サカ歴', '紀元前')
  .calendar(['1891-09-08(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(E) a-A f-F', 0])
  .daily('Rise')
  .algo({
    f: [九星, 九星かな],
    F: [九星rev, 九星かなrev],
  })
  .init()

const プールニマンタ = g
  .dup()
  .spot(...Jaypore)
  .era('サカ歴', '紀元前')
  .calendar(['1891-09-23(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(E) a-A f-F', 0])
  .daily('Rise')
  .algo({
    f: [九星, 九星かな],
    F: [九星rev, 九星かなrev],
  })
  .init()

// 和暦の日付(d)は最大30日(旧暦の大の月)。漢字表現(do)・日付のふりがな
// 表現(dr)を list/rubys に静的展開しておく(bare の d は算用数字のまま
// 変えない)。年(y)は無界のため同じ list/rubys 方式が使えず、
// .numeral_label() 経由で yo/yr に別途「漢字表現」「日付以外のふりがな
// 表現」(old_jpn ではなく jpn.rubys——年のような3桁4桁の数は和語の
// 数え方(old_jpn)の対象外で漢語系の読みが自然なため)を割り当てる。
const 和暦日付漢字 = Array.from({ length: 30 }, (_, i) => jpn.漢字.parse(i + 1))
const 和暦日付ふりがな = Array.from({ length: 30 }, (_, i) => old_jpn.rubys.語尾('か').parse(i + 1))

const 平気法 = g
  .dup()
  .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
  .spot(...東京)
  .era('皇紀', '紀元前', 北朝元号)
  // 日干支(A)がグレゴリオ暦(実測で2020年1月22日=甲子という既知の事実と
  // 一致することを確認済み)に対して常に+6(60日周期、anchor の日付
  // "7日"の0始まり index と一致)ずれていた。真因は anchor 側ではなく
  // `def_zero()` 側にあった: E/F/C/B/A/V の各日次巡回トークンのゼロ点を
  // 「既に-idx.d日ぶんシフト済みの `day`」を起点に計算していたため、
  // d(暦日)自身のシフト分が二重に効いていた(修正はfancy-date.tsのdef_zero()、
  // development-notes.md参照)。真因を修正したので、anchor の A は
  // 本来の(2629年12月7日の実際の日干支である)辛巳に戻す。
  .calendar(['2629年12月7日 赤口-昴 己酉-辛巳 九紫火-七赤金', 'y年M月d日 E-V a-A f-F', 0])
  .daily('Sunny')
  .numeral_label(jpn.漢字, jpn.rubys)
  .algo({
    E: [六曜, 六曜かな],
    V: [二十七宿, 二十七宿かな],
    M: [和風月名, 和風月名かな],
    d: [和暦日付漢字, 和暦日付ふりがな, '日'],
    H: [時鐘, 時鐘かな, '刻'],
    m: [
      ['', '半'],
      ['', 'はん'],
      ['', '半'],
    ],
    s: [3600],
    S: [1000],

    f: [九星, 九星かな],
    F: [九星rev, 九星かなrev],
  })
  .init()

const 定気法 = g
  .dup()
  .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
  .spot(...天文東京)
  .era('皇紀', '紀元前', 北朝元号)
  // 年干支(a)が平気法の同一起点(皇紀2629年=西暦1969年)と1年ずれていた
  // (戊申=1968年の干支。1969年の正しい年干支は己酉で、平気法側の
  // 起点値と一致する)。同じ皇紀年を起点にしている以上、年干支は暦の
  // 計算方式(定気法/平気法)に依存しない実年の事実なので揃うはずであり、
  // 誤って戊申になっていたのはサンプルの初期値定義側の誤り(実測:
  // 2024年3月10日時点で定気法だけ年干支が1年分過去にずれていた)。
  // 日干支(A)も同様にグレゴリオ暦(2020年1月22日=甲子の既知の事実と一致
  // 済み)に対して常に+23(60日周期、anchor の日付"24日"の0始まりindexと
  // 一致)ずれていたが、これも真因は `def_zero()` 側(平気法のコメント
  // 参照)。真因を修正したので、anchor の A は本来の(2629年11月24日の
  // 実際の日干支である)辛巳に戻す。
  .calendar(['2629年11月24日 仏滅-房 己酉-辛巳 一白水-七赤金', 'y年M月d日 E-V a-A f-F', 0])
  .daily('Sunny')
  .numeral_label(jpn.漢字, jpn.rubys)
  .algo({
    E: [六曜, 六曜かな],
    V: [二十七宿, 二十七宿かな],
    M: [和風月名, 和風月名かな],
    d: [和暦日付漢字, 和暦日付ふりがな, '日'],
    H: [時鐘, 時鐘かな, '刻'],
    m: [
      ['', '半'],
      ['', 'はん'],
      ['', '半'],
    ],
    s: [3600],
    S: [1000],

    f: [九星, 九星かな],
    F: [九星rev, 九星かなrev],
  })
  .init()

const Romulus = g
  .dup()
  // M(サフィックスなし)は常に数値のまま(def_to_label() 参照)なので、
  // 暦外ラベルを反映するには Mo(list 参照あり)を明示的に使う書式に
  // する必要がある。既定の 'Gy年M月d日...' のような「M+リテラル月」
  // の組み合わせのままだと、Mo に変えても暦外の位置で「暦外月1日」の
  // ような不自然な表示になるため、月を表す助字自体を書式から外す。
  // parse は他の暦(平気法/定気法等)と同様、format より要素を絞った
  // 最小形にする(曜日(E)や干支(a-A)は表示専用の付加情報であり、
  // parse 側にまで同じ要素を含めると、その通りの文字列でなければ
  // parse できなくなり format() の出力と噛み合わなくなる)。
  .lang('y年Mo d日', 'Gy年Mo d日(E)H時m分s秒')
  .spot(...Romus)
  .era('ロムルス暦', '紀元前')
  .calendar(['754年1月16日(H) 辛酉-己亥', 'y年M月d日(E) a-A', g.parse('1年3月22日')!], null, [
    31,
    30,
    31,
    30,
    31,
    30,
    30,
    31,
    30,
    30,
    null,
  ])
  .algo({
    // 11番目(month_divs の null が担う可変長月、約60日)は暦月ではなく
    // 冬籠もりのための暦外期間(10月の後に置かれるのは正しい配置)。
    // 伝統的なロムルス暦の月名(ラテン語、Martius〜December)を割り当て、
    // 11番目だけ「暦外」ラベルにする(ロムルス月ラベルラテン語/
    // ロムルス月ラベルラテン語かな のドキュメント参照。数値のみ版が
    // 欲しい場合は ロムルス月ラベル数値/ロムルス月ラベル数値かな に
    // 差し替える)。上の .lang() で Mo(list 参照あり)を使う書式に
    // しているため、通常の月はラテン語名、11番目は「暦外」になる。
    M: [ロムルス月ラベルラテン語, ロムルス月ラベルラテン語かな],
    E: [[...'ABCDEFGH'], null] as const,
  })
  .init()

// Gregorianは太陽暦なので、衛星未定義でもよい
const MarsGregorian = g
  .dup()
  .spot(火星, 35, 0, 0)
  .era('西暦', '紀元前')
  .calendar(
    ['1年(火) 壬子-辛巳', 'y年(E) a-A', g.parse('0年4月1日')!], // 春分が３月くらいになるよう、恣意的に決めました。
    [1, 7, 70],
  )
  .algo({
    M: [20],
  })
  .init()

const Jupiter = g
  .dup()
  .spot(カリスト, 35, 0, 0)
  .era('西暦', '紀元前')
  .calendar(
    ['1年(火) 壬子-辛巳', 'y年(E) a-A', g.parse('0年4月1日')!], // 春分が３月くらいになるよう、恣意的に決めました。
  )
  .algo({
    H: [10],
    M: [260],
    N: [40],
    Z: [520],
  })
  .init()

const フランス革命暦 = g
  .dup()
  .spot(...Paris)
  .era('革命暦', '紀元前')
  .calendar(
    ['1年1月1日 1曜 壬子-癸酉', 'y年M月d日 E曜 a-A', g.parse('1792年9月22日')!],
    [4, 100, 400],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
  )
  .algo({
    M: [
      [
        '葡萄月',
        '霧月',
        '霜月',
        '雪月',
        '雨月',
        '風月',
        '芽月',
        '花月',
        '牧月',
        '収穫月',
        '熱月',
        '実月',
        '休日',
      ],
      [
        'Vendémiaire',
        'Brumaire',
        'Frimaire',
        'Nivôse',
        'Pluviôse',
        'Ventôse',
        'Germinal',
        'Floréal',
        'Prairial',
        'Messidor',
        'Thermidor',
        'Fructidor',
        'Vacances',
      ],
    ] as const,
    H: [10],
    m: [100],
    s: [100],

    E: [10],
  })
  .init()

const マヤ暦地球: PLANET = [太陽, [365 * 86400000, 0], [86400000, 0, 0]] as const
const マヤ長期暦13バクトゥン = 13 * 144000
const マヤ長期暦基準日 = g.parse('2012年12月21日')!

const Maya = g
  .dup()
  .lang('Gy年Mod日', 'Mo do')
  .spot(マヤ暦地球, 0, 0, 0)
  .era('', '')
  .calendar(['0年Kankin3日', 'y年Mod日', マヤ長期暦基準日], null, [
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    null,
  ])
  .algo({
    M: [マヤハアブ, null],
    d: [マヤハアブ日, null],
  })
  .init()

function mayaKin(utc: number) {
  return Math.floor((utc - マヤ長期暦基準日) / 86400000) + マヤ長期暦13バクトゥン
}

export function mayaLongCount(utc: number) {
  let kin = mayaKin(utc)
  const baktun = Math.floor(kin / 144000)
  kin -= baktun * 144000
  const katun = Math.floor(kin / 7200)
  kin -= katun * 7200
  const tun = Math.floor(kin / 360)
  kin -= tun * 360
  const uinal = Math.floor(kin / 20)
  kin -= uinal * 20
  return `${baktun}.${katun}.${tun}.${uinal}.${kin}`
}

export function mayaTzolkin(utc: number) {
  const kin = mayaKin(utc)
  const number = mod(kin + 3, 13) + 1
  const name = マヤツォルキン[mod(kin + 19, 20)]
  return `${number} ${name}`
}

export function mayaHaab(utc: number) {
  const kin = mayaKin(utc)
  const dayOfYear = mod(kin + 348, 365)
  const monthIndex = Math.floor(dayOfYear / 20)
  const day = dayOfYear - monthIndex * 20
  const name = マヤハアブ[monthIndex]
  return `${day} ${name}`
}

const Beat = g
  .dup()
  .spot(...zürich)
  .era('@', '紀元前')
  .algo({
    H: [1000],
    m: [100],
  })
  .init()

const エジプト民用暦地球: PLANET = [太陽, [365 * 86400000, 0], [86400000, 0, 0]] as const
const ナボナサル紀元 = Julian.parse('紀元前747年2月26日')
const エジプト民用暦 = g
  .dup()
  .spot(エジプト民用暦地球, Cairo[1], Cairo[2], Cairo[3])
  .era('ナボナサル紀元', '紀元前')
  .calendar(
    ['1年トート1日', 'y年Mod日', ナボナサル紀元],
    [],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
  )
  .algo({
    M: [エジプト月名, null],
  })
  .init()

const コプト暦 = g
  .dup()
  .spot(...Alexandria)
  .era('コプト暦', '紀元前')
  .calendar(
    ['1736年トウト1日', 'y年Mod日', g.parse('2019年9月11日')!],
    [4],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
    3,
  )
  .algo({
    M: [コプト月名, null],
  })
  .init()

/**
 * RomanClock: 時計の文字盤で定番のローマ数字表示を試すためのサンプル暦。
 * Gregorian をそのまま複製し、数詞辞書だけ roman.upper に差し替えている。
 *
 * 現状の .numeral() は暦全体で1つの Numeral しか割り当てられない
 * (トークンごとに数詞を出し分ける仕組みは未実装、docs/numeral-design.md
 * 参照)ため、H(時)だけでなく y/M/d 等も roman.upper で描画される。
 * ローマ数字には 0 の表記が無い(roman.parse(0) は素通しの '0' を返す)
 * ため、0時・ちょうど0分のような値は数字のまま表示される——これは
 * ローマ数字という記法自体の制約であり、このサンプル固有の不具合ではない。
 */
const RomanClock = Gregorian.dup().numeral(roman.upper).init()

export const Calendar = {
  UTC,
  Gregorian,
  GregorianAstronomical,
  LocalGregorian,
  Julian,
  アマンタ,
  プールニマンタ,
  平気法,
  定気法,
  Romulus,
  MarsGregorian,
  Jupiter,
  フランス革命暦,
  Maya,
  Beat,
  エジプト民用暦,
  コプト暦,
  RomanClock,
}
