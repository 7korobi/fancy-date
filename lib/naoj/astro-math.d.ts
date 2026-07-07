import { DAY as MSEC_PER_DAY, MINUTE as MSEC_PER_MINUTE } from '../time'
export declare const DEG_TO_RAD: number
export declare const RAD_TO_DEG: number
export { MSEC_PER_DAY, MSEC_PER_MINUTE }
export declare const EARTH_EQUATORIAL_RADIUS_KM = 6378.14
export declare function signed_degree_diff(a: number, b: number): number
export declare function julian_day(utc: number): number
export declare function utc_year(utc: number): number
export declare function delta_t_sec(utc: number): number
export declare function sin_deg(deg: number): number
export declare function cos_deg(deg: number): number
export declare function tan_deg(deg: number): number
export declare function asin_deg(value: number): number
export declare function acos_deg(value: number): number
export declare function atan2_deg(y: number, x: number): number
export declare function bisect_zero(
  from: number,
  to: number,
  valueAt: (at: number) => number,
  toleranceMsec?: number,
  maxIterations?: number,
): number
export declare function mean_obliquity_deg(jde: number): number
export declare function true_obliquity_deg(jde: number): number
export declare function greenwich_apparent_sidereal_time_deg(utc: number): number
export declare function local_horizontal_from_equatorial(
  utc: number,
  latitudeDeg: number,
  longitudeDeg: number,
  rightAscensionDeg: number,
  declinationDeg: number,
): {
  altitudeDeg: number
  azimuthDeg: number
  hourAngleDeg: number
}
export declare function jde_to_utc(jde: number): number
