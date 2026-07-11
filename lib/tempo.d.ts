import type { OrbitalModel, RotationModel, TIMEZONE } from './orbital-model';
import type { LunisolarDate } from './phenomena/lunisolar';
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
    /**
     * EraAdjustedTempoRule が now_idx を元号内相対年へ書き換える前の、
     * 調整前(通し番号)の now_idx。元号を持たない暦(EraAdjustedTempoRule を
     * 経由しない envelope)では設定されない。
     *
     * fancy-date.ts の span_target()/find_span_year_start() は「目標の年へ
     * 何年分移動するか」を検算するため、ある年から別の年への距離を
     * now_idx の差分(や絶対値への到達)で計算している。now_idx が元号ごとに
     * 1 へリセットされる値だと、この距離計算が意味を失い(例: 平成31年→
     * 令和1年は本来1年の移動だが、31→1という見かけの差分は-30になる)、
     * 目標に到達するまでのループが暴走して無関係な年まで進んでしまう
     * (実測: 平気法/定気法で元号を跨ぐ年送りをすると数十年先に飛ぶ、
     * または探索ループが数十回余分に走り体感できる遅延が出た)。
     * raw_now_idx は常に単調な通し番号を保つため、この距離計算に使う。
     */
    raw_now_idx?: number;
    /**
     * AssignmentRule が now_idx へ投影する前の、assignment 側の通し番号。
     * raw_now_idx は assignment 前の暦座標(civil day など)を保持する一方、
     * assignment_raw_now_idx は tithi のような割当対象現象そのものの連続座標を
     * 保持する。assignment を使わない token では設定されない。
     */
    assignment_raw_now_idx?: number;
    assignment_flags?: readonly string[];
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
 * at(write_at, base) は、直近の envelope がまだ write_at を覆っており
 * (last_at <= write_at < next_at)、かつ任意の cacheKey(base) も一致する
 * 場合はそれをそのまま返し、それ以外だけ元の rule.at() を呼んで
 * 解決し直す。実軌道の位相探索(OrbitalPhaseTempoRule)や観測太陰太陽暦の
 * 探索など、天体計算を伴う重い規則を、同じ季節/同じ月のように近接した
 * write_at で繰り返し問い合わせる場面(to_table() の日次走査など)で
 * 効果を発揮する。
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
    private readonly cacheKey?;
    private cached?;
    private cachedKey?;
    constructor(rule: TempoRule<Base>, cacheKey?: ((base: Base) => unknown) | undefined);
    at(write_at: number, base: Base): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope;
}
/**
 * TempoLike: Tempos の各トークンが実際に要求する最小限の構造。
 *
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
 * TempoLabelLike: 親トークンの位置(now_idx)から派生する「周期ラベル」の
 * 最小限の構造。TempoLike と異なり succ()/back()/slide()/slide_to()/
 * copy()/reset() を持たない。
 *
 * 干支年(a)/十二年(b)/十年(c)/年不断(f)/週番号整合用の年ラベル(Y)/
 * 四半期(Q)は、いずれも親トークン(u や M)の位置から導かれるラベルで
 * あり、親を独立に再解決する手段を規則(TempoRule)が持たないため、
 * 正確な succ()/back() を実装できない(実際に呼ばれている箇所も存在
 * しない)。これを TempoLike として扱うと、型上は succ 等が存在する
 * ことになってしまい、実際には存在しない機能を偽ることになる
 * (旧実装の `{ now_idx } as Tempo` がまさにこれで、zero/last_at/next_at
 * すら持っていなかった)。ここでは「持っている情報だけ」を正直に表現する。
 */
export interface TempoLabelLike {
    readonly now_idx: number;
    readonly last_at: number;
    readonly next_at: number;
    label?: string;
    is_leap?: boolean;
    is_cover(at: number): boolean;
}
/**
 * cyclic_label(): 親トークンと同じ実区間(last_at/next_at)を持ち、
 * now_idx だけを差し替えたラベルを作る。TempoRule/TempoView を経由しない
 * (これらは succ()/back()/slide() による遷移を前提にした仕組みであり、
 * この用途には使えないため。TempoLabelLike 参照)。
 *
 * now_idx の計算(mod によるラップや、別トークンの now_idx からの
 * 四半期計算など)は呼び出し側の関心事とし、ここでは受け取らない。
 */
export declare function cyclic_label(parent: TempoEnvelope, now_idx: number): TempoLabelLike;
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
 * join: 2つの TempoLike を「両方を覆う最小区間」へ結合した TempoView を作る。
 * 既存 time.ts の `Tempo.join(a, b)` (静的メソッド)と数値的に同じ式
 * (a.zero !== b.zero はエラー、last_at=min、next_at=max、
 * write_at=(a.write_at+b.write_at)/2)を、TempoLike 向けに再実装したもの
 * (phenomena/solar.ts の雑節_from_terms() が 彼岸/土用/四季の区間を
 * 求めるのに使う。既存の静的メソッドは a/b に生の Tempo を要求するため、
 * TempoView(a/bがsolar_terms()由来でTempoView化されると必要になる)を
 * 渡せない)。結合後の区間は「last_at を零点とする幅 size の1区間」なので
 * FixedTempoRule(size, last_at) で構築すれば now_idx=0 かつ
 * succ()/back()/is_cover() が正しく機能する TempoView になる。
 */
export declare function join(a: TempoLike, b: TempoLike): Tempo;
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
 *
 * offset(既定0)は、親の last_at からさらに一定量ずらした点を zero に
 * する(FancyDate.dayBoundary() が d/N の分割起点を実時計 0 時から
 * offsetHours 時間ずらすのに使う)。親自体(月/年などの zero 点)には
 * 触れず、この規則が刻む区間の位相だけを動かす——offset を親側
 * (例: def_zero() の day 自体)に注入すると、month/year など他のすべての
 * 下流トークンまで同じ量ずれてしまう(実測: オスマン季節時法/アラトゥルカの
 * ような「時刻体系だけが違う」はずの対で、月の zero 点が18時間ズレたことで
 * 1日のうち大半の時間帯で日番号が食い違う実バグがあった)。
 *
 * offset>0 の場合、親の last_at 直後(offset 未満)の区間は now_idx が
 * 負(-1)になりうる(親の last_at が offset ぶんずれた区間境界より前に
 * 来るため)。負の now_idx は「月内0日目より前」という表現不能な値で、
 * format() が不正な日番号を出す・その値を parse() し直すと別の月に
 * 化けるという実バグがあった(実測: dayBoundary(18) を使う暦の全ての月頭で
 * 発生)。0 に切り詰め、この区間は「その月の1日目」として扱う(既に真の
 * 1日目(offset 直後の区間)も now_idx=0 になるため、月頭の狭い区間だけ
 * 2つの実区間が同じ日番号を共有することになるが、負の日番号や誤った月への
 * 化けよりは実害が小さい——真の暦日境界を月境界にも波及させる全面的な
 * 再設計は今回のスコープを超えるため見送った)。
 *
 * この切り詰めでは now_idx だけでなく last_at も base.parent.last_at まで
 * 引き上げる(zero も合わせて last_at に更新)。last_at を自然な(親の
 * last_at より前の)値のまま残すと、この envelope の last_at を直接読む
 * 呼び出し元(clamp_since() 等)がそこから to_tempos() を再度呼んだ際に、
 * 「親の last_at より前」という理由だけで前の月に化けて戻ってしまう実バグが
 * あった(実測: add()/sub() が月境界をまたぐ日送りで前の月の別の日を
 * 返した)。last_at を親の last_at 以上に保つことで、この envelope が
 * 表す時刻は常に「対象の月の範囲内」になる。
 *
 * ただしこの切り詰めは write_at が親の last_at 以上(=真に「この月の
 * 範囲内」の問い合わせ)の場合に限る。write_at がそれより前(月を跨いで
 * 戻ろうとする意図的な問い合わせ)なら切り詰めない
 * (RealSunsetDayTempoRule.at() の同種のドキュメント参照——この
 * クラス自身の slide() は zero を直接使う純粋な算術で月を跨ぐため実害は
 * ないが、Tempo.reset() 等 write_at を直接渡す経路のために同じ条件を
 * 揃えておく)。
 */
export declare class SubdivideTempoRule implements TempoRule<SubdivideBase> {
    private readonly size;
    private readonly offset;
    constructor(size: number, offset?: number);
    at(write_at: number, base: SubdivideBase): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * FloorStep: FloorTempoRule が順番に適用する「外向きに切り詰める先」の
 * 単位(例: 月境界、日境界)。
 */
export type FloorStep = {
    size: number;
    zero: number;
};
/**
 * FloorTempoRule: 固定幅の envelope を起点に、1つ以上の粗い境界へ
 * 順番に外向き切り詰めをする規則。既存 to_tempos() の
 * `to_tempo_bare(size, zero, utc).floor(sub1, sub2).floor(sub3, sub4)...`
 * という単発の組み合わせ(季節テーブル暦の年、平均太陰太陽暦(非観測)の年)を
 * 一般化したもの。floors が1件なら1回だけ、2件なら2回連続で切り詰める。
 *
 * 各切り詰めは、直前の切り詰め結果(1件目は起点の固定幅 envelope)の
 * 実際のサイズ(next_at-last_at)を基準に floor_envelope() を適用する
 * (既存 Tempo.floor() が this.size を使って計算するのと同じ)。
 *
 * 既存コードでは、この envelope に対応する Tempos.u の succ()/back() は
 * どこからも呼ばれていない(月/年の遷移は毎回 to_tempos() の再解決で行う)。
 * ただし find({step:'u'}) のように外部から呼ばれる可能性はゼロではないため、
 * MeanLunarPhaseTempoRule と同様、目標周期の中央付近の write_at で at() を
 * 再実行する slide() を用意しておく。
 *
 * slide() の中央付近の write_at は envelope.last_at(直前に解決済みの実際の
 * 境界)を基準に組み立てる。floors が2段以上あると、各段の「切り詰めで
 * 1つ先へずれる」補正が積み重なり、now_idx が this.zero からの単純な
 * 周期数(now_idx*size)から最大で floors.length 分ずれうる。this.zero
 * 基準で中央値を組み立てる(MeanLunarPhaseTempoRule と同じやり方)と、
 * このずれの分だけ目標周期を外してしまうため、必ず envelope.last_at
 * (今の実際の境界)を起点にする。
 */
export declare class FloorTempoRule implements TempoRule {
    private readonly size;
    private readonly zero;
    private readonly floors;
    constructor(size: number, zero: number, floors: readonly FloorStep[]);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * CyclicDayTempoRule: 固定長(日など)を length 個で 1 周するラベルとして
 * 解決する規則。既存 to_tempos() が
 * `const A = to_tempo_bare(dayMsec, zero, utc); A.now_idx = mod(A.now_idx, length)`
 * のように、いったん周期をまたぐと際限なく増減する生の now_idx を作ってから
 * mod で包み直していた「日不断」トークン(干支日 A/十二直 B/十干日 C/
 * 曜日 E/九星日相当 F/宿 V など)を、包み直し無しで最初からラベル整合な
 * now_idx を返せるようにしたもの。
 *
 * TableTempoRule は年(閏年テーブルなど)のように now_idx 自体が周期を
 * またいで増え続ける値であることを前提にしており(table_envelope_by_idx が
 * now_idx をそのまま返し、mod 済みの内部 idx は last_at/next_at の計算にしか
 * 使わない)、この用途にはそのまま使えない。ここでは mod 済みの値を
 * envelope 自体の now_idx として直接返す。
 *
 * 実コードでは、この envelope に対応する Tempos の succ()/back() は
 * どこからも呼ばれていない(暦座標のパスではなく単発の周期位相トークンと
 * して扱われている)。ただし find({step:'A'}) のように外部から呼ばれる
 * 可能性はゼロではないため、FloorTempoRule/MeanLunarPhaseTempoRule と同様、
 * 目標日の中央付近の write_at で at() を再実行する slide() を用意しておく。
 */
export declare class CyclicDayTempoRule implements TempoRule {
    private readonly daySize;
    private readonly zero;
    private readonly length;
    constructor(daySize: number, zero: number, length: number);
    at(write_at: number): TempoEnvelope;
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
 * slide() は等間隔ではなく、目標月の中央付近の write_at で at() を
 * 再実行して日境界へ切り詰め直す設計(now_idx が周期をまたいでも常に
 * moonZero からの一定周期として扱えるため、この方式で安全)。
 * この規則自体は succ()/back() 経由での利用を想定していないが、この
 * 規則を包む上位のトークン(Nn/M、下記 MeanLunisolarMonthRule 参照)は
 * to_table() の yeary_table() 経由で実際に succ() が呼ばれる。
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
 * MeanLunisolarMonthRule: MeanLunarPhaseTempoRule が解決する生の朔望月
 * (moonZero からの連続カウント)から、年内の月番号(0-11、閏月は前月と
 * 同じ番号)と閏月判定までを解決する規則。
 *
 * 既存 to_tempos() は、生の月 envelope を作った後
 *   1. その月の中気(節気)が実際にこの月の範囲内にあるか(is_cover)を
 *      resolveSeason(this.last_at) で確認
 *   2. 範囲外なら resolveSeason(this.next_at) で再確認し、それでも
 *      範囲外なら閏月と判定する
 *   3. 中気の節気番号(0-23)を2で割って月番号(0-11)を得る
 * という手順を、素の Tempo に対して直接 now_idx を書き換える形で行って
 * いた。この規則はその手順をまるごと内在化し、月番号・閏月判定込みの
 * envelope を直接返す。resolveSeason は実軌道(定気法)か平気法かの
 * 分岐を含む既存の `resolve_season` をそのまま注入できるシグネチャ
 * (呼び出し側の関心事をこの規則に持ち込まない)。
 *
 * slide() は月番号(意味が年でリセットされる非連続な値)を一切使わず、
 * last_at(実際の暦上の位置)を起点に平均朔望月の定数長(moonMsec)で
 * 目標付近まで進めてから at() で解決し直す。これは
 * MeanLunarPhaseTempoRule.slide() と似ているが、対象が「連続する朔望月
 * カウント」ではなく「年内月番号」であるため、now_idx を使わず
 * last_at だけを基準にする点が異なる。
 *
 * この設計変更の直接の動機: 以前は Nn が素の Tempo のままだったため、
 * succ()/back() が Tempo.slide() の「今の月の実サイズを固定長とみなして
 * write_at + n*size で進める」という式を使っていた。朔望月の実サイズは
 * 月ごとに29〜30日で変動するため、この式は稀に「次の月の途中」までしか
 * 進まないことがあり、to_table() の yeary_table()/monthry_table() が
 * 同じ月を2回出力する不具合があった(平気法・アマンタ暦・プールニマンタ暦の
 * 年間表で実際に確認)。この規則の slide() は moonMsec という定数長を
 * 使うため、この不具合を起こさない。
 */
export declare class MeanLunisolarMonthRule implements TempoRule<TempoBase> {
    private readonly moonMsec;
    private readonly moonZero;
    private readonly daySize;
    private readonly dayZero;
    private readonly termCount;
    private readonly resolveSeason;
    constructor(moonMsec: number, moonZero: number, daySize: number, dayZero: number, termCount: number, resolveSeason: (write_at: number) => TempoLike);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * EraAdjustedTempoRule: 内側の規則が返す「通し年」を、元号(のような
 * 紀年法)の開始年を1年とする相対年に変換する規則。
 *
 * 既存 to_tempos() は、内側の規則(FloorTempoRule 等、あるいは
 * lunisolar() 由来の素の Tempo)で年の envelope を作った後、
 * `u.now_idx += 1 - era[2]` のように外部から now_idx だけを書き換えて
 * いた。last_at/next_at/zero には反映されないため、succ()/back()
 * (内側の規則自身の slide())が再計算する now_idx は元号調整前の値に
 * 戻ってしまう(last_at 自体は正しいため find()/to_table() には実害が
 * ないが、succ() の戻り値の now_idx を直接読む呼び出し元には正しくない
 * 値を返していた)。
 *
 * 元号は年の境界とは無関係に(年の途中でも)切り替わりうる
 * (実測: 定気法の239元号のうち239件が年の途中での改元だった、つまり
 * 「年初に改元」はほぼ皆無)。そのため元号の解決は、必ず「実際に
 * 問い合わせている時刻」を基準にする必要がある。既存 G(元号ラベル)の
 * 解決も write_at(利用者が問い合わせた時刻そのもの)を基準にしており、
 * この規則の年番号も同じ基準で揃える。
 *
 * at() は write_at をそのまま元号解決に使えばよいが、slide() は
 * 「year.last_at からの経過(since)」を保ったまま次の年の対応する
 * 時刻(next.last_at + since)で元号を解決する必要がある。単純に
 * 「year.last_at + (amount+0.5)*avgYearMsec」のような年内の適当な
 * 目安点で元号を引くと、その点がたまたま改元後の期間に入ってしまい
 * (元の問い合わせ時点ではまだ改元前だったのに)誤った元号を拾うことが
 * ある(next の envelope 自体は正しく求まるにも関わらず、である)。
 * amount による目標年の特定(inner rule への再問い合わせ)には目安点で
 * 構わないが、元号自体の解決は「対応する時刻(same-since)」で行う。
 */
export declare class EraAdjustedTempoRule<Base extends TempoBase = TempoBase> implements TempoRule<Base> {
    private readonly innerRule;
    private readonly avgYearMsec;
    private readonly eraTable;
    private readonly eraZero;
    private readonly eras;
    constructor(innerRule: TempoRule<Base>, avgYearMsec: number, eraTable: readonly number[], eraZero: number, eras: readonly (readonly [string, number, number])[]);
    private with_era;
    at(write_at: number, base: Base): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope;
}
/**
 * ObservedLunisolarYearRule: 観測太陰太陽暦(実朔・実節気)の年を解決する
 * 規則。既存 lunisolar()(37ヶ月窓の朔・節気探索という重い天文計算)を
 * そのまま再利用し、再実装しない。この規則が新たに担うのは「lunisolar()
 * の結果を年の envelope として切り出す」部分のみ(ObservedLunisolarMonthRule
 * が月について行っているのと同じ切り分け方)。
 *
 * 実コードでも年の遷移は succ()/back() ではなく毎回 to_tempos() の
 * 再解決で行われているため、slide() も他の規則と同様に目標年の中央付近の
 * write_at で at() を再実行する設計にする。
 */
export declare class ObservedLunisolarYearRule implements TempoRule<TempoBase> {
    private readonly resolveYear;
    constructor(resolveYear: (write_at: number) => {
        year_start_at: number;
        next_year_start_at: number;
        year: number;
    });
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
export type SolarDayBoundaryEvent = 'sunrise' | 'sunset';
/**
 * SolarEventDayTempoRule: 実際の(季節で変動する)日の出/日没時刻そのものを
 * 暦日の境界に使う規則。dayBoundary()(固定オフセットで日没相当にずらす
 * だけ)と違い、solor() が返す日ごとの太陽イベントを直接境界にする。
 * dusk() は 'sunset' を使い、将来の sunrise/dawn 系の暦日境界は
 * 'sunrise' を使えば同じ仕組みに乗せられる。
 *
 * 循環依存の回避: 「日の出/日没時刻を求めるには対象の暦日(day envelope)
 * が要る(noon() が day.last_at/center_at を使う)」「暦日境界を求めるには
 * 太陽イベント時刻が要る」という一見循環した依存に見えるが、noon() の均時差
 * 相当の補正(南中差分)は write_at(≒季節)のみに依存し、day 自体の
 * 精度には敏感でない(実測: 通常の真夜中起点の civil day を仮の day として
 * solor() に渡しても、南中差分のずれは高々分オーダーで太陽イベント時刻への
 * 影響は無視できる)。そのため civil day(常にオフセット無しの実時計基準、
 * calc.zero.day)を仮の探索起点にし、その日・前日・翌日いずれかの太陽イベント
 * 時刻を求める(最大2回の solor() 呼び出し)束探索(bracket search)で
 * 真の境界を求める。
 *
 * now_idx(月内の日番号)は、真の太陽イベント日は日ごとにわずかに伸縮する
 * (SubdivideTempoRule のような単純な除算では求まらない)ため、月頭
 * (base.parent.last_at)からの経過時間を平均日長(dayMsec)で割って
 * floor する(at() 内のコメント参照——round ではない)ことで求める。
 * 実際の太陽イベント時刻のずれは平均日長に対して十分小さい(高緯度でも夏至/
 * 冬至付近で数分〜十数分程度)ため、月を通して欠番・重複のない連番になる。
 */
export declare class SolarEventDayTempoRule implements TempoRule<SubdivideBase> {
    private readonly sunny;
    private readonly earthy;
    private readonly geo;
    private readonly dayMsec;
    private readonly civilDayZero;
    private readonly yearMsec;
    private readonly seasonZero;
    private readonly event;
    constructor(sunny: OrbitalModel, earthy: RotationModel, geo: TIMEZONE, dayMsec: number, civilDayZero: number, yearMsec: number, seasonZero: number, event: SolarDayBoundaryEvent);
    private event_of;
    boundary_at_or_after(write_at: number): number;
    at(write_at: number, base: SubdivideBase): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: SubdivideBase): TempoEnvelope;
}
/**
 * RealSunsetDayTempoRule: 互換用の薄いラッパー。新規用途では
 * SolarEventDayTempoRule(..., 'sunset' | 'sunrise') を使う。
 */
export declare class RealSunsetDayTempoRule extends SolarEventDayTempoRule {
    constructor(sunny: OrbitalModel, earthy: RotationModel, geo: TIMEZONE, dayMsec: number, civilDayZero: number, yearMsec: number, seasonZero: number);
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
 * この idx は探索の過程で 0..divisions-1 に mod 済みなので、そのまま
 * ラベル参照(list[val.now_idx] を mod なしで直接引く)に使えるラベル整合な
 * 値になっている。
 *
 * `Tempos.Z` は `FancyDate.resolve_orbital_season()` 経由でこの規則に
 * 接続済み(`hasSolarEvents(sunny)` の暦のみ opt-in、それ以外は従来通り
 * `SubdivideTempoRule` による等角分割のまま)。
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
 * 既存 lunisolar()(37ヶ月窓の朔・節気探索という重い天文計算)の結果を
 * resolveMonth コールバック経由で受け取り、再実装しない
 * (ObservedLunisolarYearRule と同じ「コールバック注入」パターン)。
 * FancyDate.lunisolar() は37ヶ月窓探索の結果をMRUキャッシュするため、
 * 同じ write_at について u(年)側で既に this.lunisolar(at) を呼んで
 * いれば、この規則からの呼び出しはキャッシュヒットで軽量に済む。
 * 生の LunisolarOptions を直接受け取って毎回 lunisolar(options, write_at)
 * を呼ぶ設計(以前の実装)だと、FancyDate 側のキャッシュを経由できず、
 * u/M それぞれで別々に重い探索が走ってしまう(このためこの規則は
 * 長らく配線されず、fancy-date.ts 側は生の Tempo を直接構築していた。
 * 詳細下記)。
 *
 * 年(year_start_at 等)・日(day)は同じ lunisolar() の結果から別途取れる、
 * この規則の外側の関心事として扱う
 * (SubdivideTempoRule/MeanLunarPhaseTempoRule で length/月番号割当てを
 * 規則の外に出したのと同じ切り分け方)。now_idx は「月番号-1」(0-11)であり、
 * 年ごとにリセットし閘月では重複する(連続増加する朔望月カウンタではない)。
 * MeanLunarPhaseTempoRule の Nn.now_idx と同じ数値規約。
 *
 * **発見した実バグ(このクラス自体ではなく、未配線だった fancy-date.ts 側)**:
 * ObservedLunisolarMonthRule が長らく未配線だったため、fancy-date.ts の
 * usesObservedLunisolar 分岐の M は `new Tempo(...)` という生の Tempo
 * だった。この M の succ() は Tempo.slide() の非テーブル分岐(「今の月の
 * 実サイズを固定長とみなして write_at + n*size で進める」式)を使うが、
 * now_idx は「月番号-1」(年境界でリセットされる)という意味であり、
 * この式は now_idx を単純に+1し続けるだけで年境界のリセットを一切
 * 反映しない。実測で300回succ()の連鎖のうち298回が fresh 再導出と
 * 不一致(now_idx が年をまたいでも12,13,14...と増え続け、last_at も
 * 蓄積的にずれていく)。find([...], [{d:'1'}], {step:'M'}) が63件中
 * 2件しか見つけられず、しかも見つかった日付が「0054年」等の破綻した
 * 元号年になる実害を確認した(to_table()/find() の他の step では
 * .succ() の戻り値を直接使わず fresh 再導出するため無傷だったが、
 * find({step:'M'}) は succ() を連鎖させ続けるため直撃した)。
 * この規則を配線することで修正する。
 *
 * 既存コードでも月の遷移は succ()/back() ではなく毎回 to_tempos() の
 * 再解決で行われているため、slide() も MeanLunarPhaseTempoRule と同様に
 * 目標の月の中央付近の write_at で at() を再実行する設計にする。
 * avgMonthMsec(平均朔望月、通常 calc.msec.moon)は呼び出し側が渡す
 * (以前の実装は options.moony?.periodMsec を優先し、無ければ直前の
 * envelope の実サイズにフォールバックしていたが、この規則が実際に
 * 使われる場面は必ず moony が存在する usesObservedLunisolar 分岐のみ
 * なので、フォールバック分岐自体が不要になった)。
 */
export declare class ObservedLunisolarMonthRule implements TempoRule<TempoBase> {
    private readonly resolveMonth;
    private readonly avgMonthMsec;
    constructor(resolveMonth: (write_at: number) => LunisolarDate, avgMonthMsec: number);
    at(write_at: number): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number): TempoEnvelope;
}
/**
 * StartAlignedTempoRule: 内側の規則が返す区間境界を、別の実境界へ丸めて
 * 露出する wrapper。月・年などの開始候補を「その後に最初に来る日没」へ
 * 丸め上げ、親境界と暦日境界を同じ時刻に揃える用途で使う。
 */
export declare class StartAlignedTempoRule<Base extends TempoBase = TempoBase> implements TempoRule<Base> {
    private readonly innerRule;
    private readonly alignStart;
    constructor(innerRule: TempoRule<Base>, alignStart: (rawStart: number) => number);
    private align;
    at(write_at: number, base: Base): TempoEnvelope;
    slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope;
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
export declare class Tempo<Base extends TempoBase = TempoBase> implements TempoLike {
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
    /** 既存 Tempo.deg と同じ式(区間内の経過を360度換算した角度)。 */
    get deg(): string;
    /** 既存 Tempo.timeout と同じ式。sleep() の待ち時間算出にのみ使う。 */
    get timeout(): number;
    get label(): string | undefined;
    set label(value: string | undefined);
    get is_leap(): boolean | undefined;
    set is_leap(value: boolean | undefined);
    /**
     * EraAdjustedTempoRule が元号内相対年へ書き換える前の、常に単調な
     * 通し番号。元号調整を経由しない envelope(raw_now_idx 未設定)では
     * now_idx をそのまま返す(グレゴリオ暦等、既存の動作を変えない)。
     * TempoEnvelope.raw_now_idx のドキュメント参照。
     */
    get raw_now_idx(): number;
    /** AssignmentRule が割り当てた現象側の通し番号。未設定なら undefined。 */
    get assignment_raw_now_idx(): number | undefined;
    get assignment_flags(): readonly string[];
    /**
     * 既存 Tempo.table と同じ役割。TableTempoRule/SolarDayHourTempoRule が
     * 解決した envelope に含まれるテーブルを読み取り専用で公開する
     * (SolarDayHourTempoRule.slide() が「同じ日のテーブル内かどうか」を
     * 判定する最適化に使うほか、外部からテーブルの中身を検査したい場合にも使う)。
     */
    get table(): readonly number[] | undefined;
    is_cover(at: number): boolean;
    /** 既存 Tempo.is_hit と同じ式(2つの区間が重なるかを判定する)。 */
    is_hit(that: TempoLike): boolean;
    succ(n?: number): Tempo<Base>;
    back(n?: number): Tempo<Base>;
    slide(amount: number): Tempo<Base>;
    slide_to(n: number): Tempo<Base>;
    copy(): Tempo<Base>;
    reset(now?: number): Tempo<Base>;
    /** 既存 Tempo.tick と同じ式。区間を過ぎていれば reset() した結果を、まだなら null を返す。 */
    tick(): Tempo<Base> | null;
    /** 既存 Tempo.sleep(インスタンス)と同じ式。 */
    sleep(): Promise<unknown>;
    /** rule.at(base.write_at, base) を解決して TempoView を作る。 */
    static at<B extends TempoBase>(rule: TempoRule<B>, base: B): Tempo<B>;
    /**
     * 既存 Tempo.sleep(静的)と同じ式。渡された TempoView のうち最も近い
     * next_at(=timeout が最小)まで待つ Promise を返す。
     */
    static sleep(tempos: Tempo<any>[]): Promise<unknown>;
}
