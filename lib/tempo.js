"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tempo = exports.StartAlignedTempoRule = exports.ObservedLunisolarMonthRule = exports.OrbitalPhaseTempoRule = exports.RealSunsetDayTempoRule = exports.SolarEventDayTempoRule = exports.SolarDayHourTempoRule = exports.TableTempoRule = exports.ObservedLunisolarYearRule = exports.EraAdjustedTempoRule = exports.MeanLunisolarMonthRule = exports.MeanLunarPhaseTempoRule = exports.CyclicDayTempoRule = exports.FloorTempoRule = exports.SubdivideTempoRule = exports.FixedTempoRule = exports.CachedTempoRule = void 0;
exports.cyclic_label = cyclic_label;
exports.join = join;
exports.envelope_of = envelope_of;
const number_1 = require("./number");
const solar_1 = require("./phenomena/solar");
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
class CachedTempoRule {
    constructor(rule, cacheKey) {
        this.rule = rule;
        this.cacheKey = cacheKey;
    }
    at(write_at, base) {
        const cached = this.cached;
        const key = this.cacheKey?.(base);
        if (cached &&
            (this.cacheKey == null || Object.is(key, this.cachedKey)) &&
            cached.last_at <= write_at &&
            write_at < cached.next_at) {
            return cached;
        }
        this.cachedKey = key;
        return (this.cached = this.rule.at(write_at, base));
    }
    slide(envelope, amount, base) {
        return this.rule.slide(envelope, amount, base);
    }
}
exports.CachedTempoRule = CachedTempoRule;
/**
 * cyclic_label(): 親トークンと同じ実区間(last_at/next_at)を持ち、
 * now_idx だけを差し替えたラベルを作る。TempoRule/TempoView を経由しない
 * (これらは succ()/back()/slide() による遷移を前提にした仕組みであり、
 * この用途には使えないため。TempoLabelLike 参照)。
 *
 * now_idx の計算(mod によるラップや、別トークンの now_idx からの
 * 四半期計算など)は呼び出し側の関心事とし、ここでは受け取らない。
 */
function cyclic_label(parent, now_idx) {
    return {
        now_idx,
        last_at: parent.last_at,
        next_at: parent.next_at,
        is_cover: (at) => parent.last_at <= at && at < parent.next_at,
    };
}
function fixed_envelope(size, zero, write_at) {
    let now_idx = Math.floor((write_at - zero) / size);
    // 既存 to_tempo_bare と同じ式・同じ演算順序にする。
    // (last_at + size と (now_idx+1)*size+zero は数学的には同じだが、
    // 浮動小数点では丸め誤差が変わりうる。端数の出るサイズ(火星のsolを
    // 24分割する等)で succ() を繰り返すとこの誤差が蓄積し、後段で
    // to_tempos() が同じ write_at を再計算したときの now_idx が
    // 1つずれてしまうことがあるため、既存コードとビット単位で一致させる)
    let last_at = (now_idx + 0) * size + zero;
    let next_at = (now_idx + 1) * size + zero;
    // zero が write_at に対して絶対値の大きい(≒起点から遠い)場合、
    // (write_at-zero)/size が本来ちょうど整数になるはずなのに浮動小数点の
    // 丸め誤差で 0.999999999... のようにわずかに小さく計算され、floor が
    // 1つ小さい now_idx を返すことがある(実測: 火星暦の端数サイズ時刻で
    // 発生し、succ() で得た境界をそのまま write_at として使い回すと
    // 同じ場所に戻り続けて実質的な無限ループになった)。
    // 実際の区間 [last_at, next_at) に write_at が収まっているかを検証し、
    // 外れていれば 1 つ補正する(is_cover() の不変条件を保証する)。
    if (next_at <= write_at) {
        now_idx += 1;
        last_at = next_at;
        next_at = (now_idx + 1) * size + zero;
    }
    else if (write_at < last_at) {
        now_idx -= 1;
        next_at = last_at;
        last_at = now_idx * size + zero;
    }
    return { zero, now_idx, last_at, next_at };
}
/**
 * fixed_envelope_by_idx: now_idx が既知(整数)のときに last_at/next_at を
 * 直接組み立てる。fixed_envelope(size, zero, envelope.last_at + amount*size)
 * のように「差分を加算した write_at からもう一度 floor((write_at-zero)/size)
 * で now_idx を逆算する」経路は、write_at が zero から遠い(絶対値が大きい)
 * 場合に浮動小数点の丸め誤差で floor の結果が1つずれることがある
 * (実測: 火星暦の端数サイズで 16.999999999... になり 17 ではなく 16 に
 * floor され、succ() が実質的に進まず無限ループになった)。
 * now_idx を除算で逆算せず整数演算のまま渡せる場面(slide)ではこちらを使う。
 */
function fixed_envelope_by_idx(size, zero, now_idx) {
    const last_at = now_idx * size + zero;
    const next_at = (now_idx + 1) * size + zero;
    return { zero, now_idx, last_at, next_at };
}
/**
 * FixedTempoRule: 固定幅(等間隔)の Tempo を解決する規則。
 * 既存の to_tempo_bare / Tempo.slide の非テーブル分岐と同じ計算をする。
 */
class FixedTempoRule {
    constructor(size, zero = 0) {
        this.size = size;
        this.zero = zero;
    }
    at(write_at) {
        return fixed_envelope(this.size, this.zero, write_at);
    }
    slide(envelope, amount) {
        return fixed_envelope_by_idx(this.size, envelope.zero, envelope.now_idx + amount);
    }
}
exports.FixedTempoRule = FixedTempoRule;
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
function join(a, b) {
    if (a.zero !== b.zero) {
        throw new Error("can't join.");
    }
    const last_at = Math.min(a.last_at, b.last_at);
    const next_at = Math.max(a.next_at, b.next_at);
    const write_at = (a.write_at + b.write_at) / 2;
    const size = next_at - last_at;
    return Tempo.at(new FixedTempoRule(size, last_at), { write_at });
}
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
class SubdivideTempoRule {
    constructor(size, offset = 0) {
        this.size = size;
        this.offset = offset;
    }
    at(write_at, base) {
        const envelope = fixed_envelope(this.size, base.parent.last_at + this.offset, write_at);
        if (envelope.now_idx < 0 && base.parent.last_at <= write_at) {
            const last_at = base.parent.last_at;
            return { zero: last_at, now_idx: 0, last_at, next_at: envelope.next_at };
        }
        return envelope;
    }
    slide(envelope, amount) {
        return fixed_envelope_by_idx(this.size, envelope.zero, envelope.now_idx + amount);
    }
}
exports.SubdivideTempoRule = SubdivideTempoRule;
/**
 * fixed_envelope で作った区間を、より粗い単位(例: 日)の境界に
 * 外向きに切り詰める。既存 Tempo.floor(sub1, sub2, subf=to_tempo_bare) を
 * envelope レベルで再現したもの。
 *
 * write_at を境に「次の粗い境界がすでに write_at 以前まで来ている」場合は
 * 1周期先へずらしてから切り詰める(元の実装の分岐と同じ)。
 * 結果の zero は、切り詰め後の last_at / now_idx / size から逆算して
 * 再定義する(元の実装同様、以後の slide がこの粗い境界を基準にするため)。
 */
function floor_envelope(envelope, size, coarseSize, coarseZero, write_at) {
    const nextCoarse = fixed_envelope(coarseSize, coarseZero, envelope.next_at);
    if (nextCoarse.last_at <= write_at) {
        // 元の Tempo.slide(1) と同じ基準点(write_at + size)を使う。
        // envelope.next_at を基準にすると、size が期ごとに変動する
        // (floor 済みの区間を再度 floor するなど)場合に誤った周期先へ
        // ずれてしまう。
        const nextPeriod = fixed_envelope(size, envelope.zero, write_at + size);
        const nextNextCoarse = fixed_envelope(coarseSize, coarseZero, nextPeriod.next_at);
        const now_idx = envelope.now_idx + 1;
        const last_at = nextCoarse.last_at;
        const next_at = nextNextCoarse.last_at;
        return { zero: last_at - now_idx * size, now_idx, last_at, next_at };
    }
    const lastCoarse = fixed_envelope(coarseSize, coarseZero, envelope.last_at);
    const now_idx = envelope.now_idx;
    const last_at = lastCoarse.last_at;
    const next_at = nextCoarse.last_at;
    return { zero: last_at - now_idx * size, now_idx, last_at, next_at };
}
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
class FloorTempoRule {
    constructor(size, zero, floors) {
        this.size = size;
        this.zero = zero;
        this.floors = floors;
    }
    at(write_at) {
        let envelope = fixed_envelope(this.size, this.zero, write_at);
        for (const floor of this.floors) {
            const coarseSize = envelope.next_at - envelope.last_at;
            envelope = floor_envelope(envelope, coarseSize, floor.size, floor.zero, write_at);
        }
        return envelope;
    }
    slide(envelope, amount) {
        const midpoint = envelope.last_at + (amount + 0.5) * this.size;
        return this.at(midpoint);
    }
}
exports.FloorTempoRule = FloorTempoRule;
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
class CyclicDayTempoRule {
    constructor(daySize, zero, length) {
        this.daySize = daySize;
        this.zero = zero;
        this.length = length;
    }
    at(write_at) {
        const raw = fixed_envelope(this.daySize, this.zero, write_at);
        const now_idx = (0, number_1.mod)(raw.now_idx, this.length);
        return {
            zero: raw.last_at - now_idx * this.daySize,
            now_idx,
            last_at: raw.last_at,
            next_at: raw.next_at,
        };
    }
    slide(envelope, amount) {
        const midpoint = envelope.last_at + (amount + 0.5) * this.daySize;
        return this.at(midpoint);
    }
}
exports.CyclicDayTempoRule = CyclicDayTempoRule;
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
class MeanLunarPhaseTempoRule {
    constructor(moonMsec, moonZero, daySize, dayZero) {
        this.moonMsec = moonMsec;
        this.moonZero = moonZero;
        this.daySize = daySize;
        this.dayZero = dayZero;
    }
    at(write_at) {
        const raw = fixed_envelope(this.moonMsec, this.moonZero, write_at);
        return floor_envelope(raw, this.moonMsec, this.daySize, this.dayZero, write_at);
    }
    slide(envelope, amount) {
        const targetIdx = envelope.now_idx + amount;
        const midpoint = this.moonZero + (targetIdx + 0.5) * this.moonMsec;
        return this.at(midpoint);
    }
}
exports.MeanLunarPhaseTempoRule = MeanLunarPhaseTempoRule;
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
class MeanLunisolarMonthRule {
    constructor(moonMsec, moonZero, daySize, dayZero, termCount, resolveSeason) {
        this.moonMsec = moonMsec;
        this.moonZero = moonZero;
        this.daySize = daySize;
        this.dayZero = dayZero;
        this.termCount = termCount;
        this.resolveSeason = resolveSeason;
    }
    at(write_at) {
        const raw = fixed_envelope(this.moonMsec, this.moonZero, write_at);
        const month = floor_envelope(raw, this.moonMsec, this.daySize, this.dayZero, write_at);
        const is_cover = (at) => month.last_at <= at && at < month.next_at;
        let season = this.resolveSeason(month.last_at);
        let is_leap = false;
        if (!is_cover(season.moderate_at)) {
            season = this.resolveSeason(month.next_at);
            if (!is_cover(season.moderate_at)) {
                is_leap = true;
            }
        }
        const now_idx = (0, number_1.mod)(season.now_idx, this.termCount) >> 1;
        return {
            zero: month.last_at - now_idx * this.moonMsec,
            now_idx,
            last_at: month.last_at,
            next_at: month.next_at,
            is_leap,
        };
    }
    slide(envelope, amount) {
        const midpoint = envelope.last_at + (amount + 0.5) * this.moonMsec;
        return this.at(midpoint);
    }
}
exports.MeanLunisolarMonthRule = MeanLunisolarMonthRule;
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
class EraAdjustedTempoRule {
    constructor(innerRule, avgYearMsec, eraTable, eraZero, eras) {
        this.innerRule = innerRule;
        this.avgYearMsec = avgYearMsec;
        this.eraTable = eraTable;
        this.eraZero = eraZero;
        this.eras = eras;
    }
    with_era(raw, era_at) {
        // def_eras() 自身が this.table.msec.era を構築する最中(まだ未設定)に
        // this.to_tempos() を呼ぶ(各元号の開始年の raw な now_idx を得るため)
        // ため、この規則もその構築の最中に呼ばれうる。その場合は元号調整
        // 前の raw な値を返す(既存 to_tempos() が `if (this.table.msec.era
        // != null)` で同じ状況をガードしていたのと同じ理由)。
        if (!this.eraTable)
            return raw;
        const eraEnv = table_envelope(this.eraTable, this.eraZero, era_at);
        const era = this.eras[eraEnv.now_idx];
        if (!era?.[0])
            return raw;
        const now_idx = raw.now_idx + 1 - era[2];
        return { ...raw, now_idx, raw_now_idx: raw.now_idx };
    }
    at(write_at, base) {
        const raw = this.innerRule.at(write_at, base);
        return this.with_era(raw, write_at);
    }
    slide(envelope, amount, base) {
        const since = base.write_at - envelope.last_at;
        const midpoint = envelope.last_at + (amount + 0.5) * this.avgYearMsec;
        const raw = this.innerRule.at(midpoint, base);
        const era_at = Math.min(Math.max(raw.last_at + since, raw.last_at), raw.next_at - 1);
        return this.with_era(raw, era_at);
    }
}
exports.EraAdjustedTempoRule = EraAdjustedTempoRule;
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
class ObservedLunisolarYearRule {
    constructor(resolveYear) {
        this.resolveYear = resolveYear;
    }
    at(write_at) {
        const { year_start_at, next_year_start_at, year } = this.resolveYear(write_at);
        const yearSize = next_year_start_at - year_start_at;
        return {
            zero: year_start_at - year * yearSize,
            now_idx: year,
            last_at: year_start_at,
            next_at: next_year_start_at,
        };
    }
    slide(envelope, amount) {
        const avgSize = envelope.next_at - envelope.last_at;
        const midpoint = envelope.last_at + (amount + 0.5) * avgSize;
        return this.at(midpoint);
    }
}
exports.ObservedLunisolarYearRule = ObservedLunisolarYearRule;
function table_envelope_by_idx(table, zero, now_idx) {
    const idx = (0, number_1.mod)(now_idx, table.length);
    const table_idx = Math.floor(now_idx / table.length);
    const table_diff = table_idx ? table[table.length - 1] * table_idx : 0;
    const last_at = zero + table_diff + (table[idx - 1] || 0);
    const next_at = zero + table_diff + table[idx];
    return { zero, now_idx, last_at, next_at, table };
}
function table_envelope(table, zero, write_at) {
    let scan_at = write_at - zero;
    const table_size = table[table.length - 1];
    const table_idx = Math.floor(scan_at / table_size);
    if (table_idx) {
        scan_at -= table_idx * table_size;
    }
    let now_idx = table.length;
    let top_idx = 0;
    while (top_idx < now_idx) {
        const mid_idx = (top_idx + now_idx) >>> 1;
        if (table[mid_idx] <= scan_at) {
            top_idx = mid_idx + 1;
        }
        else {
            now_idx = mid_idx;
        }
    }
    return table_envelope_by_idx(table, zero, now_idx + table_idx * table.length);
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
class TableTempoRule {
    constructor(table, zero = 0) {
        this.table = table;
        this.zero = zero;
    }
    at(write_at) {
        return table_envelope(this.table, this.zero, write_at);
    }
    slide(envelope, amount) {
        return table_envelope_by_idx(this.table, this.zero, envelope.now_idx + amount);
    }
}
exports.TableTempoRule = TableTempoRule;
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
class SolarDayHourTempoRule {
    constructor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, hourLength) {
        this.sunny = sunny;
        this.earthy = earthy;
        this.geo = geo;
        this.dayMsec = dayMsec;
        this.dayZero = dayZero;
        this.yearMsec = yearMsec;
        this.seasonZero = seasonZero;
        this.hourLength = hourLength;
    }
    at(write_at, base) {
        const list = this.hour_table(write_at, base.day);
        return table_envelope(list, base.day.last_at, write_at);
    }
    slide(envelope, amount, base) {
        const now_idx = envelope.now_idx + amount;
        if (envelope.table && 0 <= now_idx && now_idx < envelope.table.length) {
            return table_envelope_by_idx(envelope.table, envelope.zero, now_idx);
        }
        const list = this.hour_table(base.write_at, base.day);
        return table_envelope_by_idx(list, base.day.last_at, now_idx);
    }
    hour_table(write_at, dayEnvelope) {
        // noon()/solor() が要求するのは TempoLike(zero/write_at/last_at/
        // next_at/center_at 等の読み取りのみ)なので、legacy Tempo を new する
        // 必要はない。dayEnvelope(既に解決済みの区間)に write_at だけを
        // 差し込んだ TempoView を渡す(この View 自体は .slide() されない
        // ため、渡す rule の中身は実質問われない)。
        const day = new Tempo(dayEnvelope, { write_at }, new FixedTempoRule(this.dayMsec, dayEnvelope.zero));
        const solarNoon = (0, solar_1.noon)(this.sunny, this.dayMsec, this.dayZero, this.yearMsec, this.seasonZero, write_at, day);
        const { 日の出, 日の入 } = (0, solar_1.solor)(this.sunny, this.earthy, this.geo, this.dayMsec, this.dayZero, this.yearMsec, this.seasonZero, write_at, 4, solarNoon);
        const size = this.hourLength / 4;
        const list = [];
        let next_at = 0;
        let msec = (日の出 - day.last_at) / size;
        for (let idx = 0, end = 1 * size; idx < end; idx++) {
            next_at += msec;
            list.push(Math.floor(next_at));
        }
        next_at = 日の出 - day.last_at;
        msec = (日の入 - 日の出) / (2 * size);
        for (let idx = 1 * size, end = 3 * size; idx < end; idx++) {
            next_at += msec;
            list.push(Math.floor(next_at));
        }
        next_at = day.size;
        msec = (day.next_at - 日の入) / size;
        const tails = [];
        for (let idx = 3 * size, end = 4 * size; idx < end; idx++) {
            tails.push(Math.ceil(next_at));
            next_at -= msec;
        }
        list.push(...tails.reverse());
        return list;
    }
}
exports.SolarDayHourTempoRule = SolarDayHourTempoRule;
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
class SolarEventDayTempoRule {
    constructor(sunny, earthy, geo, dayMsec, civilDayZero, yearMsec, seasonZero, event) {
        this.sunny = sunny;
        this.earthy = earthy;
        this.geo = geo;
        this.dayMsec = dayMsec;
        this.civilDayZero = civilDayZero;
        this.yearMsec = yearMsec;
        this.seasonZero = seasonZero;
        this.event = event;
    }
    event_of(civilDay) {
        const center_at = (civilDay.last_at + civilDay.next_at) / 2;
        const day = new Tempo(civilDay, { write_at: center_at }, new FixedTempoRule(this.dayMsec, civilDay.zero));
        const solarNoon = (0, solar_1.noon)(this.sunny, this.dayMsec, this.civilDayZero, this.yearMsec, this.seasonZero, center_at, day);
        const { 日の出, 日の入 } = (0, solar_1.solor)(this.sunny, this.earthy, this.geo, this.dayMsec, this.civilDayZero, this.yearMsec, this.seasonZero, center_at, 2, solarNoon);
        return this.event === 'sunrise' ? 日の出 : 日の入;
    }
    boundary_at_or_after(write_at) {
        const civil = fixed_envelope(this.dayMsec, this.civilDayZero, write_at);
        const event0 = this.event_of(civil);
        if (write_at <= event0)
            return event0;
        return this.event_of(fixed_envelope_by_idx(this.dayMsec, this.civilDayZero, civil.now_idx + 1));
    }
    at(write_at, base) {
        const civil = fixed_envelope(this.dayMsec, this.civilDayZero, write_at);
        const event0 = this.event_of(civil);
        let last_at;
        let next_at;
        let lastCivilIdx;
        if (write_at < event0) {
            last_at = this.event_of(fixed_envelope_by_idx(this.dayMsec, this.civilDayZero, civil.now_idx - 1));
            next_at = event0;
            lastCivilIdx = civil.now_idx - 1;
        }
        else {
            last_at = event0;
            next_at = this.event_of(fixed_envelope_by_idx(this.dayMsec, this.civilDayZero, civil.now_idx + 1));
            lastCivilIdx = civil.now_idx;
        }
        // now_idx は、イベント境界が属する civil day の index 差分で求める。
        // 親境界からの経過ミリ秒を dayMsec で割るだけだと、日の出が前日より
        // 早くなる季節に「2つ目の sunrise が親 sunrise からまだ1平均日未満」
        // となり、2日目が now_idx=0 のまま重複する。sunset でも季節により
        // 同じ問題が起きうるため、実イベントの時刻差ではなく civil day の
        // 連番差を使う。
        //
        // 月始点(base.parent.last_at)の直後、真の太陽イベント境界が来る前の区間は
        // now_idx が負(-1)になりうる(真の日没が月始点よりわずかに後に
        // 来るため)。SubdivideTempoRule(dayBoundary())と同じ理由(doc
        // コメント参照)で 0 に切り詰め、last_at も base.parent.last_at まで
        // 引き上げる。
        //
        // ただしこの切り詰めは write_at が月始点以上(=to_tempos() が直接
        // 解決している、真に「この月の範囲内」の問い合わせ)の場合に限る。
        // slide()(succ()/back())が前の月へ跨って戻ろうとする際は、
        // envelope.last_at より前の write_at を意図的に渡してくる——この場合に
        // 同じように切り詰めると、月始点より前へは絶対に進めず back() が
        // 月の1日目に張り付いて動かなくなる実バグがあった(実測:
        // dusk() な暦で d.back()/sub() を月始めから遡ると、前の月へ進まず
        // 同じ日に留まり続けた)。write_at < base.parent.last_at のときは
        // 切り詰めず自然な負の now_idx を返し、呼び出し元が返る last_at を
        // 元に to_tempos() を再解決すれば前の月が正しく求まる(SubdivideTempoRule
        // の slide() が envelope.zero を直接使って月を跨ぐのと同じ仕組み)。
        const parentCivilIdx = fixed_envelope(this.dayMsec, this.civilDayZero, base.parent.last_at).now_idx;
        const rawNowIdx = lastCivilIdx - parentCivilIdx;
        if (rawNowIdx < 0 && base.parent.last_at <= write_at) {
            const clampedLastAt = base.parent.last_at;
            return { zero: clampedLastAt, now_idx: 0, last_at: clampedLastAt, next_at };
        }
        return { zero: last_at - rawNowIdx * this.dayMsec, now_idx: rawNowIdx, last_at, next_at };
    }
    slide(envelope, amount, base) {
        const midpoint = envelope.last_at + (amount + 0.5) * this.dayMsec;
        return this.at(midpoint, base);
    }
}
exports.SolarEventDayTempoRule = SolarEventDayTempoRule;
/**
 * RealSunsetDayTempoRule: 互換用の薄いラッパー。新規用途では
 * SolarEventDayTempoRule(..., 'sunset' | 'sunrise') を使う。
 */
class RealSunsetDayTempoRule extends SolarEventDayTempoRule {
    constructor(sunny, earthy, geo, dayMsec, civilDayZero, yearMsec, seasonZero) {
        super(sunny, earthy, geo, dayMsec, civilDayZero, yearMsec, seasonZero, 'sunset');
    }
}
exports.RealSunsetDayTempoRule = RealSunsetDayTempoRule;
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
class OrbitalPhaseTempoRule {
    constructor(sunny, divisions, referencePhaseOffset = 0) {
        this.sunny = sunny;
        this.divisions = divisions;
        this.referencePhaseOffset = referencePhaseOffset;
    }
    at(write_at) {
        const avgSize = this.sunny.periodMsec / this.divisions;
        const boundaryAt = (idx) => (0, solar_1.solar_phase)(this.sunny, idx / this.divisions - this.referencePhaseOffset, write_at);
        let idx = Math.floor((0, number_1.mod)(this.sunny.phaseAt(write_at) + this.referencePhaseOffset, 1) * this.divisions);
        let last_at = boundaryAt(idx);
        while (write_at < last_at) {
            idx = (0, number_1.mod)(idx - 1, this.divisions);
            last_at = boundaryAt(idx);
        }
        let next_at = boundaryAt((0, number_1.mod)(idx + 1, this.divisions));
        while (next_at <= write_at) {
            idx = (0, number_1.mod)(idx + 1, this.divisions);
            last_at = next_at;
            next_at = boundaryAt((0, number_1.mod)(idx + 1, this.divisions));
        }
        // idx はこの探索で確定した「基準位相からの区間番号」であり、既に
        // 0..divisions-1 に収まっている(mod 済み)ラベル整合な値。以前は
        // sunny.epochMsec からの連番を now_idx にしていたため、ラベル参照側
        // (list[val.now_idx] を mod なしで直接引く)と基準がずれ、呼び出し側
        // (resolve_orbital_season)で都度 idx を再計算し直す必要があった。
        // ここで直接 idx を返すことで、その再計算が不要になる。
        const now_idx = idx;
        return { zero: last_at - now_idx * avgSize, now_idx, last_at, next_at };
    }
    slide(envelope, amount) {
        const avgSize = this.sunny.periodMsec / this.divisions;
        return this.at(envelope.last_at + amount * avgSize + avgSize / 2);
    }
}
exports.OrbitalPhaseTempoRule = OrbitalPhaseTempoRule;
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
class ObservedLunisolarMonthRule {
    constructor(resolveMonth, avgMonthMsec) {
        this.resolveMonth = resolveMonth;
        this.avgMonthMsec = avgMonthMsec;
    }
    at(write_at) {
        const date = this.resolveMonth(write_at);
        const now_idx = date.month - 1;
        const size = date.next_at - date.last_at;
        return {
            zero: date.last_at - now_idx * size,
            now_idx,
            last_at: date.last_at,
            next_at: date.next_at,
            is_leap: date.is_leap,
        };
    }
    slide(envelope, amount) {
        const midpoint = envelope.last_at + (amount + 0.5) * this.avgMonthMsec;
        return this.at(midpoint);
    }
}
exports.ObservedLunisolarMonthRule = ObservedLunisolarMonthRule;
/**
 * StartAlignedTempoRule: 内側の規則が返す区間境界を、別の実境界へ丸めて
 * 露出する wrapper。月・年などの開始候補を「その後に最初に来る日没」へ
 * 丸め上げ、親境界と暦日境界を同じ時刻に揃える用途で使う。
 */
class StartAlignedTempoRule {
    constructor(innerRule, alignStart) {
        this.innerRule = innerRule;
        this.alignStart = alignStart;
    }
    align(raw) {
        return {
            ...raw,
            last_at: this.alignStart(raw.last_at),
            next_at: this.alignStart(raw.next_at),
        };
    }
    at(write_at, base) {
        let raw = this.innerRule.at(write_at, base);
        let aligned = this.align(raw);
        while (write_at < aligned.last_at) {
            raw = this.innerRule.slide(raw, -1, base);
            aligned = this.align(raw);
        }
        while (aligned.next_at <= write_at) {
            raw = this.innerRule.slide(raw, 1, base);
            aligned = this.align(raw);
        }
        return aligned;
    }
    slide(envelope, amount, base) {
        return this.align(this.innerRule.slide(envelope, amount, base));
    }
}
exports.StartAlignedTempoRule = StartAlignedTempoRule;
/**
 * envelope_of: 任意の TempoLike(既存 Tempo でも TempoView でも)から
 * TempoEnvelope 形状を取り出す。SubdivideBase.parent / SolarDayHourBase.day
 * など、他の規則へ「区間情報」だけを渡したい文脈で使う
 * (具象型が Tempo か TempoView かを呼び出し側が意識しなくてよくなる)。
 */
function envelope_of(t) {
    return {
        zero: t.zero,
        now_idx: t.now_idx,
        last_at: t.last_at,
        next_at: t.next_at,
        label: t.label,
        is_leap: t.is_leap,
    };
}
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
class Tempo {
    constructor(envelope, base, rule) {
        this.envelope = envelope;
        this.base = base;
        this.rule = rule;
    }
    get zero() {
        return this.envelope.zero;
    }
    get write_at() {
        return this.base.write_at;
    }
    get now_idx() {
        return this.envelope.now_idx;
    }
    set now_idx(value) {
        this.envelope = { ...this.envelope, now_idx: value };
    }
    get last_at() {
        return this.envelope.last_at;
    }
    get next_at() {
        return this.envelope.next_at;
    }
    get size() {
        return this.envelope.next_at - this.envelope.last_at;
    }
    get since() {
        return this.base.write_at - this.envelope.last_at;
    }
    get center_at() {
        return (this.envelope.next_at + this.envelope.last_at) / 2;
    }
    get moderate_at() {
        return this.envelope.now_idx & 1 ? this.envelope.last_at : this.envelope.next_at;
    }
    /** 既存 Tempo.deg と同じ式(区間内の経過を360度換算した角度)。 */
    get deg() {
        return `${Math.floor((360 * this.since) / this.size)}deg`;
    }
    /** 既存 Tempo.timeout と同じ式。sleep() の待ち時間算出にのみ使う。 */
    get timeout() {
        return this.next_at - this.write_at;
    }
    get label() {
        return this.envelope.label;
    }
    set label(value) {
        this.envelope = { ...this.envelope, label: value };
    }
    get is_leap() {
        return this.envelope.is_leap;
    }
    set is_leap(value) {
        this.envelope = { ...this.envelope, is_leap: value };
    }
    /**
     * EraAdjustedTempoRule が元号内相対年へ書き換える前の、常に単調な
     * 通し番号。元号調整を経由しない envelope(raw_now_idx 未設定)では
     * now_idx をそのまま返す(グレゴリオ暦等、既存の動作を変えない)。
     * TempoEnvelope.raw_now_idx のドキュメント参照。
     */
    get raw_now_idx() {
        return this.envelope.raw_now_idx ?? this.envelope.now_idx;
    }
    /** AssignmentRule が割り当てた現象側の通し番号。未設定なら undefined。 */
    get assignment_raw_now_idx() {
        return this.envelope.assignment_raw_now_idx;
    }
    /**
     * 既存 Tempo.table と同じ役割。TableTempoRule/SolarDayHourTempoRule が
     * 解決した envelope に含まれるテーブルを読み取り専用で公開する
     * (SolarDayHourTempoRule.slide() が「同じ日のテーブル内かどうか」を
     * 判定する最適化に使うほか、外部からテーブルの中身を検査したい場合にも使う)。
     */
    get table() {
        return this.envelope.table;
    }
    is_cover(at) {
        return this.envelope.last_at <= at && at < this.envelope.next_at;
    }
    /** 既存 Tempo.is_hit と同じ式(2つの区間が重なるかを判定する)。 */
    is_hit(that) {
        return this.last_at <= that.next_at && that.last_at < this.next_at;
    }
    succ(n = 1) {
        return this.slide(n);
    }
    back(n = 1) {
        return this.slide(-n);
    }
    slide(amount) {
        const since = this.since;
        const envelope = this.rule.slide(this.envelope, amount, this.base);
        const base = { ...this.base, write_at: envelope.last_at + since };
        return new Tempo(envelope, base, this.rule);
    }
    slide_to(n) {
        return this.slide(n - this.envelope.now_idx);
    }
    copy() {
        return new Tempo(this.envelope, this.base, this.rule);
    }
    reset(now = Date.now()) {
        const base = { ...this.base, write_at: now };
        return new Tempo(this.rule.at(now, base), base, this.rule);
    }
    /** 既存 Tempo.tick と同じ式。区間を過ぎていれば reset() した結果を、まだなら null を返す。 */
    tick() {
        const now = Date.now();
        if (this.next_at <= now) {
            return this.reset(now);
        }
        else {
            return null;
        }
    }
    /** 既存 Tempo.sleep(インスタンス)と同じ式。 */
    sleep() {
        return Tempo.sleep([this]);
    }
    /** rule.at(base.write_at, base) を解決して TempoView を作る。 */
    static at(rule, base) {
        return new Tempo(rule.at(base.write_at, base), base, rule);
    }
    /**
     * 既存 Tempo.sleep(静的)と同じ式。渡された TempoView のうち最も近い
     * next_at(=timeout が最小)まで待つ Promise を返す。
     */
    static async sleep(tempos) {
        if (tempos && tempos.length) {
            const o = tempos.reduce((min, o) => (min.timeout < o.timeout ? min : o), {
                timeout: Infinity,
            });
            if (o.timeout < Infinity) {
                return new Promise((ok) => {
                    setTimeout(() => {
                        ok(o);
                    }, o.timeout);
                });
            }
        }
        return new Promise((ok) => ok(null));
    }
}
exports.Tempo = Tempo;
//# sourceMappingURL=tempo.js.map