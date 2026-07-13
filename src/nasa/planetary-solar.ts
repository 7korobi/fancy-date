import type {
  SolarEquatorialCoordinates,
  SolarEventModel,
  SolarHorizontalCoordinates,
  SolarObservation,
  SolarObservationOptions,
} from '../orbital-model'
import { mod } from '../number'
import {
  DEG_TO_RAD,
  acos_deg,
  asin_deg,
  atan2_deg,
  cos_deg,
  signed_degree_diff,
  sin_deg,
  tan_deg,
} from '../naoj/astro-math'

export type PlanetarySolarEventModelOptions = {
  periodMsec: number
  epochMsec: number
  dayMsec: number
  siderealDayMsec: number
  rotationEpochMsec: number
  axialTiltDeg: number
}

export abstract class PlanetarySolarEventModel implements SolarEventModel {
  readonly periodMsec: number
  readonly epochMsec: number
  protected readonly dayMsec: number
  protected readonly siderealDayMsec: number
  protected readonly rotationEpochMsec: number
  protected readonly axialTiltDeg: number

  constructor({
    periodMsec,
    epochMsec,
    dayMsec,
    siderealDayMsec,
    rotationEpochMsec,
    axialTiltDeg,
  }: PlanetarySolarEventModelOptions) {
    this.periodMsec = periodMsec
    this.epochMsec = epochMsec
    this.dayMsec = dayMsec
    this.siderealDayMsec = siderealDayMsec
    this.rotationEpochMsec = rotationEpochMsec
    this.axialTiltDeg = axialTiltDeg
  }

  abstract solarLongitudeDeg(utc: number): number

  phaseAt(utc: number) {
    return mod(this.solarLongitudeDeg(utc) / 360, 1)
  }

  timeOfPhase(phase: number, near: number) {
    const target = mod(phase, 1) * 360
    let at = near
    for (let i = 0; i < 8; i++) {
      const diff = signed_degree_diff(this.solarLongitudeDeg(at), target)
      at -= (diff / 360) * this.periodMsec
      if (Math.abs(diff) < 1e-8) break
    }
    return Math.round(
      [at - this.periodMsec, at, at + this.periodMsec].reduce((best, candidate) =>
        Math.abs(candidate - near) < Math.abs(best - near) ? candidate : best,
      ),
    )
  }

  solarEquatorial(utc: number): SolarEquatorialCoordinates {
    const longitudeDeg = this.solarLongitudeDeg(utc)
    const obliquityDeg = this.axialTiltDeg
    const rightAscensionDeg = mod(
      atan2_deg(cos_deg(obliquityDeg) * sin_deg(longitudeDeg), cos_deg(longitudeDeg)),
      360,
    )
    const declinationDeg = asin_deg(sin_deg(obliquityDeg) * sin_deg(longitudeDeg))
    return { longitudeDeg, rightAscensionDeg, declinationDeg, obliquityDeg }
  }

  solarHorizontal(
    utc: number,
    latitudeDeg: number,
    longitudeDeg: number,
  ): SolarHorizontalCoordinates {
    const equatorial = this.solarEquatorial(utc)
    const hourAngleDeg = signed_degree_diff(
      this.localMeridianDeg(utc, longitudeDeg),
      equatorial.rightAscensionDeg,
    )
    const altitudeDeg = asin_deg(
      sin_deg(latitudeDeg) * sin_deg(equatorial.declinationDeg) +
        cos_deg(latitudeDeg) * cos_deg(equatorial.declinationDeg) * cos_deg(hourAngleDeg),
    )
    const azimuthDeg = mod(
      atan2_deg(
        sin_deg(hourAngleDeg),
        cos_deg(hourAngleDeg) * sin_deg(latitudeDeg) -
          tan_deg(equatorial.declinationDeg) * cos_deg(latitudeDeg),
      ) + 180,
      360,
    )
    return { ...equatorial, altitudeDeg, azimuthDeg, hourAngleDeg }
  }

  solarEvents(utc: number, options: SolarObservationOptions): SolarObservation {
    const { latitudeDeg, longitudeDeg, timezoneDeg = longitudeDeg, horizonDeg = -50 / 60 } = options
    const timezoneMsec = (timezoneDeg / 360) * this.dayMsec
    const dayStartUtc =
      options.dayStartUtc ??
      Math.floor((utc + timezoneMsec) / this.dayMsec) * this.dayMsec - timezoneMsec
    const dayCenterUtc = options.dayCenterUtc ?? dayStartUtc + this.dayMsec / 2
    const transitAt = this.timeOfSolarHourAngle(0, dayCenterUtc, latitudeDeg, longitudeDeg)
    const midnightAt = this.timeOfSolarHourAngle(
      180,
      transitAt - this.dayMsec / 2,
      latitudeDeg,
      longitudeDeg,
    )
    const transit = this.solarHorizontal(transitAt, latitudeDeg, longitudeDeg)
    const hourAngleDeg = this.riseSetHourAngleDeg(latitudeDeg, transit.declinationDeg, horizonDeg)
    const riseAt = Number.isNaN(hourAngleDeg)
      ? NaN
      : this.timeOfSolarAltitude(
          transitAt - (hourAngleDeg / 360) * this.dayMsec,
          latitudeDeg,
          longitudeDeg,
          horizonDeg,
        )
    const setAt = Number.isNaN(hourAngleDeg)
      ? NaN
      : this.timeOfSolarAltitude(
          transitAt + (hourAngleDeg / 360) * this.dayMsec,
          latitudeDeg,
          longitudeDeg,
          horizonDeg,
        )
    const rise = Number.isNaN(riseAt)
      ? undefined
      : this.solarHorizontal(riseAt, latitudeDeg, longitudeDeg)
    const set = Number.isNaN(setAt)
      ? undefined
      : this.solarHorizontal(setAt, latitudeDeg, longitudeDeg)
    const directionDeg = rise?.azimuthDeg ?? NaN
    return {
      K: transit.obliquityDeg * DEG_TO_RAD,
      lat: latitudeDeg * DEG_TO_RAD,
      時角: hourAngleDeg * DEG_TO_RAD,
      方向: directionDeg * DEG_TO_RAD,
      高度: horizonDeg * DEG_TO_RAD,
      真夜中: midnightAt,
      日の出: riseAt,
      南中時刻: transitAt,
      日の入: setAt,
      日の出方位: directionDeg * DEG_TO_RAD,
      日の入方位: (set?.azimuthDeg ?? NaN) * DEG_TO_RAD,
      南中高度: transit.altitudeDeg * DEG_TO_RAD,
      has_sunrise: !Number.isNaN(hourAngleDeg),
      is_up_all_day: 0 <= transit.altitudeDeg,
    }
  }

  private localMeridianDeg(utc: number, longitudeDeg: number) {
    return mod(((utc - this.rotationEpochMsec) / this.siderealDayMsec) * 360 + longitudeDeg, 360)
  }

  private riseSetHourAngleDeg(latitudeDeg: number, declinationDeg: number, horizonDeg: number) {
    const value =
      (sin_deg(horizonDeg) - sin_deg(latitudeDeg) * sin_deg(declinationDeg)) /
      (cos_deg(latitudeDeg) * cos_deg(declinationDeg))
    if (value < -1 || 1 < value) return NaN
    return acos_deg(value)
  }

  private timeOfSolarHourAngle(
    targetDeg: number,
    near: number,
    latitudeDeg: number,
    longitudeDeg: number,
  ) {
    let at = near
    for (let i = 0; i < 8; i++) {
      const { hourAngleDeg } = this.solarHorizontal(at, latitudeDeg, longitudeDeg)
      const diff = signed_degree_diff(hourAngleDeg, targetDeg)
      if (Math.abs(diff) < 1e-7) break
      const before = this.solarHorizontal(at - 60000, latitudeDeg, longitudeDeg).hourAngleDeg
      const after = this.solarHorizontal(at + 60000, latitudeDeg, longitudeDeg).hourAngleDeg
      const rate = signed_degree_diff(after, before) / 120000
      if (!Number.isFinite(rate) || Math.abs(rate) < 1e-10) break
      const correction = Math.max(-this.dayMsec / 4, Math.min(this.dayMsec / 4, diff / rate))
      at -= correction
    }
    return Math.round(at)
  }

  private timeOfSolarAltitude(
    near: number,
    latitudeDeg: number,
    longitudeDeg: number,
    altitudeDeg: number,
  ) {
    let at = near
    for (let i = 0; i < 8; i++) {
      const altitude = this.solarHorizontal(at, latitudeDeg, longitudeDeg).altitudeDeg
      const diff = altitude - altitudeDeg
      if (Math.abs(diff) < 1e-7) break
      const before = this.solarHorizontal(at - 60000, latitudeDeg, longitudeDeg).altitudeDeg
      const after = this.solarHorizontal(at + 60000, latitudeDeg, longitudeDeg).altitudeDeg
      const rate = (after - before) / 120000
      if (!Number.isFinite(rate) || Math.abs(rate) < 1e-10) break
      const correction = Math.max(-this.dayMsec / 4, Math.min(this.dayMsec / 4, diff / rate))
      at -= correction
    }
    return Math.round(at)
  }
}
