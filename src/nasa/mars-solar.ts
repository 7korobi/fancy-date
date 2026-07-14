import type { PLANET, ROTATION, STAR } from '../orbital-model'
import { placePlanet } from '../orbital-model'
import { meanOrbitalOptionsOf, type MeanOrbitalInput } from '../astronomy-data'
import { mod } from '../number'
import { PlanetarySolarEventModel } from './planetary-solar'

export type MarsSolarOrbitalOptions = MeanOrbitalInput

const MSEC_PER_DAY = 86400000

export class MarsSolarOrbital extends PlanetarySolarEventModel {
  static readonly sun: STAR = [null, null, null]
  static readonly meanSolarDayMsec = 88775244
  static readonly meanSiderealDayMsec = 88642663
  static readonly rotationEpochMsec = 0
  static readonly axialTiltDeg = 25.19
  static readonly meanTropicalYearMsec = 59355072000
  static readonly vernalEquinoxEpochMsec = Date.UTC(2018, 4, 22, 13, 54)

  constructor(options: MarsSolarOrbitalOptions = {}) {
    const {
      periodMsec = MarsSolarOrbital.meanTropicalYearMsec,
      epochMsec = MarsSolarOrbital.vernalEquinoxEpochMsec,
    } = meanOrbitalOptionsOf(options)
    super({
      periodMsec,
      epochMsec,
      dayMsec: MarsSolarOrbital.meanSolarDayMsec,
      siderealDayMsec: MarsSolarOrbital.meanSiderealDayMsec,
      rotationEpochMsec: MarsSolarOrbital.rotationEpochMsec,
      axialTiltDeg: MarsSolarOrbital.axialTiltDeg,
    })
  }

  static rotation(): ROTATION {
    return [
      MarsSolarOrbital.meanSolarDayMsec,
      MarsSolarOrbital.rotationEpochMsec,
      MarsSolarOrbital.axialTiltDeg,
    ]
  }

  static planet(
    center: STAR = MarsSolarOrbital.sun,
    options: MarsSolarOrbitalOptions = {},
  ): PLANET {
    const { body } = meanOrbitalOptionsOf(options)
    return placePlanet({
      body,
      center,
      orbital: new MarsSolarOrbital(options),
      rotation: MarsSolarOrbital.rotation(),
    })
  }

  solarLongitudeDeg(utc: number) {
    const days = (utc - Date.UTC(2000, 0, 6, 0, 0)) / MSEC_PER_DAY
    const meanAnomalyDeg = mod(19.387 + 0.52402075 * days, 360)
    const alphaFmsDeg = mod(270.3863 + 0.5240384 * days, 360)
    const pbsDeg =
      0.0071 * cosDeg((0.985626 * days) / 2.2353 + 49.409) +
      0.0057 * cosDeg((0.985626 * days) / 2.7543 + 168.173) +
      0.0039 * cosDeg((0.985626 * days) / 1.1177 + 191.837) +
      0.0037 * cosDeg((0.985626 * days) / 15.7866 + 21.736) +
      0.0021 * cosDeg((0.985626 * days) / 2.1354 + 15.704) +
      0.002 * cosDeg((0.985626 * days) / 2.4694 + 95.528) +
      0.0018 * cosDeg((0.985626 * days) / 32.8493 + 49.095)
    const equationOfCenterDeg =
      (10.691 + 3e-7 * days) * sinDeg(meanAnomalyDeg) +
      0.623 * sinDeg(2 * meanAnomalyDeg) +
      0.05 * sinDeg(3 * meanAnomalyDeg) +
      0.005 * sinDeg(4 * meanAnomalyDeg) +
      0.0005 * sinDeg(5 * meanAnomalyDeg) +
      pbsDeg
    return mod(alphaFmsDeg + equationOfCenterDeg, 360)
  }
}

function sinDeg(deg: number) {
  return Math.sin((Math.PI * deg) / 180)
}

function cosDeg(deg: number) {
  return Math.cos((Math.PI * deg) / 180)
}
