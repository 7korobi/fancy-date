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
import type { KeplerianOrbitalProfile, KeplerianOrbitalOptions } from './keplerian-orbital'
import { KeplerianOrbital } from './keplerian-orbital'
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

export type KeplerianPlanetOptions = {
  body?: BodyProfile
  rotation: ROTATION
} & KeplerianOrbitalOptions

export type KeplerianSatelliteOptions = {
  body?: BodyProfile
  rotation?: ROTATION
} & KeplerianOrbitalOptions

/**
 * ケプラー楕円軌道の創作惑星を配置する。
 * 中心天体（恒星）の周りを楕円軌道で公転する惑星を作る。
 */
export function placeKeplerianPlanet(
  center: STAR,
  profile: KeplerianOrbitalProfile,
  options: KeplerianPlanetOptions,
): PlanetPlacement {
  const { body, rotation, ...orbitalOptions } = options
  return placePlanet({
    body,
    center,
    orbital: new KeplerianOrbital(profile, orbitalOptions),
    rotation,
  })
}

/**
 * ケプラー楕円軌道の創作衛星を配置する。
 * 中心天体（惑星）の周りを楕円軌道で公転する衛星を作る。
 */
export function placeKeplerianSatellite(
  center: PLANET,
  profile: KeplerianOrbitalProfile,
  options: KeplerianSatelliteOptions = {},
): SatellitePlacement {
  const { body, rotation, ...orbitalOptions } = options
  return placeSatellite({
    body,
    center,
    orbital: new KeplerianOrbital(profile, orbitalOptions),
    rotation,
  })
}

function hasOrbitalTransform({ direction, epochMsec, phaseOffset }: OrbitalTransformOptions) {
  return direction != null || epochMsec != null || phaseOffset != null
}
