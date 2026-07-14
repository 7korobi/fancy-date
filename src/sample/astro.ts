import type { BodyProfile, PLANET, SATELLITE, SPOT, STAR } from '../fancy-date'
import { MEAN_ASTRONOMY } from '../astronomy-data'
import { placeStar, transformOrbital } from '../fancy-date'
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

export const 太陽: STAR = placeStar(MEAN_ASTRONOMY.Sun.body)

export const 天文水星: PLANET = MercurySolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Mercury.body,
})
export const 天文地球: PLANET = EarthSolarOrbital.planet(太陽, { body: MEAN_ASTRONOMY.Earth.body })
export const 天文金星: PLANET = VenusSolarOrbital.planet(太陽, { body: MEAN_ASTRONOMY.Venus.body })
export const 天文火星: PLANET = MarsSolarOrbital.planet(太陽, { body: MEAN_ASTRONOMY.Mars.body })
export const 天文木星: PLANET = JupiterSolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Jupiter.body,
})
export const 天文土星: PLANET = SaturnSolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Saturn.body,
})
export const 天文天王星: PLANET = UranusSolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Uranus.body,
})
export const 天文海王星: PLANET = NeptuneSolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Neptune.body,
})
export const 天文冥王星: PLANET = PlutoSolarOrbital.planet(太陽, {
  body: MEAN_ASTRONOMY.Pluto.body,
})

export const 地球: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Earth)
export const 水星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Mercury)
export const 金星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Venus)
export const 火星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Mars)
export const 木星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Jupiter)
export const 土星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Saturn)
export const 天王星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Uranus)
export const 海王星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Neptune)
export const 冥王星: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Pluto)
export const セレス: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Ceres)
export const ハウメア: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Haumea)
export const マケマケ: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Makemake)
export const エリス: PLANET = placeMeanPlanet(太陽, MEAN_ASTRONOMY.Eris)

const 太歳本体: BodyProfile = { kind: 'virtual', name: '太歳', derivedFrom: 木星 }
const 太歳軌道 = transformOrbital(MEAN_ASTRONOMY.Jupiter.orbital, { direction: -1 })
export const 太歳: PLANET = placeMeanPlanet(太陽, {
  body: 太歳本体,
  orbital: 太歳軌道,
  rotation: MEAN_ASTRONOMY.Jupiter.rotation,
})
Object.defineProperties(太歳, {
  本体: { value: 太歳本体 },
  軌道: { value: 太歳軌道 },
  自転: { value: MEAN_ASTRONOMY.Jupiter.rotation },
})

export const 天文月: SATELLITE = EarthMoonOrbital.satellite(天文地球, {
  body: MEAN_ASTRONOMY.Moon.body,
})
export const 月: SATELLITE = placeMeanSatellite(地球, MEAN_ASTRONOMY.Moon)
export const 白分月: SATELLITE = 月

export const 黒分月軌道 = transformOrbital(MEAN_ASTRONOMY.Moon.whiteOrbital, { phaseOffset: 0.5 })
export const 黒分月: SATELLITE = placeMeanSatellite(地球, {
  body: MEAN_ASTRONOMY.Moon.body,
  orbital: 黒分月軌道,
  rotation: MEAN_ASTRONOMY.Moon.rotation,
})

export const ガニメデ: SATELLITE = placeMeanSatellite(木星, MEAN_ASTRONOMY.Ganymede)
export const カリスト: SATELLITE = placeMeanSatellite(木星, MEAN_ASTRONOMY.Callisto)
export const タイタン: SATELLITE = placeMeanSatellite(土星, MEAN_ASTRONOMY.Titan)
export const チタニア: SATELLITE = placeMeanSatellite(天王星, MEAN_ASTRONOMY.Titania)
export const トリトン: SATELLITE = placeMeanSatellite(海王星, MEAN_ASTRONOMY.Triton)

export const ナマカ: SATELLITE = placeMeanSatellite(ハウメア, MEAN_ASTRONOMY.Namaka)
export const ヒイアカ: SATELLITE = placeMeanSatellite(ハウメア, MEAN_ASTRONOMY.Hiiaka)
export const カロン: SATELLITE = placeMeanSatellite(冥王星, MEAN_ASTRONOMY.Charon)
export const ディスノミア: SATELLITE = placeMeanSatellite(エリス, MEAN_ASTRONOMY.Dysnomia)

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
