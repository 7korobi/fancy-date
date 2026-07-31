const { Calendar } = require('../lib/sample')

const ITERATIONS = 1000
const RUNS = 5
const base = Calendar.GregorianAstronomical.parse('2024年3月20日')
const solar = Calendar.GregorianAstronomical.dic.sunny
const lunar = Calendar.GregorianAstronomical.dic.moony
const geo = Calendar.GregorianAstronomical.dic.geo
const solarOptions = {
  latitudeDeg: geo[0],
  longitudeDeg: geo[1],
  timezoneDeg: geo[2],
  horizonDeg: -50 / 60,
}
const lunarOptions = {
  latitudeDeg: geo[0],
  longitudeDeg: geo[1],
  timezoneDeg: geo[2],
  horizonDeg: -34 / 60,
}

const cases = [
  {
    key: 'earthSolarEvents',
    label: 'EarthSolarOrbital.solarEvents',
    run: () => solar.solarEvents(base, solarOptions),
  },
  {
    key: 'earthLunarEvents',
    label: 'EarthMoonOrbital.lunarEvents',
    run: () => lunar.lunarEvents(base, lunarOptions),
  },
  {
    key: 'fancySolarObservation',
    label: 'GregorianAstronomical.solor',
    run: () => Calendar.GregorianAstronomical.solor(base),
  },
  {
    key: 'fancyLunarObservation',
    label: 'GregorianAstronomical.lunar',
    run: () => Calendar.GregorianAstronomical.lunar(base),
  },
]

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000
}

function round(value) {
  return Number(value.toFixed(3))
}

function measure(run) {
  for (let index = 0; index < 50; index++) run()
  const startedAt = process.hrtime.bigint()
  let result
  for (let index = 0; index < ITERATIONS; index++) result = run()
  return { totalMs: elapsedMs(startedAt), result }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const report = {
  generatedAt: new Date().toISOString(),
  iterations: ITERATIONS,
  runs: RUNS,
  cases: {},
}

for (const item of cases) {
  const samples = []
  let lastResult
  for (let run = 0; run < RUNS; run++) {
    const measured = measure(item.run)
    samples.push(measured.totalMs)
    lastResult = measured.result
  }
  const medianTotalMs = median(samples)
  report.cases[item.key] = {
    label: item.label,
    samplesMs: samples.map(round),
    medianTotalMs: round(medianTotalMs),
    medianMeanMs: round(medianTotalMs / ITERATIONS),
    resultKeys: Object.keys(lastResult ?? {}).sort(),
  }
}

console.log(JSON.stringify(report, null, 2))
