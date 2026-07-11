"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY = exports.HOUR = exports.MINUTE = exports.SECOND = void 0;
exports.to_tempo_bare = to_tempo_bare;
exports.to_tempo_by = to_tempo_by;
exports.to_msec = to_msec;
exports.to_timezone_deg = to_timezone_deg;
exports.localTimezoneDeg = localTimezoneDeg;
exports.to_sec = to_sec;
const tempo_1 = require("./tempo");
// SI単位系ベースの物理的な時間量。naoj/astro-math.ts のユリウス日計算等、
// 暦を介さない生の天文計算(本体)が実際に使う。
exports.SECOND = to_msec('1s');
exports.MINUTE = to_msec('1m');
exports.HOUR = to_msec('1h');
exports.DAY = to_msec('1d');
/**
 * Tempo(旧 TempoView。class Tempo は本ファイルから削除され、
 * tempo.ts(旧 tempo-model.ts)の TempoView が Tempo としてリネームされた)は
 * envelope(zero/now_idx/last_at/next_at)+base(write_at)+rule の
 * 組み合わせで succ()/back()/slide() を実現する。
 *
 * round/ceil/to_list/upto(探索を伴う旧 Tempo のメソッド)は、
 * 呼び出し元がゼロ(コードベース内で一切使われていなかった)と確認の上、
 * FloorTempoRule 等の新設計に役割が引き継がれたため移植していない。
 * deg/is_hit/tick/sleep(呼び出し元は同様にゼロだが、単純な式のため
 * 後方互換のために温存)は TempoView 側に移植済み。
 *
 * WEEK/YEAR/tempo_zero/to_tempo(文字列指定版)は、かつてここに存在したが
 * 削除した。SECOND/MINUTE/HOUR/DAY(上記、本体が実際に使う物理定数)とは異なり、
 * これらは実質的にグレゴリオ暦(1週=7日という文化的な区切り、暦の平均年、
 * 曜日起点でタイムゾーンを考慮した zero 値)を暗黙の前提にした値であり、
 * fancy-date 自身が「暦は FancyDate のインスタンスとして表現する」という
 * 思想と矛盾していた(実際、本体からは一切参照されておらず、外部向けの
 * 飾りとして残っていただけだった)。これらが必要な場面では
 * Calendar.Gregorian.calc.msec.{year,week} /
 * Calendar.Gregorian.calc.zero.{day,week,...} を直接使う(暦の定義から
 * 導出された値を使うことで、YEAR=31556925.147(固定近似)のような不正確さも
 * 生まれない)。
 */
function to_tempo_bare(size, zero, write_at_src) {
    const write_at = Number(write_at_src);
    return tempo_1.Tempo.at(new tempo_1.FixedTempoRule(size, zero), { write_at });
}
function to_tempo_by(table, zero, write_at) {
    return tempo_1.Tempo.at(new tempo_1.TableTempoRule(table, zero), { write_at });
}
function to_msec(str, options) {
    return 1000 * to_sec(str, options);
}
/**
 * 時差(分)を timezoneDeg(経度換算: 15度 = 1時間、360度 = 1日)へ変換する。
 * spot(body, lat, lng, timezoneDeg) の第4引数にそのまま渡せる。
 *
 * Date#getTimezoneOffset() は「UTC より遅れている分数」を返す(例: 東京 UTC+9 は
 * -540)ため、符号を反転してから経度に換算する。
 */
function to_timezone_deg(offsetMinutes) {
    return (-offsetMinutes / 60) * 15;
}
/**
 * 実行環境(ブラウザ)のタイムゾーンを timezoneDeg として得る。
 * spot(body, lat, lng, localTimezoneDeg()) のように使い、暦を現地時刻へ合わせる。
 *
 * window が無い環境(SSR 等)では getTimezoneOffset() を参照できないため
 * fallbackDeg を返す(既定は東京 = UTC+9 = 135度)。
 */
function localTimezoneDeg(fallbackDeg = 15 * 9) {
    const has_window = 'undefined' !== typeof window && window !== null;
    if (!has_window)
        return fallbackDeg;
    return to_timezone_deg(new Date().getTimezoneOffset());
}
function to_sec(str, { strict = false } = {}) {
    let timeout = 0;
    let consumed = '';
    str.replace(/(\d+)(([ヶヵかカケ箇]?月|[smhdwy秒分時日週年])[間]?(半$)?)|0/g, (full, num_str, _fullunit, unit, appendix) => {
        consumed += full;
        let num = Number(num_str);
        if (!num)
            return '';
        if ('半' === appendix)
            num += 0.5;
        let unit_size = 0;
        switch (unit) {
            case 's':
            case '秒':
                unit_size = 1;
                break;
            case 'm':
            case '分':
                unit_size = 60;
                break;
            case 'h':
            case '時':
                unit_size = 3600;
                break;
            case 'd':
            case '日':
                unit_size = 3600 * 24;
                break;
            case 'w':
            case '週':
                unit_size = 3600 * 24 * 7;
                break;
            case '月':
            case 'ヶ月':
            case 'ヵ月':
            case 'か月':
            case 'カ月':
            case 'ケ月':
            case '箇月':
                throw new Error(`variable-length unit 月 is not supported by to_msec: ${str}`);
            case 'y':
            case '年':
                unit_size = 31556925.147;
                break;
            // 2019 average.
            default:
                throw new Error(`${str} at ${num}${unit}`);
        }
        timeout += num * unit_size;
        return '';
    });
    if (strict && consumed !== str) {
        throw new Error(`invalid duration ${str}`);
    }
    return timeout;
}
//# sourceMappingURL=time.js.map