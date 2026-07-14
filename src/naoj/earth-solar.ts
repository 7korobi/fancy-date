import type {
  BodyProfile,
  PLANET,
  ROTATION,
  SolarEquatorialCoordinates,
  SolarEventModel,
  SolarHorizontalCoordinates,
  SolarObservation,
  SolarObservationOptions,
  STAR,
} from '../orbital-model'
import { placePlanet } from '../orbital-model'
import { mod } from '../number'
import {
  DEG_TO_RAD,
  MSEC_PER_DAY,
  RAD_TO_DEG,
  acos_deg,
  asin_deg,
  atan2_deg,
  cos_deg,
  delta_t_sec,
  julian_day,
  local_horizontal_from_equatorial,
  signed_degree_diff,
  sin_deg,
  true_obliquity_deg,
} from './astro-math'

export type EarthSolarOrbitalOptions = {
  periodMsec?: number
  epochMsec?: number
  body?: BodyProfile
}

export type EarthSolarOrbitalPlanetOptions =
  | EarthSolarOrbitalOptions
  | {
      body?: BodyProfile
      orbital: readonly [periodMsec: number, epochMsec: number]
    }

const SOLAR_HOUR_ANGLE_DEG_PER_DAY = 360.98564736629

const EARTH_L_TERMS = [
  [
    [175347046, 0, 0],
    [3341656, 4.6692568, 6283.07585],
    [34894, 4.6261, 12566.1517],
    [3497, 2.7441, 5753.3849],
    [3418, 2.8289, 3.5231],
    [3136, 3.6277, 77713.7715],
    [2676, 4.4181, 7860.4194],
    [2343, 6.1352, 3930.2097],
    [1324, 0.7425, 11506.7698],
    [1273, 2.0371, 529.691],
    [1199, 1.1096, 1577.3435],
    [990, 5.233, 5884.927],
    [902, 2.045, 26.298],
    [857, 3.508, 398.149],
    [780, 1.179, 5223.694],
    [753, 2.533, 5507.553],
    [505, 4.583, 18849.228],
    [492, 4.205, 775.523],
    [357, 2.92, 0.067],
    [317, 5.849, 11790.629],
    [284, 1.899, 796.298],
    [271, 0.315, 10977.079],
    [243, 0.345, 5486.778],
    [206, 4.806, 2544.314],
    [205, 1.869, 5573.143],
    [202, 2.458, 6069.777],
    [156, 0.833, 213.299],
    [132, 3.411, 2942.463],
    [126, 1.083, 20.775],
    [115, 0.645, 0.98],
    [103, 0.636, 4694.003],
    [102, 0.976, 15720.839],
    [102, 4.267, 7.114],
    [99, 6.21, 2146.17],
    [98, 0.68, 155.42],
    [86, 5.98, 161000.69],
    [85, 1.3, 6275.96],
    [85, 3.67, 71430.7],
    [80, 1.81, 17260.15],
    [79, 3.04, 12036.46],
    [75, 1.76, 5088.63],
    [74, 3.5, 3154.69],
    [74, 4.68, 801.82],
    [70, 0.83, 9437.76],
    [62, 3.98, 8827.39],
    [61, 1.82, 7084.9],
    [57, 2.78, 6286.6],
    [56, 4.39, 14143.5],
    [56, 3.47, 6279.55],
    [52, 0.19, 12139.55],
    [52, 1.33, 1748.02],
    [51, 0.28, 5856.48],
    [49, 0.49, 1194.45],
    [41, 5.37, 8429.24],
    [41, 2.4, 19651.05],
    [39, 6.17, 10447.39],
    [37, 6.04, 10213.29],
    [37, 2.57, 1059.38],
    [36, 1.71, 2352.87],
    [36, 1.78, 6812.77],
    [33, 0.59, 17789.85],
    [30, 0.44, 83996.85],
    [30, 2.74, 1349.87],
    [25, 3.16, 4690.48],
  ],
  [
    [628331966747, 0, 0],
    [206059, 2.678235, 6283.07585],
    [4303, 2.6351, 12566.1517],
    [425, 1.59, 3.523],
    [119, 5.796, 26.298],
    [109, 2.966, 1577.344],
    [93, 2.59, 18849.23],
    [72, 1.14, 529.69],
    [68, 1.87, 398.15],
    [67, 4.41, 5507.55],
    [59, 2.89, 5223.69],
    [56, 2.17, 155.42],
    [45, 0.4, 796.3],
    [36, 0.47, 775.52],
    [29, 2.65, 7.11],
    [21, 5.34, 0.98],
    [19, 1.85, 5486.78],
    [19, 4.97, 213.3],
    [17, 2.99, 6275.96],
    [16, 0.03, 2544.31],
    [16, 1.43, 2146.17],
    [15, 1.21, 10977.08],
    [12, 2.83, 1748.02],
    [12, 3.26, 5088.63],
    [12, 5.27, 1194.45],
    [12, 2.08, 4694],
    [11, 0.77, 553.57],
    [10, 1.3, 6286.6],
    [10, 4.24, 1349.87],
    [9, 2.7, 242.73],
    [9, 5.64, 951.72],
    [8, 5.3, 2352.87],
    [6, 2.65, 9437.76],
    [6, 4.67, 4690.48],
  ],
  [
    [52919, 0, 0],
    [8720, 1.0721, 6283.0758],
    [309, 0.867, 12566.152],
    [27, 0.05, 3.52],
    [16, 5.19, 26.3],
    [16, 3.68, 155.42],
    [10, 0.76, 18849.23],
    [9, 2.06, 77713.77],
    [7, 0.83, 775.52],
    [5, 4.66, 1577.34],
    [4, 1.03, 7.11],
    [4, 3.44, 5573.14],
    [3, 5.14, 796.3],
    [3, 6.05, 5507.55],
    [3, 1.19, 242.73],
    [3, 6.12, 529.69],
    [3, 0.31, 398.15],
    [3, 2.28, 553.57],
    [2, 4.38, 5223.69],
    [2, 3.75, 0.98],
  ],
  [
    [289, 5.844, 6283.076],
    [35, 0, 0],
    [17, 5.49, 12566.15],
    [3, 5.2, 155.42],
    [1, 4.72, 3.52],
    [1, 5.3, 18849.23],
    [1, 5.97, 242.73],
  ],
  [
    [114, 3.142, 0],
    [8, 4.13, 6283.08],
    [1, 3.84, 12566.15],
  ],
  [[1, 3.14, 0]],
] as const

export class EarthSolarOrbital implements SolarEventModel {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = MSEC_PER_DAY
  static readonly rotationEpochMsec = 0
  static readonly axialTiltDeg = 23.4397
  static readonly meanTropicalYearMsec = 31556925147
  static readonly vernalEquinoxEpochMsec = 1553119080000

  readonly periodMsec: number
  readonly epochMsec: number

  constructor({
    periodMsec = EarthSolarOrbital.meanTropicalYearMsec,
    epochMsec = EarthSolarOrbital.vernalEquinoxEpochMsec,
  }: EarthSolarOrbitalOptions = {}) {
    this.periodMsec = periodMsec
    this.epochMsec = epochMsec
  }

  static rotation(): ROTATION {
    return [
      EarthSolarOrbital.meanSolarDayMsec,
      EarthSolarOrbital.rotationEpochMsec,
      EarthSolarOrbital.axialTiltDeg,
    ]
  }

  static planet(
    center: STAR = EarthSolarOrbital.sun,
    options: EarthSolarOrbitalPlanetOptions = {},
  ): PLANET {
    const { body, ...orbitalOptions } = earthSolarOrbitalOptionsOf(options)
    return placePlanet({
      body,
      center,
      orbital: new EarthSolarOrbital(orbitalOptions),
      rotation: EarthSolarOrbital.rotation(),
    })
  }

  solarLongitudeDeg(utc: number) {
    const jde = julian_day(utc) + delta_t_sec(utc) / 86400
    const tau = (jde - 2451545.0) / 365250
    let earthLongitude = 0
    let tauPower = 1
    for (const terms of EARTH_L_TERMS) {
      let sum = 0
      for (const [amplitude, phase, frequency] of terms) {
        sum += amplitude * Math.cos(phase + frequency * tau)
      }
      earthLongitude += sum * tauPower
      tauPower *= tau
    }
    const T = (jde - 2451545.0) / 36525
    const omega = (125.04 - 1934.136 * T) * DEG_TO_RAD
    return mod((earthLongitude / 1e8) * RAD_TO_DEG + 180 - 0.00569 - 0.00478 * Math.sin(omega), 360)
  }

  solarEquatorial(utc: number): SolarEquatorialCoordinates {
    const jde = julian_day(utc) + delta_t_sec(utc) / 86400
    const longitudeDeg = this.solarLongitudeDeg(utc)
    const obliquityDeg = true_obliquity_deg(jde)
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
    const horizontal = local_horizontal_from_equatorial(
      utc,
      latitudeDeg,
      longitudeDeg,
      equatorial.rightAscensionDeg,
      equatorial.declinationDeg,
    )
    return { ...equatorial, ...horizontal }
  }

  solarEvents(utc: number, options: SolarObservationOptions): SolarObservation {
    const { latitudeDeg, longitudeDeg, timezoneDeg = longitudeDeg, horizonDeg = -50 / 60 } = options
    const timezoneMsec = (timezoneDeg / 360) * MSEC_PER_DAY
    const dayStartUtc =
      options.dayStartUtc ??
      Math.floor((utc + timezoneMsec) / MSEC_PER_DAY) * MSEC_PER_DAY - timezoneMsec
    const dayCenterUtc = options.dayCenterUtc ?? dayStartUtc + MSEC_PER_DAY / 2
    const transitAt = this.timeOfSolarHourAngle(0, dayCenterUtc, latitudeDeg, longitudeDeg)
    const midnightAt = this.timeOfSolarHourAngle(
      180,
      transitAt - MSEC_PER_DAY / 2,
      latitudeDeg,
      longitudeDeg,
    )
    const transit = this.solarHorizontal(transitAt, latitudeDeg, longitudeDeg)
    const hourAngleDeg = this.riseSetHourAngleDeg(latitudeDeg, transit.declinationDeg, horizonDeg)
    const riseAt = Number.isNaN(hourAngleDeg)
      ? NaN
      : this.timeOfSolarAltitude(
          transitAt - (hourAngleDeg / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY,
          latitudeDeg,
          longitudeDeg,
          horizonDeg,
        )
    const setAt = Number.isNaN(hourAngleDeg)
      ? NaN
      : this.timeOfSolarAltitude(
          transitAt + (hourAngleDeg / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY,
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
      at -= (diff / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY
      if (Math.abs(diff) < 1e-7) break
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
      const correction = Math.max(-7200000, Math.min(7200000, diff / rate))
      at -= correction
    }
    return Math.round(at)
  }

  phaseAt(utc: number) {
    return this.solarLongitudeDeg(utc) / 360
  }

  timeOfPhase(phase: number, near: number) {
    const target = mod(phase, 1) * 360
    let at = near
    for (let i = 0; i < 8; i++) {
      const diff = signed_degree_diff(this.solarLongitudeDeg(at), target)
      at -= (diff / 360) * this.periodMsec
      if (Math.abs(diff) < 1e-8) break
    }
    return Math.round(at)
  }
}

function earthSolarOrbitalOptionsOf(
  options: EarthSolarOrbitalPlanetOptions,
): EarthSolarOrbitalOptions {
  if ('orbital' in options) {
    return { body: options.body, periodMsec: options.orbital[0], epochMsec: options.orbital[1] }
  }
  return options
}
