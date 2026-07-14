import type { BodyProfile, ERA, ORBITAL, PLANET, ROTATION, SATELLITE, STAR } from './fancy-date'
import { placePlanet, placeSatellite } from './fancy-date'

export type PlanetAstronomyEntry = {
  readonly 本体: BodyProfile
  readonly 軌道: ORBITAL
  readonly 自転: ROTATION
}

export type PlanetAstronomySource =
  | PlanetAstronomyEntry
  | {
      readonly body: BodyProfile
      readonly orbital: ORBITAL
      readonly rotation: ROTATION
    }

export type SatelliteAstronomyEntry = {
  readonly 本体: BodyProfile
  readonly 軌道: ORBITAL
  readonly 自転?: ROTATION
}

export type SatelliteAstronomySource =
  | SatelliteAstronomyEntry
  | {
      readonly body: BodyProfile
      readonly orbital: ORBITAL
      readonly rotation?: ROTATION
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

export function placeMeanPlanet(center: STAR, source: PlanetAstronomySource): PLANET {
  const body = 'body' in source ? source.body : source.本体
  const orbital = 'body' in source ? source.orbital : source.軌道
  const rotation = 'body' in source ? source.rotation : source.自転
  return placePlanet({ body, center, orbital, rotation })
}

export function placeMeanSatellite(center: PLANET, source: SatelliteAstronomySource): SATELLITE {
  const body = 'body' in source ? source.body : source.本体
  const orbital = 'body' in source ? source.orbital : source.軌道
  const rotation = 'body' in source ? source.rotation : source.自転
  return placeSatellite({ body, center, orbital, rotation })
}
