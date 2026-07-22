import type { FancyDate } from '../../fancy-date'
import {
  ThaiBuddhistFeastPolicy,
  type ThaiBuddhistFeast,
  type ThaiBuddhistFeastId,
} from '../../phenomena/thai-feasts'

export const THAI_BUDDHIST_FEAST_LABELS: Readonly<Record<ThaiBuddhistFeastId, string>> = {
  'makha-bucha': 'マーカブーチャー',
  'visakha-bucha': 'ヴィサーカブーチャー',
  'asalha-bucha': 'アーサーンハブーチャー',
  'khao-phansa': '入安居',
  'ok-phansa': '出安居',
}

export type ThaiBuddhistFeastOptions = {
  labels?: Partial<Record<ThaiBuddhistFeastId, string>>
}

export type ThaiBuddhistFeastDate = ThaiBuddhistFeast & {
  label: string
}

function policy_of(calendar: FancyDate) {
  return new ThaiBuddhistFeastPolicy({
    lunar: {
      geo: calendar.dic.geo,
      dayMsec: calendar.calc.msec.day,
      dayZero: calendar.calc.zero.day,
    },
  })
}

export function thaiBuddhistFeastDates(
  calendar: FancyDate,
  year: number,
  options: ThaiBuddhistFeastOptions = {},
): readonly ThaiBuddhistFeastDate[] {
  const labels = { ...THAI_BUDDHIST_FEAST_LABELS, ...options.labels }
  return policy_of(calendar)
    .resolve({ year })
    .map((feast) => ({ ...feast, label: labels[feast.id] }))
}

export function thaiBuddhistFeastNotes(
  calendar: FancyDate,
  utc: number,
  options: ThaiBuddhistFeastOptions = {},
): readonly string[] {
  const thaiDate = calendar.thaiLunisolar(utc)
  return [thaiDate.year - 1, thaiDate.year, thaiDate.year + 1]
    .flatMap((year) => thaiBuddhistFeastDates(calendar, year, options))
    .filter((feast) => feast.utc === thaiDate.day_start_at)
    .map(({ label }) => label)
}
