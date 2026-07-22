import type { FancyDate } from '../../fancy-date'
import {
  ChurchFeastPolicy,
  convert_civil_date,
  type ChurchFeast,
  type ChurchFeastId,
  type ComputusSystem,
} from '../../phenomena/computus'

export const CHURCH_FEAST_LABELS: Readonly<Record<ChurchFeastId, string>> = {
  epiphany: '公現祭',
  annunciation: '受胎告知',
  'ash-wednesday': '灰の水曜日',
  'palm-sunday': '枝の主日',
  'maundy-thursday': '聖木曜日',
  'good-friday': '聖金曜日',
  'holy-saturday': '聖土曜日',
  'easter-sunday': '復活祭',
  ascension: '昇天祭',
  pentecost: '聖霊降臨祭',
  'all-saints': '諸聖人の日',
  christmas: '降誕祭',
}

export type ChurchFeastOptions = {
  system?: ComputusSystem
  calendarSystem?: ComputusSystem
  labels?: Partial<Record<ChurchFeastId, string>>
}

export type ChurchFeastDate = Omit<ChurchFeast, 'date'> & {
  date: ChurchFeast['date']
  computus_date: ChurchFeast['date']
  utc: number
  label: string
}

function civil_date_text({ year, month, day }: ChurchFeast['date']) {
  return `${year}年${month}月${day}日`
}

export function churchFeastDates(
  calendar: FancyDate,
  year: number,
  options: ChurchFeastOptions = {},
): readonly ChurchFeastDate[] {
  const system = options.system ?? 'gregorian'
  const calendarSystem = options.calendarSystem ?? system
  const labels = { ...CHURCH_FEAST_LABELS, ...options.labels }
  return new ChurchFeastPolicy(system).resolve({ year }).map((feast) => {
    const date = convert_civil_date(feast.date, system, calendarSystem)
    return {
      ...feast,
      date,
      computus_date: feast.date,
      utc: calendar.parse(civil_date_text(date), 'y年M月d日'),
      label: labels[feast.id],
    }
  })
}

export function churchFeastNotes(
  calendar: FancyDate,
  utc: number,
  options: ChurchFeastOptions = {},
): readonly string[] {
  const day = calendar.to_tempos(utc).d.last_at
  const year = calendar.to_tempos(day).y.now_idx
  return [year - 1, year, year + 1]
    .flatMap((candidateYear) => churchFeastDates(calendar, candidateYear, options))
    .filter((feast) => feast.utc === day)
    .map(({ label }) => label)
}
