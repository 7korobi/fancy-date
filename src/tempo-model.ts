import { mod } from './number'
import type { OrbitalModel, RotationModel, TIMEZONE } from './orbital-model'
import type { LunisolarDate } from './phenomena/lunisolar'
import { noon, solar_phase, solor } from './phenomena/solar'
import { Tempo } from './time'

/**
 * TempoEnvelope: 再利用可能な「暦区間」情報。
 *
 * write_at を持たないため、同じ envelope を異なる write_at から参照しても
 * キャッシュを共有できる（将来の TempoEnvelope キャッシュ構想の土台）。
 */
export type TempoEnvelope = {
  zero: number
  now_idx: number
  last_at: number
  next_at: number
  label?: string
  is_leap?: boolean
  /**
   * テーブル参照で幅が決まる envelope の場合のみ設定する。
   * 既存 Tempo.slide() はテーブルの有無で挙動(等間隔 or テーブル参照)を
   * 切り替えるため、TableTempoRule/SolarDayHourTempoRule から生成した
   * envelope を実 Tempo へ変換する際は、この table を引き継がないと
   * succ()/back() が誤った(等間隔の)遷移をしてしまう。
   */
  table?: readonly number[]
}

/**
 * TempoBase: envelope を解決するときに渡す最小限の文脈。
 * 兄弟トークンの値が必要な特殊な規則(観測太陰太陽暦など)は、
 * より広い文脈(例: Tempos)を型引数として指定する。
 */
export type TempoBase = {
  label?: string
  write_at: number
}

/**
 * TempoRule: envelope の初期化(at)と遷移(slide)の規則。
 *
 * 固定幅、テーブル参照、等角分割、軌道位相分割、観測太陰太陽暦、
 * 不定時法などのバリエーションは、すべてこのインターフェースの実装になる。
 */
export interface TempoRule<Base = TempoBase> {
  at(write_at: number, base: Base): TempoEnvelope
  slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope
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
export class CachedTempoRule<Base extends TempoBase = TempoBase> implements TempoRule<Base> {
  private cached?: TempoEnvelope

  constructor(private readonly rule: TempoRule<Base>) {}

  at(write_at: number, base: Base): TempoEnvelope {
    const cached = this.cached
    if (cached && cached.last_at <= write_at && write_at < cached.next_at) {
      return cached
    }
    return (this.cached = this.rule.at(write_at, base))
  }

  slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope {
    return this.rule.slide(envelope, amount, base)
  }
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
  readonly zero: number
  readonly write_at: number
  // 既存 to_tempos() が now_idx を解決後に直接書き換える箇所
  // (閏月番号の再割当て、元号切替に伴う年番号調整など)があるため、
  // readonly にはしない。
  now_idx: number
  readonly last_at: number
  readonly next_at: number
  readonly size: number
  readonly since: number
  readonly center_at: number
  readonly moderate_at: number
  label?: string
  is_leap?: boolean
  is_cover(at: number): boolean
  succ(n?: number): TempoLike
  back(n?: number): TempoLike
  slide(n: number): TempoLike
  slide_to(n: number): TempoLike
  copy(): TempoLike
  reset(now?: number): TempoLike
}

/**
 * 既存の Tempo を TempoLike の境界へ渡すための変換関数。
 * Tempo が構造的に TempoLike を満たさなくなった場合、ここで型エラーになる。
 */
export function to_tempo_like(tempo: Tempo): TempoLike {
  return tempo
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
  readonly now_idx: number
  readonly last_at: number
  readonly next_at: number
  label?: string
  is_leap?: boolean
  is_cover(at: number): boolean
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
export function cyclic_label(parent: TempoEnvelope, now_idx: number): TempoLabelLike {
  return {
    now_idx,
    last_at: parent.last_at,
    next_at: parent.next_at,
    is_cover: (at: number) => parent.last_at <= at && at < parent.next_at,
  }
}

function fixed_envelope(size: number, zero: number, write_at: number): TempoEnvelope {
  let now_idx = Math.floor((write_at - zero) / size)
  // 既存 to_tempo_bare と同じ式・同じ演算順序にする。
  // (last_at + size と (now_idx+1)*size+zero は数学的には同じだが、
  // 浮動小数点では丸め誤差が変わりうる。端数の出るサイズ(火星のsolを
  // 24分割する等)で succ() を繰り返すとこの誤差が蓄積し、後段で
  // to_tempos() が同じ write_at を再計算したときの now_idx が
  // 1つずれてしまうことがあるため、既存コードとビット単位で一致させる)
  let last_at = (now_idx + 0) * size + zero
  let next_at = (now_idx + 1) * size + zero
  // zero が write_at に対して絶対値の大きい(≒起点から遠い)場合、
  // (write_at-zero)/size が本来ちょうど整数になるはずなのに浮動小数点の
  // 丸め誤差で 0.999999999... のようにわずかに小さく計算され、floor が
  // 1つ小さい now_idx を返すことがある(実測: 火星暦の端数サイズ時刻で
  // 発生し、succ() で得た境界をそのまま write_at として使い回すと
  // 同じ場所に戻り続けて実質的な無限ループになった)。
  // 実際の区間 [last_at, next_at) に write_at が収まっているかを検証し、
  // 外れていれば 1 つ補正する(is_cover() の不変条件を保証する)。
  if (next_at <= write_at) {
    now_idx += 1
    last_at = next_at
    next_at = (now_idx + 1) * size + zero
  } else if (write_at < last_at) {
    now_idx -= 1
    next_at = last_at
    last_at = now_idx * size + zero
  }
  return { zero, now_idx, last_at, next_at }
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
function fixed_envelope_by_idx(size: number, zero: number, now_idx: number): TempoEnvelope {
  const last_at = now_idx * size + zero
  const next_at = (now_idx + 1) * size + zero
  return { zero, now_idx, last_at, next_at }
}

/**
 * FixedTempoRule: 固定幅(等間隔)の Tempo を解決する規則。
 * 既存の to_tempo_bare / Tempo.slide の非テーブル分岐と同じ計算をする。
 */
export class FixedTempoRule implements TempoRule {
  constructor(
    private readonly size: number,
    private readonly zero = 0,
  ) {}

  at(write_at: number): TempoEnvelope {
    return fixed_envelope(this.size, this.zero, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    return fixed_envelope_by_idx(this.size, envelope.zero, envelope.now_idx + amount)
  }
}

/**
 * SubdivideBase: 等角分割の解決に必要な文脈。
 * 分割元になる親 Tempo の envelope(特に last_at)を毎回渡す必要がある。
 */
export type SubdivideBase = TempoBase & {
  parent: TempoEnvelope
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
 */
export class SubdivideTempoRule implements TempoRule<SubdivideBase> {
  constructor(private readonly size: number) {}

  at(write_at: number, base: SubdivideBase): TempoEnvelope {
    return fixed_envelope(this.size, base.parent.last_at, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    return fixed_envelope_by_idx(this.size, envelope.zero, envelope.now_idx + amount)
  }
}

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
function floor_envelope(
  envelope: TempoEnvelope,
  size: number,
  coarseSize: number,
  coarseZero: number,
  write_at: number,
): TempoEnvelope {
  const nextCoarse = fixed_envelope(coarseSize, coarseZero, envelope.next_at)
  if (nextCoarse.last_at <= write_at) {
    // 元の Tempo.slide(1) と同じ基準点(write_at + size)を使う。
    // envelope.next_at を基準にすると、size が期ごとに変動する
    // (floor 済みの区間を再度 floor するなど)場合に誤った周期先へ
    // ずれてしまう。
    const nextPeriod = fixed_envelope(size, envelope.zero, write_at + size)
    const nextNextCoarse = fixed_envelope(coarseSize, coarseZero, nextPeriod.next_at)
    const now_idx = envelope.now_idx + 1
    const last_at = nextCoarse.last_at
    const next_at = nextNextCoarse.last_at
    return { zero: last_at - now_idx * size, now_idx, last_at, next_at }
  }
  const lastCoarse = fixed_envelope(coarseSize, coarseZero, envelope.last_at)
  const now_idx = envelope.now_idx
  const last_at = lastCoarse.last_at
  const next_at = nextCoarse.last_at
  return { zero: last_at - now_idx * size, now_idx, last_at, next_at }
}

/**
 * FloorStep: FloorTempoRule が順番に適用する「外向きに切り詰める先」の
 * 単位(例: 月境界、日境界)。
 */
export type FloorStep = { size: number; zero: number }

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
export class FloorTempoRule implements TempoRule {
  constructor(
    private readonly size: number,
    private readonly zero: number,
    private readonly floors: readonly FloorStep[],
  ) {}

  at(write_at: number): TempoEnvelope {
    let envelope = fixed_envelope(this.size, this.zero, write_at)
    for (const floor of this.floors) {
      const coarseSize = envelope.next_at - envelope.last_at
      envelope = floor_envelope(envelope, coarseSize, floor.size, floor.zero, write_at)
    }
    return envelope
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const midpoint = envelope.last_at + (amount + 0.5) * this.size
    return this.at(midpoint)
  }
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
export class CyclicDayTempoRule implements TempoRule {
  constructor(
    private readonly daySize: number,
    private readonly zero: number,
    private readonly length: number,
  ) {}

  at(write_at: number): TempoEnvelope {
    const raw = fixed_envelope(this.daySize, this.zero, write_at)
    const now_idx = mod(raw.now_idx, this.length)
    return {
      zero: raw.last_at - now_idx * this.daySize,
      now_idx,
      last_at: raw.last_at,
      next_at: raw.next_at,
    }
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const midpoint = envelope.last_at + (amount + 0.5) * this.daySize
    return this.at(midpoint)
  }
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
export class MeanLunarPhaseTempoRule implements TempoRule<TempoBase> {
  constructor(
    private readonly moonMsec: number,
    private readonly moonZero: number,
    private readonly daySize: number,
    private readonly dayZero: number,
  ) {}

  at(write_at: number): TempoEnvelope {
    const raw = fixed_envelope(this.moonMsec, this.moonZero, write_at)
    return floor_envelope(raw, this.moonMsec, this.daySize, this.dayZero, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const targetIdx = envelope.now_idx + amount
    const midpoint = this.moonZero + (targetIdx + 0.5) * this.moonMsec
    return this.at(midpoint)
  }
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
export class MeanLunisolarMonthRule implements TempoRule<TempoBase> {
  constructor(
    private readonly moonMsec: number,
    private readonly moonZero: number,
    private readonly daySize: number,
    private readonly dayZero: number,
    private readonly termCount: number,
    private readonly resolveSeason: (write_at: number) => TempoLike,
  ) {}

  at(write_at: number): TempoEnvelope {
    const raw = fixed_envelope(this.moonMsec, this.moonZero, write_at)
    const month = floor_envelope(raw, this.moonMsec, this.daySize, this.dayZero, write_at)
    const is_cover = (at: number) => month.last_at <= at && at < month.next_at

    let season = this.resolveSeason(month.last_at)
    let is_leap = false
    if (!is_cover(season.moderate_at)) {
      season = this.resolveSeason(month.next_at)
      if (!is_cover(season.moderate_at)) {
        is_leap = true
      }
    }
    const now_idx = mod(season.now_idx, this.termCount) >> 1

    return {
      zero: month.last_at - now_idx * this.moonMsec,
      now_idx,
      last_at: month.last_at,
      next_at: month.next_at,
      is_leap,
    }
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const midpoint = envelope.last_at + (amount + 0.5) * this.moonMsec
    return this.at(midpoint)
  }
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
export class EraAdjustedTempoRule<Base extends TempoBase = TempoBase> implements TempoRule<Base> {
  constructor(
    private readonly innerRule: TempoRule<Base>,
    private readonly avgYearMsec: number,
    private readonly eraTable: readonly number[],
    private readonly eraZero: number,
    private readonly eras: readonly (readonly [string, number, number])[],
  ) {}

  private with_era(raw: TempoEnvelope, era_at: number): TempoEnvelope {
    // def_eras() 自身が this.table.msec.era を構築する最中(まだ未設定)に
    // this.to_tempos() を呼ぶ(各元号の開始年の raw な now_idx を得るため)
    // ため、この規則もその構築の最中に呼ばれうる。その場合は元号調整
    // 前の raw な値を返す(既存 to_tempos() が `if (this.table.msec.era
    // != null)` で同じ状況をガードしていたのと同じ理由)。
    if (!this.eraTable) return raw
    const eraEnv = table_envelope(this.eraTable, this.eraZero, era_at)
    const era = this.eras[eraEnv.now_idx]
    if (!era?.[0]) return raw
    const now_idx = raw.now_idx + 1 - era[2]
    return { ...raw, now_idx }
  }

  at(write_at: number, base: Base): TempoEnvelope {
    const raw = this.innerRule.at(write_at, base)
    return this.with_era(raw, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number, base: Base): TempoEnvelope {
    const since = base.write_at - envelope.last_at
    const midpoint = envelope.last_at + (amount + 0.5) * this.avgYearMsec
    const raw = this.innerRule.at(midpoint, base)
    const era_at = Math.min(Math.max(raw.last_at + since, raw.last_at), raw.next_at - 1)
    return this.with_era(raw, era_at)
  }
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
export class ObservedLunisolarYearRule implements TempoRule<TempoBase> {
  constructor(
    private readonly resolveYear: (write_at: number) => {
      year_start_at: number
      next_year_start_at: number
      year: number
    },
  ) {}

  at(write_at: number): TempoEnvelope {
    const { year_start_at, next_year_start_at, year } = this.resolveYear(write_at)
    const yearSize = next_year_start_at - year_start_at
    return {
      zero: year_start_at - year * yearSize,
      now_idx: year,
      last_at: year_start_at,
      next_at: next_year_start_at,
    }
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const avgSize = envelope.next_at - envelope.last_at
    const midpoint = envelope.last_at + (amount + 0.5) * avgSize
    return this.at(midpoint)
  }
}

function table_envelope_by_idx(table: readonly number[], zero: number, now_idx: number): TempoEnvelope {
  const idx = mod(now_idx, table.length)
  const table_idx = Math.floor(now_idx / table.length)
  const table_diff = table_idx ? table[table.length - 1] * table_idx : 0
  const last_at = zero + table_diff + (table[idx - 1] || 0)
  const next_at = zero + table_diff + table[idx]
  return { zero, now_idx, last_at, next_at, table }
}

function table_envelope(table: readonly number[], zero: number, write_at: number): TempoEnvelope {
  let scan_at = write_at - zero
  const table_size = table[table.length - 1]
  const table_idx = Math.floor(scan_at / table_size)
  if (table_idx) {
    scan_at -= table_idx * table_size
  }

  let now_idx = table.length
  let top_idx = 0
  while (top_idx < now_idx) {
    const mid_idx = (top_idx + now_idx) >>> 1
    if (table[mid_idx] <= scan_at) {
      top_idx = mid_idx + 1
    } else {
      now_idx = mid_idx
    }
  }

  return table_envelope_by_idx(table, zero, now_idx + table_idx * table.length)
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
export class TableTempoRule implements TempoRule {
  constructor(
    private readonly table: readonly number[],
    private readonly zero = 0,
  ) {}

  at(write_at: number): TempoEnvelope {
    return table_envelope(this.table, this.zero, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    return table_envelope_by_idx(this.table, this.zero, envelope.now_idx + amount)
  }
}

/**
 * SolarDayHourBase: 不定時法の時刻を解決するための文脈。
 * 対象の暦日(day)の envelope を毎回渡す必要がある
 * (日の出・入りは日ごとに変わるため)。
 */
export type SolarDayHourBase = TempoBase & {
  day: TempoEnvelope
}

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
export class SolarDayHourTempoRule implements TempoRule<SolarDayHourBase> {
  constructor(
    private readonly sunny: OrbitalModel,
    private readonly earthy: RotationModel,
    private readonly geo: TIMEZONE,
    private readonly dayMsec: number,
    private readonly dayZero: number,
    private readonly yearMsec: number,
    private readonly seasonZero: number,
    private readonly hourLength: number,
  ) {}

  at(write_at: number, base: SolarDayHourBase): TempoEnvelope {
    const list = this.hour_table(write_at, base.day)
    return table_envelope(list, base.day.last_at, write_at)
  }

  slide(envelope: TempoEnvelope, amount: number, base: SolarDayHourBase): TempoEnvelope {
    const now_idx = envelope.now_idx + amount
    if (envelope.table && 0 <= now_idx && now_idx < envelope.table.length) {
      return table_envelope_by_idx(envelope.table, envelope.zero, now_idx)
    }
    const list = this.hour_table(base.write_at, base.day)
    return table_envelope_by_idx(list, base.day.last_at, now_idx)
  }

  private hour_table(write_at: number, dayEnvelope: TempoEnvelope): number[] {
    const day = new Tempo(
      dayEnvelope.zero,
      dayEnvelope.now_idx,
      write_at,
      dayEnvelope.last_at,
      dayEnvelope.next_at,
    )
    const solarNoon = noon(this.sunny, this.dayMsec, this.dayZero, this.yearMsec, this.seasonZero, write_at, day)
    const { 日の出, 日の入 } = solor(
      this.sunny,
      this.earthy,
      this.geo,
      this.dayMsec,
      this.dayZero,
      this.yearMsec,
      this.seasonZero,
      write_at,
      4,
      solarNoon,
    )
    const size = this.hourLength / 4
    const list: number[] = []

    let next_at = 0
    let msec = (日の出 - day.last_at) / size
    for (let idx = 0, end = 1 * size; idx < end; idx++) {
      next_at += msec
      list.push(Math.floor(next_at))
    }

    next_at = 日の出 - day.last_at
    msec = (日の入 - 日の出) / (2 * size)
    for (let idx = 1 * size, end = 3 * size; idx < end; idx++) {
      next_at += msec
      list.push(Math.floor(next_at))
    }

    next_at = day.size
    msec = (day.next_at - 日の入) / size
    const tails: number[] = []
    for (let idx = 3 * size, end = 4 * size; idx < end; idx++) {
      tails.push(Math.ceil(next_at))
      next_at -= msec
    }
    list.push(...tails.reverse())
    return list
  }
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
export class OrbitalPhaseTempoRule implements TempoRule<TempoBase> {
  constructor(
    private readonly sunny: OrbitalModel,
    private readonly divisions: number,
    private readonly referencePhaseOffset = 0,
  ) {}

  at(write_at: number): TempoEnvelope {
    const avgSize = this.sunny.periodMsec / this.divisions
    const boundaryAt = (idx: number) =>
      solar_phase(this.sunny, idx / this.divisions - this.referencePhaseOffset, write_at)

    let idx = Math.floor(mod(this.sunny.phaseAt(write_at) + this.referencePhaseOffset, 1) * this.divisions)
    let last_at = boundaryAt(idx)
    while (write_at < last_at) {
      idx = mod(idx - 1, this.divisions)
      last_at = boundaryAt(idx)
    }
    let next_at = boundaryAt(mod(idx + 1, this.divisions))
    while (next_at <= write_at) {
      idx = mod(idx + 1, this.divisions)
      last_at = next_at
      next_at = boundaryAt(mod(idx + 1, this.divisions))
    }

    // idx はこの探索で確定した「基準位相からの区間番号」であり、既に
    // 0..divisions-1 に収まっている(mod 済み)ラベル整合な値。以前は
    // sunny.epochMsec からの連番を now_idx にしていたため、ラベル参照側
    // (list[val.now_idx] を mod なしで直接引く)と基準がずれ、呼び出し側
    // (resolve_orbital_season)で都度 idx を再計算し直す必要があった。
    // ここで直接 idx を返すことで、その再計算が不要になる。
    const now_idx = idx
    return { zero: last_at - now_idx * avgSize, now_idx, last_at, next_at }
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const avgSize = this.sunny.periodMsec / this.divisions
    return this.at(envelope.last_at + amount * avgSize + avgSize / 2)
  }
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
export class ObservedLunisolarMonthRule implements TempoRule<TempoBase> {
  constructor(
    private readonly resolveMonth: (write_at: number) => LunisolarDate,
    private readonly avgMonthMsec: number,
  ) {}

  at(write_at: number): TempoEnvelope {
    const date = this.resolveMonth(write_at)
    const now_idx = date.month - 1
    const size = date.next_at - date.last_at
    return {
      zero: date.last_at - now_idx * size,
      now_idx,
      last_at: date.last_at,
      next_at: date.next_at,
      is_leap: date.is_leap,
    }
  }

  slide(envelope: TempoEnvelope, amount: number): TempoEnvelope {
    const midpoint = envelope.last_at + (amount + 0.5) * this.avgMonthMsec
    return this.at(midpoint)
  }
}

/**
 * envelope_of: 任意の TempoLike(既存 Tempo でも TempoView でも)から
 * TempoEnvelope 形状を取り出す。SubdivideBase.parent / SolarDayHourBase.day
 * など、他の規則へ「区間情報」だけを渡したい文脈で使う
 * (具象型が Tempo か TempoView かを呼び出し側が意識しなくてよくなる)。
 */
export function envelope_of(t: TempoLike): TempoEnvelope {
  return {
    zero: t.zero,
    now_idx: t.now_idx,
    last_at: t.last_at,
    next_at: t.next_at,
    label: t.label,
    is_leap: t.is_leap,
  }
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
export class TempoView<Base extends TempoBase = TempoBase> implements TempoLike {
  constructor(
    private envelope: TempoEnvelope,
    public base: Base,
    public readonly rule: TempoRule<Base>,
  ) {}

  get zero() {
    return this.envelope.zero
  }
  get write_at() {
    return this.base.write_at
  }
  get now_idx() {
    return this.envelope.now_idx
  }
  set now_idx(value: number) {
    this.envelope = { ...this.envelope, now_idx: value }
  }
  get last_at() {
    return this.envelope.last_at
  }
  get next_at() {
    return this.envelope.next_at
  }
  get size() {
    return this.envelope.next_at - this.envelope.last_at
  }
  get since() {
    return this.base.write_at - this.envelope.last_at
  }
  get center_at() {
    return (this.envelope.next_at + this.envelope.last_at) / 2
  }
  get moderate_at() {
    return this.envelope.now_idx & 1 ? this.envelope.last_at : this.envelope.next_at
  }
  get label() {
    return this.envelope.label
  }
  set label(value: string | undefined) {
    this.envelope = { ...this.envelope, label: value }
  }
  get is_leap() {
    return this.envelope.is_leap
  }
  set is_leap(value: boolean | undefined) {
    this.envelope = { ...this.envelope, is_leap: value }
  }

  is_cover(at: number) {
    return this.envelope.last_at <= at && at < this.envelope.next_at
  }

  succ(n = 1): TempoView<Base> {
    return this.slide(n)
  }
  back(n = 1): TempoView<Base> {
    return this.slide(-n)
  }
  slide(amount: number): TempoView<Base> {
    const since = this.since
    const envelope = this.rule.slide(this.envelope, amount, this.base)
    const base = { ...this.base, write_at: envelope.last_at + since }
    return new TempoView(envelope, base, this.rule)
  }
  slide_to(n: number): TempoView<Base> {
    return this.slide(n - this.envelope.now_idx)
  }
  copy(): TempoView<Base> {
    return new TempoView(this.envelope, this.base, this.rule)
  }
  reset(now: number = Date.now()): TempoView<Base> {
    const base = { ...this.base, write_at: now }
    return new TempoView(this.rule.at(now, base), base, this.rule)
  }

  /** rule.at(base.write_at, base) を解決して TempoView を作る。 */
  static at<B extends TempoBase>(rule: TempoRule<B>, base: B): TempoView<B> {
    return new TempoView(rule.at(base.write_at, base), base, rule)
  }
}
