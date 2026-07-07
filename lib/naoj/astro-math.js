'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.EARTH_EQUATORIAL_RADIUS_KM =
  exports.MSEC_PER_MINUTE =
  exports.MSEC_PER_DAY =
  exports.RAD_TO_DEG =
  exports.DEG_TO_RAD =
    void 0
exports.signed_degree_diff = signed_degree_diff
exports.julian_day = julian_day
exports.utc_year = utc_year
exports.delta_t_sec = delta_t_sec
exports.sin_deg = sin_deg
exports.cos_deg = cos_deg
exports.tan_deg = tan_deg
exports.asin_deg = asin_deg
exports.acos_deg = acos_deg
exports.atan2_deg = atan2_deg
exports.bisect_zero = bisect_zero
exports.mean_obliquity_deg = mean_obliquity_deg
exports.true_obliquity_deg = true_obliquity_deg
exports.greenwich_apparent_sidereal_time_deg = greenwich_apparent_sidereal_time_deg
exports.local_horizontal_from_equatorial = local_horizontal_from_equatorial
exports.jde_to_utc = jde_to_utc
const number_1 = require('../number')
const time_1 = require('../time')
Object.defineProperty(exports, 'MSEC_PER_DAY', {
  enumerable: true,
  get: function () {
    return time_1.DAY
  },
})
Object.defineProperty(exports, 'MSEC_PER_MINUTE', {
  enumerable: true,
  get: function () {
    return time_1.MINUTE
  },
})
exports.DEG_TO_RAD = Math.PI / 180
exports.RAD_TO_DEG = 180 / Math.PI
exports.EARTH_EQUATORIAL_RADIUS_KM = 6378.14
function signed_degree_diff(a, b) {
  return (0, number_1.mod)(a - b + 180, 360) - 180
}
function julian_day(utc) {
  return utc / time_1.DAY + 2440587.5
}
function utc_year(utc) {
  const date = new Date(utc)
  const year = date.getUTCFullYear()
  const start = Date.UTC(year, 0, 1)
  const next = Date.UTC(year + 1, 0, 1)
  return year + (utc - start) / (next - start)
}
function delta_t_sec(utc) {
  const year = utc_year(utc)
  const t = year - 2000
  return 62.92 + 0.32217 * t + 0.005589 * t * t
}
function sin_deg(deg) {
  return Math.sin(deg * exports.DEG_TO_RAD)
}
function cos_deg(deg) {
  return Math.cos(deg * exports.DEG_TO_RAD)
}
function tan_deg(deg) {
  return Math.tan(deg * exports.DEG_TO_RAD)
}
function asin_deg(value) {
  return Math.asin(Math.max(-1, Math.min(1, value))) * exports.RAD_TO_DEG
}
function acos_deg(value) {
  return Math.acos(Math.max(-1, Math.min(1, value))) * exports.RAD_TO_DEG
}
function atan2_deg(y, x) {
  return Math.atan2(y, x) * exports.RAD_TO_DEG
}
function bisect_zero(from, to, valueAt, toleranceMsec = 500, maxIterations = 32) {
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
function mean_obliquity_deg(jde) {
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
function true_obliquity_deg(jde) {
  const T = (jde - 2451545.0) / 36525
  const omega = 125.04 - 1934.136 * T
  return mean_obliquity_deg(jde) + 0.00256 * cos_deg(omega)
}
function greenwich_apparent_sidereal_time_deg(utc) {
  const jd = julian_day(utc)
  const T = (jd - 2451545.0) / 36525
  const gmst =
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000
  const jde = jd + delta_t_sec(utc) / 86400
  const omega = 125.04 - 1934.136 * ((jde - 2451545.0) / 36525)
  const nutationLongitudeDeg = -0.00478 * sin_deg(omega)
  return (0, number_1.mod)(gmst + nutationLongitudeDeg * cos_deg(true_obliquity_deg(jde)), 360)
}
function local_horizontal_from_equatorial(
  utc,
  latitudeDeg,
  longitudeDeg,
  rightAscensionDeg,
  declinationDeg,
) {
  const hourAngleDeg = signed_degree_diff(
    greenwich_apparent_sidereal_time_deg(utc) + longitudeDeg,
    rightAscensionDeg,
  )
  const altitudeDeg = asin_deg(
    sin_deg(latitudeDeg) * sin_deg(declinationDeg) +
      cos_deg(latitudeDeg) * cos_deg(declinationDeg) * cos_deg(hourAngleDeg),
  )
  const azimuthDeg = (0, number_1.mod)(
    atan2_deg(
      sin_deg(hourAngleDeg),
      cos_deg(hourAngleDeg) * sin_deg(latitudeDeg) - tan_deg(declinationDeg) * cos_deg(latitudeDeg),
    ) + 180,
    360,
  )
  return { altitudeDeg, azimuthDeg, hourAngleDeg }
}
function jde_to_utc(jde) {
  let utc = (jde - 2440587.5) * time_1.DAY
  for (let i = 0; i < 3; i++) {
    utc = (jde - 2440587.5) * time_1.DAY - delta_t_sec(utc) * 1000
  }
  return Math.round(utc)
}
//# sourceMappingURL=astro-math.js.map
