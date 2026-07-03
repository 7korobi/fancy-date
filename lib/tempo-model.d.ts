import type { OrbitalModel, RotationModel, TIMEZONE } from './orbital-model';
import type { LunisolarOptions } from './phenomena/lunisolar';
import { Tempo } from './time';
/**
 * TempoEnvelope: 再利用可能な「暦区間」情報。
 *
 * write_at を持たないため、同じ envelope を異なる write_at から参照しても
 * キャッシュを共有できる（将来の TempoEnvelope キャッシュ構想の土台）。
 */
export type TempoEnvelope = {
    zero: number;
    now_idx: number;
    last_at: number;
    next_at: number;
    label?: string;
    is_leap?: boolean;
    /**
     * テーブル参照で幅が決まる envelope の場合のみ設定する。
     * 既存 Tempo.slide() はテーブルの有無で挙動(等間隔 or テーブル参照)を
     * 切り替えるため、TableTempoRule/SolarDayHourTempoRule から生成した
     * envelope を実 Tempo へ変換する際は、この table を引き継がないと
     * succ()/back() が誤った(等間隔の)遷移をしてしまう。
     */
    table?: readonly number[];
};
/**
 * TempoBase: envelope を解決するときに渡す最小限の文脈。
 * 兄弟トークンの値が必要な特殊な規則(観測太陰太陽暦など)は、
 * より広い文脈(例: Tempos)を型引数として指定する。
 */
export type TempoBase = {
    label?: string;
    write_at: number;
};
/**
 * TempoRule: envelope の初期化(at)と遷移(slide)の規則。
 *
 * 固定幅、テーブル参照、等角分割、軌道位相分割、観測太陰太陽暦、
 * 不定時法などのバリエーションは、すべてこのインターフェースの実装になる。
 */
export interface TempoRule<Base = TempoBase> {
    at(write_at: number, base: Base): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope;
}
/**
 * CachedTempoRule: 他の TempoRule をラップし、直近に解決した envelope を
 * 再利用するデコレータ。
 *
 * at(write_at, base) は、直近の envelope がまだ write_at を覆っている
 * (last_at <= write_at < next_at)場合はそれをそのまま返し、覆っていない
 * 場合だけ元の rule.at() を呼んで解決し直す。実軌道の位相探索
 * (OrbitalPhaseTempoRule)や観測太陰太陽暦の探索など、天体計算を伴う
 * 重い規則を、同じ季節/同じ月のように近接した write_at で繰り返し
 * 問い合わせる場面(to_table() の日次走査など)で効果を発揮する。
 *
 * 規則インスタンス自体が呼び出しのたびに new され直すのでは、直近の
 * 解決結果を保持する場所がなくキャッシュが効かない。このデコレータで
 * 包んだインスタンスを呼び出し側(FancyDate)で使い回す(1回だけ構築して
 * 保持する)ことで初めて効果が出る。
 *
 * slide() はキャッシュを更新しない(素通しで元の rule.slide() を呼ぶ)。
 * TempoView.slide() は隣接区間への遷移であり、都度 at() が再度呼ばれる
 * とは限らないため、明示的にキャッシュへ反映する余地はあるが、
 * 現状 slide() は at() ほど頻繁に(重い探索を伴って)呼ばれないため
 * 単純化のため省略する。
 */
export declare class CachedTempoRule<Base extends TempoBase = TempoBase> implements TempoRule<Base> {
    private readonly rule;
    private cached?;
    constructor(rule: TempoRule<Base>);
    at(write_at: number, base: Base): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope;
}
/**
 * TempoLike: Tempos の各トークンが実際に要求する最小限の構造。
 *
 * 既存の Tempo クラスは変更なしにこれを満たす
 * (下部の to_tempo_like で型検査として確認している)。
 * round/ceil/floor/to_list/upto/tick/sleep/table など、
 * 固定Tempo固有の機能はここには含めない。
 */
export interface TempoLike {
    readonly zero: number;
    readonly write_at: number;
    now_idx: number;
    readonly last_at: number;
    readonly next_at: number;
    readonly size: number;
    readonly since: number;
    readonly center_at: number;
    readonly moderate_at: number;
    label?: string;
    is_leap?: boolean;
    is_cover(at: number): boolean;
    succ(n?: number): TempoLike;
    back(n?: number): TempoLike;
    slide(n: number): TempoLike;
    slide_to(n: number): TempoLike;
    copy(): TempoLike;
    reset(now?: number): TempoLike;
}
/**
 * 既存の Tempo を TempoLike の境界へ渡すための変換関数。
 * Tempo が構造的に TempoLike を満たさなくなった場合、ここで型エラーになる。
 */
export declare function to_tempo_like(tempo: Tempo): TempoLike;
/**
 * FixedTempoRule: 固定幅(等間隔)の Tempo を解決する規則。
 * 既存の to_tempo_bare / Tempo.slide の非テーブル分岐と同じ計算をする。
 */
export declare class FixedTempoRule implements TempoRule {
    private readonly size;
    private readonly zero;
    constructor(size: number, zero?: number);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * SubdivideBase: 等角分割の解決に必要な文脈。
 * 分割元になる親 Tempo の envelope(特に last_at)を毎回渡す必要がある。
 */
export type SubdivideBase = TempoBase & {
    parent: TempoEnvelope;
};
/**
 * SubdivideTempoRule: 親 Tempo の位置(last_at)を動的な zero として使い、
 * 固定幅で等分割する規則。
 *
 * 既存 to_tempos() の drill_down() で「テーブルが無い場合」に取っている
 * 分岐(季節の二十四節気 Z、不定時法でない時/分/秒 H・m・s・S、
 * 年初来週番号 w、平均太陰太陽暦の月内日 N など)と同じ計算になる。
 * ただし drill_down が副次的に設定する o.length は既存コードのどこからも
 * 読まれていない値なので、envelope には含めない。
 *
 * FixedTempoRule と式自体は同じだが、zero を規則自身が持たず、
 * 親 Tempo の last_at から呼び出しごとに受け取る点だけが違う
 * (年が変われば year.last_at が変わり、季節の起点もそれに追従するため)。
 * 一度 envelope が解決された後の slide() は、zero が envelope 側に
 * 保持されるため FixedTempoRule と全く同じ式になる。
 */
export declare class SubdivideTempoRule implements TempoRule<SubdivideBase> {
    private readonly size;
    constructor(size: number);
    at(write_at: number, base: SubdivideBase): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * MeanLunarPhaseTempoRule: 平均朔望月(固定周期)の月境界を、日境界へ
 * 切り詰めて解決する規則。
 *
 * 既存 to_tempos() の `Nn = to_tempo_bare(moon_msec, zero.moon, utc).floor(msec.day, zero.day)`
 * と同じ計算(月番号の割り当てや閏月判定はこの規則の外側で行われる別の関心事なので含めない)。
 * 実際の運用で観測太陰太陽暦を使わない暦(平気法など)の月境界がこれにあたる。
 *
 * 実コードでは月境界の遷移は succ()/back() ではなく、毎回 to_tempos() の
 * 再解決で行われている(Nn.succ() 等の呼び出しは存在しない)。そのため
 * slide() は等間隔ではなく、目標月の中央付近の write_at で at() を
 * 再実行して日境界へ切り詰め直す(実運用に合わせた設計)。
 */
export declare class MeanLunarPhaseTempoRule implements TempoRule<TempoBase> {
    private readonly moonMsec;
    private readonly moonZero;
    private readonly daySize;
    private readonly dayZero;
    constructor(moonMsec: number, moonZero: number, daySize: number, dayZero: number);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * TableTempoRule: テーブル参照で幅が決まる Tempo を解決する規則。
 * zero から見て最初の1周期(table_idx===0)の範囲では、既存の
 * to_tempo_by / Tempo.slide のテーブル分岐と同じ計算結果になる。
 * 太陽暦の年(閏年テーブル)など、幅が周期表で決まる単位が対象。
 *
 * 実際の呼び出しでは zero が常に親 Tempo の last_at で再計算されるため
 * table_idx は 0 のまま使われるが、1周期を越える場合の計算式は
 * 既存2関数の間でも食い違いがある(to_tempo_by は table_idx を
 * last_at/next_at に反映せず、Tempo.slide は現在値からの差分で
 * 反映するため経路依存になる)。ここでは zero からの絶対量として
 * 一貫した(経路に依存しない)計算に統一している。
 */
export declare class TableTempoRule implements TempoRule {
    private readonly table;
    private readonly zero;
    constructor(table: readonly number[], zero?: number);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * SolarDayHourBase: 不定時法の時刻を解決するための文脈。
 * 対象の暦日(day)の envelope を毎回渡す必要がある
 * (日の出・入りは日ごとに変わるため)。
 */
export type SolarDayHourBase = TempoBase & {
    day: TempoEnvelope;
};
/**
 * SolarDayHourTempoRule: 不定時法(見かけの日の出・入りを基準にした
 * 長さが変わる「時」)を解決する規則。
 *
 * 既存 to_tempo_by_solor() と同じ計算をする。日の出・日の入りの算出は
 * 既存の noon()/solor()(NAOJ精度モデルにも対応)をそのまま再利用し、
 * この規則が新たに担うのは「日の出・日の入りから hourLength 個の
 * 区切りテーブルを作り、日(day)を zero として envelope 化する」部分のみ。
 * このテーブルは日ごとに動的に作られるため、TableTempoRuleと違い
 * 規則インスタンスに固定テーブルを持たせられない。
 *
 * 日をまたぐ遷移だけ天文計算のやり直しが必要。envelope.table(直前に
 * 解決した、その日のテーブル)が渡され、かつ遷移後も同じテーブルの範囲内に
 * 収まる場合は、天文計算をやり直さずテーブル参照だけで解決する
 * (TempoView.succ()/back() は毎回 rule.slide() を経由するため、ここで
 * 再計算を避けないと、1時間進めるだけの操作が日の出入りの再計算という
 * 高コスト処理を毎回引き起こしてしまう)。
 *
 * 規則インスタンスは day 単位のテーブルキャッシュを持たない。noon() が
 * 計算する南中差分(均時差相当)は write_at そのものに依存するため、
 * 同じ日でも問い合わせた時刻によってテーブルの値がわずかにずれる
 * (実測: 同日の時刻0と最終時刻とで最大13秒程度差が出た)。日単位で
 * テーブルを使い回すと、この差が2回目以降のクエリに残ってしまうため
 * 採用しない。at() は常に hour_table() を呼び直す。
 */
export declare class SolarDayHourTempoRule implements TempoRule<SolarDayHourBase> {
    private readonly sunny;
    private readonly earthy;
    private readonly geo;
    private readonly dayMsec;
    private readonly dayZero;
    private readonly yearMsec;
    private readonly seasonZero;
    private readonly hourLength;
    constructor(sunny: OrbitalModel, earthy: RotationModel, geo: TIMEZONE, dayMsec: number, dayZero: number, yearMsec: number, seasonZero: number, hourLength: number);
    at(write_at: number, base: SolarDayHourBase): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: SolarDayHourBase): TempoEnvelope;
    private hour_table;
}
/**
 * OrbitalPhaseTempoRule: 実軌道(実際の黄経など)を基準に、1公転周期を等しい
 * 「角度」で divisions 等分した位相区間を解決する規則。
 *
 * 既存 solar_terms()/雑節_by_phase() が使っている solar_phase()
 * (= sunny.timeOfPhase())をそのまま再利用する。referencePhaseOffset は
 * 既存実装が使う「基準位相からのズレ」(二十四節気なら春分基準の 2/8)をそのまま渡せばよい。
 *
 * phaseAt() から推定した idx を初期値にし、実際の境界(solar_phase の
 * 探索結果)が write_at をまたぐことがある(実軌道の不等速性による平均との
 * ズレ)ので、境界をまたいでしまった場合は idx を進める/戻す方向に補正する。
 *
 * 現状 Tempos.Z は等角分割(SubdivideTempoRule)であり、この規則はまだ
 * to_tempos() には接続していない。接続する場合は、平気法のように
 * 「等角=定義そのもの」である暦を壊さないための暦ごとのオプトイン設計と、
 * 天体計算の実行コストをいつ抟うかの判断が必要
 * (詳細はリポジトリメモリ参照)。
 */
export declare class OrbitalPhaseTempoRule implements TempoRule<TempoBase> {
    private readonly sunny;
    private readonly divisions;
    private readonly referencePhaseOffset;
    constructor(sunny: OrbitalModel, divisions: number, referencePhaseOffset?: number);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * ObservedLunisolarMonthRule: 観測太陰太陽暦(実朔・実節気)の月を解決する規則。
 *
 * 既存 lunisolar()/lunisolar_months_around()(37ヶ月窓の朔・節気探索という重い
 * 天文計算)をそのまま再利用し、再実装しない。この規則が新たに担うのは
 * 「lunisolar() の結果を月の envelope(now_idx=月番号-1, is_leap,
 * last_at, next_at)として切り出す」部分のみ。
 *
 * 年(year_start_at 等)・日(day)は同じ lunisolar() の結果から別途取れる、
 * この規則の外側の関心事として扱う
 * (SubdivideTempoRule/MeanLunarPhaseTempoRule で length/月番号割当てを
 * 規則の外に出したのと同じ切り分け方)。now_idx は「月番号-1」(0-11)であり、
 * 年ごとにリセットし閘月では重複する(連続増加する朔望月カウンタではない)。
 * MeanLunarPhaseTempoRule の Nn.now_idx と同じ数値規約。
 *
 * 既存コードでも月の遷移は succ()/back() ではなく毎回 to_tempos() の
 * 再解決で行われているため、slide() も MeanLunarPhaseTempoRule と同様に
 * 目標の月の中央付近の write_at で at() を再実行する設計にする。
 */
export type ObservedLunisolarBase = TempoBase;
export declare class ObservedLunisolarMonthRule implements TempoRule<ObservedLunisolarBase> {
    private readonly options;
    constructor(options: LunisolarOptions);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * envelope_of: 任意の TempoLike(既存 Tempo でも TempoView でも)から
 * TempoEnvelope 形状を取り出す。SubdivideBase.parent / SolarDayHourBase.day
 * など、他の規則へ「区間情報」だけを渡したい文脈で使う
 * (具象型が Tempo か TempoView かを呼び出し側が意識しなくてよくなる)。
 */
export declare function envelope_of(t: TempoLike): TempoEnvelope;
/**
 * TempoView<Base>: (envelope, base, rule) を保有する TempoLike 実装。
 *
 * 既存 Tempo は table の有無で succ()/back()/slide() の挙動(等間隔か
 * テーブル参照か)を暗黙に切り替えるが、TempoView は
 * rule.slide(envelope, amount, base) に委譲するだけなので、挙動の
 * バリエーションは rule の実装として明示される
 * (固定幅・テーブル参照・等角分割・軌道位相分割・不定時法・
 * 観測太陰太陽暦のいずれであるかを if 分岐で判定する必要がない)。
 *
 * envelope 自体は書き換えない。now_idx/label/is_leap への代入は
 * 新しい envelope を作って差し替える(copy-on-write)。これは、
 * envelope が将来キャッシュされ複数の TempoView/クエリ間で共有される
 * ようになった場合でも、1つの TempoView インスタンスへの代入が
 * キャッシュや他インスタンスに影響しないようにするため
 * (既存 to_tempos() は Nn.now_idx/Nn.is_leap 等をその場で書き換える
 * 箇所があり、この挙動を壊さず安全に保つ必要がある)。
 */
export declare class TempoView<Base extends TempoBase = TempoBase> implements TempoLike {
    private envelope;
    base: Base;
    readonly rule: TempoRule<Base>;
    constructor(envelope: TempoEnvelope, base: Base, rule: TempoRule<Base>);
    get zero(): number;
    get write_at(): number;
    get now_idx(): number;
    set now_idx(value: number);
    get last_at(): number;
    get next_at(): number;
    get size(): number;
    get since(): number;
    get center_at(): number;
    get moderate_at(): number;
    get label(): string | undefined;
    set label(value: string | undefined);
    get is_leap(): boolean | undefined;
    set is_leap(value: boolean | undefined);
    is_cover(at: number): boolean;
    succ(n?: number): TempoView<Base>;
    back(n?: number): TempoView<Base>;
    slide(amount: number): TempoView<Base>;
    slide_to(n: number): TempoView<Base>;
    copy(): TempoView<Base>;
    reset(now?: number): TempoView<Base>;
    /** rule.at(base.write_at, base) を解決して TempoView を作る。 */
    static at<B extends TempoBase>(rule: TempoRule<B>, base: B): TempoView<B>;
}
