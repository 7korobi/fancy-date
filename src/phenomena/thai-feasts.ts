import type { FeastDate, FeastPolicy, FeastPolicyContext, FeastRecord } from './calendar-policy'
import {
  thai_lunisolar_date_start,
  thai_lunisolar_year_type,
  type ThaiLunisolarOptions,
} from './thai-lunisolar'

export type ThaiBuddhistFeastId =
  | 'makha-bucha'
  | 'visakha-bucha'
  | 'asalha-bucha'
  | 'khao-phansa'
  | 'ok-phansa'

export type ThaiBuddhistFeast = FeastRecord<ThaiBuddhistFeastId> & {
  thai_year: number
  lunar_month: number
  lunar_day: number
  is_leap_month: boolean
  utc: number
}

export type ThaiBuddhistFeastPolicyOptions = {
  lunar: ThaiLunisolarOptions
}

function local_civil_date(utc: number, options: ThaiLunisolarOptions): FeastDate {
  const timezoneMsec = (options.dayMsec * (options.geo[2] ?? options.geo[1])) / 360
  const local = new Date(utc + timezoneMsec)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  }
}

export class ThaiBuddhistFeastPolicy implements FeastPolicy<FeastPolicyContext, ThaiBuddhistFeast> {
  constructor(readonly options: ThaiBuddhistFeastPolicyOptions) {}

  resolve({ year }: FeastPolicyContext): readonly ThaiBuddhistFeast[] {
    const isIntercalaryMonth = thai_lunisolar_year_type(year - 543) === 'intercalary-month'
    const targets = [
      { id: 'makha-bucha' as const, month: 3, day: 15, is_leap: false },
      { id: 'visakha-bucha' as const, month: 6, day: 15, is_leap: false },
      { id: 'asalha-bucha' as const, month: 8, day: 15, is_leap: isIntercalaryMonth },
      { id: 'khao-phansa' as const, month: 8, day: 16, is_leap: isIntercalaryMonth },
      { id: 'ok-phansa' as const, month: 11, day: 15, is_leap: false },
    ]
    return targets.map(({ id, month, day, is_leap }) => {
      const utc = thai_lunisolar_date_start(this.options.lunar, year, month, day, is_leap)
      return {
        id,
        kind: 'movable' as const,
        date: local_civil_date(utc, this.options.lunar),
        thai_year: year,
        lunar_month: month,
        lunar_day: day,
        is_leap_month: is_leap,
        utc,
      }
    })
  }
}
