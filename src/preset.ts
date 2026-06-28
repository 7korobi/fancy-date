import type { BodyProfile, ERA, ORBITAL, PLANET, ROTATION, SATELLITE, STAR } from './fancy-date'
import { placePlanet, placeSatellite } from './fancy-date'

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

export function make元号(
  source: readonly ERA[],
  base: readonly ERA[],
  target: string,
): readonly ERA[] {
  const replace: Record<string, ERA> = {}
  source.forEach(([name, start, side]) => {
    if (side && side.includes(target)) {
      replace[name] = [name, start, side]
    }
  })
  return base.map(([name, start, side]) => [name, replace[name]?.[1] ?? start, side])
}

export function placeMeanPlanet(center: STAR, { 本体, 軌道, 自転 }: PlanetAstronomyEntry): PLANET {
  return placePlanet({ body: 本体, center, orbital: 軌道, rotation: 自転 })
}

export function placeMeanSatellite(
  center: PLANET,
  { 本体, 軌道, 自転 }: SatelliteAstronomyEntry,
): SATELLITE {
  return placeSatellite({ body: 本体, center, orbital: 軌道, rotation: 自転 })
}
