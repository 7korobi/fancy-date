export type BodyProfile = {
  kind?: 'physical' | 'virtual'
  name?: string
  radiusKm?: number
  meanDistanceKm?: number
  massKg?: number
  albedo?: number
  derivedFrom?: STAR | SKY_BODY
}

export type STAR = readonly [center: null, orbital: null, rotation: null] & {
  body?: BodyProfile
}
export type PLANET_TUPLE = readonly [center: STAR, orbital: ORBITAL, rotation: ROTATION]
export type SATELLITE_TUPLE = readonly [center: PLANET, orbital: ORBITAL, rotation?: ROTATION]
export type PlanetPlacement = PLANET_TUPLE & {
  body?: BodyProfile
  center: STAR
  orbital: ORBITAL
  rotation: ROTATION
}
export type SatellitePlacement = SATELLITE_TUPLE & {
  body?: BodyProfile
  center: PLANET
  orbital: ORBITAL
  rotation?: ROTATION
}
export type PLANET = PLANET_TUPLE | PlanetPlacement
export type SATELLITE = SATELLITE_TUPLE | SatellitePlacement
export type SKY_BODY = PLANET | SATELLITE
export type SPOT = readonly [
  body: SKY_BODY,
  latitudeDeg: number,
  longitudeDeg: number,
  timezoneDeg: number,
]

export type TIMEZONE = readonly [latitudeDeg: number, longitudeDeg: number, timezoneDeg: number]
export type ORBITAL = readonly [periodMsec: number, epochMsec: number] | OrbitalModel
export type ROTATION =
  | readonly [periodMsec: number, epochMsec: number, axialTiltDeg: number]
  | RotationModel

export type PlanetPlacementOptions = {
  body?: BodyProfile
  center: STAR
  orbital: ORBITAL
  rotation: ROTATION
}

export type SatellitePlacementOptions = {
  body?: BodyProfile
  center: PLANET
  orbital: ORBITAL
  rotation?: ROTATION
}

export interface OrbitalModel {
  periodMsec: number
  epochMsec: number
  phaseAt(utc: number): number
  timeOfPhase(phase: number, near: number): number
}

export type OrbitalTransformOptions = {
  phaseOffset?: number
  direction?: 1 | -1
  epochMsec?: number
}

export interface RotationModel {
  periodMsec: number
  epochMsec: number
  axialTiltDeg: number
}

function definePlacementProps<T extends object, P extends object>(target: T, props: P): T & P {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      value,
      writable: false,
    })
  }
  return target as T & P
}

export function placeStar(body?: BodyProfile): STAR {
  return definePlacementProps([null, null, null] as unknown as STAR, { body })
}

export function placePlanet(options: PlanetPlacementOptions): PlanetPlacement {
  const { body, center, orbital, rotation } = options
  return definePlacementProps([center, orbital, rotation] as unknown as PlanetPlacement, {
    body,
    center,
    orbital,
    rotation,
  })
}

export function placeSatellite(options: SatellitePlacementOptions): SatellitePlacement {
  const { body, center, orbital, rotation } = options
  return definePlacementProps([center, orbital, rotation] as unknown as SatellitePlacement, {
    body,
    center,
    orbital,
    rotation,
  })
}

export function isPlanetSkyBody(body: SKY_BODY): body is PLANET {
  return centerOf(body)[0] === null
}

export function centerOf(body: PLANET): STAR
export function centerOf(body: SATELLITE): PLANET
export function centerOf(body: SKY_BODY): STAR | PLANET
export function centerOf(body: SKY_BODY): STAR | PLANET {
  return ('center' in body ? body.center : body[0]) as STAR | PLANET
}

export function orbitalOf(body: SKY_BODY): ORBITAL {
  return ('orbital' in body ? body.orbital : body[1]) as ORBITAL
}

export function rotationOf(body: SKY_BODY): ROTATION | undefined {
  return ('rotation' in body ? body.rotation : body[2]) as ROTATION | undefined
}

export function bodyProfileOf(body: STAR | SKY_BODY): BodyProfile | undefined {
  return (body as { body?: BodyProfile }).body
}

export type SolarObservationOptions = {
  latitudeDeg: number
  longitudeDeg: number
  timezoneDeg?: number
  horizonDeg?: number
  dayStartUtc?: number
  dayCenterUtc?: number
}

export type SolarObservation = {
  K: number
  lat: number
  時角: number
  方向: number
  高度: number
  真夜中: number
  日の出: number
  南中時刻: number
  日の入: number
  日の出方位: number
  日の入方位: number
  南中高度: number
}

export type SolarEquatorialCoordinates = {
  longitudeDeg: number
  rightAscensionDeg: number
  declinationDeg: number
  obliquityDeg: number
}

export type SolarHorizontalCoordinates = SolarEquatorialCoordinates & {
  altitudeDeg: number
  azimuthDeg: number
  hourAngleDeg: number
}

export interface SolarPositionModel extends OrbitalModel {
  solarLongitudeDeg(utc: number): number
  solarEquatorial(utc: number): SolarEquatorialCoordinates
  solarHorizontal(utc: number, latitudeDeg: number, longitudeDeg: number): SolarHorizontalCoordinates
}

export interface SolarEventModel extends SolarPositionModel {
  solarEvents(utc: number, options: SolarObservationOptions): SolarObservation
}

export type LunarObservationOptions = {
  latitudeDeg: number
  longitudeDeg: number
  timezoneDeg?: number
  heightM?: number
  horizonDeg?: number
  dayStartUtc?: number
}

export type LunarObservation = {
  月の出: number
  南中時刻: number
  月の入: number
  月の出方位: number
  月の入方位: number
  南中高度: number
}

export type LunarEquatorialCoordinates = {
  longitudeDeg: number
  latitudeDeg: number
  distanceKm: number
  rightAscensionDeg: number
  declinationDeg: number
  horizontalParallaxDeg: number
  obliquityDeg: number
}

export type LunarHorizontalCoordinates = LunarEquatorialCoordinates & {
  altitudeDeg: number
  azimuthDeg: number
  hourAngleDeg: number
  topocentricRightAscensionDeg: number
  topocentricDeclinationDeg: number
}

export interface LunarPositionModel extends OrbitalModel {
  lunarEquatorial(utc: number): LunarEquatorialCoordinates
  lunarHorizontal(
    utc: number,
    latitudeDeg: number,
    longitudeDeg: number,
    heightM?: number,
  ): LunarHorizontalCoordinates
}

export interface LunarEventModel extends LunarPositionModel {
  lunarEvents(utc: number, options: LunarObservationOptions): LunarObservation
}

export function hasSolarEvents(model: OrbitalModel): model is SolarEventModel {
  return typeof (model as SolarEventModel).solarEvents === 'function'
}

export function hasLunarEvents(model: OrbitalModel | undefined): model is LunarEventModel {
  return typeof (model as LunarEventModel | undefined)?.lunarEvents === 'function'
}
