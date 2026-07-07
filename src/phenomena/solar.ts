import type { OrbitalModel, RotationModel, TIMEZONE } from '../orbital-model'
import { mod } from '../number'
import { hasSolarEvents } from '../orbital-model'
import type { TempoLike } from '../tempo'
import { CyclicDayTempoRule, FixedTempoRule, join, Tempo } from '../tempo'
import { to_tempo_by, to_tempo_bare } from '../time'

export function solar_phase(sunny: OrbitalModel, phase: number, near: number) {
  return sunny.timeOfPhase(mod(phase, 1), near)
}

export function solar_term(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  utc: number,
  phase: number,
) {
  const at = solar_phase(sunny, phase, utc)
  return Tempo.at(new FixedTempoRule(dayMsec, dayZero), { write_at: at })
}

export function solar_phase_before(sunny: OrbitalModel, phase: number, utc: number) {
  let at = solar_phase(sunny, phase, utc)
  while (utc < at) {
    at = solar_phase(sunny, phase, at - sunny.periodMsec)
  }
  return at
}

export function solar_terms(sunny: OrbitalModel, dayMsec: number, dayZero: number, utc: number) {
  const phases = {
    立春: 1 / 8,
    入梅: 80 / 360,
    春分: 2 / 8,
    半夏生: 100 / 360,
    夏土用: 13 / 40,
    立夏: 3 / 8,
    夏至: 4 / 8,
    秋土用: 23 / 40,
    立秋: 5 / 8,
    秋分: 6 / 8,
    冬土用: 33 / 40,
    立冬: 7 / 8,
    冬至: 8 / 8,
    春土用: 43 / 40,
    次立春: 9 / 8,
  }
  const springEquinoxPhase = 2 / 8
  const basePhase = phases.立春
  const baseAt = solar_phase_before(sunny, basePhase - springEquinoxPhase, utc)
  const term = (phase: number) => {
    const near = baseAt + (phase - basePhase) * sunny.periodMsec
    return solar_term(sunny, dayMsec, dayZero, near, phase - springEquinoxPhase)
  }
  return {
    立春: term(phases.立春),
    入梅: term(phases.入梅),
    春分: term(phases.春分),
    半夏生: term(phases.半夏生),
    夏土用: term(phases.夏土用),
    立夏: term(phases.立夏),
    夏至: term(phases.夏至),
    秋土用: term(phases.秋土用),
    立秋: term(phases.立秋),
    秋分: term(phases.秋分),
    冬土用: term(phases.冬土用),
    立冬: term(phases.立冬),
    冬至: term(phases.冬至),
    春土用: term(phases.春土用),
    次立春: term(phases.次立春),
  }
}

export function noon(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  yearMsec: number,
  seasonZero: number,
  utc: number,
  day: TempoLike = to_tempo_bare(dayMsec, dayZero, utc),
) {
  const { last_at, center_at } = day
  const { sin, PI } = Math
  const deg_to_day = dayMsec / 360
  const year_to_rad = (2 * PI) / yearMsec

  const T0 = to_tempo_bare(yearMsec, seasonZero, utc)

  const 南中差分A = deg_to_day * 2.0 * sin(year_to_rad * T0.since)
  const 南中差分B = deg_to_day * 2.5 * sin(year_to_rad * T0.since * 2 + PI * 0.4)
  const 南中差分 = 南中差分A + 南中差分B

  const 南中時刻 = center_at + 南中差分
  const 真夜中 = last_at + 南中差分

  const T1 = to_tempo_bare(yearMsec, sunny.epochMsec, 南中時刻)
  const 季節 = T1.since * year_to_rad

  // { ...day } は day が TempoLike(getterベース、例: TempoView)の場合、
  // インスタンス自身のプロパティではなくprototypeのgetterなので
  // オブジェクトスプレッドで複製されない(生の Tempo は各フィールドを
  // コンストラクタでインスタンスプロパティとして持つため今まで気づかれ
  // なかった)。solor() が読む last_at はここで明示的に含めることで、
  // day がどちらの型でも正しく動くようにする。
  return { ...day, last_at, center_at, T0, T1, 季節, 南中差分, 南中時刻, 真夜中 }
}

export function solor(
  sunny: OrbitalModel,
  earthy: RotationModel,
  geo: TIMEZONE,
  dayMsec: number,
  dayZero: number,
  yearMsec: number,
  seasonZero: number,
  utc: number,
  idx = 2,
  solarNoon = noon(sunny, dayMsec, dayZero, yearMsec, seasonZero, utc),
) {
  const days = [6, -18 / 60, -50 / 60, -6, -7.36, -12, -18]
  if (hasSolarEvents(sunny)) {
    return sunny.solarEvents(utc, {
      latitudeDeg: geo[0],
      longitudeDeg: geo[1],
      timezoneDeg: geo[2],
      horizonDeg: days[idx],
      dayStartUtc: solarNoon.last_at,
      dayCenterUtc: solarNoon.center_at,
    })
  }
  const { 季節, 南中時刻, 真夜中 } = solarNoon
  const { asin, acos, sin, cos, PI } = Math
  const deg_to_rad = (2 * PI) / 360
  const rad_to_day = dayMsec / (2 * PI)

  const 高度 = days[idx] * deg_to_rad
  const K = earthy.axialTiltDeg * deg_to_rad
  const lat = geo[0] * deg_to_rad

  const 赤緯 = asin(sin(K) * sin(季節))
  const 時角 = acos((sin(高度) - sin(lat) * sin(赤緯)) / (cos(lat) * cos(赤緯)))
  const 方向 = acos((cos(lat) * sin(赤緯) - sin(lat) * cos(赤緯) * cos(時角)) / cos(高度))

  const 日の出 = Math.floor(南中時刻 - 時角 * rad_to_day)
  const 日の入 = Math.floor(南中時刻 + 時角 * rad_to_day)
  // 南中高度(南中=太陽が真南に来る瞬間の高度)は「90°-|緯度-赤緯|」という
  // 標準公式で求まる。EarthSolarOrbital.solarEvents() 側にはあった
  // 南中高度/日の出方位/日の入方位/has_sunrise/is_up_all_day が、この
  // (hasSolarEvents を持たない簡易モデル向けの)フォールバック経路には
  // 実装されておらず SolarObservation 型と食い違っていた
  // (呼び出し側で型チェックされていなかったため気づかれていなかった)。
  const 南中高度 = PI / 2 - Math.abs(lat - 赤緯)
  // 方向(=日の出方位)は cos(時角) の偶関数性により日の出・日の入で同じ式
  // 値になる(実測: 精密モデル(EarthSolarOrbital)でも日の入方位は
  // 2π-日の出方位 と最大0.25°程度(分点付近、赤緯が日中に変化する分の
  // 誤差)しか違わず、この平均モデル自体が1日を通して赤緯を一定とみなす
  // 近似である以上、鏡映で求めても精度上の後退はない)ため、日の入方位は
  // 日の出方位(=方向)を北基準で反転(2π-方向)して求める。
  const 日の出方位 = 方向
  const 日の入方位 = 2 * PI - 方向

  return {
    K,
    lat,
    時角,
    方向,
    高度,
    真夜中,
    日の出,
    南中時刻,
    日の入,
    日の出方位,
    日の入方位,
    南中高度,
    has_sunrise: !Number.isNaN(時角),
    is_up_all_day: 0 <= 南中高度,
  }
}

type SolarTerms = ReturnType<typeof solar_terms>

/**
 * solar_terms_mean: 平気法(等角分割)版の二十四節気+雑節の基準15項目。
 * solar_terms() が実軌道(sunny.timeOfPhase())で求めるのに対し、
 * こちらは Zz(平均太陽年)の span を比例配分するだけで求める。
 * 既存 FancyDate.雑節() が内部で行っていた計算をそのまま抽出したもの。
 *
 * Zz/d は呼び出し側の to_tempos() が解決した Tempo をそのまま渡すこと
 * (暦によって d の zero 基準が異なる場合があるため、ここで作り直さない)。
 */
export function solar_terms_mean(Zz: TempoLike, d: TempoLike): SolarTerms {
  const d0 = d.reset(Zz.zero)
  const phases = {
    立春: 1 / 8,
    入梅: 80 / 360,
    春分: 2 / 8,
    半夏生: 100 / 360,
    夏土用: 13 / 40,
    立夏: 3 / 8,
    夏至: 4 / 8,
    秋土用: 23 / 40,
    立秋: 5 / 8,
    秋分: 6 / 8,
    冬土用: 33 / 40,
    立冬: 7 / 8,
    冬至: 8 / 8,
    春土用: 43 / 40,
    次立春: 9 / 8,
  }
  const term = (phase: number) => {
    const now = Zz.last_at + (phase - phases.立春) * Zz.size
    return Tempo.at(new FixedTempoRule(d.size, d0.last_at), { write_at: now })
  }
  return {
    立春: term(phases.立春),
    入梅: term(phases.入梅),
    春分: term(phases.春分),
    半夏生: term(phases.半夏生),
    夏土用: term(phases.夏土用),
    立夏: term(phases.立夏),
    夏至: term(phases.夏至),
    秋土用: term(phases.秋土用),
    立秋: term(phases.立秋),
    秋分: term(phases.秋分),
    冬土用: term(phases.冬土用),
    立冬: term(phases.立冬),
    冬至: term(phases.冬至),
    春土用: term(phases.春土用),
    次立春: term(phases.次立春),
  }
}

/**
 * 雑節_from_terms: 二十四節気+雑節の基準15項目から、八十八夜・二百十日・
 * 二百二十日・彼岸・社日・土用・節分などの雑節一式を組み立てる共通部分。
 * 基準15項目を実軌道(solar_terms)で求めるか平気法(solar_terms_mean)で
 * 求めるかだけが 雑節_by_phase / 雑節_by_mean の違いになる。
 */
export function 雑節_from_terms(
  dayMsec: number,
  day10Zero: number,
  stemLength: number,
  terms: SolarTerms,
) {
  let {
    立春,
    入梅,
    春分,
    半夏生,
    夏土用,
    立夏,
    夏至,
    秋土用,
    立秋,
    秋分,
    冬土用,
    立冬,
    冬至,
    春土用,
    次立春: 立春2,
  } = terms

  const [八十八夜, 二百十日, 二百二十日] = [88, 210, 220].map((n) => 立春.succ(n - 1))

  const [春彼岸, 秋彼岸] = [春分, 秋分].map((dd) => {
    return join(dd.back(3), dd.succ(3))
  })
  const [春社日, 秋社日] = [春分, 秋分].map((dd) => {
    // 「十干『戊』(stemLength/2-1 番目)に最も近い日」を求める計算。
    // 以前は素の Tempo(to_tempo_bare)を構築した後 now_idx を
    // mod(now_idx, stemLength) で書き換えてから slide() していたが、
    // 素の Tempo.slide()(非テーブル分岐)は write_at 基準で再導出する
    // ため書き換えた now_idx を使わず安全だった一方、この書き換え済み
    // now_idx を伴う envelope をそのまま TempoRule.slide() に渡すのは
    // 一般には危険(FixedTempoRule.slide() は envelope.now_idx + amount
    // を絶対値として直接使うため、ラップ済みの小さい値だと壊れる。
    // __tests__/tempo-spec.js の 'PITFALL' テスト参照)。
    // CyclicDayTempoRule.slide() は envelope.last_at 基準で at() を
    // 再導出する設計のため、mod 済みの now_idx を経由しても安全
    // (同ファイルの 'CyclicDayTempoRule for the 社日-style ...' で
    // 旧実装との数値一致・全10剰余の網羅を検証済み)。
    const view = Tempo.at(new CyclicDayTempoRule(dayMsec, day10Zero, stemLength), {
      write_at: dd.write_at,
    })
    return view.slide(stemLength / 2 - view.now_idx - 1)
  })

  const 春 = join(立春, 夏土用.back())
  const 夏節分 = 立夏.back()
  const 夏 = join(立夏, 秋土用.back())
  const 秋節分 = 立秋.back()
  const 秋 = join(立秋, 冬土用.back())
  const 冬節分 = 立冬.back()
  const 冬 = join(立冬, 春土用.back())
  const 春節分 = 立春2.back()
  const 節分 = 春節分

  夏土用 = join(夏土用, 夏節分)
  秋土用 = join(秋土用, 秋節分)
  冬土用 = join(冬土用, 冬節分)
  春土用 = join(春土用, 立春2)

  return {
    立春,
    立夏,
    立秋,
    立冬,
    冬至,
    春分,
    夏至,
    秋分,
    入梅,
    半夏生,
    春,
    夏,
    秋,
    冬,
    春社日,
    秋社日,
    春土用,
    夏土用,
    秋土用,
    冬土用,
    春節分,
    夏節分,
    秋節分,
    冬節分,
    節分,
    春彼岸,
    秋彼岸,
    八十八夜,
    二百十日,
    二百二十日,
  }
}

/**
 * 雑節_by_mean: 平気法(等角分割)版。solar_terms_mean() で基準項目を求め、
 * 雑節_from_terms() で残りを組み立てる。既存 FancyDate.雑節() と同じ結果になる。
 */
export function 雑節_by_mean(
  Zz: TempoLike,
  d: TempoLike,
  dayMsec: number,
  day10Zero: number,
  stemLength: number,
) {
  return 雑節_from_terms(dayMsec, day10Zero, stemLength, solar_terms_mean(Zz, d))
}

export function 雑節_by_phase(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  day10Zero: number,
  stemLength: number,
  utc: number,
) {
  return 雑節_from_terms(dayMsec, day10Zero, stemLength, solar_terms(sunny, dayMsec, dayZero, utc))
}

export function to_tempo_by_solor(
  sunny: OrbitalModel,
  earthy: RotationModel,
  geo: TIMEZONE,
  dayMsec: number,
  dayZero: number,
  yearMsec: number,
  seasonZero: number,
  hourLength: number,
  utc: number,
  day: TempoLike,
) {
  let idx, end, start
  const solarNoon = noon(sunny, dayMsec, dayZero, yearMsec, seasonZero, utc, day)
  const { 日の出, 日の入 } = solor(
    sunny,
    earthy,
    geo,
    dayMsec,
    dayZero,
    yearMsec,
    seasonZero,
    utc,
    4,
    solarNoon,
  )
  const size = hourLength / 4

  const list: number[] = []

  let next_at = 0
  let msec = (日の出 - day.last_at) / size
  for (idx = 0, end = 1 * size; idx < end; idx++) {
    next_at += msec
    list.push(Math.floor(next_at))
  }

  next_at = 日の出 - day.last_at
  msec = (日の入 - 日の出) / (2 * size)
  for (start = 1 * size, idx = start, end = 3 * size; idx < end; idx++) {
    next_at += msec
    list.push(Math.floor(next_at))
  }

  next_at = day.size
  msec = (day.next_at - 日の入) / size

  const tails: number[] = []
  for (start = 3 * size, idx = start, end = 4 * size; idx < end; idx++) {
    tails.push(Math.ceil(next_at))
    next_at -= msec
  }
  list.push(...tails.reverse())
  return to_tempo_by(list, day.last_at, utc)
}
