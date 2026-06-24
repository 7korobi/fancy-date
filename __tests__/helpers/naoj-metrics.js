function roundMetric(value) {
  return Number(value.toFixed(3))
}

function summarizeDifferences(items, fields) {
  const summary = { count: items.length, max: {}, mean: {} }
  for (const field of fields) {
    const values = items.map((item) => item[field])
    summary.max[field] = roundMetric(Math.max(...values))
    summary.mean[field] = roundMetric(values.reduce((sum, value) => sum + value, 0) / values.length)
  }
  return summary
}

function expectMetricsNotWorse(actual, baseline) {
  expect(actual.count).toBe(baseline.count)
  for (const group of ['max', 'mean']) {
    expect(Object.keys(actual[group])).toEqual(Object.keys(baseline[group]))
    for (const field of Object.keys(baseline[group])) {
      expect(actual[group][field]).toBeLessThanOrEqual(baseline[group][field])
    }
  }
}

module.exports = {
  expectMetricsNotWorse,
  summarizeDifferences,
}
