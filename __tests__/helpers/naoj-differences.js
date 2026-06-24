const { Calendar, 天文月 } = require('../../lib/sample')
const { NAOJ_LUNAR_EVENT_FIXTURES, NAOJ_LUNAR_EVENT_SOURCE } = require('../fixtures/lunar-events-naoj')
const { NAOJ_LUNAR_PHASE_FIXTURES } = require('../fixtures/lunar-phases-naoj')
const { NAOJ_SOLAR_EVENT_FIXTURES, NAOJ_SOLAR_EVENT_SOURCE } = require('../fixtures/solar-events-naoj')
const { NAOJ_SOLAR_TERM_FIXTURES } = require('../fixtures/solar-terms-naoj')

const SOLAR_TERM_DIFF_FIELDS = ['diffMinutes']
const SOLAR_TERM_DIFF_BASELINE = {
  count: 68,
  max: { diffMinutes: 0.939 },
  mean: { diffMinutes: 0.361 },
}

const LUNAR_PHASE_DIFF_FIELDS = ['diffMinutes']
const LUNAR_PHASE_DIFF_BASELINE = {
  count: 32,
  max: { diffMinutes: 0.578 },
  mean: { diffMinutes: 0.237 },
}

const SOLAR_EVENT_DIFF_FIELDS = [
  'sunriseMinutes',
  'transitMinutes',
  'sunsetMinutes',
  'sunriseAzimuthDeg',
  'transitAltitudeDeg',
  'sunsetAzimuthDeg',
]
const SOLAR_EVENT_DIFF_BASELINE = {
  count: 3,
  max: {
    sunriseMinutes: 0.82,
    transitMinutes: 0.436,
    sunsetMinutes: 0.059,
    sunriseAzimuthDeg: 0.048,
    transitAltitudeDeg: 0.031,
    sunsetAzimuthDeg: 0.049,
  },
  mean: {
    sunriseMinutes: 0.38,
    transitMinutes: 0.285,
    sunsetMinutes: 0.047,
    sunriseAzimuthDeg: 0.031,
    transitAltitudeDeg: 0.022,
    sunsetAzimuthDeg: 0.021,
  },
}

const LUNAR_EVENT_DIFF_FIELDS = [
  'moonriseMinutes',
  'transitMinutes',
  'moonsetMinutes',
  'moonriseAzimuthDeg',
  'transitAltitudeDeg',
  'moonsetAzimuthDeg',
]
const LUNAR_EVENT_DIFF_BASELINE = {
  count: 3,
  max: {
    moonriseMinutes: 0.347,
    transitMinutes: 0.391,
    moonsetMinutes: 0.356,
    moonriseAzimuthDeg: 0.017,
    transitAltitudeDeg: 0.066,
    moonsetAzimuthDeg: 0.064,
  },
  mean: {
    moonriseMinutes: 0.251,
    transitMinutes: 0.227,
    moonsetMinutes: 0.26,
    moonriseAzimuthDeg: 0.01,
    transitAltitudeDeg: 0.033,
    moonsetAzimuthDeg: 0.036,
  },
}

function lunarPhaseKey({ year, name, jst }) {
  return `${year}:${name}:${jst}`
}

function solarTermKey({ year, name }) {
  return `${year}:${name}`
}

function jstUtc({ year, month, day }, hm) {
  const [hour, minute] = hm.split(':').map(Number)
  return Date.UTC(year, month - 1, day, hour - 9, minute)
}

function deg(rad) {
  return (rad * 180) / Math.PI
}

function minuteDiff(a, b) {
  return Math.abs(a - b) / 60000
}

function solarTermDifferences(calendar = Calendar.GregorianAstronomical) {
  return NAOJ_SOLAR_TERM_FIXTURES.map((event) => {
    const expectedAt = Date.parse(event.jst)
    const actualAt = calendar.solar_phase(event.longitudeDeg / 360, expectedAt)
    return {
      key: solarTermKey(event),
      expected: event.jst,
      actual: calendar.format(actualAt, 'yyyy-MM-dd HH:mm'),
      diffMinutes: minuteDiff(actualAt, expectedAt),
    }
  })
}

function lunarPhaseDifferences(calendar = Calendar.GregorianAstronomical) {
  return NAOJ_LUNAR_PHASE_FIXTURES.map((event) => {
    const expectedAt = Date.parse(event.jst)
    const actualAt = calendar.lunar_phase(event.phase, expectedAt)
    return {
      key: lunarPhaseKey(event),
      expected: event.jst,
      actual: calendar.format(actualAt, 'yyyy-MM-dd HH:mm'),
      diffMinutes: minuteDiff(actualAt, expectedAt),
    }
  })
}

function solarEventDifferences() {
  const nagoya = Calendar.Gregorian.dup()
    .spot(
      天文月,
      NAOJ_SOLAR_EVENT_SOURCE.latitudeDeg,
      NAOJ_SOLAR_EVENT_SOURCE.longitudeDeg,
      NAOJ_SOLAR_EVENT_SOURCE.timezoneDeg,
    )
    .init()
  return NAOJ_SOLAR_EVENT_FIXTURES.map((fixture) => {
    const utc = nagoya.parse(`${fixture.year}年${fixture.month}月${fixture.day}日`)
    const actual = nagoya.solor(utc)
    return {
      key: `${fixture.year}-${fixture.month}-${fixture.day}`,
      fixture,
      sunriseMinutes: Math.abs(actual.日の出 - jstUtc(fixture, fixture.sunrise)) / 60000,
      transitMinutes: Math.abs(actual.南中時刻 - jstUtc(fixture, fixture.transit)) / 60000,
      sunsetMinutes: Math.abs(actual.日の入 - jstUtc(fixture, fixture.sunset)) / 60000,
      sunriseAzimuthDeg: Math.abs(deg(actual.日の出方位) - fixture.sunriseAzimuthDeg),
      transitAltitudeDeg: Math.abs(deg(actual.南中高度) - fixture.transitAltitudeDeg),
      sunsetAzimuthDeg: Math.abs(deg(actual.日の入方位) - fixture.sunsetAzimuthDeg),
    }
  })
}

function lunarEventDifferences() {
  const nagoya = Calendar.Gregorian.dup()
    .spot(
      天文月,
      NAOJ_LUNAR_EVENT_SOURCE.latitudeDeg,
      NAOJ_LUNAR_EVENT_SOURCE.longitudeDeg,
      NAOJ_LUNAR_EVENT_SOURCE.timezoneDeg,
    )
    .init()
  return NAOJ_LUNAR_EVENT_FIXTURES.map((fixture) => {
    const utc = nagoya.parse(`${fixture.year}年${fixture.month}月${fixture.day}日`)
    const actual = nagoya.lunar(utc)
    return {
      key: `${fixture.year}-${fixture.month}-${fixture.day}`,
      fixture,
      moonriseMinutes: Math.abs(actual.月の出 - jstUtc(fixture, fixture.moonrise)) / 60000,
      transitMinutes: Math.abs(actual.南中時刻 - jstUtc(fixture, fixture.transit)) / 60000,
      moonsetMinutes: Math.abs(actual.月の入 - jstUtc(fixture, fixture.moonset)) / 60000,
      moonriseAzimuthDeg: Math.abs(deg(actual.月の出方位) - fixture.moonriseAzimuthDeg),
      transitAltitudeDeg: Math.abs(deg(actual.南中高度) - fixture.transitAltitudeDeg),
      moonsetAzimuthDeg: Math.abs(deg(actual.月の入方位) - fixture.moonsetAzimuthDeg),
    }
  })
}

const NAOJ_DIFFERENCE_SUITES = [
  {
    key: 'solarTerms',
    label: '二十四節気',
    fields: SOLAR_TERM_DIFF_FIELDS,
    baseline: SOLAR_TERM_DIFF_BASELINE,
    differences: solarTermDifferences,
  },
  {
    key: 'lunarPhases',
    label: '朔弦望',
    fields: LUNAR_PHASE_DIFF_FIELDS,
    baseline: LUNAR_PHASE_DIFF_BASELINE,
    differences: lunarPhaseDifferences,
  },
  {
    key: 'solarEvents',
    label: '太陽の出入り・南中',
    fields: SOLAR_EVENT_DIFF_FIELDS,
    baseline: SOLAR_EVENT_DIFF_BASELINE,
    differences: solarEventDifferences,
  },
  {
    key: 'lunarEvents',
    label: '月の出入り・南中',
    fields: LUNAR_EVENT_DIFF_FIELDS,
    baseline: LUNAR_EVENT_DIFF_BASELINE,
    differences: lunarEventDifferences,
  },
]

module.exports = {
  LUNAR_EVENT_DIFF_BASELINE,
  LUNAR_EVENT_DIFF_FIELDS,
  LUNAR_PHASE_DIFF_BASELINE,
  LUNAR_PHASE_DIFF_FIELDS,
  NAOJ_DIFFERENCE_SUITES,
  SOLAR_EVENT_DIFF_BASELINE,
  SOLAR_EVENT_DIFF_FIELDS,
  SOLAR_TERM_DIFF_BASELINE,
  SOLAR_TERM_DIFF_FIELDS,
  lunarEventDifferences,
  lunarPhaseDifferences,
  solarEventDifferences,
  solarTermDifferences,
}
