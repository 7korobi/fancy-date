import type { OrbitalModel, RotationModel, SKY_BODY, SPOT, TIMEZONE } from './orbital-model'
import { resolveSkyBody } from './orbital-model'
import { MeanOrbital, MeanRotation } from './mean'

export type PreparedSpotModels = {
  sunny: OrbitalModel
  moony?: OrbitalModel
  earthy: RotationModel
}

export type PreparedSpot = PreparedSpotModels & {
  geo: TIMEZONE
}

export function prepareSpotModels(body: SKY_BODY): PreparedSpotModels {
  const { planetaryOrbital, planetaryRotation, satelliteOrbital } = resolveSkyBody(body)
  return {
    sunny: MeanOrbital.from(planetaryOrbital),
    moony: satelliteOrbital ? MeanOrbital.from(satelliteOrbital) : undefined,
    earthy: MeanRotation.from(planetaryRotation),
  }
}

export function prepareSpot(...spot: SPOT): PreparedSpot {
  const [body, ...geo] = spot
  return {
    ...prepareSpotModels(body),
    geo,
  }
}
