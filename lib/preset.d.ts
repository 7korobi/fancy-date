import type { BodyProfile, ERA, ORBITAL, PLANET, ROTATION, SATELLITE, STAR } from './fancy-date'
export type PlanetAstronomyEntry = {
  readonly 本体: BodyProfile
  readonly 軌道: ORBITAL
  readonly 自転: ROTATION
}
export type SatelliteAstronomyEntry = {
  readonly 本体: BodyProfile
  readonly 軌道: ORBITAL
  readonly 自転?: ROTATION
}
export declare function make元号(
  source: readonly ERA[],
  base: readonly ERA[],
  target: string,
): readonly ERA[]
export declare function placeMeanPlanet(
  center: STAR,
  { 本体, 軌道, 自転 }: PlanetAstronomyEntry,
): PLANET
export declare function placeMeanSatellite(
  center: PLANET,
  { 本体, 軌道, 自転 }: SatelliteAstronomyEntry,
): SATELLITE
