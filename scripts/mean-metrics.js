const { Calendar } = require('../lib/sample')
const {
  LUNAR_PHASE_DIFF_BASELINE,
  LUNAR_PHASE_DIFF_FIELDS,
  SOLAR_TERM_DIFF_BASELINE,
  SOLAR_TERM_DIFF_FIELDS,
  lunarPhaseDifferences,
  solarTermDifferences,
} = require('../__tests__/helpers/naoj-differences')
const { summarizeDifferences } = require('../__tests__/helpers/naoj-metrics')
const { metricEntry } = require('./metrics-report')

const suites = [
  {
    key: 'solarTerms',
    label: '二十四節気',
    fields: SOLAR_TERM_DIFF_FIELDS,
    baseline: SOLAR_TERM_DIFF_BASELINE,
    differences: () => solarTermDifferences(Calendar.Gregorian),
  },
  {
    key: 'lunarPhases',
    label: '朔弦望',
    fields: LUNAR_PHASE_DIFF_FIELDS,
    baseline: LUNAR_PHASE_DIFF_BASELINE,
    differences: () => lunarPhaseDifferences(Calendar.Gregorian),
  },
]

const report = {}
for (const suite of suites) {
  const actual = summarizeDifferences(suite.differences(), suite.fields)
  report[suite.key] = metricEntry(suite, actual)
}

report.solarEvents = {
  label: '太陽の出入り・南中',
  actual: null,
  baseline: null,
  delta: null,
  withinBaseline: false,
  available: false,
  reason: 'MeanOrbital does not implement solarEvents',
}

report.lunarEvents = {
  label: '月の出入り・南中',
  actual: null,
  baseline: null,
  delta: null,
  withinBaseline: false,
  available: false,
  reason: 'MeanOrbital does not implement lunarEvents',
}

console.log(JSON.stringify(report, null, 2))
