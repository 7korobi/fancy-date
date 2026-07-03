"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempoView = exports.ObservedLunisolarMonthRule = exports.OrbitalPhaseTempoRule = exports.SolarDayHourTempoRule = exports.TableTempoRule = exports.MeanLunarPhaseTempoRule = exports.SubdivideTempoRule = exports.FixedTempoRule = exports.CachedTempoRule = void 0;
exports.to_tempo_like = to_tempo_like;
exports.envelope_of = envelope_of;
const number_1 = require("./number");
const lunisolar_1 = require("./phenomena/lunisolar");
const solar_1 = require("./phenomena/solar");
const time_1 = require("./time");
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
class CachedTempoRule {
    constructor(rule) {
        this.rule = rule;
    }
    at(write_at, base) {
        const cached = this.cached;
        if (cached && cached.last_at <= write_at && write_at < cached.next_at) {
            return cached;
        }
        return (this.cached = this.rule.at(write_at, base));
    }
    slide(envelope, amount, base) {
        return this.rule.slide(envelope, amount, base);
    }
}
exports.CachedTempoRule = CachedTempoRule;
/**
 * 既存の Tempo を TempoLike の境界へ渡すための変換関数。
 * Tempo が構造的に TempoLike を満たさなくなった場合、ここで型エラーになる。
 */
function to_tempo_like(tempo) {
    return tempo;
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
class SubdivideTempoRule {
    constructor(size) {
        this.size = size;
    }
    at(write_at, base) {
        return fixed_envelope(this.size, base.parent.last_at, write_at);
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
        const nextPeriod = fixed_envelope(size, envelope.zero, envelope.next_at);
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
        const day = new time_1.Tempo(dayEnvelope.zero, dayEnvelope.now_idx, write_at, dayEnvelope.last_at, dayEnvelope.next_at);
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
        const now_idx = Math.round((last_at - this.sunny.epochMsec) / avgSize);
        return { zero: last_at - now_idx * avgSize, now_idx, last_at, next_at };
    }
    slide(envelope, amount) {
        const avgSize = this.sunny.periodMsec / this.divisions;
        return this.at(envelope.last_at + amount * avgSize + avgSize / 2);
    }
}
exports.OrbitalPhaseTempoRule = OrbitalPhaseTempoRule;
class ObservedLunisolarMonthRule {
    constructor(options) {
        this.options = options;
    }
    at(write_at) {
        const date = (0, lunisolar_1.lunisolar)(this.options, write_at);
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
        const avgSize = this.options.moony?.periodMsec ?? envelope.next_at - envelope.last_at;
        const midpoint = envelope.last_at + (amount + 0.5) * avgSize;
        return this.at(midpoint);
    }
}
exports.ObservedLunisolarMonthRule = ObservedLunisolarMonthRule;
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
class TempoView {
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
    is_cover(at) {
        return this.envelope.last_at <= at && at < this.envelope.next_at;
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
        return new TempoView(envelope, base, this.rule);
    }
    slide_to(n) {
        return this.slide(n - this.envelope.now_idx);
    }
    copy() {
        return new TempoView(this.envelope, this.base, this.rule);
    }
    reset(now = Date.now()) {
        const base = { ...this.base, write_at: now };
        return new TempoView(this.rule.at(now, base), base, this.rule);
    }
    /** rule.at(base.write_at, base) を解決して TempoView を作る。 */
    static at(rule, base) {
        return new TempoView(rule.at(base.write_at, base), base, rule);
    }
}
exports.TempoView = TempoView;
//# sourceMappingURL=tempo-model.js.map