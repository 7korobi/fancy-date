import type {
  LunarPhaseEventModel,
  OrbitalModel,
  RotationModel,
  SKY_BODY,
  SPOT,
  TIMEZONE,
} from './orbital-model'
import {
  bodyProfileOf,
  hasApparentLongitude,
  hasLunarEvents,
  hasLunarPhaseEvents,
  resolveSkyBody,
} from './orbital-model'
import { MeanOrbital, MeanRotation } from './mean'
import { OrbitalLunarEventModel } from './orbital-lunar-events'
import { RelativeLunarPhaseEventModel } from './relative-lunar-phase'

export type PreparedSpotModels = {
  sunny: OrbitalModel
  moony?: OrbitalModel
  lunarPhase?: LunarPhaseEventModel
  earthy: RotationModel
}

export type PreparedSpot = PreparedSpotModels & {
  geo: TIMEZONE
}

export function prepareSpotModels(body: SKY_BODY): PreparedSpotModels {
  const { planet, satellite, planetaryOrbital, planetaryRotation, satelliteOrbital } =
    resolveSkyBody(body)
  const sunny = MeanOrbital.from(planetaryOrbital)
  const earthy = MeanRotation.from(planetaryRotation)
  const sourceMoony = satelliteOrbital ? MeanOrbital.from(satelliteOrbital) : undefined
  const lunarPhase = hasLunarPhaseEvents(sourceMoony)
    ? sourceMoony
    : sourceMoony && hasApparentLongitude(sunny) && hasApparentLongitude(sourceMoony)
      ? new RelativeLunarPhaseEventModel(sunny, sourceMoony)
      : undefined
  const moony =
    sourceMoony && !hasLunarEvents(sourceMoony) && hasApparentLongitude(sourceMoony)
      ? new OrbitalLunarEventModel(sourceMoony, earthy, {
          radiusKm: satellite ? bodyProfileOf(satellite)?.radiusKm : undefined,
          meanDistanceKm: satellite ? bodyProfileOf(satellite)?.meanDistanceKm : undefined,
          centerRadiusKm: bodyProfileOf(planet)?.radiusKm,
        })
      : sourceMoony
  return {
    sunny,
    moony,
    ...(lunarPhase ? { lunarPhase } : {}),
    earthy,
  }
}

export function prepareSpot(...spot: SPOT): PreparedSpot {
  const [body, ...geo] = spot
  return {
    ...prepareSpotModels(body),
    geo,
  }
}
