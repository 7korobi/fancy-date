const {
  EarthSolarOrbital,
  JupiterSolarOrbital,
  MarsSolarOrbital,
  MeanOrbital,
  MercurySolarOrbital,
  NeptuneSolarOrbital,
  PlutoSolarOrbital,
  SaturnSolarOrbital,
  TransformedOrbital,
  UranusSolarOrbital,
  VenusSolarOrbital,
} = require('../lib')

const DAY_MSEC = 86400000
const MEAN_PERIOD_MSEC = 365.2422 * DAY_MSEC
const MEAN_EPOCH_MSEC = Date.UTC(2000, 0, 1)
const PHASES = [0, 1 / 12, 1 / 4, 1 / 2, 3 / 4, 11 / 12]
const EPOCH_OFFSETS = [-1.5, -0.5, -0.125, 0, 0.125, 0.5, 1.5]
const HOPS_PER_DIRECTION = 4
const PHASE_SAMPLES = 32
const TURN_TOLERANCE = 0.01

const transformedSource = new EarthSolarOrbital()
const solarModels = [
  ['MeanOrbital', new MeanOrbital(MEAN_PERIOD_MSEC, MEAN_EPOCH_MSEC), 1],
  ['EarthSolarOrbital', new EarthSolarOrbital(), 1],
  ['MarsSolarOrbital', new MarsSolarOrbital(), 1],
  ['MercurySolarOrbital', new MercurySolarOrbital(), 1],
  ['VenusSolarOrbital', new VenusSolarOrbital(), 1],
  ['JupiterSolarOrbital', new JupiterSolarOrbital(), 1],
  ['SaturnSolarOrbital', new SaturnSolarOrbital(), 1],
  ['UranusSolarOrbital', new UranusSolarOrbital(), 1],
  ['NeptuneSolarOrbital', new NeptuneSolarOrbital(), 1],
  ['PlutoSolarOrbital', new PlutoSolarOrbital(), 1],
  [
    'TransformedOrbital(direction: 1)',
    new TransformedOrbital(transformedSource, { phaseOffset: 0.37, direction: 1 }),
    1,
  ],
  [
    'TransformedOrbital(direction: -1)',
    new TransformedOrbital(transformedSource, { phaseOffset: 0.37, direction: -1 }),
    -1,
  ],
]

function sampledPhaseTurns(model, startAt, endAt, expectedDirection) {
  let previous = model.phaseAt(startAt)
  let turns = 0
  let monotone = true

  for (let index = 1; index <= PHASE_SAMPLES; index++) {
    const at = startAt + ((endAt - startAt) * index) / PHASE_SAMPLES
    const current = model.phaseAt(at)
    let delta = current - previous
    if (delta > 0.5) delta -= 1
    if (delta < -0.5) delta += 1
    if (expectedDirection * delta < -1e-8) monotone = false
    turns += delta
    previous = current
  }

  return { turns, monotone }
}

function expectAdjacentOccurrence(model, earlierAt, laterAt, direction) {
  expect(laterAt).toBeGreaterThan(earlierAt)
  const { turns, monotone } = sampledPhaseTurns(model, earlierAt, laterAt, direction)
  expect(monotone).toBe(true)
  // Check cycle adjacency, not the resolver's phase residual at either root.
  expect(Math.abs(turns - direction)).toBeLessThan(TURN_TOLERANCE)
}

describe('OrbitalModel phase-cycle adjacency', () => {
  for (const [name, model, direction] of solarModels) {
    test(`${name} resolves adjacent same-phase occurrences`, () => {
      let rootCount = 0
      let adjacencyCount = 0

      for (const offset of EPOCH_OFFSETS) {
        const near = model.epochMsec + offset * model.periodMsec
        for (const phase of PHASES) {
          const root = model.timeOfPhase(phase, near)
          expect(Number.isFinite(root)).toBe(true)
          rootCount++

          let forward = root
          for (let hop = 0; hop < HOPS_PER_DIRECTION; hop++) {
            const next = model.timeOfPhase(phase, forward + model.periodMsec)
            expectAdjacentOccurrence(model, forward, next, direction)
            forward = next
            adjacencyCount++
          }

          let backward = root
          for (let hop = 0; hop < HOPS_PER_DIRECTION; hop++) {
            const previous = model.timeOfPhase(phase, backward - model.periodMsec)
            expectAdjacentOccurrence(model, previous, backward, direction)
            backward = previous
            adjacencyCount++
          }
        }
      }

      expect(rootCount).toBe(EPOCH_OFFSETS.length * PHASES.length)
      expect(adjacencyCount).toBe(rootCount * HOPS_PER_DIRECTION * 2)
    })
  }
})
