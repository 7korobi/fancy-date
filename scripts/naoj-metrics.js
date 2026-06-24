const { NAOJ_DIFFERENCE_SUITES } = require('../__tests__/helpers/naoj-differences')
const { summarizeDifferences } = require('../__tests__/helpers/naoj-metrics')
const { metricEntry } = require('./metrics-report')

const report = {}
for (const suite of NAOJ_DIFFERENCE_SUITES) {
  const actual = summarizeDifferences(suite.differences(), suite.fields)
  report[suite.key] = metricEntry(suite, actual)
}

console.log(JSON.stringify(report, null, 2))
