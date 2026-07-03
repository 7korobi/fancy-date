import type { OrbitalModel, RotationModel, TIMEZONE } from '../orbital-model';
import type { TempoLike } from '../tempo-model';
import { Tempo } from '../time';
export declare function solar_phase(sunny: OrbitalModel, phase: number, near: number): number;
export declare function solar_term(sunny: OrbitalModel, dayMsec: number, dayZero: number, utc: number, phase: number): Tempo;
export declare function solar_phase_before(sunny: OrbitalModel, phase: number, utc: number): number;
export declare function solar_terms(sunny: OrbitalModel, dayMsec: number, dayZero: number, utc: number): {
    立春: Tempo;
    入梅: Tempo;
    春分: Tempo;
    半夏生: Tempo;
    夏土用: Tempo;
    立夏: Tempo;
    夏至: Tempo;
    秋土用: Tempo;
    立秋: Tempo;
    秋分: Tempo;
    冬土用: Tempo;
    立冬: Tempo;
    冬至: Tempo;
    春土用: Tempo;
    次立春: Tempo;
};
export declare function noon(sunny: OrbitalModel, dayMsec: number, dayZero: number, yearMsec: number, seasonZero: number, utc: number, day?: Tempo): {
    center_at: number;
    T0: Tempo;
    T1: Tempo;
    季節: number;
    南中差分: number;
    南中時刻: number;
    真夜中: number;
    label?: string;
    table?: number[];
    zero: number;
    write_at: number;
    now_idx: number;
    last_at: number;
    next_at: number;
};
export declare function solor(sunny: OrbitalModel, earthy: RotationModel, geo: TIMEZONE, dayMsec: number, dayZero: number, yearMsec: number, seasonZero: number, utc: number, idx?: number, solarNoon?: {
    center_at: number;
    T0: Tempo;
    T1: Tempo;
    季節: number;
    南中差分: number;
    南中時刻: number;
    真夜中: number;
    label?: string;
    table?: number[];
    zero: number;
    write_at: number;
    now_idx: number;
    last_at: number;
    next_at: number;
}): import("../orbital-model").SolarObservation | {
    K: number;
    lat: number;
    時角: number;
    方向: number;
    高度: number;
    真夜中: number;
    日の出: number;
    南中時刻: number;
    日の入: number;
};
type SolarTerms = ReturnType<typeof solar_terms>;
/**
 * solar_terms_mean: 平気法(等角分割)版の二十四節気+雑節の基準15項目。
 * solar_terms() が実軌道(sunny.timeOfPhase())で求めるのに対し、
 * こちらは Zz(平均太陽年)の span を比例配分するだけで求める。
 * 既存 FancyDate.雑節() が内部で行っていた計算をそのまま抽出したもの。
 *
 * Zz/d は呼び出し側の to_tempos() が解決した Tempo をそのまま渡すこと
 * (暦によって d の zero 基準が異なる場合があるため、ここで作り直さない)。
 */
export declare function solar_terms_mean(Zz: TempoLike, d: TempoLike): SolarTerms;
/**
 * 雑節_from_terms: 二十四節気+雑節の基準15項目から、八十八夜・二百十日・
 * 二百二十日・彼岸・社日・土用・節分などの雑節一式を組み立てる共通部分。
 * 基準15項目を実軌道(solar_terms)で求めるか平気法(solar_terms_mean)で
 * 求めるかだけが 雑節_by_phase / 雑節_by_mean の違いになる。
 */
export declare function 雑節_from_terms(dayMsec: number, day10Zero: number, stemLength: number, terms: SolarTerms): {
    立春: Tempo;
    立夏: Tempo;
    立秋: Tempo;
    立冬: Tempo;
    冬至: Tempo;
    春分: Tempo;
    夏至: Tempo;
    秋分: Tempo;
    入梅: Tempo;
    半夏生: Tempo;
    春: Tempo;
    夏: Tempo;
    秋: Tempo;
    冬: Tempo;
    春社日: Tempo;
    秋社日: Tempo;
    春土用: Tempo;
    夏土用: Tempo;
    秋土用: Tempo;
    冬土用: Tempo;
    春節分: Tempo;
    夏節分: Tempo;
    秋節分: Tempo;
    冬節分: Tempo;
    節分: Tempo;
    春彼岸: Tempo;
    秋彼岸: Tempo;
    八十八夜: Tempo;
    二百十日: Tempo;
    二百二十日: Tempo;
};
/**
 * 雑節_by_mean: 平気法(等角分割)版。solar_terms_mean() で基準項目を求め、
 * 雑節_from_terms() で残りを組み立てる。既存 FancyDate.雑節() と同じ結果になる。
 */
export declare function 雑節_by_mean(Zz: TempoLike, d: TempoLike, dayMsec: number, day10Zero: number, stemLength: number): {
    立春: Tempo;
    立夏: Tempo;
    立秋: Tempo;
    立冬: Tempo;
    冬至: Tempo;
    春分: Tempo;
    夏至: Tempo;
    秋分: Tempo;
    入梅: Tempo;
    半夏生: Tempo;
    春: Tempo;
    夏: Tempo;
    秋: Tempo;
    冬: Tempo;
    春社日: Tempo;
    秋社日: Tempo;
    春土用: Tempo;
    夏土用: Tempo;
    秋土用: Tempo;
    冬土用: Tempo;
    春節分: Tempo;
    夏節分: Tempo;
    秋節分: Tempo;
    冬節分: Tempo;
    節分: Tempo;
    春彼岸: Tempo;
    秋彼岸: Tempo;
    八十八夜: Tempo;
    二百十日: Tempo;
    二百二十日: Tempo;
};
export declare function 雑節_by_phase(sunny: OrbitalModel, dayMsec: number, dayZero: number, day10Zero: number, stemLength: number, utc: number): {
    立春: Tempo;
    立夏: Tempo;
    立秋: Tempo;
    立冬: Tempo;
    冬至: Tempo;
    春分: Tempo;
    夏至: Tempo;
    秋分: Tempo;
    入梅: Tempo;
    半夏生: Tempo;
    春: Tempo;
    夏: Tempo;
    秋: Tempo;
    冬: Tempo;
    春社日: Tempo;
    秋社日: Tempo;
    春土用: Tempo;
    夏土用: Tempo;
    秋土用: Tempo;
    冬土用: Tempo;
    春節分: Tempo;
    夏節分: Tempo;
    秋節分: Tempo;
    冬節分: Tempo;
    節分: Tempo;
    春彼岸: Tempo;
    秋彼岸: Tempo;
    八十八夜: Tempo;
    二百十日: Tempo;
    二百二十日: Tempo;
};
export declare function to_tempo_by_solor(sunny: OrbitalModel, earthy: RotationModel, geo: TIMEZONE, dayMsec: number, dayZero: number, yearMsec: number, seasonZero: number, hourLength: number, utc: number, day: Tempo): Tempo;
export {};
