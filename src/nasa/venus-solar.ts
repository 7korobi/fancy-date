import type { BodyProfile, PLANET, ROTATION, STAR } from '../orbital-model'
import { placePlanet } from '../orbital-model'
import { mod } from '../number'
import { PlanetarySolarEventModel } from './planetary-solar'

export type VenusSolarOrbitalOptions = {
  periodMsec?: number
  epochMsec?: number
  body?: BodyProfile
}

export class VenusSolarOrbital extends PlanetarySolarEventModel {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = 10087251840
  static readonly meanSiderealDayMsec = -20997360000
  static readonly rotationEpochMsec = 0
  static readonly axialTiltDeg = -2.64
  static readonly meanTropicalYearMsec = 19414456423
  static readonly vernalEquinoxEpochMsec = Date.UTC(2019, 2, 21, 6, 58)

  constructor({
    periodMsec = VenusSolarOrbital.meanTropicalYearMsec,
    epochMsec = VenusSolarOrbital.vernalEquinoxEpochMsec,
  }: VenusSolarOrbitalOptions = {}) {
    super({
      periodMsec,
      epochMsec,
      dayMsec: VenusSolarOrbital.meanSolarDayMsec,
      siderealDayMsec: VenusSolarOrbital.meanSiderealDayMsec,
      rotationEpochMsec: VenusSolarOrbital.rotationEpochMsec,
      axialTiltDeg: VenusSolarOrbital.axialTiltDeg,
    })
  }

  static rotation(): ROTATION {
    return [
      VenusSolarOrbital.meanSolarDayMsec,
      VenusSolarOrbital.rotationEpochMsec,
      VenusSolarOrbital.axialTiltDeg,
    ]
  }

  static planet(
    center: STAR = VenusSolarOrbital.sun,
    options: VenusSolarOrbitalOptions = {},
  ): PLANET {
    const { body, ...orbitalOptions } = options
    return placePlanet({
      body,
      center,
      orbital: new VenusSolarOrbital(orbitalOptions),
      rotation: VenusSolarOrbital.rotation(),
    })
  }

  solarLongitudeDeg(utc: number) {
    return mod(((utc - this.epochMsec) / this.periodMsec) * 360, 360)
  }
}
