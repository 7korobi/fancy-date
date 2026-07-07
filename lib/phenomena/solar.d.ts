import type { OrbitalModel, RotationModel, TIMEZONE } from '../orbital-model'
import type { TempoLike } from '../tempo'
import { Tempo } from '../tempo'
export declare function solar_phase(sunny: OrbitalModel, phase: number, near: number): number
export declare function solar_term(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  utc: number,
  phase: number,
): Tempo<{
  write_at: number
}>
export declare function solar_phase_before(sunny: OrbitalModel, phase: number, utc: number): number
export declare function solar_terms(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  utc: number,
): {
  立春: Tempo<{
    write_at: number
  }>
  入梅: Tempo<{
    write_at: number
  }>
  春分: Tempo<{
    write_at: number
  }>
  半夏生: Tempo<{
    write_at: number
  }>
  夏土用: Tempo<{
    write_at: number
  }>
  立夏: Tempo<{
    write_at: number
  }>
  夏至: Tempo<{
    write_at: number
  }>
  秋土用: Tempo<{
    write_at: number
  }>
  立秋: Tempo<{
    write_at: number
  }>
  秋分: Tempo<{
    write_at: number
  }>
  冬土用: Tempo<{
    write_at: number
  }>
  立冬: Tempo<{
    write_at: number
  }>
  冬至: Tempo<{
    write_at: number
  }>
  春土用: Tempo<{
    write_at: number
  }>
  次立春: Tempo<{
    write_at: number
  }>
}
export declare function noon(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  yearMsec: number,
  seasonZero: number,
  utc: number,
  day?: TempoLike,
): {
  last_at: number
  center_at: number
  T0: Tempo<{
    write_at: number
  }>
  T1: Tempo<{
    write_at: number
  }>
  季節: number
  南中差分: number
  南中時刻: number
  真夜中: number
  zero: number
  write_at: number
  now_idx: number
  next_at: number
  size: number
  since: number
  moderate_at: number
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
export declare function solor(
  sunny: OrbitalModel,
  earthy: RotationModel,
  geo: TIMEZONE,
  dayMsec: number,
  dayZero: number,
  yearMsec: number,
  seasonZero: number,
  utc: number,
  idx?: number,
  solarNoon?: {
    last_at: number
    center_at: number
    T0: Tempo<{
      write_at: number
    }>
    T1: Tempo<{
      write_at: number
    }>
    季節: number
    南中差分: number
    南中時刻: number
    真夜中: number
    zero: number
    write_at: number
    now_idx: number
    next_at: number
    size: number
    since: number
    moderate_at: number
    label?: string
    is_leap?: boolean
    is_cover(at: number): boolean
    succ(n?: number): TempoLike
    back(n?: number): TempoLike
    slide(n: number): TempoLike
    slide_to(n: number): TempoLike
    copy(): TempoLike
    reset(now?: number): TempoLike
  },
):
  | import('../orbital-model').SolarObservation
  | {
      K: number
      lat: number
      時角: number
      方向: number
      高度: number
      真夜中: number
      日の出: number
      南中時刻: number
      日の入: number
      南中高度: number
      has_sunrise: boolean
      is_up_all_day: boolean
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
export declare function solar_terms_mean(Zz: TempoLike, d: TempoLike): SolarTerms
/**
 * 雑節_from_terms: 二十四節気+雑節の基準15項目から、八十八夜・二百十日・
 * 二百二十日・彼岸・社日・土用・節分などの雑節一式を組み立てる共通部分。
 * 基準15項目を実軌道(solar_terms)で求めるか平気法(solar_terms_mean)で
 * 求めるかだけが 雑節_by_phase / 雑節_by_mean の違いになる。
 */
export declare function 雑節_from_terms(
  dayMsec: number,
  day10Zero: number,
  stemLength: number,
  terms: SolarTerms,
): {
  立春: Tempo<{
    write_at: number
  }>
  立夏: Tempo<{
    write_at: number
  }>
  立秋: Tempo<{
    write_at: number
  }>
  立冬: Tempo<{
    write_at: number
  }>
  冬至: Tempo<{
    write_at: number
  }>
  春分: Tempo<{
    write_at: number
  }>
  夏至: Tempo<{
    write_at: number
  }>
  秋分: Tempo<{
    write_at: number
  }>
  入梅: Tempo<{
    write_at: number
  }>
  半夏生: Tempo<{
    write_at: number
  }>
  春: Tempo<import('../tempo').TempoBase>
  夏: Tempo<import('../tempo').TempoBase>
  秋: Tempo<import('../tempo').TempoBase>
  冬: Tempo<import('../tempo').TempoBase>
  春社日: Tempo<{
    write_at: number
  }>
  秋社日: Tempo<{
    write_at: number
  }>
  春土用: Tempo<{
    write_at: number
  }>
  夏土用: Tempo<{
    write_at: number
  }>
  秋土用: Tempo<{
    write_at: number
  }>
  冬土用: Tempo<{
    write_at: number
  }>
  春節分: Tempo<{
    write_at: number
  }>
  夏節分: Tempo<{
    write_at: number
  }>
  秋節分: Tempo<{
    write_at: number
  }>
  冬節分: Tempo<{
    write_at: number
  }>
  節分: Tempo<{
    write_at: number
  }>
  春彼岸: Tempo<import('../tempo').TempoBase>
  秋彼岸: Tempo<import('../tempo').TempoBase>
  八十八夜: Tempo<{
    write_at: number
  }>
  二百十日: Tempo<{
    write_at: number
  }>
  二百二十日: Tempo<{
    write_at: number
  }>
}
/**
 * 雑節_by_mean: 平気法(等角分割)版。solar_terms_mean() で基準項目を求め、
 * 雑節_from_terms() で残りを組み立てる。既存 FancyDate.雑節() と同じ結果になる。
 */
export declare function 雑節_by_mean(
  Zz: TempoLike,
  d: TempoLike,
  dayMsec: number,
  day10Zero: number,
  stemLength: number,
): {
  立春: Tempo<{
    write_at: number
  }>
  立夏: Tempo<{
    write_at: number
  }>
  立秋: Tempo<{
    write_at: number
  }>
  立冬: Tempo<{
    write_at: number
  }>
  冬至: Tempo<{
    write_at: number
  }>
  春分: Tempo<{
    write_at: number
  }>
  夏至: Tempo<{
    write_at: number
  }>
  秋分: Tempo<{
    write_at: number
  }>
  入梅: Tempo<{
    write_at: number
  }>
  半夏生: Tempo<{
    write_at: number
  }>
  春: Tempo<import('../tempo').TempoBase>
  夏: Tempo<import('../tempo').TempoBase>
  秋: Tempo<import('../tempo').TempoBase>
  冬: Tempo<import('../tempo').TempoBase>
  春社日: Tempo<{
    write_at: number
  }>
  秋社日: Tempo<{
    write_at: number
  }>
  春土用: Tempo<{
    write_at: number
  }>
  夏土用: Tempo<{
    write_at: number
  }>
  秋土用: Tempo<{
    write_at: number
  }>
  冬土用: Tempo<{
    write_at: number
  }>
  春節分: Tempo<{
    write_at: number
  }>
  夏節分: Tempo<{
    write_at: number
  }>
  秋節分: Tempo<{
    write_at: number
  }>
  冬節分: Tempo<{
    write_at: number
  }>
  節分: Tempo<{
    write_at: number
  }>
  春彼岸: Tempo<import('../tempo').TempoBase>
  秋彼岸: Tempo<import('../tempo').TempoBase>
  八十八夜: Tempo<{
    write_at: number
  }>
  二百十日: Tempo<{
    write_at: number
  }>
  二百二十日: Tempo<{
    write_at: number
  }>
}
export declare function 雑節_by_phase(
  sunny: OrbitalModel,
  dayMsec: number,
  dayZero: number,
  day10Zero: number,
  stemLength: number,
  utc: number,
): {
  立春: Tempo<{
    write_at: number
  }>
  立夏: Tempo<{
    write_at: number
  }>
  立秋: Tempo<{
    write_at: number
  }>
  立冬: Tempo<{
    write_at: number
  }>
  冬至: Tempo<{
    write_at: number
  }>
  春分: Tempo<{
    write_at: number
  }>
  夏至: Tempo<{
    write_at: number
  }>
  秋分: Tempo<{
    write_at: number
  }>
  入梅: Tempo<{
    write_at: number
  }>
  半夏生: Tempo<{
    write_at: number
  }>
  春: Tempo<import('../tempo').TempoBase>
  夏: Tempo<import('../tempo').TempoBase>
  秋: Tempo<import('../tempo').TempoBase>
  冬: Tempo<import('../tempo').TempoBase>
  春社日: Tempo<{
    write_at: number
  }>
  秋社日: Tempo<{
    write_at: number
  }>
  春土用: Tempo<{
    write_at: number
  }>
  夏土用: Tempo<{
    write_at: number
  }>
  秋土用: Tempo<{
    write_at: number
  }>
  冬土用: Tempo<{
    write_at: number
  }>
  春節分: Tempo<{
    write_at: number
  }>
  夏節分: Tempo<{
    write_at: number
  }>
  秋節分: Tempo<{
    write_at: number
  }>
  冬節分: Tempo<{
    write_at: number
  }>
  節分: Tempo<{
    write_at: number
  }>
  春彼岸: Tempo<import('../tempo').TempoBase>
  秋彼岸: Tempo<import('../tempo').TempoBase>
  八十八夜: Tempo<{
    write_at: number
  }>
  二百十日: Tempo<{
    write_at: number
  }>
  二百二十日: Tempo<{
    write_at: number
  }>
}
export declare function to_tempo_by_solor(
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
): Tempo<{
  write_at: number
}>
export {}
