'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.EarthMoonOrbital = void 0
const orbital_model_1 = require('../orbital-model')
const number_1 = require('../number')
const astro_math_1 = require('./astro-math')
const MOON_LR_TERMS = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003],
  [2, 0, -1, 2, -2602, 0],
  [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322],
  [2, -2, 0, 0, 2236, -9884],
  [0, 1, 2, 0, -2120, 5751],
  [0, 2, 0, 0, -2069, 0],
  [2, -2, -1, 0, 2048, -4950],
  [2, 0, 1, -2, -1773, 4130],
  [2, 0, 0, 2, -1595, 0],
  [4, -1, -1, 0, 1215, -3958],
  [0, 0, 2, 2, -1110, 0],
  [3, 0, -1, 0, -892, 3258],
  [2, 1, 1, 0, -810, 2616],
  [4, -1, -2, 0, 759, -1897],
  [0, 2, -1, 0, -713, -2117],
  [2, 2, -1, 0, -700, 2354],
  [2, 1, -2, 0, 691, 0],
  [2, -1, 0, -2, 596, 0],
  [4, 0, 1, 0, 549, -1423],
  [0, 0, 4, 0, 537, -1117],
  [4, -1, 0, 0, 520, -1571],
  [1, 0, -2, 0, -487, -1739],
  [2, 1, 0, -2, -399, 0],
  [0, 0, 2, -2, -381, -4421],
  [1, 1, 1, 0, 351, 0],
  [3, 0, -2, 0, -340, 0],
  [4, 0, -3, 0, 330, 0],
  [2, -1, 2, 0, 327, 0],
  [0, 2, 1, 0, -323, 1165],
  [1, 1, -1, 0, 299, 0],
  [2, 0, 3, 0, 294, 0],
  [2, 0, -1, -2, 0, 8752],
]
const MOON_B_TERMS = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565],
  [1, 0, 0, 1, -1491],
  [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410],
  [0, 1, 0, -1, -1344],
  [1, 0, 0, -1, -1335],
  [0, 0, 3, 1, 1107],
  [4, 0, 0, -1, 1021],
  [4, 0, -1, 1, 833],
  [0, 0, 1, -3, 777],
  [4, 0, -2, 1, 671],
  [2, 0, 0, -3, 607],
  [2, 0, 2, -1, 596],
  [2, -1, 1, -1, 491],
  [2, 0, -2, 1, -451],
  [0, 0, 3, -1, 439],
  [2, 0, 2, 1, 422],
  [2, 0, -3, -1, 421],
  [2, 1, -1, 1, -366],
  [2, 1, 0, 1, -351],
  [4, 0, 0, 1, 331],
  [2, -1, 1, 1, 315],
  [2, -2, 0, -1, 302],
  [0, 0, 1, 3, -283],
  [2, 1, 1, -1, -229],
  [1, 1, 0, -1, 223],
  [1, 1, 0, 1, 223],
  [0, 1, -2, -1, -220],
  [2, 1, -1, -1, -220],
  [1, 0, 1, 1, -185],
  [2, -1, -2, -1, 181],
  [0, 1, 2, 1, -177],
  [4, 0, -2, -1, 176],
  [4, -1, -1, -1, 166],
  [1, 0, 1, -1, -164],
  [4, 0, 1, -1, 132],
  [1, 0, -1, -1, -119],
  [4, -1, 0, -1, 115],
  [2, -2, 0, 1, 107],
]
class EarthMoonOrbital {
  static {
    this.meanSynodicMonthMsec = 2551442889
  }
  static {
    this.newMoonEpochMsec = 1577310360000
  }
  static {
    this.rotationAxialTiltDeg = 6.68
  }
  constructor({
    periodMsec = EarthMoonOrbital.meanSynodicMonthMsec,
    epochMsec = EarthMoonOrbital.newMoonEpochMsec,
  } = {}) {
    this.periodMsec = periodMsec
    this.epochMsec = epochMsec
  }
  static rotation() {
    return [EarthMoonOrbital.meanSynodicMonthMsec, 0, EarthMoonOrbital.rotationAxialTiltDeg]
  }
  static satellite(center, options = {}) {
    const { body, ...orbitalOptions } = options
    return (0, orbital_model_1.placeSatellite)({
      body,
      center,
      orbital: new EarthMoonOrbital(orbitalOptions),
      rotation: EarthMoonOrbital.rotation(),
    })
  }
  lunarEquatorial(utc) {
    const jde = (0, astro_math_1.julian_day)(utc) + (0, astro_math_1.delta_t_sec)(utc) / 86400
    const T = (jde - 2451545.0) / 36525
    const T2 = T * T
    const T3 = T2 * T
    const T4 = T3 * T
    const Lp = (0, number_1.mod)(
      218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000,
      360,
    )
    const D = (0, number_1.mod)(
      297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000,
      360,
    )
    const M = (0, number_1.mod)(
      357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000,
      360,
    )
    const Mp = (0, number_1.mod)(
      134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000,
      360,
    )
    const F = (0, number_1.mod)(
      93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000,
      360,
    )
    const A1 = 119.75 + 131.849 * T
    const A2 = 53.09 + 479264.29 * T
    const A3 = 313.45 + 481266.484 * T
    const E = 1 - 0.002516 * T - 0.0000074 * T2
    let sigmaL = 0
    let sigmaR = 0
    for (const [d, m, mp, f, l, r] of MOON_LR_TERMS) {
      const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1
      const argument = d * D + m * M + mp * Mp + f * F
      sigmaL += e * l * (0, astro_math_1.sin_deg)(argument)
      sigmaR += e * r * (0, astro_math_1.cos_deg)(argument)
    }
    sigmaL +=
      3958 * (0, astro_math_1.sin_deg)(A1) +
      1962 * (0, astro_math_1.sin_deg)(Lp - F) +
      318 * (0, astro_math_1.sin_deg)(A2)
    let sigmaB = 0
    for (const [d, m, mp, f, b] of MOON_B_TERMS) {
      const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1
      sigmaB += e * b * (0, astro_math_1.sin_deg)(d * D + m * M + mp * Mp + f * F)
    }
    sigmaB +=
      -2235 * (0, astro_math_1.sin_deg)(Lp) +
      382 * (0, astro_math_1.sin_deg)(A3) +
      175 * (0, astro_math_1.sin_deg)(A1 - F) +
      175 * (0, astro_math_1.sin_deg)(A1 + F) +
      127 * (0, astro_math_1.sin_deg)(Lp - Mp) -
      115 * (0, astro_math_1.sin_deg)(Lp + Mp)
    const longitudeDeg = (0, number_1.mod)(Lp + sigmaL / 1000000, 360)
    const latitudeDeg = sigmaB / 1000000
    const distanceKm = 385000.56 + sigmaR / 1000
    const obliquityDeg = (0, astro_math_1.true_obliquity_deg)(jde)
    const rightAscensionDeg = (0, number_1.mod)(
      (0, astro_math_1.atan2_deg)(
        (0, astro_math_1.sin_deg)(longitudeDeg) * (0, astro_math_1.cos_deg)(obliquityDeg) -
          (0, astro_math_1.tan_deg)(latitudeDeg) * (0, astro_math_1.sin_deg)(obliquityDeg),
        (0, astro_math_1.cos_deg)(longitudeDeg),
      ),
      360,
    )
    const declinationDeg = (0, astro_math_1.asin_deg)(
      (0, astro_math_1.sin_deg)(latitudeDeg) * (0, astro_math_1.cos_deg)(obliquityDeg) +
        (0, astro_math_1.cos_deg)(latitudeDeg) *
          (0, astro_math_1.sin_deg)(obliquityDeg) *
          (0, astro_math_1.sin_deg)(longitudeDeg),
    )
    const horizontalParallaxDeg = (0, astro_math_1.asin_deg)(
      astro_math_1.EARTH_EQUATORIAL_RADIUS_KM / distanceKm,
    )
    return {
      longitudeDeg,
      latitudeDeg,
      distanceKm,
      rightAscensionDeg,
      declinationDeg,
      horizontalParallaxDeg,
      obliquityDeg,
    }
  }
  lunarHorizontal(utc, latitudeDeg, longitudeDeg, heightM = 0) {
    const equatorial = this.lunarEquatorial(utc)
    const siderealDeg = (0, astro_math_1.greenwich_apparent_sidereal_time_deg)(utc) + longitudeDeg
    const hourAngleDeg = (0, astro_math_1.signed_degree_diff)(
      siderealDeg,
      equatorial.rightAscensionDeg,
    )
    const u = Math.atan(0.99664719 * Math.tan(latitudeDeg * astro_math_1.DEG_TO_RAD))
    const heightKm = heightM / 1000
    const rhoSinPhiPrime =
      0.99664719 * Math.sin(u) +
      (heightKm / astro_math_1.EARTH_EQUATORIAL_RADIUS_KM) * (0, astro_math_1.sin_deg)(latitudeDeg)
    const rhoCosPhiPrime =
      Math.cos(u) +
      (heightKm / astro_math_1.EARTH_EQUATORIAL_RADIUS_KM) * (0, astro_math_1.cos_deg)(latitudeDeg)
    const parallaxRad = equatorial.horizontalParallaxDeg * astro_math_1.DEG_TO_RAD
    const hourAngleRad = hourAngleDeg * astro_math_1.DEG_TO_RAD
    const declinationRad = equatorial.declinationDeg * astro_math_1.DEG_TO_RAD
    const deltaAlphaRad = Math.atan2(
      -rhoCosPhiPrime * Math.sin(parallaxRad) * Math.sin(hourAngleRad),
      Math.cos(declinationRad) - rhoCosPhiPrime * Math.sin(parallaxRad) * Math.cos(hourAngleRad),
    )
    const topocentricRightAscensionDeg = (0, number_1.mod)(
      equatorial.rightAscensionDeg + deltaAlphaRad * astro_math_1.RAD_TO_DEG,
      360,
    )
    const topocentricDeclinationDeg = (0, astro_math_1.atan2_deg)(
      (Math.sin(declinationRad) - rhoSinPhiPrime * Math.sin(parallaxRad)) * Math.cos(deltaAlphaRad),
      Math.cos(declinationRad) - rhoCosPhiPrime * Math.sin(parallaxRad) * Math.cos(hourAngleRad),
    )
    const horizontal = (0, astro_math_1.local_horizontal_from_equatorial)(
      utc,
      latitudeDeg,
      longitudeDeg,
      topocentricRightAscensionDeg,
      topocentricDeclinationDeg,
    )
    return {
      ...equatorial,
      ...horizontal,
      topocentricRightAscensionDeg,
      topocentricDeclinationDeg,
    }
  }
  lunarEvents(utc, options) {
    const {
      latitudeDeg,
      longitudeDeg,
      timezoneDeg = longitudeDeg,
      heightM = 0,
      horizonDeg = -34 / 60,
    } = options
    const timezoneMsec = (timezoneDeg / 360) * astro_math_1.MSEC_PER_DAY
    const dayStartUtc =
      options.dayStartUtc ??
      Math.floor((utc + timezoneMsec) / astro_math_1.MSEC_PER_DAY) * astro_math_1.MSEC_PER_DAY -
        timezoneMsec
    const samples = this.lunarSamples(dayStartUtc, latitudeDeg, longitudeDeg, heightM)
    const moonrise = this.findAltitudeEvent(
      samples,
      horizonDeg,
      1,
      horizonDeg,
      latitudeDeg,
      longitudeDeg,
      heightM,
    )
    const moonset = this.findAltitudeEvent(
      samples,
      horizonDeg,
      -1,
      horizonDeg,
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
      月の出方位: (rise?.azimuthDeg ?? NaN) * astro_math_1.DEG_TO_RAD,
      月の入方位: (set?.azimuthDeg ?? NaN) * astro_math_1.DEG_TO_RAD,
      南中高度: (transitHorizontal?.altitudeDeg ?? NaN) * astro_math_1.DEG_TO_RAD,
      has_moonrise: !Number.isNaN(moonrise),
      has_transit: !Number.isNaN(transit),
      has_moonset: !Number.isNaN(moonset),
      is_up_all_day: 0 <= (transitHorizontal?.altitudeDeg ?? -1),
    }
  }
  lunarApsis(kind, near) {
    const compare = kind === 'perigee' ? (a, b) => a < b : (a, b) => b < a
    let at = near
    let distanceKm = this.lunarEquatorial(at).distanceKm
    const step = astro_math_1.MSEC_PER_DAY / 4
    for (
      let cursor = near - 14 * astro_math_1.MSEC_PER_DAY;
      cursor <= near + 14 * astro_math_1.MSEC_PER_DAY;
      cursor += step
    ) {
      const candidateDistanceKm = this.lunarEquatorial(cursor).distanceKm
      if (compare(candidateDistanceKm, distanceKm)) {
        at = cursor
        distanceKm = candidateDistanceKm
      }
    }
    let from = at - step
    let to = at + step
    for (let i = 0; i < 48; i++) {
      const left = from + (to - from) / 3
      const right = to - (to - from) / 3
      const leftDistanceKm = this.lunarEquatorial(left).distanceKm
      const rightDistanceKm = this.lunarEquatorial(right).distanceKm
      if (
        kind === 'perigee' ? leftDistanceKm < rightDistanceKm : rightDistanceKm < leftDistanceKm
      ) {
        to = right
      } else {
        from = left
      }
      if (Math.abs(to - from) < 500) break
    }
    const eventAt = Math.round((from + to) / 2)
    return { kind, at: eventAt, distanceKm: this.lunarEquatorial(eventAt).distanceKm }
  }
  lunarNode(kind, near) {
    const step = astro_math_1.MSEC_PER_DAY / 4
    let best
    let previousAt = near - 14 * astro_math_1.MSEC_PER_DAY
    let previousLatitudeDeg = this.lunarEquatorial(previousAt).latitudeDeg
    for (let at = previousAt + step; at <= near + 14 * astro_math_1.MSEC_PER_DAY; at += step) {
      const latitudeDeg = this.lunarEquatorial(at).latitudeDeg
      if (previousLatitudeDeg === 0 || previousLatitudeDeg * latitudeDeg <= 0) {
        const direction = previousLatitudeDeg < latitudeDeg ? 'ascending' : 'descending'
        if (direction === kind) {
          const middle = (previousAt + at) / 2
          const distance = Math.abs(middle - near)
          if (!best || distance < best.distance) {
            best = { from: previousAt, to: at, distance }
          }
        }
      }
      previousAt = at
      previousLatitudeDeg = latitudeDeg
    }
    if (!best) {
      throw new Error(`failed to resolve lunar ${kind} node near ${near}`)
    }
    const eventAt = (0, astro_math_1.bisect_zero)(
      best.from,
      best.to,
      (at) => this.lunarEquatorial(at).latitudeDeg,
      500,
      48,
    )
    const { longitudeDeg, latitudeDeg } = this.lunarEquatorial(eventAt)
    return { kind, at: eventAt, longitudeDeg, latitudeDeg }
  }
  lunarSamples(dayStartUtc, latitudeDeg, longitudeDeg, heightM) {
    const samples = []
    for (let i = 0; i <= 24; i++) {
      const at = dayStartUtc + i * 60 * astro_math_1.MSEC_PER_MINUTE
      const { altitudeDeg, hourAngleDeg } = this.lunarHorizontal(
        at,
        latitudeDeg,
        longitudeDeg,
        heightM,
      )
      samples.push({ at, altitudeDeg, hourAngleDeg })
    }
    return samples
  }
  findAltitudeEvent(samples, targetDeg, direction, horizonDeg, latitudeDeg, longitudeDeg, heightM) {
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]
      const next = samples[i]
      const prevAltitude = prev.altitudeDeg - targetDeg
      const nextAltitude = next.altitudeDeg - targetDeg
      if (prevAltitude === 0 || prevAltitude * nextAltitude <= 0) {
        if (direction === 1 && nextAltitude < prevAltitude) continue
        if (direction === -1 && prevAltitude < nextAltitude) continue
        return this.timeOfLunarAltitude(
          prev.at,
          next.at,
          horizonDeg,
          latitudeDeg,
          longitudeDeg,
          heightM,
        )
      }
    }
    return NaN
  }
  findTransitEvent(samples, latitudeDeg, longitudeDeg, heightM) {
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]
      const next = samples[i]
      if (prev.hourAngleDeg <= 0 && 0 < next.hourAngleDeg) {
        return this.timeOfLunarHourAngle(prev.at, next.at, 0, latitudeDeg, longitudeDeg, heightM)
      }
    }
    return NaN
  }
  timeOfLunarAltitude(from, to, altitudeDeg, latitudeDeg, longitudeDeg, heightM) {
    return (0, astro_math_1.bisect_zero)(
      from,
      to,
      (at) =>
        this.lunarHorizontal(at, latitudeDeg, longitudeDeg, heightM).altitudeDeg - altitudeDeg,
    )
  }
  timeOfLunarHourAngle(from, to, targetDeg, latitudeDeg, longitudeDeg, heightM) {
    return (0, astro_math_1.bisect_zero)(from, to, (at) =>
      (0, astro_math_1.signed_degree_diff)(
        this.lunarHorizontal(at, latitudeDeg, longitudeDeg, heightM).hourAngleDeg,
        targetDeg,
      ),
    )
  }
  phaseAt(utc) {
    return (0, number_1.mod)((utc - this.epochMsec) / this.periodMsec, 1)
  }
  timeOfPhase(phase, near) {
    const k = this.nearestLunation(phase, near)
    return (0, astro_math_1.jde_to_utc)(this.phaseJde(k))
  }
  nearestLunation(phase, near) {
    const jde = (0, astro_math_1.julian_day)(near) + (0, astro_math_1.delta_t_sec)(near) / 86400
    return Math.round((jde - 2451550.09766) / 29.530588861 - phase) + phase
  }
  phaseJde(k) {
    const T = k / 1236.85
    const T2 = T * T
    const T3 = T2 * T
    const T4 = T3 * T
    const E = 1 - 0.002516 * T - 0.0000074 * T2
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4
    const Omega = 124.7746 - 1.5637558 * k + 0.0020691 * T2 + 0.00000215 * T3
    let jde =
      2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4
    jde += this.phaseCorrection((0, number_1.mod)(k, 1), E, M, Mp, F, Omega)
    jde += this.additionalCorrection(k, T)
    return jde
  }
  phaseCorrection(phase, E, M, Mp, F, Omega) {
    if (phase < 0.125 || 0.875 < phase) {
      return this.newOrFullCorrection(E, M, Mp, F, Omega, false)
    }
    if (0.375 < phase && phase < 0.625) {
      return this.newOrFullCorrection(E, M, Mp, F, Omega, true)
    }
    const correction =
      -0.62801 * (0, astro_math_1.sin_deg)(Mp) +
      0.17172 * E * (0, astro_math_1.sin_deg)(M) -
      0.01183 * E * (0, astro_math_1.sin_deg)(Mp + M) +
      0.00862 * (0, astro_math_1.sin_deg)(2 * Mp) +
      0.00804 * (0, astro_math_1.sin_deg)(2 * F) +
      0.00454 * E * (0, astro_math_1.sin_deg)(Mp - M) +
      0.00204 * E * E * (0, astro_math_1.sin_deg)(2 * M) -
      0.0018 * (0, astro_math_1.sin_deg)(Mp - 2 * F) -
      0.0007 * (0, astro_math_1.sin_deg)(Mp + 2 * F) -
      0.0004 * (0, astro_math_1.sin_deg)(3 * Mp) -
      0.00034 * E * (0, astro_math_1.sin_deg)(2 * Mp - M) +
      0.00032 * E * (0, astro_math_1.sin_deg)(M + 2 * F) +
      0.00032 * E * (0, astro_math_1.sin_deg)(M - 2 * F) -
      0.00028 * E * E * (0, astro_math_1.sin_deg)(Mp + 2 * M) +
      0.00027 * E * (0, astro_math_1.sin_deg)(2 * Mp + M) -
      0.00017 * (0, astro_math_1.sin_deg)(Omega) -
      0.00005 * (0, astro_math_1.sin_deg)(Mp - M - 2 * F) +
      0.00004 * (0, astro_math_1.sin_deg)(2 * Mp + 2 * F) -
      0.00004 * (0, astro_math_1.sin_deg)(Mp + M + 2 * F) +
      0.00004 * (0, astro_math_1.sin_deg)(Mp - 2 * M) +
      0.00003 * (0, astro_math_1.sin_deg)(Mp + M - 2 * F) +
      0.00003 * (0, astro_math_1.sin_deg)(3 * M) +
      0.00002 * (0, astro_math_1.sin_deg)(2 * Mp - 2 * F) +
      0.00002 * (0, astro_math_1.sin_deg)(Mp - M + 2 * F) -
      0.00002 * (0, astro_math_1.sin_deg)(3 * Mp + M)
    const w =
      0.00306 -
      0.00038 * E * (0, astro_math_1.cos_deg)(M) +
      0.00026 * (0, astro_math_1.cos_deg)(Mp) -
      0.00002 * (0, astro_math_1.cos_deg)(Mp - M) +
      0.00002 * (0, astro_math_1.cos_deg)(Mp + M) +
      0.00002 * (0, astro_math_1.cos_deg)(2 * F)
    return phase < 0.5 ? correction + w : correction - w
  }
  newOrFullCorrection(E, M, Mp, F, Omega, isFullMoon) {
    return (
      (isFullMoon ? -0.40614 : -0.4072) * (0, astro_math_1.sin_deg)(Mp) +
      (isFullMoon ? 0.17302 : 0.17241) * E * (0, astro_math_1.sin_deg)(M) +
      (isFullMoon ? 0.01614 : 0.01608) * (0, astro_math_1.sin_deg)(2 * Mp) +
      (isFullMoon ? 0.01043 : 0.01039) * (0, astro_math_1.sin_deg)(2 * F) +
      (isFullMoon ? 0.00734 : 0.00739) * E * (0, astro_math_1.sin_deg)(Mp - M) -
      0.00514 * E * (0, astro_math_1.sin_deg)(Mp + M) +
      0.00208 * E * E * (0, astro_math_1.sin_deg)(2 * M) -
      0.00111 * (0, astro_math_1.sin_deg)(Mp - 2 * F) -
      0.00057 * (0, astro_math_1.sin_deg)(Mp + 2 * F) +
      0.00056 * E * (0, astro_math_1.sin_deg)(2 * Mp + M) -
      0.00042 * (0, astro_math_1.sin_deg)(3 * Mp) +
      0.00042 * E * (0, astro_math_1.sin_deg)(M + 2 * F) +
      0.00038 * E * (0, astro_math_1.sin_deg)(M - 2 * F) -
      0.00024 * E * (0, astro_math_1.sin_deg)(2 * Mp - M) -
      0.00017 * (0, astro_math_1.sin_deg)(Omega) -
      0.00007 * (0, astro_math_1.sin_deg)(Mp + 2 * M) +
      0.00004 * (0, astro_math_1.sin_deg)(2 * Mp - 2 * F) +
      0.00004 * (0, astro_math_1.sin_deg)(3 * M) +
      0.00003 * (0, astro_math_1.sin_deg)(Mp + M - 2 * F) +
      0.00003 * (0, astro_math_1.sin_deg)(2 * Mp + 2 * F) -
      0.00003 * (0, astro_math_1.sin_deg)(Mp + M + 2 * F) +
      0.00003 * (0, astro_math_1.sin_deg)(Mp - M + 2 * F) -
      0.00002 * (0, astro_math_1.sin_deg)(Mp - M - 2 * F) -
      0.00002 * (0, astro_math_1.sin_deg)(3 * Mp + M) +
      0.00002 * (0, astro_math_1.sin_deg)(4 * Mp)
    )
  }
  additionalCorrection(k, T) {
    const angles = [
      299.77 + 0.107408 * k - 0.009173 * T * T,
      251.88 + 0.016321 * k,
      251.83 + 26.651886 * k,
      349.42 + 36.412478 * k,
      84.66 + 18.206239 * k,
      141.74 + 53.303771 * k,
      207.14 + 2.453732 * k,
      154.84 + 7.30686 * k,
      34.52 + 27.261239 * k,
      207.19 + 0.121824 * k,
      291.34 + 1.844379 * k,
      161.72 + 24.198154 * k,
      239.56 + 25.513099 * k,
      331.55 + 3.592518 * k,
    ]
    const coefficients = [
      0.000325, 0.000165, 0.000164, 0.000126, 0.00011, 0.000062, 0.00006, 0.000056, 0.000047,
      0.000042, 0.00004, 0.000037, 0.000035, 0.000023,
    ]
    return angles.reduce(
      (sum, angle, index) => sum + coefficients[index] * (0, astro_math_1.sin_deg)(angle),
      0,
    )
  }
}
exports.EarthMoonOrbital = EarthMoonOrbital
//# sourceMappingURL=earth-moon.js.map
