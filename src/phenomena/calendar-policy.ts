import { mod } from '../number'

export type CalendarMonthLayout = {
  index: number
  month: number
  days: number
  is_leap?: boolean
  label?: string
}

export type CalendarYearLayout = {
  year: number
  lengthDays: number
  months: readonly CalendarMonthLayout[]
  is_leap?: boolean
  kind?: string
}

export type CalendarYearPolicy<Context = unknown> = {
  resolve(year: number, context: Context): CalendarYearLayout
}

export type CalendarYearPolicyContext = {
  normalLengthDays: number
  leapLengthDays: number
  normalMonths?: readonly CalendarMonthLayout[]
  leapMonths?: readonly CalendarMonthLayout[]
}

export class PeriodicCalendarYearPolicy implements CalendarYearPolicy<CalendarYearPolicyContext> {
  constructor(
    readonly divisors: readonly number[],
    readonly period: number,
    readonly leapShift = 0,
  ) {}

  isLeapYear(year: number) {
    const relativeYear = mod(year - this.leapShift, this.period)
    let isLeap = false
    for (let index = 0; index < this.divisors.length; index++) {
      if (relativeYear % this.divisors[index] !== 0) continue
      isLeap = index % 2 === 0
    }
    return isLeap || mod(year, this.period) === mod(this.leapShift, this.period)
  }

  resolve(year: number, context: CalendarYearPolicyContext): CalendarYearLayout {
    const is_leap = this.isLeapYear(year)
    return {
      year,
      lengthDays: is_leap ? context.leapLengthDays : context.normalLengthDays,
      months: is_leap ? (context.leapMonths ?? []) : (context.normalMonths ?? []),
      is_leap,
      kind: 'periodic',
    }
  }
}

export type LunisolarBoundarySource = 'mean' | 'observed' | 'table' | 'hybrid'

export type LunisolarBoundary = {
  index: number
  last_at: number
  next_at: number
  source_at?: number
  next_source_at?: number
  source_kind: LunisolarBoundarySource
}

export type LunisolarYearContext = {
  solar_year: number
  year_start_at: number
  next_year_start_at: number
  months: readonly LunisolarBoundary[]
  source?: LunisolarBoundarySource
}

export type LunisolarLeapDay = {
  month: number
  amount: number
}

export type LunisolarPolicy = {
  resolveYear(context: LunisolarYearContext): number
  resolveMonth(context: LunisolarYearContext, boundary: LunisolarBoundary): number
  isLeapMonth?(context: LunisolarYearContext, boundary: LunisolarBoundary): boolean
  resolveLeapDay?(context: LunisolarYearContext): LunisolarLeapDay | undefined
}

export type LunisolarPrincipalTermLike = {
  index: number
  longitudeDeg: number
  month: number
  at: number
}

export type PrincipalTermLunisolarMonth = LunisolarBoundary & {
  month: number
  is_leap: boolean
  year: number
  principal_term?: LunisolarPrincipalTermLike
}

export class PrincipalTermLunisolarPolicy {
  constructor(
    private readonly resolvePrincipalTerm: (
      boundary: LunisolarBoundary,
    ) => LunisolarPrincipalTermLike | undefined,
    private readonly yearOf: (at: number) => number,
  ) {}

  assign(boundaries: readonly LunisolarBoundary[]): PrincipalTermLunisolarMonth[] {
    const assigned = boundaries.map((boundary) => ({
      ...boundary,
      month: NaN,
      is_leap: false,
      year: NaN,
      principal_term: this.resolvePrincipalTerm(boundary),
    }))
    let month = NaN
    for (const item of assigned) {
      if (item.principal_term) {
        month = item.principal_term.month
        item.month = month
        item.is_leap = false
      } else {
        item.month = month
        item.is_leap = true
      }
    }

    const firstAssignedIndex = assigned.findIndex(({ month }) => Number.isFinite(month))
    if (0 < firstAssignedIndex) {
      let previousMonth = assigned[firstAssignedIndex].month
      for (let index = firstAssignedIndex - 1; 0 <= index; index--) {
        const item = assigned[index]
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

    const firstMonthOneIndex = assigned.findIndex(({ month, is_leap }) => month === 1 && !is_leap)
    if (firstMonthOneIndex < 0) {
      const year = this.yearOf(assigned[0].last_at)
      for (const item of assigned) item.year = year
      return assigned
    }

    let year = this.yearOf(assigned[firstMonthOneIndex].last_at)
    for (let index = 0; index < firstMonthOneIndex; index++) {
      assigned[index].year = year - 1
    }
    for (let index = firstMonthOneIndex; index < assigned.length; index++) {
      const item = assigned[index]
      if (item.month === 1 && !item.is_leap) {
        year = this.yearOf(item.last_at)
      }
      item.year = year
    }
    return assigned
  }
}

export type HourArithmeticPolicy = 'elapsed-duration' | 'boundary-step'

export type HourDivisionPolicy =
  | {
      kind: 'equal'
      divisions: number
      arithmetic?: HourArithmeticPolicy
    }
  | {
      kind: 'temporal'
      dayDivisions: number
      nightDivisions: number
      dayStart: 'sunrise'
      dayEnd: 'sunset'
      arithmetic?: HourArithmeticPolicy
    }
  | {
      kind: 'table'
      boundaries: readonly number[]
      arithmetic?: HourArithmeticPolicy
    }
