export type ComputusSystem = 'gregorian' | 'julian'

export type CivilDate = {
  year: number
  month: number
  day: number
}

export type ComputusResult = {
  system: ComputusSystem
  year: number
  paschal_full_moon: CivilDate
  easter_sunday: CivilDate
}

export type ChurchFeastId =
  | 'epiphany'
  | 'annunciation'
  | 'ash-wednesday'
  | 'palm-sunday'
  | 'maundy-thursday'
  | 'good-friday'
  | 'holy-saturday'
  | 'easter-sunday'
  | 'ascension'
  | 'pentecost'
  | 'all-saints'
  | 'christmas'

export type ChurchFeast = {
  id: ChurchFeastId
  kind: 'fixed' | 'movable'
  date: CivilDate
  offset_from_easter?: number
}

const FIXED_FEASTS: readonly (readonly [ChurchFeastId, number, number])[] = [
  ['epiphany', 1, 6],
  ['annunciation', 3, 25],
  ['all-saints', 11, 1],
  ['christmas', 12, 25],
]

const MOVABLE_FEASTS: readonly (readonly [ChurchFeastId, number])[] = [
  ['ash-wednesday', -46],
  ['palm-sunday', -7],
  ['maundy-thursday', -3],
  ['good-friday', -2],
  ['holy-saturday', -1],
  ['easter-sunday', 0],
  ['ascension', 39],
  ['pentecost', 49],
]

function positive_mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function assert_year(year: number) {
  if (!Number.isInteger(year)) throw new RangeError(`invalid computus year ${year}`)
}

function civil_date(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function civil_date_to_jdn(date: CivilDate, system: ComputusSystem) {
  const a = Math.floor((14 - date.month) / 12)
  const year = date.year + 4800 - a
  const month = date.month + 12 * a - 3
  if (system === 'julian') {
    return date.day + Math.floor((153 * month + 2) / 5) + 365 * year + Math.floor(year / 4) - 32083
  }
  return (
    date.day +
    Math.floor((153 * month + 2) / 5) +
    365 * year +
    Math.floor(year / 4) -
    Math.floor(year / 100) +
    Math.floor(year / 400) -
    32045
  )
}

function jdn_to_civil_date(jdn: number, system: ComputusSystem): CivilDate {
  if (system === 'julian') {
    const c = jdn + 32082
    const d = Math.floor((4 * c + 3) / 1461)
    const e = c - Math.floor((1461 * d) / 4)
    const monthIndex = Math.floor((5 * e + 2) / 153)
    return civil_date(
      d - 4800 + Math.floor(monthIndex / 10),
      monthIndex + 3 - 12 * Math.floor(monthIndex / 10),
      e - Math.floor((153 * monthIndex + 2) / 5) + 1,
    )
  }
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const monthIndex = Math.floor((5 * e + 2) / 153)
  return civil_date(
    100 * b + d - 4800 + Math.floor(monthIndex / 10),
    monthIndex + 3 - 12 * Math.floor(monthIndex / 10),
    e - Math.floor((153 * monthIndex + 2) / 5) + 1,
  )
}

export function add_civil_days(date: CivilDate, amount: number, system: ComputusSystem): CivilDate {
  if (!Number.isInteger(amount)) throw new RangeError(`invalid civil day amount ${amount}`)
  return jdn_to_civil_date(civil_date_to_jdn(date, system) + amount, system)
}

export function convert_civil_date(
  date: CivilDate,
  from: ComputusSystem,
  to: ComputusSystem,
): CivilDate {
  if (from === to) return { ...date }
  return jdn_to_civil_date(civil_date_to_jdn(date, from), to)
}

function gregorian_computus(year: number): ComputusResult {
  const century = Math.floor(year / 100)
  const yearOfCentury = year % 100
  const goldenNumber = year % 19
  const leapCentury = Math.floor(century / 4)
  const centuryRemainder = century % 4
  const solarCorrection = Math.floor((century + 8) / 25)
  const lunarCorrection = Math.floor((century - solarCorrection + 1) / 3)
  const epact = positive_mod(19 * goldenNumber + century - leapCentury - lunarCorrection + 15, 30)
  const leapYear = Math.floor(yearOfCentury / 4)
  const yearRemainder = yearOfCentury % 4
  const weekdayCorrection = positive_mod(
    32 + 2 * centuryRemainder + 2 * leapYear - epact - yearRemainder,
    7,
  )
  const correction = Math.floor((goldenNumber + 11 * epact + 22 * weekdayCorrection) / 451)
  const easterMonth = Math.floor((epact + weekdayCorrection - 7 * correction + 114) / 31)
  const easterDay = positive_mod(epact + weekdayCorrection - 7 * correction + 114, 31) + 1
  return {
    system: 'gregorian',
    year,
    paschal_full_moon: add_civil_days(civil_date(year, 3, 21), epact, 'gregorian'),
    easter_sunday: civil_date(year, easterMonth, easterDay),
  }
}

function julian_computus(year: number): ComputusResult {
  const lunarCycle = year % 19
  const solarCycle = year % 4
  const weekdayCycle = year % 7
  const epact = positive_mod(19 * lunarCycle + 15, 30)
  const weekdayCorrection = positive_mod(2 * solarCycle + 4 * weekdayCycle - epact + 34, 7)
  const easterMonth = Math.floor((epact + weekdayCorrection + 114) / 31)
  const easterDay = positive_mod(epact + weekdayCorrection + 114, 31) + 1
  return {
    system: 'julian',
    year,
    paschal_full_moon: add_civil_days(civil_date(year, 3, 21), epact, 'julian'),
    easter_sunday: civil_date(year, easterMonth, easterDay),
  }
}

export function computus(year: number, system: ComputusSystem = 'gregorian'): ComputusResult {
  assert_year(year)
  return system === 'julian' ? julian_computus(year) : gregorian_computus(year)
}

export function church_feasts(
  year: number,
  system: ComputusSystem = 'gregorian',
): readonly ChurchFeast[] {
  const result = computus(year, system)
  const fixed = FIXED_FEASTS.map(([id, month, day]) => ({
    id,
    kind: 'fixed' as const,
    date: civil_date(year, month, day),
  }))
  const movable = MOVABLE_FEASTS.map(([id, offset_from_easter]) => ({
    id,
    kind: 'movable' as const,
    date: add_civil_days(result.easter_sunday, offset_from_easter, system),
    offset_from_easter,
  }))
  return [...fixed, ...movable].sort(
    (left, right) => civil_date_to_jdn(left.date, system) - civil_date_to_jdn(right.date, system),
  )
}
