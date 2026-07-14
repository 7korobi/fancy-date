import type {
  BodyProfile,
  ERA,
  ORBITAL,
  PLANET,
  OrbitalTransformOptions,
  PlanetPlacement,
  ROTATION,
  SatellitePlacement,
  STAR,
} from './fancy-date'
import { placePlanet, placeSatellite } from './fancy-date'
import { transformOrbital } from './mean'

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
      readonly solarDay: ROTATION
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
      readonly solarDay?: ROTATION
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

export function placeMeanPlanet(
  center: STAR,
  source: PlanetAstronomySource,
  transformOptions: OrbitalTransformOptions = {},
): PlanetPlacement {
  const body = 'body' in source ? source.body : source.本体
  const baseOrbital = 'body' in source ? source.orbital : source.軌道
  const orbital = hasOrbitalTransform(transformOptions)
    ? transformOrbital(baseOrbital, transformOptions)
    : baseOrbital
  const rotation = 'body' in source ? source.solarDay : source.自転
  return placePlanet({ body, center, orbital, rotation })
}

export function placeMeanSatellite(
  center: PLANET,
  source: SatelliteAstronomySource,
  transformOptions: OrbitalTransformOptions = {},
): SatellitePlacement {
  const body = 'body' in source ? source.body : source.本体
  const baseOrbital = 'body' in source ? source.orbital : source.軌道
  const orbital = hasOrbitalTransform(transformOptions)
    ? transformOrbital(baseOrbital, transformOptions)
    : baseOrbital
  const rotation = 'body' in source ? source.solarDay : source.自転
  return placeSatellite({ body, center, orbital, rotation })
}

function hasOrbitalTransform({ direction, epochMsec, phaseOffset }: OrbitalTransformOptions) {
  return direction != null || epochMsec != null || phaseOffset != null
}
