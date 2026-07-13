import { FancyDate, hasLunarEvents, hasSolarEvents } from '../../fancy-date'
import { mod } from '../../number'

type PanchangaElement = {
  index: number
  number: number
}

export type Panchanga = {
  at: number
  elongationDeg: number
  tithi: PanchangaElement
  paksha: PanchangaElement & { name: '白分' | '黒分' }
  nakshatra: PanchangaElement & { longitudeDeg: number }
  yoga: PanchangaElement & { longitudeDeg: number }
  karana: PanchangaElement
}

type PanchangaValueMatcher = number | readonly number[]
export type PanchangaCondition = Partial<{
  tithi: PanchangaValueMatcher
  paksha: PanchangaValueMatcher | '白分' | '黒分'
  nakshatra: PanchangaValueMatcher
  yoga: PanchangaValueMatcher
  karana: PanchangaValueMatcher
}>
export type PanchangaNoteRule = PanchangaCondition & { name: string }

function matchPanchangaValue(actual: number, matcher: PanchangaValueMatcher | undefined) {
  if (matcher == null) return true
  return Array.isArray(matcher) ? matcher.includes(actual) : actual === matcher
}

export function panchanga(calendar: FancyDate, utc: number): Panchanga {
  if (!hasSolarEvents(calendar.dic.sunny) || !hasLunarEvents(calendar.dic.moony)) {
    throw new Error('panchanga requires solar and lunar position models')
  }
  const at = calendar.to_tempos(utc).d.last_at
  const lunarLongitude = calendar.dic.moony.lunarEquatorial(at).longitudeDeg
  const solarLongitude = calendar.dic.sunny.solarLongitudeDeg(at)
  const elongationDeg = mod(lunarLongitude - solarLongitude, 360)
  const index = (degrees: number, divisions: number) => {
    return Math.min(divisions - 1, Math.floor(mod(degrees, 360) / (360 / divisions)))
  }
  const tithi = index(elongationDeg, 30)
  const paksha = tithi < 15 ? 0 : 1
  const nakshatra = index(lunarLongitude, 27)
  const yoga = index(lunarLongitude + solarLongitude, 27)
  const karana = index(elongationDeg, 60)
  return {
    at,
    elongationDeg,
    tithi: { index: tithi, number: tithi + 1 },
    paksha: { index: paksha, number: paksha + 1, name: paksha === 0 ? '白分' : '黒分' },
    nakshatra: { index: nakshatra, number: nakshatra + 1, longitudeDeg: lunarLongitude },
    yoga: {
      index: yoga,
      number: yoga + 1,
      longitudeDeg: mod(lunarLongitude + solarLongitude, 360),
    },
    karana: { index: karana, number: karana + 1 },
  }
}

export function matchesPanchanga(value: Panchanga, condition: PanchangaCondition) {
  return (
    matchPanchangaValue(value.tithi.number, condition.tithi) &&
    matchPanchangaValue(value.nakshatra.number, condition.nakshatra) &&
    matchPanchangaValue(value.yoga.number, condition.yoga) &&
    matchPanchangaValue(value.karana.number, condition.karana) &&
    (condition.paksha == null ||
      condition.paksha === value.paksha.name ||
      matchPanchangaValue(value.paksha.number, condition.paksha as PanchangaValueMatcher))
  )
}

export function panchangaNotes(
  calendar: FancyDate,
  utc: number,
  rules: readonly PanchangaNoteRule[],
) {
  const value = panchanga(calendar, utc)
  return rules.filter((rule) => matchesPanchanga(value, rule)).map(({ name }) => name)
}

export function panchangaCandidates(
  calendar: FancyDate,
  between: readonly [number, number],
  condition: PanchangaCondition,
  { limit = 1000 }: { limit?: number } = {},
) {
  const [from, to] = between
  const list: number[] = []
  let cursor = from
  while (cursor < to && list.length < limit) {
    const day = calendar.to_tempos(cursor).d
    const at = Math.max(day.last_at, from)
    if (at < to && matchesPanchanga(panchanga(calendar, at), condition)) {
      list.push(at)
    }
    if (day.next_at <= cursor) break
    cursor = day.next_at
  }
  return list
}
