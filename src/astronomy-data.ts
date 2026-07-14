import type { BodyProfile } from './orbital-model'

export type MeanOrbital = readonly [periodMsec: number, epochMsec: number]
export type MeanSolarDay = readonly [periodMsec: number, epochMsec: number, axialTiltDeg: number]

const MSEC_PER_DAY = 86400000
const HOURS_PER_DAY = 24
const MEAN_SYNODIC_MONTH_MSEC = 2551442889
const MEAN_NEW_MOON_EPOCH_MSEC = 1577310360000
const MARS_SEASONAL_YEAR_MSEC = 59355048804
const MARS_SEASON_EPOCH_MSEC = 1540684800000
const MARS24_SOLAR_DAY_MSEC = 88775244

export type MeanOrbitalOptions = {
  periodMsec?: number
  epochMsec?: number
  body?: BodyProfile
}

export type MeanOrbitalSource = {
  body?: BodyProfile
  orbital: MeanOrbital
}

export type MeanPlanetAstronomyEntry = MeanOrbitalSource & {
  body: BodyProfile
  solarDay: MeanSolarDay
}

export type MeanSatelliteAstronomyEntry = MeanOrbitalSource & {
  body: BodyProfile
  solarDay?: MeanSolarDay
}

export type MeanOrbitalInput = MeanOrbitalOptions | MeanOrbitalSource

export function meanOrbitalOptionsOf(options: MeanOrbitalInput): MeanOrbitalOptions {
  if ('orbital' in options) {
    return { body: options.body, periodMsec: options.orbital[0], epochMsec: options.orbital[1] }
  }
  return options
}

function meanSolarDayMsec(siderealDay: number, seasonalYear: number) {
  return Math.round(Math.abs(1 / (1 / siderealDay - 1 / seasonalYear)) * MSEC_PER_DAY)
}

function solarDay(
  siderealDay: number,
  seasonalYear: number,
  epochMsec: number,
  axialTiltDeg: number,
) {
  return [meanSolarDayMsec(siderealDay, seasonalYear), epochMsec, axialTiltDeg] as const
}

// 2019/03/21 06:58 JST
export const MEAN_SEASON_EPOCH_MSEC = 1553119080000

// `orbital` は、その天体上の観測者が春分を迎える平均季節年の周期。
// 水星・金星・火星・土星・天王星・海王星は JPL SSD の平均黄経変化率から換算する:
//   periodDays = 360 / meanLongitudeDegPerCentury * 36525
// 冥王星は JPL SBDB の 134340 Pluto の osculating period を使う。
// `solarDay` は物理恒星自転周期ではなく、地方太陽時の南中から次の南中までの平均周期:
//   solarDay = abs(1 / (1 / signedSiderealRotation - 1 / seasonalYear))
// 実装値は Date/Tempo 系で扱いやすいよう、上式の結果を最も近い 1ms へ丸める。
// 地球は暦上の1日として 86400000ms に固定する。
// 月は暦・月相計算用に、朔望月を月面上の太陽日として扱う。

export const MEAN_SUN = {
  body: { kind: 'physical', name: 'Sun', radiusKm: 695700 } as BodyProfile,
} as const

export const MEAN_MERCURY = {
  body: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 } as BodyProfile,
  orbital: [7600543757, MEAN_SEASON_EPOCH_MSEC] as const, // 87.969256d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(58.646225, 87.969349, 0, 0.01), // 175.938629d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_VENUS = {
  body: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 } as BodyProfile,
  orbital: [19414149221, MEAN_SEASON_EPOCH_MSEC] as const, // 224.700801d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(-243.025, 224.700799, 0, -2.64), // 116.751977d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_EARTH = {
  body: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 } as BodyProfile,
  orbital: [31556925147, MEAN_SEASON_EPOCH_MSEC] as const, // 365.242189d; epoch 2019/03/21 06:58 JST
  solarDay: [MSEC_PER_DAY, 0, 23.4397] as const, // 1d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_MOON = {
  body: {
    kind: 'physical',
    name: 'Moon',
    radiusKm: 1737.4,
    meanDistanceKm: 384400,
  } as BodyProfile,
  orbital: [MEAN_SYNODIC_MONTH_MSEC, MEAN_NEW_MOON_EPOCH_MSEC] as const, // 29.530589d; epoch 2019/12/26 06:46 JST
  whiteOrbital: [MEAN_SYNODIC_MONTH_MSEC, MEAN_NEW_MOON_EPOCH_MSEC] as const, // 29.530589d; epoch 2019/12/26 06:46 JST
  solarDay: [MEAN_SYNODIC_MONTH_MSEC, 0, 6.68] as const, // 29.530589d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry & { whiteOrbital: MeanOrbital }

export const MEAN_MARS = {
  body: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 } as BodyProfile,
  orbital: [MARS_SEASONAL_YEAR_MSEC, MARS_SEASON_EPOCH_MSEC] as const, // 686.979732d; epoch 2018/10/28 00:00 UTC
  solarDay: [MARS24_SOLAR_DAY_MSEC, 0, 25.19] as const, // 1.027491d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_JUPITER = {
  body: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 } as BodyProfile,
  orbital: [374355399818, MEAN_SEASON_EPOCH_MSEC] as const, // 4332.817128d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(9.9259 / HOURS_PER_DAY, 4332.817127523, 0, 3.12), // 0.413619d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_GANYMEDE = {
  body: { kind: 'physical', name: 'Ganymede' } as BodyProfile,
  orbital: [618192000, 0] as const, // 7.155d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_CALLISTO = {
  body: { kind: 'physical', name: 'Callisto' } as BodyProfile,
  orbital: [1441929600, 0] as const, // 16.689d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_SATURN = {
  body: { kind: 'physical', name: 'Saturn', radiusKm: 58232 } as BodyProfile,
  orbital: [929308406642, MEAN_SEASON_EPOCH_MSEC] as const, // 10755.884336d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(10.7 / HOURS_PER_DAY, 10755.884336, 0, 26.73), // 0.445833d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_TITAN = {
  body: { kind: 'physical', name: 'Titan' } as BodyProfile,
  orbital: [1377684374, 0] as const, // 15.945421d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_URANUS = {
  body: { kind: 'physical', name: 'Uranus', radiusKm: 25362 } as BodyProfile,
  orbital: [2651391484727, MEAN_SEASON_EPOCH_MSEC] as const, // 30687.401444d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(-17.24 / HOURS_PER_DAY, 30685.4, 0, -82.23), // 0.718317d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_TITANIA = {
  body: { kind: 'physical', name: 'Titania' } as BodyProfile,
  orbital: [752198400, 0] as const, // 8.706d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_NEPTUNE = {
  body: { kind: 'physical', name: 'Neptune', radiusKm: 24622 } as BodyProfile,
  orbital: [5200386539006, MEAN_SEASON_EPOCH_MSEC] as const, // 60189.659016d; epoch 2019/03/21 06:58 JST
  solarDay: solarDay(16.11 / HOURS_PER_DAY, 60189, 0, 28.32), // 0.671257d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_TRITON = {
  body: { kind: 'physical', name: 'Triton' } as BodyProfile,
  orbital: [507733056, 0] as const, // 5.87654d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_PLUTO = {
  body: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 } as BodyProfile,
  orbital: [7860820303629, 0] as const, // 90981.716477d; epoch 0
  solarDay: solarDay(-6.38723, 90487.277, 0, -60.41), // 6.386779d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_CHARON = {
  body: { kind: 'physical', name: 'Charon' } as BodyProfile,
  orbital: [551880000, 0] as const, // 6.3875d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_CERES = {
  body: { kind: 'physical', name: 'Ceres', radiusKm: 469.7 } as BodyProfile,
  orbital: [145423814400, 0] as const, // 1683.146d; epoch 0
  solarDay: solarDay(9.07417 / HOURS_PER_DAY, 1683.146, 0, 4), // 0.378175d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_HAUMEA = {
  body: { kind: 'physical', name: 'Haumea' } as BodyProfile,
  orbital: [8908394904000, 0] as const, // 103106.4225d; epoch 0
  solarDay: [14095440, 0, 0] as const, // 0.163142d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_NAMAKA = {
  body: { kind: 'physical', name: 'Namaka' } as BodyProfile,
  orbital: [1579245120, 0] as const, // 18.2783d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_HIIAKA = {
  body: { kind: 'physical', name: 'Hiiaka' } as BodyProfile,
  orbital: [4273516800, 0] as const, // 49.462d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_MAKEMAKE = {
  body: { kind: 'physical', name: 'Makemake' } as BodyProfile,
  orbital: [9639268920000, 0] as const, // 111565.6125d; epoch 0
  solarDay: [27975600, 0, 0] as const, // 0.323792d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_ERIS = {
  body: { kind: 'physical', name: 'Eris' } as BodyProfile,
  orbital: [17610403104000, 0] as const, // 203824.11d; epoch 0
  solarDay: [93240000, 0, 0] as const, // 1.079167d; epoch 0
} as const satisfies MeanPlanetAstronomyEntry

export const MEAN_DYSNOMIA = {
  body: { kind: 'physical', name: 'Dysnomia' } as BodyProfile,
  orbital: [1362700800, 0] as const, // 15.772d; epoch 0
} as const satisfies MeanSatelliteAstronomyEntry

export const MEAN_ASTRONOMY = {
  Sun: MEAN_SUN,
  Mercury: MEAN_MERCURY,
  Venus: MEAN_VENUS,
  Earth: MEAN_EARTH,
  Moon: MEAN_MOON,
  Mars: MEAN_MARS,
  Jupiter: MEAN_JUPITER,
  Ganymede: MEAN_GANYMEDE,
  Callisto: MEAN_CALLISTO,
  Saturn: MEAN_SATURN,
  Titan: MEAN_TITAN,
  Uranus: MEAN_URANUS,
  Titania: MEAN_TITANIA,
  Neptune: MEAN_NEPTUNE,
  Triton: MEAN_TRITON,
  Pluto: MEAN_PLUTO,
  Charon: MEAN_CHARON,
  Ceres: MEAN_CERES,
  Haumea: MEAN_HAUMEA,
  Namaka: MEAN_NAMAKA,
  Hiiaka: MEAN_HIIAKA,
  Makemake: MEAN_MAKEMAKE,
  Eris: MEAN_ERIS,
  Dysnomia: MEAN_DYSNOMIA,
} as const
