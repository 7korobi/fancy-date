import type { BodyProfile, PLANET, SATELLITE, SPOT, STAR } from '../fancy-date'
import {
  MEAN_CALLISTO,
  MEAN_CERES,
  MEAN_CHARON,
  MEAN_DYSNOMIA,
  MEAN_EARTH,
  MEAN_ERIS,
  MEAN_GANYMEDE,
  MEAN_HAUMEA,
  MEAN_HIIAKA,
  MEAN_JUPITER,
  MEAN_MAKEMAKE,
  MEAN_MARS,
  MEAN_MERCURY,
  MEAN_MOON,
  MEAN_NAMAKA,
  MEAN_NEPTUNE,
  MEAN_PLUTO,
  MEAN_SATURN,
  MEAN_SUN,
  MEAN_TITAN,
  MEAN_TITANIA,
  MEAN_TRITON,
  MEAN_URANUS,
  MEAN_VENUS,
} from '../astronomy-data'
import { placeStar } from '../fancy-date'
import {
  JupiterSolarOrbital,
  MarsSolarOrbital,
  MercurySolarOrbital,
  NeptuneSolarOrbital,
  PlutoSolarOrbital,
  SaturnSolarOrbital,
  UranusSolarOrbital,
  VenusSolarOrbital,
} from '../nasa'
import { EarthMoonOrbital, EarthSolarOrbital } from '../naoj'
import { placeMeanPlanet, placeMeanSatellite } from '../preset'

export const 太陽: STAR = placeStar(MEAN_SUN.body)

export const 天文水星: PLANET = MercurySolarOrbital.planet(太陽, MEAN_MERCURY)
export const 天文地球: PLANET = EarthSolarOrbital.planet(太陽, { body: MEAN_EARTH.body })
export const 天文金星: PLANET = VenusSolarOrbital.planet(太陽, MEAN_VENUS)
export const 天文火星: PLANET = MarsSolarOrbital.planet(太陽, { body: MEAN_MARS.body })
export const 天文木星: PLANET = JupiterSolarOrbital.planet(太陽, MEAN_JUPITER)
export const 天文土星: PLANET = SaturnSolarOrbital.planet(太陽, MEAN_SATURN)
export const 天文天王星: PLANET = UranusSolarOrbital.planet(太陽, MEAN_URANUS)
export const 天文海王星: PLANET = NeptuneSolarOrbital.planet(太陽, MEAN_NEPTUNE)
export const 天文冥王星: PLANET = PlutoSolarOrbital.planet(太陽, MEAN_PLUTO)

export const 地球: PLANET = placeMeanPlanet(太陽, MEAN_EARTH)
export const 水星: PLANET = placeMeanPlanet(太陽, MEAN_MERCURY)
export const 金星: PLANET = placeMeanPlanet(太陽, MEAN_VENUS)
export const 火星: PLANET = placeMeanPlanet(太陽, MEAN_MARS)
export const 木星: PLANET = placeMeanPlanet(太陽, MEAN_JUPITER)
export const 土星: PLANET = placeMeanPlanet(太陽, MEAN_SATURN)
export const 天王星: PLANET = placeMeanPlanet(太陽, MEAN_URANUS)
export const 海王星: PLANET = placeMeanPlanet(太陽, MEAN_NEPTUNE)
export const 冥王星: PLANET = placeMeanPlanet(太陽, MEAN_PLUTO)
export const セレス: PLANET = placeMeanPlanet(太陽, MEAN_CERES)
export const ハウメア: PLANET = placeMeanPlanet(太陽, MEAN_HAUMEA)
export const マケマケ: PLANET = placeMeanPlanet(太陽, MEAN_MAKEMAKE)
export const エリス: PLANET = placeMeanPlanet(太陽, MEAN_ERIS)

const 太歳本体: BodyProfile = { kind: 'virtual', name: '太歳', derivedFrom: 木星 }
const 太歳配置 = placeMeanPlanet(太陽, { ...MEAN_JUPITER, body: 太歳本体 }, { direction: -1 })
export const 太歳: PLANET = 太歳配置
Object.defineProperties(太歳, {
  本体: { value: 太歳本体 },
  軌道: { value: 太歳配置.orbital },
  自転: { value: MEAN_JUPITER.solarDay },
})

export const 天文月: SATELLITE = EarthMoonOrbital.satellite(天文地球, {
  body: MEAN_MOON.body,
})
export const 月: SATELLITE = placeMeanSatellite(地球, MEAN_MOON)
export const 白分月: SATELLITE = 月

const 黒分月配置 = placeMeanSatellite(地球, MEAN_MOON, { phaseOffset: 0.5 })
export const 黒分月軌道 = 黒分月配置.orbital
export const 黒分月: SATELLITE = 黒分月配置

export const ガニメデ: SATELLITE = placeMeanSatellite(木星, MEAN_GANYMEDE)
export const カリスト: SATELLITE = placeMeanSatellite(木星, MEAN_CALLISTO)
export const タイタン: SATELLITE = placeMeanSatellite(土星, MEAN_TITAN)
export const チタニア: SATELLITE = placeMeanSatellite(天王星, MEAN_TITANIA)
export const トリトン: SATELLITE = placeMeanSatellite(海王星, MEAN_TRITON)

export const ナマカ: SATELLITE = placeMeanSatellite(ハウメア, MEAN_NAMAKA)
export const ヒイアカ: SATELLITE = placeMeanSatellite(ハウメア, MEAN_HIIAKA)
export const カロン: SATELLITE = placeMeanSatellite(冥王星, MEAN_CHARON)
export const ディスノミア: SATELLITE = placeMeanSatellite(エリス, MEAN_DYSNOMIA)

export const 東京: SPOT = [月, 35.7, 139.8, 15 * +9] as const
export const 天文東京: SPOT = [天文月, 35.7, 139.8, 15 * +9] as const
export const zürich: SPOT = [月, 47.3, 8.5, 15 * +1] as const
export const Paris: SPOT = [月, 48.9, 2.4, 15 * 0] as const
export const Romus: SPOT = [月, 42.0, 12.5, 15 * +1] as const
export const London: SPOT = [月, 51.5, 0.0, 15 * 0] as const
export const Cairo: SPOT = [月, 30.0, 31.2, 15 * +2] as const
export const Alexandria: SPOT = [月, 31.2, 29.9, 15 * +2] as const
export const NewYork: SPOT = [月, 40.3, -74.0, 15 * -5] as const
export const NewYork_Summer: SPOT = [月, 40.3, -74.0, 15 * -4] as const
export const Madurai: SPOT = [白分月, 9.8, 78.1, 15 * +5.5] as const
export const Jaypore: SPOT = [黒分月, 18.8, 82.5, 15 * +5.5] as const
export const Babylon: SPOT = [月, 32.5, 44.4, 15 * +3] as const
export const Istanbul: SPOT = [月, 41.0, 28.9, 15 * +2] as const
