import type { OrbitalModel, TIMEZONE } from '../orbital-model'
import { to_tempo_bare } from '../time'

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
  day_start_at: number
  last_at: number
  next_at: number
  new_moon_at: number
  next_new_moon_at: number
  principal_term?: LunisolarPrincipalTerm
}

type LunisolarMonth = Omit<LunisolarDate, 'year' | 'day' | 'day_start_at'> & {
  year?: number
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

export function lunisolar(options: LunisolarOptions, utc: number): LunisolarDate {
  const months = lunisolar_months_around(options, utc)
  const month = months.find(({ last_at, next_at }) => last_at <= utc && utc < next_at)
  if (!month || month.year == null) {
    throw new Error('failed to resolve lunisolar month')
  }
  const day = to_tempo_bare(options.dayMsec, options.dayZero, utc)
  return {
    ...month,
    year: month.year,
    day: Math.floor((day.last_at - month.last_at) / options.dayMsec) + 1,
    day_start_at: day.last_at,
  }
}

function lunisolar_months_around(options: LunisolarOptions, utc: number): LunisolarMonth[] {
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

  const newMoons = [newMoonAt]
  for (let i = 0; i < 18; i++) {
    newMoons.unshift(lunarPhase(0, newMoons[0] - periodMsec))
  }
  for (let i = 0; i < 19; i++) {
    newMoons.push(lunarPhase(0, newMoons[newMoons.length - 1] + periodMsec))
  }
  const months = newMoons.slice(0, -1).map((at, index) => {
    const nextAt = newMoons[index + 1]
    return {
      month: NaN,
      is_leap: false,
      last_at: local_day_start(options, at),
      next_at: local_day_start(options, nextAt),
      new_moon_at: at,
      next_new_moon_at: nextAt,
      principal_term: lunisolar_principal_term(options, at, nextAt),
    }
  })
  assign_lunisolar_months(options, months)
  return months
}

function assign_lunisolar_months(options: LunisolarOptions, months: LunisolarMonth[]) {
  let month = NaN
  for (const item of months) {
    if (item.principal_term) {
      month = item.principal_term.month
      item.month = month
      item.is_leap = false
    } else {
      item.month = month
      item.is_leap = true
    }
  }

  const firstAssignedIndex = months.findIndex(({ month }) => Number.isFinite(month))
  if (0 < firstAssignedIndex) {
    let previousMonth = months[firstAssignedIndex].month
    for (let i = firstAssignedIndex - 1; 0 <= i; i--) {
      const item = months[i]
      if (item.principal_term) {
        previousMonth = item.principal_term.month
        item.month = previousMonth
        item.is_leap = false
      } else {
        item.month = previousMonth
        item.is_leap = true
      }
    }
  }

  const firstMonthOneIndex = months.findIndex(({ month, is_leap }) => month === 1 && !is_leap)
  if (firstMonthOneIndex < 0) {
    const year = new Date(months[0].last_at + local_timezone_msec(options)).getUTCFullYear()
    for (const item of months) item.year = year
    return
  }
  let year = new Date(
    months[firstMonthOneIndex].last_at + local_timezone_msec(options),
  ).getUTCFullYear()
  for (let i = 0; i < firstMonthOneIndex; i++) {
    months[i].year = year - 1
  }
  for (let i = firstMonthOneIndex; i < months.length; i++) {
    const item = months[i]
    if (item.month === 1 && !item.is_leap) {
      year = new Date(item.last_at + local_timezone_msec(options)).getUTCFullYear()
    }
    item.year = year
  }
}

function lunisolar_principal_term(
  options: LunisolarOptions,
  monthStartAt: number,
  nextMonthStartAt: number,
) {
  const near = (monthStartAt + nextMonthStartAt) / 2
  const startAt = local_day_start(options, monthStartAt)
  const nextAt = local_day_start(options, nextMonthStartAt)
  for (let index = 0; index < 12; index++) {
    const at = options.solarPhase(index / 12, near)
    if (startAt <= at && at < nextAt) {
      return {
        index,
        longitudeDeg: index * 30,
        month: ((index + 1) % 12) + 1,
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