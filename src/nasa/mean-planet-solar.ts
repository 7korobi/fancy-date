import type { BodyProfile, PLANET, ROTATION, STAR } from '../orbital-model'
import { placePlanet } from '../orbital-model'
import { mod } from '../number'
import { PlanetarySolarEventModel } from './planetary-solar'

export type MeanPlanetSolarOrbitalOptions = {
  periodMsec?: number
  epochMsec?: number
  body?: BodyProfile
}

type MeanPlanetSolarOrbitalProfile = {
  periodMsec: number
  epochMsec: number
  meanSolarDayMsec: number
  siderealDayMsec?: number
  rotationEpochMsec: number
  axialTiltDeg: number
}

type MeanPlanetSolarOrbitalConstructor = new (
  options?: MeanPlanetSolarOrbitalOptions,
) => MeanPlanetSolarOrbital

export abstract class MeanPlanetSolarOrbital extends PlanetarySolarEventModel {
  protected constructor(
    profile: MeanPlanetSolarOrbitalProfile,
    options: MeanPlanetSolarOrbitalOptions = {},
  ) {
    const periodMsec = options.periodMsec ?? profile.periodMsec
    super({
      periodMsec,
      epochMsec: options.epochMsec ?? profile.epochMsec,
      dayMsec: profile.meanSolarDayMsec,
      siderealDayMsec:
        profile.siderealDayMsec ??
        inferSiderealDayMsec(profile.meanSolarDayMsec, periodMsec, profile.axialTiltDeg),
      rotationEpochMsec: profile.rotationEpochMsec,
      axialTiltDeg: profile.axialTiltDeg,
    })
  }

  solarLongitudeDeg(utc: number) {
    return mod(((utc - this.epochMsec) / this.periodMsec) * 360, 360)
  }
}

function rotationOf(profile: MeanPlanetSolarOrbitalProfile): ROTATION {
  return [profile.meanSolarDayMsec, profile.rotationEpochMsec, profile.axialTiltDeg]
}

function planetOf(
  Orbital: MeanPlanetSolarOrbitalConstructor,
  profile: MeanPlanetSolarOrbitalProfile,
  center: STAR,
  options: MeanPlanetSolarOrbitalOptions,
): PLANET {
  const { body, ...orbitalOptions } = options
  return placePlanet({
    body,
    center,
    orbital: new Orbital(orbitalOptions),
    rotation: rotationOf(profile),
  })
}

function inferSiderealDayMsec(meanSolarDayMsec: number, periodMsec: number, axialTiltDeg: number) {
  return axialTiltDeg < 0
    ? -(meanSolarDayMsec * periodMsec) / (periodMsec - meanSolarDayMsec)
    : (meanSolarDayMsec * periodMsec) / (periodMsec + meanSolarDayMsec)
}

function defineProfile(profile: MeanPlanetSolarOrbitalProfile) {
  return profile
}

const MEAN_SEASON_EPOCH_MSEC = Date.UTC(2019, 2, 21, 6, 58)

const MERCURY_PROFILE = defineProfile({
  periodMsec: 7596288000,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 15192576000,
  rotationEpochMsec: 0,
  axialTiltDeg: 0.01,
})

const VENUS_PROFILE = defineProfile({
  periodMsec: 19414456423,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 10087251840,
  siderealDayMsec: -20997360000,
  rotationEpochMsec: 0,
  axialTiltDeg: -2.64,
})

const JUPITER_PROFILE = defineProfile({
  periodMsec: 374322050280,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 35769600,
  rotationEpochMsec: 0,
  axialTiltDeg: 3.12,
})

const SATURN_PROFILE = defineProfile({
  periodMsec: 931964092416,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 37920035,
  rotationEpochMsec: 0,
  axialTiltDeg: 25.33,
})

const URANUS_PROFILE = defineProfile({
  periodMsec: 2658822788376,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 62061120,
  rotationEpochMsec: 0,
  axialTiltDeg: -82.23,
})

const NEPTUNE_PROFILE = defineProfile({
  periodMsec: 5200376904000,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 64800000,
  rotationEpochMsec: 0,
  axialTiltDeg: 28.32,
})

const PLUTO_PROFILE = defineProfile({
  periodMsec: 7818100727754,
  epochMsec: MEAN_SEASON_EPOCH_MSEC,
  meanSolarDayMsec: 551856672,
  rotationEpochMsec: 0,
  axialTiltDeg: -60.41,
})

export type MercurySolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type VenusSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type JupiterSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type SaturnSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type UranusSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type NeptuneSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type PlutoSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions

export class MercurySolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = MERCURY_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    MERCURY_PROFILE.meanSolarDayMsec,
    MERCURY_PROFILE.periodMsec,
    MERCURY_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = MERCURY_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = MERCURY_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = MERCURY_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = MERCURY_PROFILE.epochMsec

  constructor(options: MercurySolarOrbitalOptions = {}) {
    super(MERCURY_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(MERCURY_PROFILE)
  }

  static planet(
    center: STAR = MercurySolarOrbital.sun,
    options: MercurySolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(MercurySolarOrbital, MERCURY_PROFILE, center, options)
  }
}

export class VenusSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = VENUS_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec =
    VENUS_PROFILE.siderealDayMsec ??
    inferSiderealDayMsec(
      VENUS_PROFILE.meanSolarDayMsec,
      VENUS_PROFILE.periodMsec,
      VENUS_PROFILE.axialTiltDeg,
    )
  static readonly rotationEpochMsec = VENUS_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = VENUS_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = VENUS_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = VENUS_PROFILE.epochMsec

  constructor(options: VenusSolarOrbitalOptions = {}) {
    super(VENUS_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(VENUS_PROFILE)
  }

  static planet(
    center: STAR = VenusSolarOrbital.sun,
    options: VenusSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(VenusSolarOrbital, VENUS_PROFILE, center, options)
  }
}

export class JupiterSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = JUPITER_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    JUPITER_PROFILE.meanSolarDayMsec,
    JUPITER_PROFILE.periodMsec,
    JUPITER_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = JUPITER_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = JUPITER_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = JUPITER_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = JUPITER_PROFILE.epochMsec

  constructor(options: JupiterSolarOrbitalOptions = {}) {
    super(JUPITER_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(JUPITER_PROFILE)
  }

  static planet(
    center: STAR = JupiterSolarOrbital.sun,
    options: JupiterSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(JupiterSolarOrbital, JUPITER_PROFILE, center, options)
  }
}

export class SaturnSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = SATURN_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    SATURN_PROFILE.meanSolarDayMsec,
    SATURN_PROFILE.periodMsec,
    SATURN_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = SATURN_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = SATURN_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = SATURN_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = SATURN_PROFILE.epochMsec

  constructor(options: SaturnSolarOrbitalOptions = {}) {
    super(SATURN_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(SATURN_PROFILE)
  }

  static planet(
    center: STAR = SaturnSolarOrbital.sun,
    options: SaturnSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(SaturnSolarOrbital, SATURN_PROFILE, center, options)
  }
}

export class UranusSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = URANUS_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    URANUS_PROFILE.meanSolarDayMsec,
    URANUS_PROFILE.periodMsec,
    URANUS_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = URANUS_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = URANUS_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = URANUS_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = URANUS_PROFILE.epochMsec

  constructor(options: UranusSolarOrbitalOptions = {}) {
    super(URANUS_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(URANUS_PROFILE)
  }

  static planet(
    center: STAR = UranusSolarOrbital.sun,
    options: UranusSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(UranusSolarOrbital, URANUS_PROFILE, center, options)
  }
}

export class NeptuneSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = NEPTUNE_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    NEPTUNE_PROFILE.meanSolarDayMsec,
    NEPTUNE_PROFILE.periodMsec,
    NEPTUNE_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = NEPTUNE_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = NEPTUNE_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = NEPTUNE_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = NEPTUNE_PROFILE.epochMsec

  constructor(options: NeptuneSolarOrbitalOptions = {}) {
    super(NEPTUNE_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(NEPTUNE_PROFILE)
  }

  static planet(
    center: STAR = NeptuneSolarOrbital.sun,
    options: NeptuneSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(NeptuneSolarOrbital, NEPTUNE_PROFILE, center, options)
  }
}

export class PlutoSolarOrbital extends MeanPlanetSolarOrbital {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = PLUTO_PROFILE.meanSolarDayMsec
  static readonly meanSiderealDayMsec = inferSiderealDayMsec(
    PLUTO_PROFILE.meanSolarDayMsec,
    PLUTO_PROFILE.periodMsec,
    PLUTO_PROFILE.axialTiltDeg,
  )
  static readonly rotationEpochMsec = PLUTO_PROFILE.rotationEpochMsec
  static readonly axialTiltDeg = PLUTO_PROFILE.axialTiltDeg
  static readonly meanTropicalYearMsec = PLUTO_PROFILE.periodMsec
  static readonly vernalEquinoxEpochMsec = PLUTO_PROFILE.epochMsec

  constructor(options: PlutoSolarOrbitalOptions = {}) {
    super(PLUTO_PROFILE, options)
  }

  static rotation(): ROTATION {
    return rotationOf(PLUTO_PROFILE)
  }

  static planet(
    center: STAR = PlutoSolarOrbital.sun,
    options: PlutoSolarOrbitalOptions = {},
  ): PLANET {
    return planetOf(PlutoSolarOrbital, PLUTO_PROFILE, center, options)
  }
}
