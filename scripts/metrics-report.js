function roundMetric(value) {
  return Number(value.toFixed(3))
}

function deltaGroup(actual, baseline) {
  const delta = {}
  for (const field of Object.keys(actual)) {
    delta[field] = roundMetric(actual[field] - baseline[field])
  }
  return delta
}

function withinBaseline(actual, baseline) {
  if (actual.count !== baseline.count) return false
  for (const group of ['max', 'mean']) {
    for (const field of Object.keys(baseline[group])) {
      if (baseline[group][field] < actual[group][field]) return false
    }
  }
  return true
}

function metricEntry(suite, actual) {
  if (!actual) {
    return {
      label: suite.label,
      actual: null,
      baseline: suite.baseline,
      delta: null,
      withinBaseline: false,
      available: false,
    }
  }
  return {
    label: suite.label,
    actual,
    baseline: suite.baseline,
    delta: {
      max: deltaGroup(actual.max, suite.baseline.max),
      mean: deltaGroup(actual.mean, suite.baseline.mean),
    },
    withinBaseline: withinBaseline(actual, suite.baseline),
    available: true,
  }
}

module.exports = {
  metricEntry,
}
