import { mod } from '../number'
import { DAY as MSEC_PER_DAY, MINUTE as MSEC_PER_MINUTE } from '../time'

export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI
export { MSEC_PER_DAY, MSEC_PER_MINUTE }
export const EARTH_EQUATORIAL_RADIUS_KM = 6378.14

export function signed_degree_diff(a: number, b: number) {
  return mod(a - b + 180, 360) - 180
}

export function julian_day(utc: number) {
  return utc / MSEC_PER_DAY + 2440587.5
}

export function utc_year(utc: number) {
  const date = new Date(utc)
  const year = date.getUTCFullYear()
  const start = Date.UTC(year, 0, 1)
  const next = Date.UTC(year + 1, 0, 1)
  return year + (utc - start) / (next - start)
}

export function delta_t_sec(utc: number) {
  const year = utc_year(utc)
  const t = year - 2000
  return 62.92 + 0.32217 * t + 0.005589 * t * t
}

export function sin_deg(deg: number) {
  return Math.sin(deg * DEG_TO_RAD)
}

export function cos_deg(deg: number) {
  return Math.cos(deg * DEG_TO_RAD)
}

export function tan_deg(deg: number) {
  return Math.tan(deg * DEG_TO_RAD)
}

export function asin_deg(value: number) {
  return Math.asin(Math.max(-1, Math.min(1, value))) * RAD_TO_DEG
}

export function acos_deg(value: number) {
  return Math.acos(Math.max(-1, Math.min(1, value))) * RAD_TO_DEG
}

export function atan2_deg(y: number, x: number) {
  return Math.atan2(y, x) * RAD_TO_DEG
}

export function bisect_zero(
  from: number,
  to: number,
  valueAt: (at: number) => number,
  toleranceMsec = 500,
  maxIterations = 32,
) {
  let start = from
  let end = to
  let startValue = valueAt(start)
  for (let i = 0; i < maxIterations; i++) {
    const middle = (start + end) / 2
    const middleValue = valueAt(middle)
    if (Math.abs(end - start) < toleranceMsec) return Math.round(middle)
    if (startValue * middleValue <= 0) {
      end = middle
    } else {
      start = middle
      startValue = middleValue
    }
  }
  return Math.round((start + end) / 2)
}

export function mean_obliquity_deg(jde: number) {
  const T = (jde - 2451545.0) / 36525
  const U = T / 100
  const arcsec =
    84381.448 -
    4680.93 * U -
    1.55 * U ** 2 +
    1999.25 * U ** 3 -
    51.38 * U ** 4 -
    249.67 * U ** 5 -
    39.05 * U ** 6 +
    7.12 * U ** 7 +
    27.87 * U ** 8 +
    5.79 * U ** 9 +
    2.45 * U ** 10
  return arcsec / 3600
}

export function true_obliquity_deg(jde: number) {
  const T = (jde - 2451545.0) / 36525
  const omega = 125.04 - 1934.136 * T
  return mean_obliquity_deg(jde) + 0.00256 * cos_deg(omega)
}

export function greenwich_apparent_sidereal_time_deg(utc: number) {
  const jd = julian_day(utc)
  const T = (jd - 2451545.0) / 36525
  const gmst =
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000
  const jde = jd + delta_t_sec(utc) / 86400
  const omega = 125.04 - 1934.136 * ((jde - 2451545.0) / 36525)
  const nutationLongitudeDeg = -0.00478 * sin_deg(omega)
  return mod(gmst + nutationLongitudeDeg * cos_deg(true_obliquity_deg(jde)), 360)
}

export function local_horizontal_from_equatorial(
  utc: number,
  latitudeDeg: number,
  longitudeDeg: number,
  rightAscensionDeg: number,
  declinationDeg: number,
) {
  const hourAngleDeg = signed_degree_diff(
    greenwich_apparent_sidereal_time_deg(utc) + longitudeDeg,
    rightAscensionDeg,
  )
  const altitudeDeg = asin_deg(
    sin_deg(latitudeDeg) * sin_deg(declinationDeg) +
      cos_deg(latitudeDeg) * cos_deg(declinationDeg) * cos_deg(hourAngleDeg),
  )
  const azimuthDeg = mod(
    atan2_deg(
      sin_deg(hourAngleDeg),
      cos_deg(hourAngleDeg) * sin_deg(latitudeDeg) - tan_deg(declinationDeg) * cos_deg(latitudeDeg),
    ) + 180,
    360,
  )
  return { altitudeDeg, azimuthDeg, hourAngleDeg }
}

export function jde_to_utc(jde: number) {
  let utc = (jde - 2440587.5) * MSEC_PER_DAY
  for (let i = 0; i < 3; i++) {
    utc = (jde - 2440587.5) * MSEC_PER_DAY - delta_t_sec(utc) * 1000
  }
  return Math.round(utc)
}
