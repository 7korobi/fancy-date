const { Calendar } = require('../lib/sample')
const { to_msec } = require('../lib/time')

function round(value) {
  return Number(value.toFixed(3))
}

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000
}

function bench({ key, label, count, run }) {
  const warmup = Math.min(5, count)
  for (let index = 0; index < warmup; index++) run()

  let last
  const startedAt = process.hrtime.bigint()
  for (let index = 0; index < count; index++) {
    last = run()
  }
  const totalMs = elapsedMs(startedAt)
  return [
    key,
    {
      label,
      count,
      totalMs: round(totalMs),
      meanMs: round(totalMs / count),
      hz: round((count * 1000) / totalMs),
      resultType: typeof last,
    },
  ]
}

const g = Calendar.Gregorian
const ga = Calendar.GregorianAstronomical
const old = Calendar.平気法
const observed = Calendar.定気法
const amanta = Calendar.アマンタ
const purnimanta = Calendar.プールニマンタ
const amantaTithi = Calendar.アマンタティティ
const purnimantaTithi = Calendar.プールニマンタティティ

const base = g.parse('2024年3月10日')
const target = g.parse('2025年2月28日') + to_msec('3h') + to_msec('45m') + to_msec('12s') + 345

const suites = [
  {
    key: 'parseGregorian',
    label: 'Gregorian parse',
    count: 5000,
    run: () => g.parse('2024年3月10日'),
  },
  {
    key: 'formatGregorian',
    label: 'Gregorian format',
    count: 5000,
    run: () => g.format(base),
  },
  {
    key: 'toTemposGregorian',
    label: 'Gregorian to_tempos',
    count: 3000,
    run: () => g.to_tempos(base),
  },
  {
    key: 'spanGregorian',
    label: 'Gregorian span',
    count: 3000,
    run: () => g.span_obj(base + to_msec('3d'), base),
  },
  {
    key: 'addGregorian',
    label: 'Gregorian add',
    count: 3000,
    run: () => g.add(base, '1年1ヶ月1日後'),
  },
  {
    key: 'subGregorian',
    label: 'Gregorian sub',
    count: 3000,
    run: () => g.sub(base, '1年1ヶ月1日後'),
  },
  {
    key: 'toTemposMeanLunisolar',
    label: 'Mean lunisolar to_tempos',
    count: 1000,
    run: () => old.to_tempos(base),
  },
  {
    key: 'toTemposObservedLunisolar',
    label: 'Observed lunisolar to_tempos',
    count: 20,
    run: () => observed.to_tempos(base),
  },
  {
    key: 'toTemposAmanta',
    label: 'Amanta baseline to_tempos',
    count: 1000,
    run: () => amanta.to_tempos(base),
  },
  {
    key: 'formatAmanta',
    label: 'Amanta baseline format',
    count: 1000,
    run: () => amanta.format(base),
  },
  {
    key: 'toTemposAmantaTithi',
    label: 'Amanta tithi assignment to_tempos',
    count: 1000,
    run: () => amantaTithi.to_tempos(base),
  },
  {
    key: 'formatAmantaTithi',
    label: 'Amanta tithi assignment format',
    count: 1000,
    run: () => amantaTithi.format(base),
  },
  {
    key: 'toTemposPurnimanta',
    label: 'Purnimanta baseline to_tempos',
    count: 1000,
    run: () => purnimanta.to_tempos(base),
  },
  {
    key: 'formatPurnimanta',
    label: 'Purnimanta baseline format',
    count: 1000,
    run: () => purnimanta.format(base),
  },
  {
    key: 'toTemposPurnimantaTithi',
    label: 'Purnimanta tithi assignment to_tempos',
    count: 1000,
    run: () => purnimantaTithi.to_tempos(base),
  },
  {
    key: 'formatPurnimantaTithi',
    label: 'Purnimanta tithi assignment format',
    count: 1000,
    run: () => purnimantaTithi.format(base),
  },
  {
    key: 'spanObservedPrecise',
    label: 'Observed lunisolar precise span',
    count: 20,
    run: () => observed.span_obj(target, base, { precise: 'S' }),
  },
  {
    key: 'addObservedPrecise',
    label: 'Observed lunisolar precise add',
    count: 10,
    run: () => observed.add(base, '1年1刻半1112秒154ミリ秒後'),
  },
  {
    key: 'lunisolarObserved',
    label: 'Observed lunisolar resolver',
    count: 20,
    run: () => ga.lunisolar(base),
  },
  {
    key: 'solarTermsObserved',
    label: 'Observed solar terms',
    count: 20,
    run: () => ga.solar_terms(base),
  },
  {
    key: 'lunarPhaseObserved',
    label: 'Observed lunar phase',
    count: 50,
    run: () => ga.lunar_phase(0, base),
  },
]

const report = {
  generatedAt: new Date().toISOString(),
  benchmarks: Object.fromEntries(suites.map(bench)),
}

console.log(JSON.stringify(report, null, 2))
