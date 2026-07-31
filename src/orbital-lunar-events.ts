import type {
  LunarEquatorialCoordinates,
  LunarEventModel,
  LunarHorizontalCoordinates,
  LunarObservation,
  LunarObservationOptions,
  LongitudeOrbitalModel,
  RotationModel,
} from './orbital-model'
import { asin_deg, atan2_deg, cos_deg, signed_degree_diff, sin_deg } from './naoj/astro-math'
import { mod } from './number'
import { MINUTE } from './time'

type RadialDistanceModel = LongitudeOrbitalModel & {
  radialDistanceRatioAt?: (utc: number) => number
}

export type OrbitalLunarEventModelOptions = {
  radiusKm?: number
  meanDistanceKm?: number
  centerRadiusKm?: number
  axialTiltDeg?: number
}

type Sample = {
  at: number
  altitudeDeg: number
  hourAngleDeg: number
  distanceKm: number
}

/**
 * 任意の惑星・衛星の黄経モデルから、その惑星上の月出入りを求める。
 *
 * このモデルは、軌道黄経が惑星の赤道面ではなく惑星の基準黄道面にあること、
 * 観測者は球形の惑星表面にいることを仮定する。高傾斜軌道や扁平な惑星を
 * 扱う場合は、将来の3次元位置モデルへ差し替える。
 */
export class OrbitalLunarEventModel implements LunarEventModel {
  readonly periodMsec: number
  readonly epochMsec: number
  private readonly radiusKm: number
  private readonly meanDistanceKm: number
  private readonly centerRadiusKm: number
  private readonly axialTiltDeg: number

  constructor(
    readonly source: RadialDistanceModel,
    readonly rotation: RotationModel,
    options: OrbitalLunarEventModelOptions = {},
  ) {
    this.periodMsec = source.periodMsec
    this.epochMsec = source.epochMsec
    this.radiusKm = positiveOrZero(options.radiusKm)
    this.meanDistanceKm = positiveOrInfinity(options.meanDistanceKm)
    this.centerRadiusKm = positiveOrZero(options.centerRadiusKm)
    this.axialTiltDeg = options.axialTiltDeg ?? rotation.axialTiltDeg
    if (!Number.isFinite(this.axialTiltDeg)) {
      throw new Error(`invalid lunar event axial tilt ${this.axialTiltDeg}`)
    }
  }

  phaseAt(utc: number) {
    return this.source.phaseAt(utc)
  }

  timeOfPhase(phase: number, near: number) {
    return this.source.timeOfPhase(phase, near)
  }

  lunarEquatorial(utc: number): LunarEquatorialCoordinates {
    const longitudeDeg = this.source.apparentLongitudeDeg(utc)
    const latitudeDeg = 0
    const distanceKm = this.distanceKmAt(utc)
    const rightAscensionDeg = mod(
      atan2_deg(cos_deg(this.axialTiltDeg) * sin_deg(longitudeDeg), cos_deg(longitudeDeg)),
      360,
    )
    const declinationDeg = asin_deg(sin_deg(this.axialTiltDeg) * sin_deg(longitudeDeg))
    return {
      longitudeDeg,
      latitudeDeg,
      distanceKm,
      rightAscensionDeg,
      declinationDeg,
      horizontalParallaxDeg:
        Number.isFinite(distanceKm) && 0 < distanceKm && 0 < this.centerRadiusKm
          ? asin_deg(this.centerRadiusKm / distanceKm)
          : 0,
      obliquityDeg: this.axialTiltDeg,
    }
  }

  lunarHorizontal(
    utc: number,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM = 0,
  ): LunarHorizontalCoordinates {
    const equatorial = this.lunarEquatorial(utc)
    const siderealDeg =
      ((utc - this.rotation.epochMsec) / this.rotation.periodMsec) * 360 + longitudeDeg
    const hourAngleDeg = signed_degree_diff(siderealDeg, equatorial.rightAscensionDeg)
    const latitudeRad = (latitudeDeg * Math.PI) / 180
    const siderealRad = (siderealDeg * Math.PI) / 180
    const rightAscensionRad = (equatorial.rightAscensionDeg * Math.PI) / 180
    const declinationRad = (equatorial.declinationDeg * Math.PI) / 180
    const distanceKm = equatorial.distanceKm
    const observerRadiusKm = this.centerRadiusKm + heightM / 1000

    if (!Number.isFinite(distanceKm)) {
      const altitudeDeg = asin_deg(
        sin_deg(latitudeDeg) * sin_deg(equatorial.declinationDeg) +
          cos_deg(latitudeDeg) * cos_deg(equatorial.declinationDeg) * cos_deg(hourAngleDeg),
      )
      const azimuthDeg = mod(
        atan2_deg(
          sin_deg(hourAngleDeg),
          cos_deg(hourAngleDeg) * sin_deg(latitudeDeg) -
            Math.tan(declinationRad) * cos_deg(latitudeDeg),
        ) + 180,
        360,
      )
      return {
        ...equatorial,
        altitudeDeg,
        azimuthDeg,
        hourAngleDeg,
        topocentricRightAscensionDeg: equatorial.rightAscensionDeg,
        topocentricDeclinationDeg: equatorial.declinationDeg,
      }
    }

    const body = [
      distanceKm * Math.cos(declinationRad) * Math.cos(rightAscensionRad),
      distanceKm * Math.cos(declinationRad) * Math.sin(rightAscensionRad),
      distanceKm * Math.sin(declinationRad),
    ]
    const observer = [
      observerRadiusKm * Math.cos(latitudeRad) * Math.cos(siderealRad),
      observerRadiusKm * Math.cos(latitudeRad) * Math.sin(siderealRad),
      observerRadiusKm * Math.sin(latitudeRad),
    ]
    const relative = body.map((value, index) => value - observer[index])
    const distance = Math.hypot(...relative)
    const up = [
      Math.cos(latitudeRad) * Math.cos(siderealRad),
      Math.cos(latitudeRad) * Math.sin(siderealRad),
      Math.sin(latitudeRad),
    ]
    const north = [
      -Math.sin(latitudeRad) * Math.cos(siderealRad),
      -Math.sin(latitudeRad) * Math.sin(siderealRad),
      Math.cos(latitudeRad),
    ]
    const east = [-Math.sin(siderealRad), Math.cos(siderealRad), 0]
    const altitudeDeg = asin_deg(dot(relative, up) / distance)
    const azimuthDeg = mod(atan2_deg(dot(relative, east), dot(relative, north)), 360)
    const topocentricRightAscensionDeg = mod(atan2_deg(relative[1], relative[0]), 360)
    const topocentricDeclinationDeg = asin_deg(relative[2] / distance)
    return {
      ...equatorial,
      altitudeDeg,
      azimuthDeg,
      hourAngleDeg,
      topocentricRightAscensionDeg,
      topocentricDeclinationDeg,
    }
  }

  lunarEvents(utc: number, options: LunarObservationOptions): LunarObservation {
    const {
      latitudeDeg,
      longitudeDeg,
      timezoneDeg = longitudeDeg,
      heightM = 0,
      horizonDeg = -34 / 60,
    } = options
    const period = this.rotation.periodMsec
    const timezoneMsec = (timezoneDeg / 360) * period
    const dayStartUtc =
      options.dayStartUtc ?? Math.floor((utc + timezoneMsec) / period) * period - timezoneMsec
    const samples = this.samples(dayStartUtc, latitudeDeg, longitudeDeg, heightM)
    const horizonAt = (_at: number, distanceKm: number) =>
      horizonDeg - (this.angularRadiusDeg(distanceKm) - this.meanAngularRadiusDeg())
    const moonrise = this.findAltitudeEvent(
      samples,
      horizonAt,
      1,
      latitudeDeg,
      longitudeDeg,
      heightM,
    )
    const moonset = this.findAltitudeEvent(
      samples,
      horizonAt,
      -1,
      latitudeDeg,
      longitudeDeg,
      heightM,
    )
    const transit = this.findTransitEvent(samples, latitudeDeg, longitudeDeg, heightM)
    const rise = Number.isNaN(moonrise)
      ? undefined
      : this.lunarHorizontal(moonrise, latitudeDeg, longitudeDeg, heightM)
    const set = Number.isNaN(moonset)
      ? undefined
      : this.lunarHorizontal(moonset, latitudeDeg, longitudeDeg, heightM)
    const transitHorizontal = Number.isNaN(transit)
      ? undefined
      : this.lunarHorizontal(transit, latitudeDeg, longitudeDeg, heightM)
    return {
      月の出: moonrise,
      南中時刻: transit,
      月の入: moonset,
      月の出方位: rise ? (rise.azimuthDeg * Math.PI) / 180 : NaN,
      月の入方位: set ? (set.azimuthDeg * Math.PI) / 180 : NaN,
      南中高度: transitHorizontal ? (transitHorizontal.altitudeDeg * Math.PI) / 180 : NaN,
      has_moonrise: !Number.isNaN(moonrise),
      has_transit: !Number.isNaN(transit),
      has_moonset: !Number.isNaN(moonset),
      is_up_all_day: 0 <= (transitHorizontal?.altitudeDeg ?? -1),
    }
  }

  private distanceKmAt(utc: number) {
    const ratio = this.source.radialDistanceRatioAt?.(utc) ?? 1
    return Number.isFinite(this.meanDistanceKm) ? this.meanDistanceKm * ratio : Infinity
  }

  private angularRadiusDeg(distanceKm: number) {
    return Number.isFinite(distanceKm) && 0 < distanceKm && 0 < this.radiusKm
      ? asin_deg(this.radiusKm / distanceKm)
      : 0
  }

  private meanAngularRadiusDeg() {
    return this.angularRadiusDeg(this.meanDistanceKm)
  }

  private samples(dayStartUtc: number, latitudeDeg: number, longitudeDeg: number, heightM: number) {
    const sampleStep = 60 * MINUTE
    const count = Math.max(24, Math.ceil(this.rotation.periodMsec / sampleStep))
    const samples: Sample[] = []
    for (let index = 0; index <= count; index++) {
      const at = dayStartUtc + Math.min(index * sampleStep, this.rotation.periodMsec)
      const horizontal = this.lunarHorizontal(at, latitudeDeg, longitudeDeg, heightM)
      samples.push({
        at,
        altitudeDeg: horizontal.altitudeDeg,
        hourAngleDeg: horizontal.hourAngleDeg,
        distanceKm: horizontal.distanceKm,
      })
    }
    return samples
  }

  private findAltitudeEvent(
    samples: Sample[],
    targetDeg: (at: number, distanceKm: number) => number,
    direction: 1 | -1,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM: number,
  ) {
    for (let index = 1; index < samples.length; index++) {
      const previous = samples[index - 1]
      const next = samples[index]
      const previousValue = previous.altitudeDeg - targetDeg(previous.at, previous.distanceKm)
      const nextValue = next.altitudeDeg - targetDeg(next.at, next.distanceKm)
      if (previousValue === 0 || previousValue * nextValue <= 0) {
        if (direction === 1 && nextValue < previousValue) continue
        if (direction === -1 && previousValue < nextValue) continue
        return this.bisectAltitude(
          previous.at,
          next.at,
          targetDeg,
          latitudeDeg,
          longitudeDeg,
          heightM,
        )
      }
    }
    return NaN
  }

  private findTransitEvent(
    samples: Sample[],
    latitudeDeg: number,
    longitudeDeg: number,
    heightM: number,
  ) {
    for (let index = 1; index < samples.length; index++) {
      const previous = samples[index - 1]
      const next = samples[index]
      if (previous.hourAngleDeg <= 0 && 0 < next.hourAngleDeg) {
        return this.bisectHourAngle(previous.at, next.at, latitudeDeg, longitudeDeg, heightM)
      }
    }
    return NaN
  }

  private bisectAltitude(
    from: number,
    to: number,
    targetDeg: (at: number, distanceKm: number) => number,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM: number,
  ) {
    let lower = from
    let upper = to
    let lowerValue = this.altitudeDifference(lower, targetDeg, latitudeDeg, longitudeDeg, heightM)
    for (let index = 0; index < 48; index++) {
      if (upper - lower <= 500) return Math.round((lower + upper) / 2)
      const middle = (lower + upper) / 2
      const middleValue = this.altitudeDifference(
        middle,
        targetDeg,
        latitudeDeg,
        longitudeDeg,
        heightM,
      )
      if (lowerValue * middleValue <= 0) upper = middle
      else {
        lower = middle
        lowerValue = middleValue
      }
    }
    return Math.round((lower + upper) / 2)
  }

  private altitudeDifference(
    at: number,
    targetDeg: (at: number, distanceKm: number) => number,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM: number,
  ) {
    const horizontal = this.lunarHorizontal(at, latitudeDeg, longitudeDeg, heightM)
    return horizontal.altitudeDeg - targetDeg(at, horizontal.distanceKm)
  }

  private bisectHourAngle(
    from: number,
    to: number,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM: number,
  ) {
    let lower = from
    let upper = to
    let lowerValue = this.lunarHorizontal(lower, latitudeDeg, longitudeDeg, heightM).hourAngleDeg
    for (let index = 0; index < 48; index++) {
      if (upper - lower <= 500) return Math.round((lower + upper) / 2)
      const middle = (lower + upper) / 2
      const middleValue = this.lunarHorizontal(
        middle,
        latitudeDeg,
        longitudeDeg,
        heightM,
      ).hourAngleDeg
      if (lowerValue * middleValue <= 0) upper = middle
      else {
        lower = middle
        lowerValue = middleValue
      }
    }
    return Math.round((lower + upper) / 2)
  }
}

function dot(a: readonly number[], b: readonly number[]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function positiveOrZero(value: number | undefined) {
  if (value == null) return 0
  if (!Number.isFinite(value) || value < 0) throw new Error(`invalid orbital body radius ${value}`)
  return value
}

function positiveOrInfinity(value: number | undefined) {
  if (value == null) return Infinity
  if (!Number.isFinite(value) || value <= 0) throw new Error(`invalid orbital distance ${value}`)
  return value
}
