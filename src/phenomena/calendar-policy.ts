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

export type LunisolarPhaseBoundary = LunisolarBoundary & {
  source_at: number
  next_source_at: number
}

export type FeastDate = {
  year: number
  month: number
  day: number
}

export type FeastKind = 'fixed' | 'movable' | 'observed'

export type FeastRecord<Id extends string = string> = {
  id: Id
  kind: FeastKind
  date: FeastDate
}

export type FeastPolicyContext = {
  year: number
}

export type FeastPolicy<
  Context extends FeastPolicyContext = FeastPolicyContext,
  Feast extends FeastRecord = FeastRecord,
> = {
  resolve(context: Context): readonly Feast[]
}

export type LunisolarPrincipalTermLike = {
  index: number
  longitudeDeg: number
  month: number
  at: number
}

export type PrincipalTermLunisolarMonth = LunisolarPhaseBoundary & {
  month: number
  is_leap: boolean
  year: number
  principal_term?: LunisolarPrincipalTermLike
}

export class PrincipalTermLunisolarPolicy {
  constructor(
    private readonly resolvePrincipalTerm: (
      boundary: LunisolarPhaseBoundary,
    ) => LunisolarPrincipalTermLike | undefined,
    private readonly yearOf: (at: number) => number,
  ) {}

  assign(boundaries: readonly LunisolarPhaseBoundary[]): PrincipalTermLunisolarMonth[] {
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

/**
 * A civil day's hour-slot construction policy. Day boundary selection remains
 * a separate policy, so temporal hours can be combined with midnight-based
 * civil dates as the existing calendar model requires.
 */
export type HourDivisionInput =
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

export type HourDivisionPolicy =
  | {
      kind: 'equal'
      divisions: number
      arithmetic: HourArithmeticPolicy
    }
  | {
      kind: 'temporal'
      dayDivisions: number
      nightDivisions: number
      dayStart: 'sunrise'
      dayEnd: 'sunset'
      arithmetic: HourArithmeticPolicy
    }
  | {
      kind: 'table'
      boundaries: readonly number[]
      arithmetic: HourArithmeticPolicy
    }

export type LegacyHourDivision = false | 'equal' | 'solar'

export type DayBoundaryEvent = 'sunrise' | 'sunset'

export type DayBoundaryPolicy =
  | { kind: 'midnight' }
  | { kind: 'fixed-offset'; offsetHours: number }
  | { kind: 'solar-event'; event: DayBoundaryEvent }

export type DayAssignmentContext = {
  token: string
  dayStart: 'midnight' | 'sunrise' | 'sunset'
  at: number
  previousAt: number
  nextAt: number
}

export type DayAssignmentResult =
  | number
  | {
      now_idx: number
      assignment_raw_now_idx?: number
      assignment_flags?: readonly string[]
    }

export type DayAssignmentPolicy = {
  assign(context: DayAssignmentContext): DayAssignmentResult
}

export function normalizeDayBoundaryPolicy(
  dayStart?: DayBoundaryEvent,
  offsetHours?: number,
): DayBoundaryPolicy {
  if (dayStart != null) return { kind: 'solar-event', event: dayStart }
  if (offsetHours != null) {
    if (!Number.isFinite(offsetHours) || offsetHours < -24 || 24 < offsetHours) {
      throw new RangeError(`day boundary offset must be between -24 and 24 hours: ${offsetHours}`)
    }
    return { kind: 'fixed-offset', offsetHours }
  }
  return { kind: 'midnight' }
}

export function normalizeHourDivisionPolicy(
  value: LegacyHourDivision | HourDivisionInput,
  defaultDivisions: number,
): HourDivisionPolicy {
  if (value === false || value === 'equal') {
    return {
      kind: 'equal',
      divisions: defaultDivisions,
      arithmetic: 'elapsed-duration',
    }
  }
  if (value === 'solar') {
    if (
      !Number.isInteger(defaultDivisions) ||
      defaultDivisions <= 0 ||
      defaultDivisions % 2 !== 0
    ) {
      throw new RangeError(
        `temporal hours require a positive even division count: ${defaultDivisions}`,
      )
    }
    const divisions = defaultDivisions / 2
    return {
      kind: 'temporal',
      dayDivisions: divisions,
      nightDivisions: divisions,
      dayStart: 'sunrise',
      dayEnd: 'sunset',
      arithmetic: 'boundary-step',
    }
  }
  if (value.kind === 'equal') {
    if (!Number.isInteger(value.divisions) || value.divisions <= 0) {
      throw new RangeError(`equal hours require a positive division count: ${value.divisions}`)
    }
  } else if (value.kind === 'temporal') {
    if (
      !Number.isInteger(value.dayDivisions) ||
      value.dayDivisions <= 0 ||
      !Number.isInteger(value.nightDivisions) ||
      value.nightDivisions <= 0
    ) {
      throw new RangeError('temporal hours require positive day and night divisions')
    }
  } else if (value.boundaries.length === 0 || value.boundaries.some((boundary) => boundary <= 0)) {
    throw new RangeError('table hours require positive cumulative boundaries')
  }
  if (value.kind === 'equal') {
    return { ...value, arithmetic: value.arithmetic ?? 'elapsed-duration' }
  }
  return { ...value, arithmetic: value.arithmetic ?? 'boundary-step' }
}
