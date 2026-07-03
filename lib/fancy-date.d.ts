import type { Numeral } from './number';
import type { LunarApsisKind, LunarNodeKind, OrbitalModel, RotationModel, SPOT, TIMEZONE } from './orbital-model';
import type { LunisolarDate } from './phenomena/lunisolar';
import type { TempoLike } from './tempo-model';
import { Tempo } from './time';
export { EarthMoonOrbital, EarthSolarOrbital } from './naoj';
export type { EarthMoonOrbitalOptions, EarthSolarOrbitalOptions } from './naoj';
export { MarsSolarOrbital } from './nasa';
export type { MarsSolarOrbitalOptions } from './nasa';
export { MeanOrbital, MeanRotation, TransformedOrbital, transformOrbital } from './mean';
export type { LunisolarDate, LunisolarPrincipalTerm } from './phenomena/lunisolar';
export type { PreparedSpot, PreparedSpotModels } from './prepare';
export { prepareSpot, prepareSpotModels } from './prepare';
export * from './orbital-model';
export type ERA = readonly [string, number, string?];
export type ERA_WITH_YEAR = readonly [string, number, number];
type ALL_DIC = ALGO_DIC | 'D' | 'G' | 'J' | 'Q' | 'Y' | 'b' | 'c' | 'd' | 'p' | 'u' | 'w' | 'x' | 'y';
type ALGO_DIC = 'A' | 'B' | 'C' | 'E' | 'F' | 'H' | 'M' | 'N' | 'S' | 'V' | 'Z' | 'a' | 'd' | 'f' | 'm' | 's';
type MSEC_CALC = 'period' | 'year' | 'season' | 'month' | 'moon' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'msec';
type RANGE_CALC = 'year' | 'month' | 'hour' | 'minute' | 'second';
type ZERO_CALC = 'period' | 'era' | 'year60' | 'year12' | 'year10' | 'year_s' | 'spring' | 'season' | 'moon' | 'week' | 'day60' | 'day28' | 'day12' | 'day10' | 'day_9' | 'day' | 'jd';
export type TempoDiff = TOKENS<ALL_DIC, number>;
export type TempoIdxs = TOKENS<ALL_DIC, number> & {
    G_is_past?: boolean;
    M_is_leap: boolean;
};
type TempoMonth = {
    is_leap: boolean;
};
export type Token = ALL_DIC | 'Zz';
export type Unit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'msec';
type CorePrecision = 'y' | 'M' | 'd' | 'H' | 'm' | 's' | 'S';
export type Precision = CorePrecision | Token;
export type SpanLabels = Partial<Record<Token, string>>;
export type SpanDirection = '前' | '後';
export type FindOrder = 1 | -1;
export type FindOptions = {
    step?: keyof Tempos;
    order?: FindOrder;
    limit?: number;
};
export type SpanPart = {
    token: Token;
    unit: Unit;
    value: number;
    label: string;
};
export type SpanPartLike = SpanPart | Omit<SpanPart, 'token'>;
export type Span = {
    unit: Unit;
    value: number;
    label: string;
    parts?: readonly SpanPart[];
    next_at?: number;
    timeout?: number;
};
export type SpanOptions = {
    precise?: boolean | Precision;
};
export type SpanLike = string | Span | SpanPartLike | readonly SpanPartLike[];
export type Tempos = {
    Zz: TempoLike;
    A: TempoLike;
    B: TempoLike;
    C: TempoLike;
    D: TempoLike;
    E: TempoLike;
    F: TempoLike;
    G: TempoLike;
    H: TempoLike;
    J: TempoLike;
    M: TempoLike & TempoMonth;
    N: TempoLike | undefined;
    Q: TempoLike;
    S: TempoLike;
    V: TempoLike;
    Y: TempoLike;
    Z: TempoLike;
    a: TempoLike;
    b: TempoLike;
    c: TempoLike;
    d: TempoLike;
    f: TempoLike;
    m: TempoLike;
    p: TempoLike | undefined;
    s: TempoLike;
    u: TempoLike;
    w: TempoLike;
    x: TempoLike | undefined;
    y: TempoLike;
};
type DateLike = number | Tempos | string;
type DateRange = readonly [from: DateLike, to: DateLike];
type NUMBER_RANGE = [number, number?];
type MEASURE = {
    range: NUMBER_RANGE;
    msec: number;
};
type FindMatcher = string | RegExp;
export type FindCondition = {
    note: FindMatcher;
} | {
    [format: string]: FindMatcher;
};
type FindBetween = DateRange;
type IIDX = TOKENS<ALL_DIC, Indexer>;
type IDIC = IIDX & {
    parse: string;
    format: string;
    numeral?: Numeral | null;
    sunny: OrbitalModel;
    moony?: OrbitalModel;
    earthy: RotationModel;
    geo: TIMEZONE;
    era: string;
    eras: readonly ERA[];
    month_divs: number[];
    leaps: number[];
    leap_shift?: number;
    labels: SpanLabels;
    start: [string, string, number];
    is_solor: boolean;
};
type ICALC = {
    eras: ERA_WITH_YEAR[];
    idx: TOKENS<ALL_DIC, number>;
    zero: TOKENS<ZERO_CALC, number>;
    msec: TOKENS<MSEC_CALC, number> & {
        moon?: number;
    };
    range: TOKENS<RANGE_CALC, [number, number]>;
};
type TOKENS<K extends string, T> = {
    [key in K]: T;
};
type IndexFactory = (this: Indexer, s: string) => number;
type LabelFactory = (list: readonly string[] | null, val: TempoLike & {
    is_leap?: boolean;
}, size: number) => string;
type IndexerProps = [] | [number] | readonly [readonly string[], readonly string[] | null] | readonly [readonly string[], readonly string[] | null, string | readonly string[]];
declare class Indexer {
    tempo?: Tempo;
    list: readonly string[];
    rubys: readonly string[];
    relatives?: string | readonly string[];
    length: number;
    zero: number;
    regex: string;
    regex_o: string;
    to_idx: IndexFactory;
    to_value: LabelFactory;
    to_label: LabelFactory;
    to_ruby: LabelFactory;
    constructor(arg: IndexerProps);
}
export declare class FancyDate {
    dic: IDIC;
    calc: ICALC;
    is_table_leap: boolean;
    is_table_month: boolean;
    strategy: string;
    table: {
        range: {
            year: number[];
            month: {
                [key: number]: number[];
            };
        };
        msec: {
            era: number[];
            year: number[];
            period: MEASURE;
            month: {
                [key: number]: number[];
            };
        };
    };
    private _orbital_season_rule?;
    private _solar_hour_rule?;
    private _lunisolar_cache?;
    constructor(o?: FancyDate);
    spot(...spot: SPOT): this;
    lang(parse: string, format: string): this;
    era(era: string, past: string, eras?: readonly ERA[]): this;
    calendar(start?: (string | number)[], leaps?: number[] | null, month_divs?: (number | null)[] | null, leap_shift?: number): this;
    algo(o: Partial<TOKENS<ALGO_DIC, IndexerProps>>): this;
    daily(is_solor?: string | boolean): this;
    numeral(numeral?: Numeral | null): this;
    labels(labels: SpanLabels): this;
    private format_number;
    private parse_number;
    private number_pattern;
    init(): this;
    yeary_table(utc: number): [string, string, string, string, (string[] | undefined)?][];
    monthry_table(utc: number): [string, string, string, string, (string[] | undefined)?][];
    weekly_table(utc: number): [string, string, string, string, (string[] | undefined)?][];
    time_table(utc: number): [string, string, string, string, (string[] | undefined)?][];
    solar_phase(phase: number, near: number): number;
    lunar_phase(phase: number, near: number): number;
    lunisolar(utc: number): LunisolarDate;
    solar_term(utc: number, phase: number): Tempo;
    solar_phase_before(phase: number, utc: number): number;
    solar_terms(utc: number): {
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
    succ(utc: DateLike, diff: SpanLike): number;
    back(utc: DateLike, diff: SpanLike): number;
    parse(tgt: string | TempoIdxs, str?: string): number;
    parse_obj(tgt: string | TempoIdxs, str?: string): TempoIdxs;
    format(utc: DateLike, str?: string): string;
    add(utc: DateLike, span: SpanLike): number;
    add_obj(utc: DateLike, span: SpanLike): Tempos;
    sub(utc: DateLike, span: SpanLike): number;
    sub_obj(utc: DateLike, span: SpanLike): Tempos;
    span(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions): string;
    span_obj(to: DateLike | DateRange, from?: DateLike | SpanOptions, options?: SpanOptions): Span;
    parse_span(text: string): Span;
    format_span(span: SpanLike, direction?: SpanDirection): Span;
    private add_span;
    private parse_span_parts;
    private disambiguate_span_parts;
    private format_span_parts;
    private span_parts_of;
    private normalize_span_part;
    private invert_span;
    private parse_span_part;
    private span_parse_rows;
    private span_target;
    private resolve_span_week_target;
    private normalize_span_target;
    private unit_msec;
    private find_span_time;
    private find_span_time_in_day_direct;
    private find_span_month;
    private find_span_year_start;
    private find_span_time_in_day;
    private compare_span_digits;
    private interval_for_rank;
    private source_since;
    private clamp_since;
    find(between: FindBetween, conditions: readonly FindCondition[], options?: FindOptions): number[];
    private infer_find_step;
    private infer_find_step_from_format;
    private find_step_for_token;
    private find_step_rank;
    private span_between;
    private with_span_anchor;
    private precise_span;
    private next_precise_span_at;
    private next_span_at;
    private span_parts;
    private hierarchical_span_rows;
    private token_span_parts;
    private span_part_unit;
    private span_part_fallback_unit;
    private span_part_label;
    match_find_condition(utc: number, condition: FindCondition): boolean;
    match_find_value(value: string, matcher: FindMatcher): boolean;
    private to_utc;
    private to_tempos_input;
    private is_tempos;
    private is_date_range;
    private span_args;
    private is_span_options;
    private is_span_text;
    dup(): FancyDate;
    def_regex(): void;
    def_to_idx(): void;
    def_to_label(): void;
    def_calc(): void;
    def_eras(): void;
    def_year_table(): void;
    def_month_table(): void;
    def_table(): void;
    def_idx(): void;
    def_zero(): void;
    precision(): {
        strategy: string;
        year: number[][];
        day: [number, number][];
        leap: number[];
        is_legal_solor: boolean;
        is_legal_eto: boolean;
        is_legal_ETO: boolean;
    };
    noon(utc: any, day?: Tempo): {
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
    solor(utc: any, idx?: number, solarNoon?: {
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
    }): import("./orbital-model").SolarObservation | {
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
    lunar(utc: any, day?: Tempo): import("./orbital-model").LunarObservation;
    lunar_apsis(kind: LunarApsisKind, near: number): import("./orbital-model").LunarApsis;
    lunar_node(kind: LunarNodeKind, near: number): import("./orbital-model").LunarNode;
    節句(_utc: number, _tempos?: Tempos): {
        カトリック: {
            万聖節: number[];
            万霊節: number[];
        };
        節句: {
            人日: number[];
            初午: (number | undefined)[];
            上巳: number[];
            端午: number[];
            七夕: number[];
            重陽: number[];
        };
        仏教: {
            灌仏会: number[];
            盂蘭盆会: number[];
        };
        風習: {
            小正月: number[];
            十五夜: number[];
            十三夜: number[];
            七五三: number[];
            正月事始め: number[];
        };
    };
    雑節(utc: number, { Zz, d }?: Tempos): {
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
    雑節_by_phase(utc: number): {
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
    to_tempo_by_solor(utc: number, day: any): Tempo;
    /**
     * 実軌道(sunny.timeOfPhase)による二十四節気の解決(定気法)。
     * calc.idx.Z = dic.Z.length/8 という既存の zero 設計により、
     * 等角分割の Z.now_idx は解析的な sekkiPhase*dic.Z.length から
     * 常に 1/8 だけずれる。この 1/8 を referencePhaseOffset に使うことで、
     * 実軌道版でも等角版と同じ now_idx 番号(=同じラベル)を維持できる
     * (実測で検証済み: 立春/立夏/夏至/立秋/秋分/立冬/冬至/次立春が一致)。
     *
     * ラベル参照(def_to_label の at())は now_idx をそのまま配列添字に使う
     * (mod を取らない)ため、0..length-1 に収まっている必要がある。
     * OrbitalPhaseTempoRule.at() が返す now_idx は sunny.epochMsec からの
     * 連番でありこの並びとは基準が異なる(epochMsec の位相が0とは限らない)ため、
     * ここでは last_at の時点の位相(sunny.phaseAt)から直接 idx を再計算する。
     *
     * TempoView へ載せない理由: 補正後の now_idx/zero は
     * OrbitalPhaseTempoRule.slide() 自身の基準(sunny.epochMsec 起点の連番)とは
     * 一致しないため、この補正済み envelope を rule.slide() にそのまま渡すと
     * 誤った遷移になる。succ()/back() が呼ばれる想定もないため、素の Tempo の
     * ままにしておく。
     */
    private resolve_orbital_season;
    /**
     * resolve_orbital_season() で使う OrbitalPhaseTempoRule を CachedTempoRule
     * で包んで使い回す(D: TempoEnvelope キャッシュ)。実軌道の位相探索は
     * 反復計算を伴うため、season(24節気で約15日幅)の範囲内で write_at を
     * 繰り返し問い合わせる場合(to_table() の日次走査など)、2回目以降は
     * 実際の探索を経ずに直近の envelope を再利用できる。
     */
    private orbital_season_rule;
    /**
     * H(不定時法)で使う SolarDayHourTempoRule を使い回す(D: TempoEnvelope
     * キャッシュ)。この規則自身が直近1日分の時刻テーブルを内部キャッシュ
     * するため(SolarDayHourTempoRule.hour_table_cached 参照)、インスタンスを
     * 使い回すことで初めてそのキャッシュが効く。CachedTempoRule でも包み、
     * 同じ時刻(1時間内)への再問い合わせもテーブル参照だけで済ませる。
     */
    private solar_hour_rule;
    note(utc: number, tempos?: Tempos, arg1?: {
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
    }, arg2?: {
        カトリック: {
            万聖節: number[];
            万霊節: number[];
        };
        節句: {
            人日: number[];
            初午: (number | undefined)[];
            上巳: number[];
            端午: number[];
            七夕: number[];
            重陽: number[];
        };
        仏教: {
            灌仏会: number[];
            盂蘭盆会: number[];
        };
        風習: {
            小正月: number[];
            十五夜: number[];
            十三夜: number[];
            七五三: number[];
            正月事始め: number[];
        };
    }): string[];
    to_tempos(utc: number): Tempos;
    get_dic(tgt: string, tokens: string[], reg: RegExp): TempoIdxs;
    index(src: string, str?: string, _disuse?: number): TempoIdxs;
    regex(tokens: any): RegExp;
    to_table(utc: number, bk: string, ik: string, has_notes?: boolean): [string, string, string, string, (string[] | undefined)?][];
    parse_by(data: TempoIdxs, diff?: TempoDiff): number;
    format_by(tempos: Tempos, str?: string): string;
    tree(): (Indexer | (string[] | Indexer[])[])[];
}
