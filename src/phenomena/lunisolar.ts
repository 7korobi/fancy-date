import type { OrbitalModel, TIMEZONE } from '../orbital-model'
import { to_tempo_bare } from '../time'
import { PrincipalTermLunisolarPolicy } from './calendar-policy'
import type { LunisolarBoundarySource, LunisolarPhaseBoundary } from './calendar-policy'

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

type LunisolarMonth = Omit<
  LunisolarDate,
  'year' | 'day' | 'day_start_at' | 'year_start_at' | 'next_year_start_at'
> & {
  year?: number
}

type PhaseResolver = (phase: number, near: number) => number
type YearResolver = (at: number) => number

const LUNISOLAR_MONTH_WINDOW_PAST_MARGIN = 5
const LUNISOLAR_MONTH_WINDOW_FUTURE_MARGIN = 6

export type LunisolarOptions = {
  moony?: OrbitalModel
  solarPeriodMsec?: number
  principalTermCount?: number
  solarYear?: YearResolver
  boundarySource?: LunisolarBoundarySource
  geo: TIMEZONE
  dayMsec: number
  dayZero: number
  lunarPhase: PhaseResolver
  solarPhase: PhaseResolver
}

export function lunisolar_month_window_counts(
  options: Pick<LunisolarOptions, 'moony' | 'solarPeriodMsec'>,
) {
  if (!options.moony) {
    throw new Error('lunisolar requires a satellite orbital model')
  }
  const monthMsec = options.moony.periodMsec
  const yearMsec = options.solarPeriodMsec ?? monthMsec * 13
  if (!Number.isFinite(monthMsec) || monthMsec <= 0) {
    throw new Error(`invalid lunar period ${monthMsec}`)
  }
  if (!Number.isFinite(yearMsec) || yearMsec <= 0) {
    throw new Error(`invalid solar period ${yearMsec}`)
  }
  const monthsPerSolarYear = Math.max(1, Math.ceil(yearMsec / monthMsec))
  return {
    past: monthsPerSolarYear + LUNISOLAR_MONTH_WINDOW_PAST_MARGIN,
    future: monthsPerSolarYear + LUNISOLAR_MONTH_WINDOW_FUTURE_MARGIN,
  }
}

export function lunisolar(options: LunisolarOptions, utc: number): LunisolarDate {
  const months = lunisolar_months_around(options, utc)
  const month = months.find(({ last_at, next_at }) => last_at <= utc && utc < next_at)
  if (!month || month.year == null) {
    throw new Error('failed to resolve lunisolar month')
  }
  const currentMonth = month
  const currentYear = month.year
  const yearStartAt =
    months.find(({ year, month, is_leap }) => year === currentYear && month === 1 && !is_leap)
      ?.last_at ?? currentMonth.last_at
  const nextYearStartAt =
    months.find(({ year, month, is_leap }) => year === currentYear + 1 && month === 1 && !is_leap)
      ?.last_at ?? currentMonth.next_at
  const day = to_tempo_bare(options.dayMsec, options.dayZero, utc)
  return {
    ...month,
    year: month.year,
    year_start_at: yearStartAt,
    next_year_start_at: nextYearStartAt,
    day: Math.floor((day.last_at - month.last_at) / options.dayMsec) + 1,
    day_start_at: day.last_at,
  }
}

function lunisolar_months_around(options: LunisolarOptions, utc: number): LunisolarMonth[] {
  const boundaries = lunisolar_boundaries_around(options, utc)
  const yearOf = (at: number) =>
    options.solarYear?.(at) ?? new Date(at + local_timezone_msec(options)).getUTCFullYear()
  const policy = new PrincipalTermLunisolarPolicy(
    (boundary) => lunisolar_principal_term(options, boundary),
    yearOf,
  )
  return policy.assign(boundaries).map((item) => ({
    month: item.month,
    is_leap: item.is_leap,
    year: item.year,
    last_at: item.last_at,
    next_at: item.next_at,
    new_moon_at: item.source_at,
    next_new_moon_at: item.next_source_at,
    principal_term: item.principal_term,
  }))
}

function lunisolar_boundaries_around(
  options: LunisolarOptions,
  utc: number,
): LunisolarPhaseBoundary[] {
  if (!options.moony) {
    throw new Error('lunisolar requires a satellite orbital model')
  }
  const { lunarPhase } = options
  const periodMsec = options.moony.periodMsec
  let newMoonAt = lunarPhase(0, utc)
  let monthStartAt = local_day_start(options, newMoonAt)
  while (utc < monthStartAt) {
    newMoonAt = lunarPhase(0, newMoonAt - periodMsec)
    monthStartAt = local_day_start(options, newMoonAt)
  }
  while (local_day_start(options, lunarPhase(0, newMoonAt + periodMsec)) <= utc) {
    newMoonAt = lunarPhase(0, newMoonAt + periodMsec)
    monthStartAt = local_day_start(options, newMoonAt)
  }

  // 前後の探索幅は「太陽年に含まれる朔望月数 + 安全マージン」から導く。
  // 地球の月では ceil(太陽年/朔望月)=13 なので従来と同じ過去18/未来19ヶ月
  // (中心を含む37ヶ月区間)になる。月が地球より短い場合は年境界を見失わない
  // よう探索幅を広げ、長い場合は不要な探索を減らす。
  const window = lunisolar_month_window_counts(options)
  const newMoons = [newMoonAt]
  for (let i = 0; i < window.past; i++) {
    newMoons.unshift(lunarPhase(0, newMoons[0] - periodMsec))
  }
  for (let i = 0; i < window.future; i++) {
    newMoons.push(lunarPhase(0, newMoons[newMoons.length - 1] + periodMsec))
  }
  const source_kind = options.boundarySource ?? 'observed'
  return newMoons.slice(0, -1).map((at, index) => {
    const nextAt = newMoons[index + 1]
    return {
      index,
      last_at: local_day_start(options, at),
      next_at: local_day_start(options, nextAt),
      source_at: at,
      next_source_at: nextAt,
      source_kind,
    }
  })
}

function lunisolar_principal_term(options: LunisolarOptions, boundary: LunisolarPhaseBoundary) {
  const termCount = options.principalTermCount ?? 12
  if (!Number.isInteger(termCount) || termCount <= 0) {
    throw new Error(`invalid principal term count ${termCount}`)
  }
  const near = (boundary.source_at + boundary.next_source_at) / 2
  const startAt = local_day_start(options, boundary.source_at)
  const nextAt = local_day_start(options, boundary.next_source_at)
  // principalTermCount は「月名を決める中気の数」。地球型なら12、木星・
  // カリストのように1太陽年あたり約260朔望月ある暦では260にできる。
  // 探索窓は lunisolar_month_window_counts() が月/年比率から広げ、ここでは
  // その年を principalTermCount 等分した中気のうち、この月に入るものを探す。
  for (let index = 0; index < termCount; index++) {
    const at = options.solarPhase(index / termCount, near)
    if (startAt <= at && at < nextAt) {
      return {
        index,
        longitudeDeg: (index * 360) / termCount,
        month: ((index + 1) % termCount) + 1,
        at,
      }
    }
  }
  return undefined
}

function local_day_start({ dayMsec, dayZero }: LunisolarOptions, utc: number) {
  return to_tempo_bare(dayMsec, dayZero, utc).last_at
}

function local_timezone_msec({ dayMsec, geo }: LunisolarOptions) {
  return (dayMsec * (geo[2] != null ? geo[2] : geo[1])) / 360
}
