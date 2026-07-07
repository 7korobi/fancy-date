import type { OrbitalModel, TIMEZONE } from '../orbital-model'
export type LunisolarPrincipalTerm = {
  index: number
  longitudeDeg: number
  month: number
  at: number
}
export type LunisolarDate = {
  year: number
  month: number
  day: number
  is_leap: boolean
  year_start_at: number
  next_year_start_at: number
  day_start_at: number
  last_at: number
  next_at: number
  new_moon_at: number
  next_new_moon_at: number
  principal_term?: LunisolarPrincipalTerm
}
type PhaseResolver = (phase: number, near: number) => number
export type LunisolarOptions = {
  moony?: OrbitalModel
  geo: TIMEZONE
  dayMsec: number
  dayZero: number
  lunarPhase: PhaseResolver
  solarPhase: PhaseResolver
}
export declare function lunisolar(options: LunisolarOptions, utc: number): LunisolarDate
export {}
