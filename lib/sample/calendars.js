'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Calendar = void 0
exports.mayaLongCount = mayaLongCount
exports.mayaTzolkin = mayaTzolkin
exports.mayaHaab = mayaHaab
const fancy_date_1 = require('../fancy-date')
const number_1 = require('../number')
const time_1 = require('../time')
const eras_1 = require('./eras')
const locale_1 = require('./locale')
const astro_1 = require('./astro')
// ---  -  I  L -OP R TUVWX -
// --- efghijkl no qr t v   z
const g = new fancy_date_1.FancyDate()
  .spot(...astro_1.London)
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
    N: [locale_1.月相, locale_1.月相かな],
    E: [locale_1.七曜, locale_1.七曜かな],
    V: [locale_1.二十八宿, locale_1.二十八宿かな],
    Z: [locale_1.二十四節季, locale_1.二十四節季かな],
    a: [60],
    A: [60],
    B: [locale_1.十二支, locale_1.十二支かな],
    C: [locale_1.十干, locale_1.十干かな],
  })
  .init()
const UTC = g
const Gregorian = g
  .dup()
  .spot(...astro_1.東京)
  .init()
const GregorianAstronomical = g
  .dup()
  .spot(...astro_1.天文東京)
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
const LocalGregorian = Gregorian.dup()
  .spot(astro_1.月, 0, 0, (0, time_1.localTimezoneDeg)())
  .init()
const Julian = g
  .dup()
  .spot(...astro_1.Romus)
  .calendar(
    ['1582/10/5(金) 壬午-甲戌', 'y/M/d(E) a-A', g.parse('1582年10月15日')],
    [4],
    [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  )
  // ローマの市民生活は共和政期からユリウス暦採用後の帝政期を通じて不定時法
  // (horae temporariae、日の出・日の入りを基準に昼夜それぞれを分割する時刻法)
  // だった。等時法が civil に定着するのは中世後期(14〜15世紀、機械式時計の
  // 普及後)であり、ユリウス暦そのものが使われていた期間の大半は不定時法と
  // 組み合わさっていたと考えるのが史実に近い。ローマ(北緯42度)は極域ガード
  // (66.5度)の対象外。
  .daily('Sunny')
  .init()
const アマンタ = g
  .dup()
  .spot(...astro_1.Madurai)
  .era('サカ歴', '紀元前')
  .calendar(['1891-09-08(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(E) a-A f-F', 0])
  .daily('Rise')
  .algo({
    f: [locale_1.九星, locale_1.九星かな],
    F: [locale_1.九星rev, locale_1.九星かなrev],
  })
  .init()
const プールニマンタ = g
  .dup()
  .spot(...astro_1.Jaypore)
  .era('サカ歴', '紀元前')
  .calendar(['1891-09-23(木) 庚戌-辛巳 三碧木-七赤金', 'y-M-d(E) a-A f-F', 0])
  .daily('Rise')
  .algo({
    f: [locale_1.九星, locale_1.九星かな],
    F: [locale_1.九星rev, locale_1.九星かなrev],
  })
  .init()
// 和暦の日付(d)は最大30日(旧暦の大の月)。漢字表現(do)・日付のふりがな
// 表現(dr)を list/rubys に静的展開しておく(bare の d は算用数字のまま
// 変えない)。年(y)は無界のため同じ list/rubys 方式が使えず、
// .numeral_label() 経由で yo/yr に別途「漢字表現」「日付以外のふりがな
// 表現」(old_jpn ではなく jpn.rubys——年のような3桁4桁の数は和語の
// 数え方(old_jpn)の対象外で漢語系の読みが自然なため)を割り当てる。
const 和暦日付漢字 = Array.from({ length: 30 }, (_, i) => number_1.jpn.漢字.parse(i + 1))
const 和暦日付ふりがな = Array.from({ length: 30 }, (_, i) =>
  number_1.old_jpn.rubys.語尾('か').parse(i + 1),
)
const 平気法 = g
  .dup()
  .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
  .spot(...astro_1.東京)
  .era('皇紀', '紀元前', eras_1.北朝元号)
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
  .numeral_label(number_1.jpn.漢字, number_1.jpn.rubys)
  .algo({
    E: [locale_1.六曜, locale_1.六曜かな],
    V: [locale_1.二十七宿, locale_1.二十七宿かな],
    M: [locale_1.和風月名, locale_1.和風月名かな],
    d: [和暦日付漢字, 和暦日付ふりがな, '日'],
    H: [locale_1.時鐘, locale_1.時鐘かな, '刻'],
    m: [
      ['', '半'],
      ['', 'はん'],
      ['', '半'],
    ],
    s: [3600],
    S: [1000],
    f: [locale_1.九星, locale_1.九星かな],
    F: [locale_1.九星rev, locale_1.九星かなrev],
  })
  .init()
const 定気法 = g
  .dup()
  .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
  .spot(...astro_1.天文東京)
  .era('皇紀', '紀元前', eras_1.北朝元号)
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
  .numeral_label(number_1.jpn.漢字, number_1.jpn.rubys)
  .algo({
    E: [locale_1.六曜, locale_1.六曜かな],
    V: [locale_1.二十七宿, locale_1.二十七宿かな],
    M: [locale_1.和風月名, locale_1.和風月名かな],
    d: [和暦日付漢字, 和暦日付ふりがな, '日'],
    H: [locale_1.時鐘, locale_1.時鐘かな, '刻'],
    m: [
      ['', '半'],
      ['', 'はん'],
      ['', '半'],
    ],
    s: [3600],
    S: [1000],
    f: [locale_1.九星, locale_1.九星かな],
    F: [locale_1.九星rev, locale_1.九星かなrev],
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
  .spot(...astro_1.Romus)
  .era('ロムルス暦', '紀元前')
  .calendar(['754年1月16日(H) 辛酉-己亥', 'y年M月d日(E) a-A', g.parse('1年3月22日')], null, [
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
    M: [locale_1.ロムルス月ラベルラテン語, locale_1.ロムルス月ラベルラテン語かな],
    E: [[...'ABCDEFGH'], null],
  })
  // Julian と同じ理由(horae temporariae、development-notes.md 参照)で
  // ロムルス暦の時代のローマも不定時法だった。
  .daily('Sunny')
  .init()
// バビロニア暦: 太陰太陽暦(12ヶ月+閏月、当初は観測ベースで2〜3年毎に
// 不規則な閏月挿入、前499年頃から19年235ヶ月周期(メトン周期相当、
// ギリシャのメトンより先行)で規則化)。年数の較正(anchor の「1年」が
// 実際のどの年かの対応付け)は史料に基づく精密な換算をしていない
// illustrative な値であり、MarsGregorian/Jupiter と同じ「恣意的に決めた」
// 位置づけ(development-notes.md 参照)。暦法自体は平気法と同じ mean モデル
// (東京と同様 月 を衛星に使う Babylon を spot に採用)。
//
// 【既知の制約】実際のバビロニア暦・イスラム暦は1日が日没始まりだが、
// 今回は実装していない(通常の真夜中起点)。当初「anchor の時刻成分を
// 18時にすれば日没相当にずらせる」という近似を試みたが、実装・検証の
// 結果これは機能しないと判明した: def_zero() は d(暦日)トークンの
// ゼロ点を「H(時)のゼロ点(anchorのH値を差し引いて求める、必然的に
// 真夜中に一致する)」から日単位でしか移動できず、anchor に書いた時刻
// 成分は単に「その暦日の中の何時何分か」を較正するだけで、暦日の境界
// 自体は動かせない(実測で確認済み)。真に日没起点の暦日境界を実装
// するには、日ごとに実際の日没時刻(daily('Sunny')が使うのと同種の
// 天文計算)を境界として使う新しい仕組みが要り、今回のスコープを超える
// ため見送った(development-notes.md 参照)。
//
// 時刻は二重体系だったため、別の暦として分ける(development-notes.md
// 参照): カスプ(季節で伸縮する不定時法、daily('Sunny')で表現)と
// ベール(2時間ぶんの等時法、1日=12ベール、H:[12]で表現)。
const バビロニア暦カスプ = g
  .dup()
  .lang('y年M月d日', 'y年M月d日(E) H時m分s秒')
  .spot(...astro_1.Babylon)
  .era('バビロニア紀元', '紀元前')
  .calendar(['1年1月1日', 'y年M月d日', 0])
  .daily('Sunny')
  .algo({
    M: [locale_1.バビロニア月名, locale_1.バビロニア月名かな],
  })
  .init()
const バビロニア暦ベール = バビロニア暦カスプ
  .dup()
  .daily(false)
  .algo({
    H: [12],
  })
  .init()
// オスマン帝国の時刻制度: "alaturka" という呼称自体が時代によって意味を
// 変えているため(development-notes.md 参照)、2つの別名で分ける。
// どちらも日付構造はユリウス暦(ルーミー暦相当の簡略化、史実のルーミー暦
// 独自の月名・紀年法までは再現していない)を流用し、時刻体系だけを
// 変える。バビロニア暦と同じ理由(既知の制約、上記コメント参照)で
// 日没起点の暦日境界は実装していない(通常の真夜中起点)。
//
// オスマン季節時法: 初期イスラム世界に広く見られた季節時法の伝統
// (昼夜それぞれ12不等分)。daily('Sunny')と同じ機構で再現できる。
const オスマン季節時法 = Julian.dup()
  .spot(...astro_1.Istanbul)
  .era('ヒジュラ紀元', '紀元前')
  .daily('Sunny')
  .init()
// アラトゥルカ: 機械式時計普及後、alafranga(西洋式、真夜中起点)と
// 1926年の共和国暦改革まで併存した、より狭義の「alaturka」。史実では
// 1時間の長さ自体は等時法のまま日付・時刻の起点だけ日没にリセット
// されるが、上記の制約により起点は真夜中のままで、等時法である点のみ
// 再現している。
const アラトゥルカ = オスマン季節時法.dup().daily(false).init()
// Gregorianは太陽暦なので、衛星未定義でもよい
const MarsGregorian = g
  .dup()
  .spot(astro_1.火星, 35, 0, 0)
  .era('西暦', '紀元前')
  .calendar(
    ['1年(火) 壬子-辛巳', 'y年(E) a-A', g.parse('0年4月1日')], // 春分が３月くらいになるよう、恣意的に決めました。
    [1, 7, 70],
  )
  .algo({
    M: [20],
  })
  .init()
const Jupiter = g
  .dup()
  .spot(astro_1.カリスト, 35, 0, 0)
  .era('西暦', '紀元前')
  .calendar(['1年(火) 壬子-辛巳', 'y年(E) a-A', g.parse('0年4月1日')])
  .algo({
    H: [10],
    M: [260],
    N: [40],
    Z: [520],
  })
  .init()
const フランス革命暦 = g
  .dup()
  .spot(...astro_1.Paris)
  .era('革命暦', '紀元前')
  .calendar(
    ['1年1月1日 1曜 壬子-癸酉', 'y年M月d日 E曜 a-A', g.parse('1792年9月22日')],
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
    ],
    H: [10],
    m: [100],
    s: [100],
    E: [10],
  })
  .init()
const マヤ暦地球 = [astro_1.太陽, [365 * 86400000, 0], [86400000, 0, 0]]
const マヤ長期暦13バクトゥン = 13 * 144000
const マヤ長期暦基準日 = g.parse('2012年12月21日')
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
    M: [locale_1.マヤハアブ, null],
    d: [locale_1.マヤハアブ日, null],
  })
  .init()
function mayaKin(utc) {
  return Math.floor((utc - マヤ長期暦基準日) / 86400000) + マヤ長期暦13バクトゥン
}
function mayaLongCount(utc) {
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
function mayaTzolkin(utc) {
  const kin = mayaKin(utc)
  const number = (0, number_1.mod)(kin + 3, 13) + 1
  const name = locale_1.マヤツォルキン[(0, number_1.mod)(kin + 19, 20)]
  return `${number} ${name}`
}
function mayaHaab(utc) {
  const kin = mayaKin(utc)
  const dayOfYear = (0, number_1.mod)(kin + 348, 365)
  const monthIndex = Math.floor(dayOfYear / 20)
  const day = dayOfYear - monthIndex * 20
  const name = locale_1.マヤハアブ[monthIndex]
  return `${day} ${name}`
}
const Beat = g
  .dup()
  .spot(...astro_1.zürich)
  .era('@', '紀元前')
  .algo({
    H: [1000],
    m: [100],
  })
  .init()
const エジプト民用暦地球 = [astro_1.太陽, [365 * 86400000, 0], [86400000, 0, 0]]
const ナボナサル紀元 = Julian.parse('紀元前747年2月26日')
const エジプト民用暦 = g
  .dup()
  .spot(エジプト民用暦地球, astro_1.Cairo[1], astro_1.Cairo[2], astro_1.Cairo[3])
  .era('ナボナサル紀元', '紀元前')
  .calendar(
    ['1年トート1日', 'y年Mod日', ナボナサル紀元],
    [],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
  )
  .algo({
    M: [locale_1.エジプト月名, null],
  })
  .init()
const コプト暦 = g
  .dup()
  .spot(...astro_1.Alexandria)
  .era('コプト暦', '紀元前')
  .calendar(
    ['1736年トウト1日', 'y年Mod日', g.parse('2019年9月11日')],
    [4],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null],
    3,
  )
  .algo({
    M: [locale_1.コプト月名, null],
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
const RomanClock = Gregorian.dup().numeral(number_1.roman.upper).init()
exports.Calendar = {
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
  バビロニア暦カスプ,
  バビロニア暦ベール,
  オスマン季節時法,
  アラトゥルカ,
}
//# sourceMappingURL=calendars.js.map
