const { Calendar } = require('../lib/sample')

const RUNS = 5
const DAY = 86400000
const red = Calendar.創作赤星太陰太陽暦
const redMoon = red.dic.moony
const redPhase = red.dic.lunarPhase
const redAt = 0
const earth = Calendar.GregorianAstronomical
const earthAt = earth.parse('2024年3月20日')
const jupiter = Calendar.JupiterObserved
const jupiterAt = 0

const cases = [
  {
    key: 'redOrbitalLunarEquatorial',
    label: '創作赤星衛星 lunarEquatorial',
    count: 1000,
    run: () => redMoon.lunarEquatorial(redAt),
  },
  {
    key: 'redOrbitalLunarHorizontal',
    label: '創作赤星衛星 lunarHorizontal',
    count: 1000,
    run: () => redMoon.lunarHorizontal(redAt, 35, 0),
  },
  {
    key: 'redLunarEvents',
    label: '創作赤星衛星 lunarEvents(月出・月没・南中)',
    count: 200,
    run: () => red.lunar(redAt),
  },
  {
    key: 'redLunarPhaseEvent',
    label: '創作赤星太陽相対 lunarPhaseEvent(朔)',
    count: 200,
    run: () => redPhase.lunarPhaseEvent(0, redAt),
  },
  {
    key: 'redLunisolarCached',
    label: '創作赤星太陰太陽暦 lunisolar(cache hit)',
    count: 200,
    run: () => red.lunisolar(redAt),
  },
  {
    key: 'redLunisolarCold',
    label: '創作赤星太陰太陽暦 lunisolar(cache clear)',
    count: 20,
    run: () => {
      red._lunisolar_cache.length = 0
      return red.lunisolar(redAt)
    },
  },
  {
    key: 'redToTempos',
    label: '創作赤星太陰太陽暦 to_tempos',
    count: 200,
    run: () => red.to_tempos(redAt),
  },
  {
    key: 'redFormat',
    label: '創作赤星太陰太陽暦 format',
    count: 200,
    run: () => red.format(redAt),
  },
  {
    key: 'earthLunisolarCold',
    label: 'GregorianAstronomical lunisolar(cache clear)',
    count: 20,
    run: () => {
      earth._lunisolar_cache.length = 0
      return earth.lunisolar(earthAt)
    },
  },
  {
    key: 'earthLunisolarCached',
    label: 'GregorianAstronomical lunisolar(cache hit)',
    count: 200,
    run: () => earth.lunisolar(earthAt),
  },
  {
    key: 'jupiterLunisolarCold',
    label: 'JupiterObserved lunisolar(cache clear)',
    count: 20,
    run: () => {
      jupiter._lunisolar_cache.length = 0
      return jupiter.lunisolar(jupiterAt)
    },
  },
  {
    key: 'jupiterLunisolarCached',
    label: 'JupiterObserved lunisolar(cache hit)',
    count: 200,
    run: () => jupiter.lunisolar(jupiterAt),
  },
  {
    key: 'earthLunarEventsBaseline',
    label: '地球月 lunarEvents baseline',
    count: 200,
    run: () => earth.lunar(earthAt),
  },
]

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1000000
}

function round(value) {
  return Number(value.toFixed(6))
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function measure(item) {
  for (let index = 0; index < Math.min(10, item.count); index++) item.run()
  const samples = []
  let last
  for (let run = 0; run < RUNS; run++) {
    const started = process.hrtime.bigint()
    for (let index = 0; index < item.count; index++) last = item.run()
    samples.push(elapsedMs(started))
  }
  const medianTotalMs = median(samples)
  return {
    label: item.label,
    count: item.count,
    samplesMs: samples.map(round),
    medianTotalMs: round(medianTotalMs),
    medianMeanMs: round(medianTotalMs / item.count),
    resultType: typeof last,
    resultKeys: last && typeof last === 'object' ? Object.keys(last).sort() : undefined,
  }
}

function countLunisolarSolarPhaseCalls(calendar, utc) {
  const cache = calendar._lunisolar_cache
  const originalSolarPhase = calendar.solar_phase
  const hadOwnSolarPhase = Object.prototype.hasOwnProperty.call(calendar, 'solar_phase')
  let calls = 0

  calendar.solar_phase = function (phase, near) {
    calls++
    return originalSolarPhase.call(this, phase, near)
  }

  try {
    cache.length = 0
    calendar.lunisolar(utc)
    const cold = calls
    calls = 0
    calendar.lunisolar(utc)
    return { cold, cacheHit: calls }
  } finally {
    if (hadOwnSolarPhase) calendar.solar_phase = originalSolarPhase
    else delete calendar.solar_phase
    cache.length = 0
  }
}

// Count outside measure(): the temporary wrapper is never active during timing.
const solarPhaseCallCounts = {
  GregorianAstronomical: countLunisolarSolarPhaseCalls(earth, earthAt),
  JupiterObserved: countLunisolarSolarPhaseCalls(jupiter, jupiterAt),
}

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      runs: RUNS,
      redDayMsec: DAY,
      solarPhaseCallCounts,
      cases: Object.fromEntries(cases.map((item) => [item.key, measure(item)])),
    },
    null,
    2,
  ),
)
