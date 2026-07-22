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

export type LunisolarBoundarySource = 'mean' | 'observed' | 'table' | 'hybrid'

export type LunisolarBoundary = {
  index: number
  last_at: number
  next_at: number
  source_at?: number
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
