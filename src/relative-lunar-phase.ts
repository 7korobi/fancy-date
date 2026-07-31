import { mod } from './number'
import type { LunarPhaseEvent, LunarPhaseEventModel, LongitudeOrbitalModel } from './orbital-model'

const ROOT_PHASE_TOLERANCE = 1e-12
const ROOT_NUMERIC_TOLERANCE_MSEC = 1
const ROOT_SCAN_SEGMENTS = 64
const ROOT_FAST_SLOPE_STEP_RATIO = 1 / 1024
const ROOT_FAST_BRACKET_HALF_WIDTH_RATIO = 1 / 32
const ROOT_FAST_MAX_DISTANCE_RATIO = 1 / 4

export type RelativeLunarPhaseEventModelOptions = {
  scanSegments?: number
  numericToleranceMsec?: number
  epochMsec?: number
}

/**
 * 月の公転黄経と、惑星から見た太陽方向の黄経差から月相を求める。
 *
 * KeplerianOrbital の phase 0 は衛星自身の基準黄経であり、朔を意味しない。
 * このモデルは、両方の軌道が同じ基準面・黄経原点を持つ場合に限って、
 * 太陽相対の朔望月を作る。
 */
export class RelativeLunarPhaseEventModel implements LunarPhaseEventModel {
  readonly synodicPeriodMsec: number
  readonly periodMsec: number
  readonly epochMsec: number
  private readonly scanSegments: number
  private readonly numericToleranceMsec: number

  constructor(
    readonly planetary: LongitudeOrbitalModel,
    readonly lunar: LongitudeOrbitalModel,
    options: RelativeLunarPhaseEventModelOptions = {},
  ) {
    const planetaryPeriod = planetary.periodMsec
    const lunarPeriod = lunar.periodMsec
    const frequencyDifference = 1 / lunarPeriod - 1 / planetaryPeriod
    if (!Number.isFinite(frequencyDifference) || frequencyDifference === 0) {
      throw new Error('relative lunar phase requires distinct orbital periods')
    }
    this.synodicPeriodMsec = Math.abs(1 / frequencyDifference)
    this.periodMsec = this.synodicPeriodMsec
    this.epochMsec = options.epochMsec ?? Math.min(planetary.epochMsec, lunar.epochMsec)
    this.scanSegments = normalizeScanSegments(options.scanSegments)
    this.numericToleranceMsec = normalizeNumericTolerance(options.numericToleranceMsec)
  }

  phaseAt(utc: number) {
    return mod(this.relativeLongitudeDeg(utc) / 360, 1)
  }

  timeOfPhase(phase: number, near: number) {
    return this.lunarPhaseEvent(phase, near).at
  }

  lunarPhaseEvent(phase: number, near: number): LunarPhaseEvent {
    if (!Number.isFinite(near)) throw new Error(`invalid lunar phase time ${near}`)
    const target = mod(phase, 1)
    const fastRoot = this.tryFastRoot(target, near)
    if (fastRoot) return this.eventFromRoot(target, fastRoot)

    const halfPeriod = this.synodicPeriodMsec / 2
    const start = near - halfPeriod
    const step = this.synodicPeriodMsec / this.scanSegments
    let previousAt = start
    let previousValue = this.phaseDifference(previousAt, target)
    const roots: Array<{ lower: number; upper: number }> = []

    for (let index = 1; index <= this.scanSegments; index++) {
      const currentAt = index === this.scanSegments ? near + halfPeriod : start + index * step
      const currentValue = this.phaseDifference(currentAt, target)
      if (Math.abs(previousValue) <= ROOT_PHASE_TOLERANCE) {
        roots.push({ lower: previousAt, upper: previousAt })
      }
      if (previousValue * currentValue < 0) {
        const bracket = this.bisect(previousAt, currentAt, previousValue, target)
        if (bracket) roots.push(bracket)
      }
      if (Math.abs(currentValue) <= ROOT_PHASE_TOLERANCE) {
        roots.push({ lower: currentAt, upper: currentAt })
      }
      previousAt = currentAt
      previousValue = currentValue
    }

    const uniqueRoots = roots.filter((root, index) => {
      return roots.findIndex((other) => Math.abs(other.lower - root.lower) < 1) === index
    })
    if (uniqueRoots.length === 0) {
      throw new Error('failed to resolve relative lunar phase')
    }
    const root = uniqueRoots.reduce((best, candidate) => {
      const bestAt = (best.lower + best.upper) / 2
      const candidateAt = (candidate.lower + candidate.upper) / 2
      return Math.abs(candidateAt - near) < Math.abs(bestAt - near) ? candidate : best
    })
    return this.eventFromRoot(target, root)
  }

  private tryFastRoot(target: number, near: number) {
    const period = this.synodicPeriodMsec
    if (!Number.isFinite(period)) return undefined

    const sampleStep = period * ROOT_FAST_SLOPE_STEP_RATIO
    const valueAtNear = this.phaseDifference(near, target)
    const valueBeforeNear = this.phaseDifference(near - sampleStep, target)
    const valueAfterNear = this.phaseDifference(near + sampleStep, target)
    const forwardDelta = signedPhaseDifference(valueAfterNear, valueAtNear)
    const backwardDelta = signedPhaseDifference(valueAtNear, valueBeforeNear)
    const slope = forwardDelta / sampleStep
    if (
      !Number.isFinite(slope) ||
      slope === 0 ||
      !Number.isFinite(backwardDelta) ||
      forwardDelta * backwardDelta <= 0
    ) {
      return undefined
    }

    const predicted = near - valueAtNear / slope
    if (
      !Number.isFinite(predicted) ||
      Math.abs(predicted - near) > period * ROOT_FAST_MAX_DISTANCE_RATIO
    ) {
      return undefined
    }

    const halfWidth = period * ROOT_FAST_BRACKET_HALF_WIDTH_RATIO
    const lower = predicted - halfWidth
    const upper = predicted + halfWidth
    const lowerValue = this.phaseDifference(lower, target)
    const upperValue = this.phaseDifference(upper, target)
    if (
      !Number.isFinite(lowerValue) ||
      !Number.isFinite(upperValue) ||
      lowerValue * upperValue > 0
    ) {
      return undefined
    }

    const root = this.bisect(lower, upper, lowerValue, target)
    if (!root) return undefined
    const rootAt = (root.lower + root.upper) / 2
    if (Math.abs(rootAt - near) > period * ROOT_FAST_MAX_DISTANCE_RATIO) {
      return undefined
    }
    return root
  }

  private eventFromRoot(target: number, root: { lower: number; upper: number }): LunarPhaseEvent {
    const at = Math.round((root.lower + root.upper) / 2)
    const lower_at = Math.min(root.lower, at)
    const upper_at = Math.max(root.upper, at)
    return {
      cycle: Math.round((at - this.epochMsec) / this.synodicPeriodMsec),
      phase: target,
      at,
      lower_at,
      upper_at,
      source_kind: 'observed',
      numeric_error_msec: Math.max(0, (upper_at - lower_at) / 2),
    }
  }

  apparentLongitudeDeg(utc: number) {
    return this.relativeLongitudeDeg(utc)
  }

  private relativeLongitudeDeg(utc: number) {
    // 月から見た太陽方向は、惑星の太陽中心黄経に180度を加えた方向。
    return mod(
      this.lunar.apparentLongitudeDeg(utc) - this.planetary.apparentLongitudeDeg(utc) - 180,
      360,
    )
  }

  private phaseDifference(utc: number, target: number) {
    return mod(this.phaseAt(utc) - target + 0.5, 1) - 0.5
  }

  private bisect(from: number, to: number, fromValue: number, target: number) {
    let lower = from
    let upper = to
    let lowerValue = fromValue
    for (let index = 0; index < 80; index++) {
      if (upper - lower <= this.numericToleranceMsec) break
      const middle = (lower + upper) / 2
      const middleValue = this.phaseDifference(middle, target)
      if (Math.abs(middleValue) <= ROOT_PHASE_TOLERANCE) {
        lower = middle
        upper = middle
        break
      }
      if (lowerValue * middleValue <= 0) {
        upper = middle
      } else {
        lower = middle
        lowerValue = middleValue
      }
    }
    const midpoint = (lower + upper) / 2
    if (Math.abs(this.phaseDifference(midpoint, target)) > 1e-8) return undefined
    return { lower, upper }
  }
}

function signedPhaseDifference(from: number, to: number) {
  return mod(from - to + 0.5, 1) - 0.5
}

function normalizeScanSegments(value: number | undefined) {
  const segments = value ?? ROOT_SCAN_SEGMENTS
  if (!Number.isInteger(segments) || segments < 32) {
    throw new Error(`invalid lunar phase scan segments ${segments}`)
  }
  return segments
}

function normalizeNumericTolerance(value: number | undefined) {
  const tolerance = value ?? ROOT_NUMERIC_TOLERANCE_MSEC
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error(`invalid lunar phase numeric tolerance ${tolerance}`)
  }
  return tolerance
}
