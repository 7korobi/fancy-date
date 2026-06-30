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
    M: [11],
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
const エジプト民用暦 = g
    .dup()
    .spot(エジプト民用暦地球, 30, 31, 30)
    .era('エジプト暦', '紀元前')
    .calendar(['1年トート1日', 'y年Mod日', g.parse('1900年9月11日')], [], [
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
exports.Calendar = {
    UTC,
    Gregorian,
    GregorianAstronomical,
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
};
//# sourceMappingURL=calendars.js.map