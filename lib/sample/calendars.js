"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Calendar = void 0;
exports.mayaLongCount = mayaLongCount;
exports.mayaTzolkin = mayaTzolkin;
exports.mayaHaab = mayaHaab;
const fancy_date_1 = require("../fancy-date");
const number_1 = require("../number");
const eras_1 = require("./eras");
const locale_1 = require("./locale");
const astro_1 = require("./astro");
// ---  -  I  L -OP R TUVWX -
// --- efghijkl no qr t v   z
const g = new fancy_date_1.FancyDate()
    .spot(...astro_1.London)
    .era('西暦', '紀元前')
    .calendar(['1970年 木-斗 庚戌-辛巳', 'y年 E-V a-A', 0], [4, 100, 400], [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
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
    .init();
const UTC = g;
const Gregorian = g
    .dup()
    .spot(...astro_1.東京)
    .init();
const GregorianAstronomical = g
    .dup()
    .spot(...astro_1.天文東京)
    .init();
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
 * timezoneDeg は経度換算(15度 = 1時間)。getTimezoneOffset() は
 * 「UTCより遅れている分数」を返す(例: 東京は -540)ため符号を反転する。
 * ブラウザ以外(SSR等)では window が無いため、東京(UTC+9)を既定値とする。
 */
const has_window = 'undefined' !== typeof window && window !== null;
const timezoneOffsetMinutes = has_window ? new Date().getTimezoneOffset() : -540;
const timezoneDeg = (-timezoneOffsetMinutes / 60) * 15;
const LocalGregorian = Gregorian.dup().spot(astro_1.月, 0, 0, timezoneDeg).init();
const Julian = g
    .dup()
    .spot(...astro_1.Romus)
    .calendar(['1582/10/5(金) 壬午-甲戌', 'y/M/d(E) a-A', g.parse('1582年10月15日')], [4], [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
    .init();
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
    .init();
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
    .init();
const 平気法 = g
    .dup()
    .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
    .spot(...astro_1.東京)
    .era('皇紀', '紀元前', eras_1.北朝元号)
    .calendar(['2629年12月7日 赤口-昴 己酉-辛巳 九紫火-七赤金', 'y年M月d日 E-V a-A f-F', 0])
    .daily('Sunny')
    .algo({
    E: [locale_1.六曜, locale_1.六曜かな],
    V: [locale_1.二十七宿, locale_1.二十七宿かな],
    M: [locale_1.和風月名, locale_1.和風月名かな],
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
    .init();
const 定気法 = g
    .dup()
    .lang('Gy年Mod日', 'Gy年Mod日(E)Homo')
    .spot(...astro_1.天文東京)
    .era('皇紀', '紀元前', eras_1.北朝元号)
    .calendar(['2629年11月24日 仏滅-房 戊申-辛巳 一白水-七赤金', 'y年M月d日 E-V a-A f-F', 0])
    .daily('Sunny')
    .algo({
    E: [locale_1.六曜, locale_1.六曜かな],
    V: [locale_1.二十七宿, locale_1.二十七宿かな],
    M: [locale_1.和風月名, locale_1.和風月名かな],
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
    .init();
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
    .init();
// Gregorianは太陽暦なので、衛星未定義でもよい
const MarsGregorian = g
    .dup()
    .spot(astro_1.火星, 35, 0, 0)
    .era('西暦', '紀元前')
    .calendar(['1年(火) 壬子-辛巳', 'y年(E) a-A', g.parse('0年4月1日')], // 春分が３月くらいになるよう、恣意的に決めました。
[1, 7, 70])
    .algo({
    M: [20],
})
    .init();
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
    .init();
const フランス革命暦 = g
    .dup()
    .spot(...astro_1.Paris)
    .era('革命暦', '紀元前')
    .calendar(['1年1月1日 1曜 壬子-癸酉', 'y年M月d日 E曜 a-A', g.parse('1792年9月22日')], [4, 100, 400], [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, null])
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
    .init();
const マヤ暦地球 = [astro_1.太陽, [365 * 86400000, 0], [86400000, 0, 0]];
const マヤ長期暦13バクトゥン = 13 * 144000;
const マヤ長期暦基準日 = g.parse('2012年12月21日');
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
    .init();
function mayaKin(utc) {
    return Math.floor((utc - マヤ長期暦基準日) / 86400000) + マヤ長期暦13バクトゥン;
}
function mayaLongCount(utc) {
    let kin = mayaKin(utc);
    const baktun = Math.floor(kin / 144000);
    kin -= baktun * 144000;
    const katun = Math.floor(kin / 7200);
    kin -= katun * 7200;
    const tun = Math.floor(kin / 360);
    kin -= tun * 360;
    const uinal = Math.floor(kin / 20);
    kin -= uinal * 20;
    return `${baktun}.${katun}.${tun}.${uinal}.${kin}`;
}
function mayaTzolkin(utc) {
    const kin = mayaKin(utc);
    const number = (0, number_1.mod)(kin + 3, 13) + 1;
    const name = locale_1.マヤツォルキン[(0, number_1.mod)(kin + 19, 20)];
    return `${number} ${name}`;
}
function mayaHaab(utc) {
    const kin = mayaKin(utc);
    const dayOfYear = (0, number_1.mod)(kin + 348, 365);
    const monthIndex = Math.floor(dayOfYear / 20);
    const day = dayOfYear - monthIndex * 20;
    const name = locale_1.マヤハアブ[monthIndex];
    return `${day} ${name}`;
}
const Beat = g
    .dup()
    .spot(...astro_1.zürich)
    .era('@', '紀元前')
    .algo({
    H: [1000],
    m: [100],
})
    .init();
const エジプト民用暦地球 = [astro_1.太陽, [365 * 86400000, 0], [86400000, 0, 0]];
const ナボナサル紀元 = Julian.parse('紀元前747年2月26日');
const エジプト民用暦 = g
    .dup()
    .spot(エジプト民用暦地球, astro_1.Cairo[1], astro_1.Cairo[2], astro_1.Cairo[3])
    .era('ナボナサル紀元', '紀元前')
    .calendar(['1年トート1日', 'y年Mod日', ナボナサル紀元], [], [
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    null,
])
    .algo({
    M: [locale_1.エジプト月名, null],
})
    .init();
const コプト暦 = g
    .dup()
    .spot(...astro_1.Alexandria)
    .era('コプト暦', '紀元前')
    .calendar(['1736年トウト1日', 'y年Mod日', g.parse('2019年9月11日')], [4], [
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    null,
], 3)
    .algo({
    M: [locale_1.コプト月名, null],
})
    .init();
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
};
//# sourceMappingURL=calendars.js.map