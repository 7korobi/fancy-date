import { FancyDate, tithi, transformOrbital } from '../fancy-date'
import type { PLANET, SATELLITE } from '../fancy-date'
import { getLocale } from '../locale-registry'
import { english, jpn, old_jpn, roman, sanskrit, sizewise } from '../number'
import { localTimezoneDeg } from '../time'
import { setMayaLongCountBase } from './derived/maya'
import {
  バビロニア月名,
  バビロニア月名かな,
  ロムルス月ラベル数値,
  ロムルス月ラベルラテン語,
  ローマ時法分,
  ローマ時法時,
  マヤハアブ,
  マヤハアブ日,
  エジプト月名,
  コプト月名,
} from './locale'
import {
  Alexandria,
  Babylon,
  Cairo,
  Istanbul,
  London,
  Madurai,
  Paris,
  Romus,
  Jaypore,
  zürich,
  カリスト,
  太陽,
  天文月,
  天文東京,
  東京,
  火星,
  月,
} from './astro'

// ---  -  I  L -OP R TUVWX -
// --- efghijkl no qr t v   z

const jaLocale = getLocale('ja')!
const koLocale = getLocale('ko')!
const ja = jaLocale.vocabulary as {
  G: { current: string; past: string; eras: Parameters<FancyDate['era']>[2] }
  H: readonly [readonly string[], readonly string[], string]
  M: readonly [readonly string[], readonly string[]]
  N: readonly [readonly string[], readonly string[]]
  Z: readonly [readonly string[], readonly string[]]
  R6: readonly [readonly string[], readonly string[]]
  LM27: readonly [readonly string[], readonly string[]]
  dC7: readonly [readonly string[], readonly string[]]
  dC9: readonly [readonly string[], readonly string[]]
  dC10: readonly [readonly string[], readonly string[]]
  dC12: readonly [readonly string[], readonly string[]]
  dC28: readonly [readonly string[], readonly string[]]
  yC9: readonly [readonly string[], readonly string[]]
}

const commonNotation: Parameters<FancyDate['notation']>[0] = {
  M: [12],
  H: [24],
  m: [60],
  s: [60],

  N: ja.N,

  dC7: ja.dC7,
  dC28: ja.dC28,
  Z: ja.Z,

  yC60: [60],
  dC60: [60],
  dC12: ja.dC12,
  dC10: ja.dC10,
}

const baseCalendar = (c: FancyDate) => c.notation(commonNotation)

const numericLabels = (length: number) => Array.from({ length }, (_, index) => `${index}`)

const romanTemporalNotation: Parameters<FancyDate['notation']>[0] = {
  H: [numericLabels(24), ローマ時法時],
  m: [numericLabels(60), ローマ時法分],
}

const gregorianBase = (c: FancyDate) =>
  baseCalendar(c)
    .lang('y年M月d日', 'Gy年M月d日(E) HH:mm')
    .era('西暦', '紀元前')
    .calendar(
      ['1970年 木-斗 庚戌-辛巳', 'y年 dC7-dC28 yC60-dC60', 0],
      [4, 100, 400],
      [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    )

const g = new FancyDate((c) => gregorianBase(c).spot(...London))

const UTC = g
const Gregorian = new FancyDate(g, (c) => c.spot(...東京))

const GregorianAstronomical = new FancyDate(g, (c) => c.spot(...天文東京))

/**
 * LocalGregorian: ブラウザ(実行環境)のタイムゾーンを反映した「現地グレゴリオ暦」。
 *
 * Gregorian は東京固定(spot(...東京))のため、そのまま使うと東京以外の
 * タイムゾーンでは「今日」「今週」の区切りがズレる。Gregorian は
 * division({ H: 'solar' })(日の出・日の入りに基づく不定時法)を使っていないため
 * 緯度・経度には依存せず、タイムゾーンだけ差し替えれば動的に「現地版」を
 * 作れる(new FancyDate(暦).spot(...) で「同じ暦を別地点/別タイムゾーンで
 * 複製」できる)。
 *
 * timezoneDeg(経度換算)は localTimezoneDeg() が実行環境から算出する
 * (ブラウザ以外では東京 UTC+9 を既定値とする)。
 */
const LocalGregorian = new FancyDate(Gregorian, (c) => c.spot(月, 0, 0, localTimezoneDeg()))

const Julian = new FancyDate((c) =>
  baseCalendar(c)
    .lang('y年M月d日', 'Gy年M月d日(dC7) HH:mm')
    .spot(...Romus)
    .era('西暦', '紀元前')
    .calendar(
      ['1582/10/5(金) 壬午-甲戌', 'y/M/d(dC7) yC60-dC60', g.parse('1582年10月15日')!],
      [4],
      [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    )
    // ローマの市民生活は共和政期からユリウス暦採用後の帝政期を通じて不定時法
    // (horae temporariae、日の出・日の入りを基準に昼夜それぞれを分割する時刻法)
    // だった。等時法が civil に定着するのは中世後期(14〜15世紀、機械式時計の
    // 普及後)であり、ユリウス暦そのものが使われていた期間の大半は不定時法と
    // 組み合わさっていたと考えるのが史実に近い。ローマ(北緯42度)は極域ガード
    // (66.5度)の対象外。
    .division({ H: 'solar' })
    // H は昼夜12分割の horae temporariae として表し、m はその不定時に
    // ぶら下がる pars minuta として表示する。秒・ミリ秒は計算精度としては
    // 残るが、ローマ暦サンプルの標準表示からは外す。
    .numeral_ruby(english.lower)
    .notation(romanTemporalNotation),
)

const アマンタ = new FancyDate((c) =>
  baseCalendar(c)
    .spot(...Madurai)
    .era('サカ歴', '紀元前')
    .calendar(['1891-09-08(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(dC7) yC60-dC60 yC9-dC9', 0])
    .division({ H: 'solar' })
    .numeral_ruby(sanskrit.latin)
    .notation({
      yC9: ja.yC9,
      dC9: ja.dC9,
    }),
)

const プールニマンタ = new FancyDate((c) =>
  baseCalendar(c)
    .spot(...Jaypore)
    .era('サカ歴', '紀元前')
    .calendar(['1891-09-23(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(dC7) yC60-dC60 yC9-dC9', 0])
    .division({ H: 'solar' })
    .numeral_ruby(sanskrit.latin)
    .notation({
      yC9: ja.yC9,
      dC9: ja.dC9,
    }),
)

// 実用的なパンチャーンガ系の日付では、civil day の境界(日の出)そのものと、
// その日の d に割り当てる tithi(月太陽離角12度ごとの30分割)は別の層になる。
// dayStart('sunrise') が「日の出始まりの日」を作り、assign({ d: tithi() }) が
// その日の d index を日の出時点の tithi へ投影する。観測に寄る暦なので、
// tithi 版は mean の アマンタ/プールニマンタ から派生しつつ spot() を
// 天文月(および満月基準の天文黒分月)へ差し替える。
const 天文黒分月: SATELLITE = [
  天文月[0],
  transformOrbital(天文月[1], { phaseOffset: 0.5 }),
  天文月[2],
] as const
const アマンタティティ = new FancyDate(アマンタ, (c) =>
  c.spot(天文月, Madurai[1], Madurai[2], Madurai[3]).dayStart('sunrise').assign({ d: tithi() }),
)
const プールニマンタティティ = new FancyDate(プールニマンタ, (c) =>
  c.spot(天文黒分月, Jaypore[1], Jaypore[2], Jaypore[3]).dayStart('sunrise').assign({ d: tithi() }),
)

// 和暦の日付(d)は最大30日(旧暦の大の月)。漢字表現(do)・日付のふりがな
// 表現(dr)を list/rubys に静的展開しておく(bare の d は算用数字のまま
// 変えない)。年(y)は無界のため同じ list/rubys 方式が使えず、
// .numeral_label() 経由で yo/yr に別途「漢字表現」「日付以外のふりがな
// 表現」(old_jpn ではなく jpn.rubys——年のような3桁4桁の数は和語の
// 数え方(old_jpn)の対象外で漢語系の読みが自然なため)を割り当てる。
const 和暦日付漢字 = Array.from({ length: 30 }, (_, i) => jpn.漢字.parse(i + 1))
const 和暦日付ふりがな = Array.from({ length: 30 }, (_, i) => old_jpn.rubys.語尾('か').parse(i + 1))

const 平気法 = new FancyDate((c) =>
  baseCalendar(c)
    .lang('Gy年Mod日', 'Gy年Mod日(R6)Homo')
    .spot(...東京)
    .era(ja.G.current, ja.G.past, ja.G.eras)
    // 日干支(dC)がグレゴリオ暦(実測で2020年1月22日=甲子という既知の事実と
    // 一致することを確認済み)に対して常に+6(60日周期、anchor の日付
    // "7日"の0始まり index と一致)ずれていた。真因は anchor 側ではなく
    // `def_zero()` 側にあった: R6/dC9/dC10/dC12/dC60/LM27 の各日次ラベルのゼロ点を
    // 「既に-idx.d日ぶんシフト済みの `day`」を起点に計算していたため、
    // d(暦日)自身のシフト分が二重に効いていた(修正はfancy-date.tsのdef_zero()、
    // development-notes.md参照)。真因を修正したので、anchor の dC は
    // 本来の(2629年12月7日の実際の日干支である)辛巳に戻す。
    .calendar([
      '2629年12月7日 赤口-昴 己酉-辛巳 九紫火-七赤金',
      'y年M月d日 R6-LM27 yC60-dC60 yC9-dC9',
      0,
    ])
    .division({ H: 'solar' })
    .locale(jaLocale, {
      lang: false,
      numeral_text: 'cardinal',
      numeral_label: 'cardinal',
      numeral_label_ruby: 'cardinalRuby',
    })
    .notation({
      R6: ja.R6,
      LM27: ja.LM27,
      M: ja.M,
      d: [和暦日付漢字, 和暦日付ふりがな, '日'],
      H: ja.H,
      m: [
        ['', '半'],
        ['', 'はん'],
        ['', '半'],
      ],
      s: [3600],
      S: [1000],

      yC9: ja.yC9,
      dC9: ja.dC9,
    }),
)

const 定気法 = new FancyDate((c) =>
  baseCalendar(c)
    .lang('Gy年Mod日', 'Gy年Mod日(R6)Homo')
    .spot(...天文東京)
    .era(ja.G.current, ja.G.past, ja.G.eras)
    // 年干支(yC)が平気法の同一起点(皇紀2629年=西暦1969年)と1年ずれていた
    // (戊申=1968年の干支。1969年の正しい年干支は己酉で、平気法側の
    // 起点値と一致する)。同じ皇紀年を起点にしている以上、年干支は暦の
    // 計算方式(定気法/平気法)に依存しない実年の事実なので揃うはずであり、
    // 誤って戊申になっていたのはサンプルの初期値定義側の誤り(実測:
    // 2024年3月10日時点で定気法だけ年干支が1年分過去にずれていた)。
    // 日干支(dC)も同様にグレゴリオ暦(2020年1月22日=甲子の既知の事実と一致
    // 済み)に対して常に+23(60日周期、anchor の日付"24日"の0始まりindexと
    // 一致)ずれていたが、これも真因は `def_zero()` 側(平気法のコメント
    // 参照)。真因を修正したので、anchor の dC は本来の(2629年11月24日の
    // 実際の日干支である)辛巳に戻す。
    .calendar([
      '2629年11月24日 仏滅-房 己酉-辛巳 一白水-七赤金',
      'y年M月d日 R6-LM27 yC60-dC60 yC9-dC9',
      0,
    ])
    .division({ H: 'solar' })
    .locale(jaLocale, {
      lang: false,
      numeral_text: 'cardinal',
      numeral_label: 'cardinal',
      numeral_label_ruby: 'cardinalRuby',
    })
    .notation({
      R6: ja.R6,
      LM27: ja.LM27,
      M: ja.M,
      d: [和暦日付漢字, 和暦日付ふりがな, '日'],
      H: ja.H,
      m: [
        ['', '半'],
        ['', 'はん'],
        ['', '半'],
      ],
      s: [3600],
      S: [1000],

      yC9: ja.yC9,
      dC9: ja.dC9,
    }),
)

const Romulus = new FancyDate((c) =>
  baseCalendar(c)
    // 月本文は数値表示にし、ruby でラテン語月名(Martius〜December)を示す。
    // 暦外期間だけは数値本文では意味が薄いが、標準表示では数値規約を優先する。
    // parse は他の暦(平気法/定気法等)と同様、format より要素を絞った
    // 最小形にする(曜日(dC7)や干支(yC60-dC60)は表示専用の付加情報であり、
    // parse 側にまで同じ要素を含めると、その通りの文字列でなければ
    // parse できなくなり format() の出力と噛み合わなくなる)。
    .lang('y年M d日', 'Gy年M d日(dC8) HH:mm')
    .spot(...Romus)
    .era('ロムルス暦', '紀元前')
    .calendar(
      ['754年1月16日(H) 辛酉-己亥', 'y年M月d日(dC8) yC60-dC60', g.parse('1年3月22日')!],
      null,
      [31, 30, 31, 30, 31, 30, 30, 31, 30, 30, null],
    )
    .notation({
      // 11番目(month_divs の null が担う可変長月、約60日)は暦月ではなく
      // 冬籠もりのための暦外期間(10月の後に置かれるのは正しい配置)。
      // 通常月は数値本文にし、ラテン語月名(Martius〜December)を ruby にする。
      // 11番目だけは暦月ではないため「暦外」ラベルを本文に残す。
      M: [ロムルス月ラベル数値, ロムルス月ラベルラテン語],
      dC8: [[...'ABCDEFGH'], null] as const,
      ...romanTemporalNotation,
    })
    .numeral_ruby(english.lower)
    // Julian と同じ理由(horae temporariae、development-notes.md 参照)で
    // ロムルス暦の時代のローマも不定時法だった。
    .division({ H: 'solar' }),
)

// バビロニア暦: 太陰太陽暦(12ヶ月+閏月、当初は観測ベースで2〜3年毎に
// 不規則な閏月挿入、前499年頃から19年235ヶ月周期(メトン周期相当、
// ギリシャのメトンより先行)で規則化)。年数の較正(anchor の「1年」が
// 実際のどの年かの対応付け)は史料に基づく精密な換算をしていない
// illustrative な値であり、MarsGregorian/Jupiter と同じ「恣意的に決めた」
// 位置づけ(development-notes.md 参照)。暦法自体は平気法と同じ mean モデル
// (東京と同様 月 を衛星に使う Babylon を spot に採用)。
//
// 実際のバビロニア暦・イスラム暦は1日が日没始まり。これは2つの仕組みで
// 再現する(development-notes.md 参照)。
// - dayStart('sunset')(SolarEventDayTempoRule): 季節で変動する実際の日没
//   時刻そのものを暦日境界にする。division({ H: 'solar' })(不定時法)と表裏一体
//   なので、季節で伸縮する不定時法のカスプ側で使う。
// - dayBoundary(offsetHours): 固定オフセットで暦日境界(d/N の構築規則)
//   だけをずらす。季節に依存しない等時法のベール側で使う。
// (当初「anchor の時刻成分を18時にすれば日没相当にずらせる」という
// 近似を試みたが機能しないと判明した経緯、および dayBoundary() が
// def_zero() 全体ではなく d/N の構築規則だけに作用する理由は
// dayBoundary() 自身の doc コメント参照。)
//
// 時刻は二重体系だったため、別の暦として分ける(development-notes.md
// 参照): カスプ(季節で伸縮する不定時法、division({ H: 'solar' })+dayStart('sunset')で
// 表現)とベール(2時間ぶんの等時法、1日=12ベール、H:[12]+dayBoundary(18)
// で表現)。
const バビロニア暦カスプ = new FancyDate((c) =>
  baseCalendar(c)
    .lang('y年M月d日', 'y年M月d日(dC7) H時m分')
    .spot(...Babylon)
    .era('バビロニア紀元', '紀元前')
    .calendar(['1年1月1日', 'y年M月d日', 0])
    .division({ H: 'solar' })
    .dayStart('sunset')
    .notation({
      M: [バビロニア月名, バビロニア月名かな],
    }),
)

const バビロニア暦ベール = new FancyDate(バビロニア暦カスプ, (c) =>
  c
    .division({ H: false })
    .dayStart('midnight')
    .dayBoundary(18)
    .notation({
      H: [12],
    }),
)

// オスマン帝国の時刻制度: "alaturka" という呼称自体が時代によって意味を
// 変えているため(development-notes.md 参照)、2つの別名で分ける。
// どちらも日付構造はユリウス暦(ルーミー暦相当の簡略化、史実のルーミー暦
// 独自の月名・紀年法までは再現していない)を流用し、時刻体系だけを
// 変える。バビロニア暦と同じ理由(上記コメント参照)で dayStart()/
// dayBoundary() を使い分ける。
//
// オスマン季節時法: 初期イスラム世界に広く見られた季節時法の伝統
// (昼夜それぞれ12不等分)。division({ H: 'solar' })+dayStart('sunset')で再現できる。
const オスマン季節時法 = new FancyDate(Julian, (c) =>
  c
    .spot(...Istanbul)
    .era('ヒジュラ紀元', '紀元前')
    .division({ H: 'solar' })
    .dayStart('sunset'),
)

// アラトゥルカ: 機械式時計普及後、alafranga(西洋式、真夜中起点)と
// 1926年の共和国暦改革まで併存した、より狭義の「alaturka」。史実通り、
// 1時間の長さは等時法のまま日付・時刻の起点だけ日没にリセットする
// (dayBoundary(18))。
const アラトゥルカ = new FancyDate(オスマン季節時法, (c) =>
  c.division({ H: false }).dayStart('midnight').dayBoundary(18),
)

// Gregorianは太陽暦なので、衛星未定義でもよい
const MarsGregorian = new FancyDate((c) =>
  baseCalendar(c)
    .spot(火星, 35, 0, 0)
    .era('西暦', '紀元前')
    .calendar(
      ['1年(火) 壬子-辛巳', 'y年(dC7) yC60-dC60', g.parse('0年4月1日')!], // 春分が３月くらいになるよう、恣意的に決めました。
      [1, 7, 70],
    )
    .notation({
      M: [20],
    }),
)

const Jupiter = new FancyDate((c) =>
  baseCalendar(c)
    .spot(カリスト, 35, 0, 0)
    .era('西暦', '紀元前')
    .calendar(
      // 非地球・長周期・多分割の検算用サンプル。文化的な木星暦ではなく、
      // NaN/Infinity や境界処理の破綻を見つけるためのストレステスト暦。
      ['1年(火) 壬子-辛巳', 'y年(dC7) yC60-dC60', g.parse('0年4月1日')!],
    )
    .notation({
      H: [10],
      M: [260],
      N: [40],
      Z: [520],
    }),
)

const JupiterObserved = new FancyDate(Jupiter, (c) => c.observedLunisolar())

const フランス革命暦 = new FancyDate((c) =>
  baseCalendar(c)
    .lang('y年M月d日', 'Gy年Mo d日(dC10)')
    .spot(...Paris)
    .era('革命暦', '紀元前')
    .calendar(
      ['1年1月1日 10曜 壬子-癸酉', 'y年M月d日 dC10曜 yC60-dC60', g.parse('1792年9月22日')!],
      [4, 100, 400],
      [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
    )
    .notation({
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

      dC10: [10],
    }),
)

const マヤ暦地球: PLANET = [太陽, [365 * 86400000, 0], [86400000, 0, 0]] as const
let マヤ長期暦基準日Cache: number | undefined
function マヤ長期暦基準日() {
  if (マヤ長期暦基準日Cache == null) {
    マヤ長期暦基準日Cache = g.parse('2012年12月21日')!
    setMayaLongCountBase(マヤ長期暦基準日Cache)
  }
  return マヤ長期暦基準日Cache
}
setMayaLongCountBase(マヤ長期暦基準日)

const Maya = new FancyDate((c) =>
  baseCalendar(c)
    .lang('Gy年Mod日', 'Mo do')
    .spot(マヤ暦地球, 0, 0, 0)
    .era('', '')
    .calendar(['0年Kankin3日', 'y年Mod日', マヤ長期暦基準日()], null, [
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
    .notation({
      M: [マヤハアブ, null],
      d: [マヤハアブ日, null],
    }),
)

const Beat = new FancyDate((c) =>
  gregorianBase(c)
    .spot(...zürich)
    .era('西暦', '紀元前')
    .lang('y年M月d日', 'Gy年M月d日(E) @HHH')
    .notation({
      H: [1000],
      m: [100],
    }),
)

const 漢数字Gregorian = new FancyDate(Gregorian, (c) =>
  c.numeral(sizewise(jpn.漢字, jpn.桁読み)).numeral_ruby(jpn.rubys),
)

const 韓国語Gregorian = new FancyDate(Gregorian, (c) =>
  c.locale(koLocale, { lang: false, numeral_ruby: 'cardinalSino' }),
)

const エジプト民用暦地球: PLANET = [太陽, [365 * 86400000, 0], [86400000, 0, 0]] as const
const エジプト民用暦 = new FancyDate((c) => {
  const ナボナサル紀元 = Julian.parse('紀元前747年2月26日')
  return baseCalendar(c)
    .spot(エジプト民用暦地球, Cairo[1], Cairo[2], Cairo[3])
    .era('ナボナサル紀元', '紀元前')
    .calendar(
      ['1年トート1日', 'y年Mod日', ナボナサル紀元],
      [],
      [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
    )
    .notation({
      M: [エジプト月名, null],
    })
})

const コプト暦 = new FancyDate((c) =>
  baseCalendar(c)
    .spot(...Alexandria)
    .era('コプト暦', '紀元前')
    .calendar(
      ['1736年トウト1日', 'y年Mod日', g.parse('2019年9月11日')!],
      [4],
      [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
      3,
    )
    .notation({
      M: [コプト月名, null],
    }),
)

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
const RomanClock = new FancyDate(Gregorian, (c) => c.numeral(roman.upper))

export const Calendar = {
  UTC,
  Gregorian,
  GregorianAstronomical,
  LocalGregorian,
  Julian,
  アマンタ,
  プールニマンタ,
  アマンタティティ,
  プールニマンタティティ,
  平気法,
  定気法,
  Romulus,
  MarsGregorian,
  Jupiter,
  JupiterObserved,
  フランス革命暦,
  Maya,
  Beat,
  漢数字Gregorian,
  韓国語Gregorian,
  エジプト民用暦,
  コプト暦,
  RomanClock,
  バビロニア暦カスプ,
  バビロニア暦ベール,
  オスマン季節時法,
  アラトゥルカ,
}
