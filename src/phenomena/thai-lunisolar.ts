import type { TIMEZONE } from '../orbital-model'
import { to_tempo_bare } from '../time'
import type {
  CalendarMonthLayout,
  CalendarYearLayout,
  CalendarYearPolicy,
  CalendarYearPolicyContext,
} from './calendar-policy'

export type ThaiLunisolarYearType = 'normal' | 'intercalary-day' | 'intercalary-month'

export type ThaiLunisolarOptions = {
  geo: TIMEZONE
  dayMsec: number
  dayZero: number
}

export type ThaiLunisolarDate = {
  year: number
  month: number
  day: number
  is_leap: boolean
  is_intercalary_day: boolean
  year_type: ThaiLunisolarYearType
  year_start_at: number
  next_year_start_at: number
  day_start_at: number
  last_at: number
  next_at: number
  month_index: number
}

type MonthEntry = {
  month: number
  is_leap: boolean
  days: number
}

const MIN_YEAR = 1903
const SOLAR_DAY_MSEC = 86400000

const DEVIATION_SEEDS: readonly (readonly [number, number])[] = [
  [1901, 0.122733000004352],
  [1906, 0.0191890000045229],
  [1911, -0.0843549999953059],
  [1916, -0.187898999995135],
  [1921, -0.291442999994964],
  [1926, 0.0744250000052413],
  [1931, -0.0291189999945876],
  [1936, -0.132662999994416],
  [1941, -0.236206999994245],
  [1946, -0.339750999994074],
  [1951, -0.443294999993903],
  [1956, -0.0774269999936981],
  [1961, -0.180970999993527],
  [1966, -0.284514999993356],
  [1971, -0.388058999993185],
  [1976, -0.491602999993014],
  [1981, -0.595146999992842],
  [1986, -0.698690999992671],
  [1991, -0.332822999992466],
  [1996, -0.436366999992295],
  [2001, -0.539910999992124],
  [2006, -0.643454999991953],
  [2011, 0.253001000008218],
  [2016, 0.149457000008389],
  [2021, -0.484674999991406],
  [2026, -0.588218999991235],
  [2031, 0.308237000008937],
  [2036, 0.204693000009108],
  [2041, 0.101149000009279],
  [2046, -0.00239499999055015],
  [2051, -0.105938999990379],
  [2056, 0.259929000009826],
  [2061, 0.156385000009997],
  [2066, 0.0528410000101682],
  [2071, -0.0507029999896607],
  [2076, -0.15424699998949],
  [2081, -0.257790999989318],
  [2086, 0.108077000010887],
  [2091, 0.00453300001105772],
  [2096, -0.099010999988583],
  [2101, -0.2025549999886],
  [2106, -0.306098999988429],
  [2111, -0.409642999988258],
  [2116, -0.0437749999880528],
  [2121, -0.147318999987882],
  [2126, -0.250862999987711],
  [2131, -0.354406999987539],
  [2136, -0.457950999987368],
  [2141, -0.561494999987197],
  [2146, -0.665038999987026],
  [2151, -0.299170999986821],
  [2156, -0.40271499998665],
  [2161, -0.506258999986479],
  [2166, -0.609802999986308],
  [2171, -0.713346999986137],
  [2176, 0.183109000014035],
  [2181, -0.45102299998576],
  [2186, -0.554566999985589],
  [2191, 0.341889000014582],
  [2196, 0.238345000014753],
  [2201, 0.134801000014924],
  [2206, 0.0312570000150951],
  [2211, -0.0722869999847338],
  [2216, 0.293581000015471],
  [2221, 0.190037000015642],
  [2226, 0.0864930000158135],
  [2231, -0.0170509999839846],
  [2236, -0.120594999983844],
  [2241, -0.224138999983673],
  [2246, 0.141729000016532],
  [2251, 0.038185000016703],
  [2256, -0.0653589999824359],
  [2261, -0.168902999982955],
  [2266, -0.272446999982784],
  [2271, -0.375990999982613],
  [2276, -0.0101229999824078],
  [2281, -0.113666999982236],
  [2286, -0.217210999982065],
  [2291, -0.320754999981894],
  [2296, -0.424298999981723],
  [2301, -0.527842999981552],
  [2306, -0.631386999981381],
  [2311, -0.265518999981176],
  [2316, -0.369062999981005],
  [2321, -0.472606999980834],
  [2326, -0.576150999980662],
  [2331, -0.679694999980491],
  [2336, 0.21676100001968],
  [2341, -0.417370999980115],
  [2346, -0.520914999979944],
  [2351, -0.624458999979773],
  [2356, 0.271997000020398],
  [2361, 0.168453000020569],
  [2366, 0.064909000020749],
  [2371, -0.0386349999790885],
  [2376, 0.327233000021117],
  [2381, 0.223689000021288],
  [2386, 0.120145000021459],
  [2391, 0.0166000000166299],
  [2396, -0.086942999978199],
  [2401, -0.190486999978028],
  [2406, 0.175381000022177],
  [2411, 0.0718370000223483],
  [2416, -0.0317069999776306],
  [2421, -0.135250999977309],
  [2426, -0.238794999976967],
  [2431, -0.342338999976967],
  [2436, 0.023529000023529],
  [2441, -0.0800149999774661],
  [2446, -0.18355899997642],
  [2451, -0.287102999976249],
  [2456, -0.390646999976078],
]

const BEGIN_DATES: readonly (readonly [number, number, number])[] = [
  [1902, 11, 30],
  [1912, 12, 8],
  [1922, 11, 19],
  [1932, 11, 27],
  [1942, 12, 7],
  [1952, 11, 16],
  [1962, 11, 26],
  [1972, 12, 5],
  [1982, 11, 15],
  [1992, 11, 24],
  [2002, 12, 4],
  [2012, 11, 13],
  [2022, 11, 23],
  [2032, 12, 2],
  [2042, 12, 12],
  [2052, 11, 21],
  [2062, 12, 1],
  [2072, 12, 9],
  [2082, 11, 20],
  [2092, 11, 28],
  [2102, 12, 9],
  [2112, 11, 18],
  [2122, 11, 28],
  [2132, 12, 7],
  [2142, 11, 17],
  [2152, 11, 26],
  [2162, 12, 6],
  [2172, 11, 15],
  [2182, 11, 25],
  [2192, 12, 4],
  [2202, 12, 15],
  [2212, 11, 24],
  [2222, 12, 4],
  [2232, 12, 12],
  [2242, 11, 23],
  [2252, 12, 1],
  [2262, 12, 11],
  [2272, 11, 20],
  [2282, 11, 30],
  [2292, 12, 9],
  [2302, 11, 20],
  [2312, 11, 29],
  [2322, 12, 9],
  [2332, 11, 18],
  [2342, 11, 28],
  [2352, 12, 7],
  [2362, 12, 17],
  [2372, 11, 26],
  [2382, 12, 6],
  [2392, 12, 14],
  [2402, 11, 25],
  [2412, 12, 3],
  [2422, 12, 13],
  [2432, 11, 23],
  [2442, 12, 2],
  [2452, 12, 11],
]

const deviation_cache = new Map<number, number>(DEVIATION_SEEDS)

function assert_year(year: number) {
  if (!Number.isInteger(year) || year < MIN_YEAR) {
    throw new RangeError(`Thai lunisolar calendar supports year ${MIN_YEAR} and later`)
  }
}

function solar_year_of(utc: number, options: ThaiLunisolarOptions) {
  const local = new Date(utc + local_timezone_msec(options))
  return local.getUTCFullYear()
}

function local_timezone_msec({ dayMsec, geo }: ThaiLunisolarOptions) {
  const degrees = geo[2] ?? geo[1]
  return (dayMsec * degrees) / 360
}

function local_day_start(options: ThaiLunisolarOptions, utc: number) {
  return to_tempo_bare(options.dayMsec, options.dayZero, utc).last_at
}

function local_date_start(options: ThaiLunisolarOptions, year: number, month: number, day: number) {
  const localMidnight = Date.UTC(year, month - 1, day) - local_timezone_msec(options)
  return local_day_start(options, localMidnight)
}

function seed_for(year: number) {
  let selected = DEVIATION_SEEDS[0]
  for (const seed of DEVIATION_SEEDS) {
    if (seed[0] > year) break
    selected = seed
  }
  return selected
}

function athikamas(year: number) {
  return (year - 78 - 0.45222) % 2.7118886 < 1
}

function deviation(year: number): number {
  const cached = deviation_cache.get(year)
  if (cached != null) return cached
  const [seedYear, seedValue] = seed_for(year)
  let current = seedValue
  for (let currentYear = seedYear + 1; currentYear <= year; currentYear++) {
    const known = deviation_cache.get(currentYear)
    if (known != null) {
      current = known
      continue
    }
    const increment = athikamas(currentYear - 1)
      ? -0.102356
      : athikavar(currentYear - 1)
        ? -0.632944
        : 0.367056
    current += increment
    deviation_cache.set(currentYear, current)
  }
  return current
}

function athikavar(year: number) {
  if (athikamas(year)) return false
  const cutoff = athikamas(year + 1) ? 0.0169501433191599 : -0.0142223099315486
  return deviation(year) > cutoff
}

export function thai_lunisolar_year_type(year: number): ThaiLunisolarYearType {
  assert_year(year)
  if (athikamas(year)) return 'intercalary-month'
  if (athikavar(year)) return 'intercalary-day'
  return 'normal'
}

function thai_lunisolar_months(type: ThaiLunisolarYearType): readonly MonthEntry[] {
  const months: MonthEntry[] = [
    { month: 1, is_leap: false, days: 29 },
    { month: 2, is_leap: false, days: 30 },
    { month: 3, is_leap: false, days: 29 },
    { month: 4, is_leap: false, days: 30 },
    { month: 5, is_leap: false, days: 29 },
    { month: 6, is_leap: false, days: 30 },
    { month: 7, is_leap: false, days: type === 'intercalary-day' ? 30 : 29 },
    { month: 8, is_leap: false, days: 30 },
  ]
  if (type === 'intercalary-month') {
    months.push({ month: 8, is_leap: true, days: 30 })
  }
  months.push(
    { month: 9, is_leap: false, days: 29 },
    { month: 10, is_leap: false, days: 30 },
    { month: 11, is_leap: false, days: 29 },
    { month: 12, is_leap: false, days: 30 },
  )
  return months
}

const thai_year_policy_context: CalendarYearPolicyContext = {
  normalLengthDays: 354,
  leapLengthDays: 384,
}

export class ThaiModernLunisolarYearPolicy implements CalendarYearPolicy<CalendarYearPolicyContext> {
  resolve(year: number, _context: CalendarYearPolicyContext): CalendarYearLayout {
    const year_type = thai_lunisolar_year_type(year)
    const months: readonly CalendarMonthLayout[] = thai_lunisolar_months(year_type).map(
      ({ month, days, is_leap }, index) => ({
        index,
        month,
        days,
        is_leap,
      }),
    )
    return {
      year,
      lengthDays: months.reduce((total, month) => total + month.days, 0),
      months,
      is_leap: year_type !== 'normal',
      kind: year_type,
    }
  }
}

const thai_modern_year_policy = new ThaiModernLunisolarYearPolicy()

function thai_year_layout(year: number) {
  return thai_modern_year_policy.resolve(year, thai_year_policy_context)
}

export function thai_lunisolar_year_length(year: number) {
  return thai_year_layout(year).lengthDays
}

function year_start(options: ThaiLunisolarOptions, year: number) {
  assert_year(year)
  let selected = BEGIN_DATES[0]
  for (const begin of BEGIN_DATES) {
    if (year - 1 <= begin[0]) break
    selected = begin
  }
  let start = local_date_start(options, selected[0], selected[1], selected[2])
  // The published ten-year anchors calibrate the reference range. After the
  // final anchor, continue the same arithmetic year-length rule proleptically.
  for (let currentYear = selected[0] + 1; currentYear < year; currentYear++) {
    start += thai_lunisolar_year_length(currentYear) * options.dayMsec
  }
  return start + options.dayMsec
}

export function thai_lunisolar_date_start(
  options: ThaiLunisolarOptions,
  buddhistYear: number,
  month: number,
  day: number,
  is_leap = false,
) {
  if (!Number.isFinite(options.dayMsec) || options.dayMsec !== SOLAR_DAY_MSEC) {
    throw new RangeError('Thai lunisolar calendar requires a 24-hour civil day')
  }
  if (!Number.isInteger(buddhistYear) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`invalid Thai lunisolar date ${buddhistYear}-${month}-${day}`)
  }
  const solarYear = buddhistYear - 543
  const layout = thai_year_layout(solarYear)
  const monthIndex = layout.months.findIndex(
    (entry) => entry.month === month && entry.is_leap === is_leap,
  )
  if (monthIndex < 0) {
    throw new RangeError(`Thai lunisolar month is not present: ${buddhistYear}-${month}`)
  }
  const monthEntry = layout.months[monthIndex]
  if (day < 1 || monthEntry.days < day) {
    throw new RangeError(`invalid Thai lunisolar day ${buddhistYear}-${month}-${day}`)
  }
  let start = year_start(options, solarYear)
  for (let index = 0; index < monthIndex; index++) {
    start += layout.months[index].days * options.dayMsec
  }
  return start + (day - 1) * options.dayMsec
}

function resolve_year(options: ThaiLunisolarOptions, utc: number) {
  if (!Number.isFinite(options.dayMsec) || options.dayMsec !== SOLAR_DAY_MSEC) {
    throw new RangeError('Thai lunisolar calendar requires a 24-hour civil day')
  }
  let year = solar_year_of(utc, options)
  assert_year(year)
  let start = year_start(options, year)
  let next = start + thai_lunisolar_year_length(year) * options.dayMsec
  const dayStart = local_day_start(options, utc)
  if (dayStart < start) {
    year--
    start = year_start(options, year)
    next = start + thai_lunisolar_year_length(year) * options.dayMsec
  } else if (next <= dayStart) {
    year++
    assert_year(year)
    start = year_start(options, year)
    next = start + thai_lunisolar_year_length(year) * options.dayMsec
  }
  return { year, start, next, dayStart }
}

export function thai_lunisolar(options: ThaiLunisolarOptions, utc: number): ThaiLunisolarDate {
  const { year, start, next, dayStart } = resolve_year(options, utc)
  const yearType = thai_lunisolar_year_type(year)
  const yearLayout = thai_year_layout(year)
  const months: readonly MonthEntry[] = yearLayout.months.map(({ month, days, is_leap }) => ({
    month,
    days,
    is_leap: is_leap === true,
  }))
  let dayOfYear = Math.floor((dayStart - start) / options.dayMsec)
  let monthIndex = 0
  let monthStart = start
  for (const [index, month] of months.entries()) {
    if (dayOfYear < month.days) {
      monthIndex = index
      break
    }
    dayOfYear -= month.days
    monthStart += month.days * options.dayMsec
  }
  const month = months[monthIndex]
  const nextMonth = monthStart + month.days * options.dayMsec
  return {
    year: year + 543,
    month: month.month,
    day: dayOfYear + 1,
    is_leap: month.is_leap,
    is_intercalary_day: yearType === 'intercalary-day',
    year_type: yearType,
    year_start_at: start,
    next_year_start_at: next,
    day_start_at: dayStart,
    last_at: monthStart,
    next_at: nextMonth,
    month_index: monthIndex,
  }
}
