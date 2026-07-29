import type { PLANET, ROTATION, STAR } from '../orbital-model'
import { placePlanet } from '../orbital-model'
import {
  MEAN_JUPITER,
  MEAN_MERCURY,
  MEAN_NEPTUNE,
  MEAN_PLUTO,
  MEAN_SATURN,
  MEAN_URANUS,
  MEAN_VENUS,
  meanOrbitalOptionsOf,
  type MeanOrbitalInput,
  type MeanPlanetAstronomyEntry,
} from '../astronomy-data'
import { mod } from '../number'
import { PlanetarySolarEventModel } from './planetary-solar'

export type MeanPlanetSolarOrbitalOptions = MeanOrbitalInput

type MeanPlanetSolarOrbitalProfile = {
  periodMsec: number
  epochMsec: number
  meanSolarDayMsec: number
  siderealDayMsec?: number
  rotationEpochMsec: number
  axialTiltDeg: number
}

import type {
  KeplerianElementRates,
  KeplerianElements,
  KeplerianOrbitalProfile,
} from '../keplerian-orbital'
import { KeplerianOrbital } from '../keplerian-orbital'

export type KeplerianSolarOrbitalProfile = MeanPlanetSolarOrbitalProfile &
  Omit<KeplerianOrbitalProfile, 'periodMsec' | 'epochMsec'> & {
    elementRates?: KeplerianElementRates
  }

type MeanPlanetSolarOrbitalConstructor = new (
  options?: MeanPlanetSolarOrbitalOptions,
) => MeanPlanetSolarOrbital

export type MeanPlanetSolarOrbitalPlanetOptions = MeanPlanetSolarOrbitalOptions

export abstract class MeanPlanetSolarOrbital extends PlanetarySolarEventModel {
  protected constructor(
    profile: MeanPlanetSolarOrbitalProfile,
    options: MeanPlanetSolarOrbitalOptions = {},
  ) {
    const { periodMsec = profile.periodMsec, epochMsec = profile.epochMsec } =
      meanOrbitalOptionsOf(options)
    super({
      periodMsec,
      epochMsec,
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

export type KeplerianSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions

export abstract class KeplerianSolarOrbital extends MeanPlanetSolarOrbital {
  private readonly keplerianOrbital: KeplerianOrbital

  protected constructor(
    profile: KeplerianSolarOrbitalProfile,
    options: KeplerianSolarOrbitalOptions = {},
  ) {
    super(profile, options)
    const { periodMsec = profile.periodMsec, epochMsec = profile.epochMsec } =
      meanOrbitalOptionsOf(options)
    this.keplerianOrbital = new KeplerianOrbital(
      {
        periodMsec,
        epochMsec,
        elementEpochJd: profile.elementEpochJd,
        elements: profile.elements,
        elementRates: profile.elementRates,
        anomalyTerms: profile.anomalyTerms,
      },
      { periodMsec, epochMsec },
    )
  }

  phaseAt(utc: number): number {
    return this.keplerianOrbital.phaseAt(utc)
  }

  timeOfPhase(phase: number, near: number): number {
    return this.keplerianOrbital.timeOfPhase(phase, near)
  }

  solarLongitudeDeg(utc: number): number {
    return mod(this.keplerianOrbital.phaseAt(utc) * 360, 360)
  }
}

function rotationOf(profile: MeanPlanetSolarOrbitalProfile): ROTATION {
  return [profile.meanSolarDayMsec, profile.rotationEpochMsec, profile.axialTiltDeg]
}

function planetOf(
  Orbital: MeanPlanetSolarOrbitalConstructor,
  profile: MeanPlanetSolarOrbitalProfile,
  center: STAR,
  options: MeanPlanetSolarOrbitalPlanetOptions,
): PLANET {
  const { body } = meanOrbitalOptionsOf(options)
  return placePlanet({
    body,
    center,
    orbital: new Orbital(options),
    rotation: rotationOf(profile),
  })
}

function inferSiderealDayMsec(meanSolarDayMsec: number, periodMsec: number, axialTiltDeg: number) {
  return axialTiltDeg < 0
    ? -(meanSolarDayMsec * periodMsec) / (periodMsec - meanSolarDayMsec)
    : (meanSolarDayMsec * periodMsec) / (periodMsec + meanSolarDayMsec)
}

function meanProfileOf({
  orbital,
  solarDay,
}: MeanPlanetAstronomyEntry): MeanPlanetSolarOrbitalProfile {
  return {
    periodMsec: orbital[0],
    epochMsec: orbital[1],
    meanSolarDayMsec: solarDay[0],
    rotationEpochMsec: solarDay[1],
    axialTiltDeg: solarDay[2],
  }
}

function defineProfile(profile: MeanPlanetSolarOrbitalProfile) {
  return profile
}

function defineKeplerianProfile(profile: KeplerianSolarOrbitalProfile) {
  return profile
}

// Source notes live in docs/astronomy-sources.md.
// Mercury/Venus use JPL SSD approximate planetary elements; Pluto uses JPL SBDB elements.
const MERCURY_PROFILE = defineKeplerianProfile({
  ...meanProfileOf(MEAN_MERCURY),
  elements: {
    semiMajorAxisAu: 0.38709927,
    eccentricity: 0.20563593,
    inclinationDeg: 7.00497902,
    meanLongitudeDeg: 252.2503235,
    perihelionLongitudeDeg: 77.45779628,
    ascendingNodeLongitudeDeg: 48.33076593,
  },
  elementRates: {
    semiMajorAxisAu: 0.00000037,
    eccentricity: 0.00001906,
    inclinationDeg: -0.00594749,
    meanLongitudeDeg: 149472.67411175,
    perihelionLongitudeDeg: 0.16047689,
    ascendingNodeLongitudeDeg: -0.12534081,
  },
})

const VENUS_PROFILE = defineKeplerianProfile({
  ...meanProfileOf(MEAN_VENUS),
  siderealDayMsec: -20997360000,
  elements: {
    semiMajorAxisAu: 0.72333566,
    eccentricity: 0.00677672,
    inclinationDeg: 3.39467605,
    meanLongitudeDeg: 181.9790995,
    perihelionLongitudeDeg: 131.60246718,
    ascendingNodeLongitudeDeg: 76.67984255,
  },
  elementRates: {
    semiMajorAxisAu: 0.0000039,
    eccentricity: -0.00004107,
    inclinationDeg: -0.0007889,
    meanLongitudeDeg: 58517.81538729,
    perihelionLongitudeDeg: 0.00268329,
    ascendingNodeLongitudeDeg: -0.27769418,
  },
})

const JUPITER_PROFILE = defineProfile(meanProfileOf(MEAN_JUPITER))

const SATURN_PROFILE = defineProfile(meanProfileOf(MEAN_SATURN))

const URANUS_PROFILE = defineProfile(meanProfileOf(MEAN_URANUS))

const NEPTUNE_PROFILE = defineProfile(meanProfileOf(MEAN_NEPTUNE))

const PLUTO_PROFILE = defineKeplerianProfile({
  ...meanProfileOf(MEAN_PLUTO),
  periodMsec: 90981.71647718345 * 86400000,
  elementEpochJd: 2457588.5,
  elements: {
    semiMajorAxisAu: 39.58862938517124,
    eccentricity: 0.2518378778576892,
    inclinationDeg: 17.14771140999114,
    meanLongitudeDeg: 38.68366347318184 + 113.7090015158565 + 110.2923840543057,
    perihelionLongitudeDeg: 113.7090015158565 + 110.2923840543057,
    ascendingNodeLongitudeDeg: 110.2923840543057,
  },
  elementRates: {
    meanLongitudeDeg: 0.003956838955553025 * 36525,
  },
})

export type MercurySolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type VenusSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type JupiterSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type SaturnSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type UranusSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type NeptuneSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions
export type PlutoSolarOrbitalOptions = MeanPlanetSolarOrbitalOptions

export class MercurySolarOrbital extends KeplerianSolarOrbital {
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
  ): PLANET {
    return planetOf(MercurySolarOrbital, MERCURY_PROFILE, center, options)
  }
}

export class VenusSolarOrbital extends KeplerianSolarOrbital {
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
  ): PLANET {
    return planetOf(NeptuneSolarOrbital, NEPTUNE_PROFILE, center, options)
  }
}

export class PlutoSolarOrbital extends KeplerianSolarOrbital {
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
    options: MeanPlanetSolarOrbitalPlanetOptions = {},
  ): PLANET {
    return planetOf(PlutoSolarOrbital, PLUTO_PROFILE, center, options)
  }
}
