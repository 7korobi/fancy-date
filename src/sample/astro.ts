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

export const 天文 = (function () {
  // 平均天体データは理科年表由来として扱う。旧コードに版情報が残っていないため、
  // 出典・未確定点は docs/astronomy-sources.md にまとめる。
  const 平均 = {
    太陽: {
      本体: MEAN_ASTRONOMY.Sun.body,
    },
    水星: {
      本体: MEAN_ASTRONOMY.Mercury.body,
      軌道: MEAN_ASTRONOMY.Mercury.orbital,
      自転: MEAN_ASTRONOMY.Mercury.rotation,
    },
    金星: {
      本体: MEAN_ASTRONOMY.Venus.body,
      軌道: MEAN_ASTRONOMY.Venus.orbital,
      自転: MEAN_ASTRONOMY.Venus.rotation,
    },
    地球: {
      本体: MEAN_ASTRONOMY.Earth.body,
      軌道: MEAN_ASTRONOMY.Earth.orbital,
      自転: MEAN_ASTRONOMY.Earth.rotation,
    },
    月: {
      本体: {
        kind: 'physical',
        name: 'Moon',
        radiusKm: 1737.4,
        meanDistanceKm: 384400,
      } as BodyProfile,
      軌道: [2551442889, 1577310360000] as const, // 2019/12/26 06:46
      白分軌道: [2551442889, 1577310360000] as const,
      自転: [2551442889, 0, 6.68] as const,
    },
    ガニメデ: {
      本体: { kind: 'physical', name: 'Ganymede' } as BodyProfile,
      軌道: [618192000, 0] as const,
    },
    カリスト: {
      本体: { kind: 'physical', name: 'Callisto' } as BodyProfile,
      軌道: [1441929600, 0] as const,
    },
    火星: {
      本体: MEAN_ASTRONOMY.Mars.body,
      軌道: MEAN_ASTRONOMY.Mars.orbital,
      自転: MEAN_ASTRONOMY.Mars.rotation,
    },
    木星: {
      本体: MEAN_ASTRONOMY.Jupiter.body,
      軌道: MEAN_ASTRONOMY.Jupiter.orbital,
      自転: MEAN_ASTRONOMY.Jupiter.rotation,
    },
    土星: {
      本体: MEAN_ASTRONOMY.Saturn.body,
      軌道: MEAN_ASTRONOMY.Saturn.orbital,
      自転: MEAN_ASTRONOMY.Saturn.rotation,
    },
    タイタン: {
      本体: { kind: 'physical', name: 'Titan' } as BodyProfile,
      軌道: [1377684374, 0] as const,
    },
    天王星: {
      本体: MEAN_ASTRONOMY.Uranus.body,
      軌道: MEAN_ASTRONOMY.Uranus.orbital,
      自転: MEAN_ASTRONOMY.Uranus.rotation,
    },
    チタニア: {
      本体: { kind: 'physical', name: 'Titania' } as BodyProfile,
      軌道: [752198400, 0] as const,
    },
    海王星: {
      本体: MEAN_ASTRONOMY.Neptune.body,
      軌道: MEAN_ASTRONOMY.Neptune.orbital,
      自転: MEAN_ASTRONOMY.Neptune.rotation,
    },
    トリトン: {
      本体: { kind: 'physical', name: 'Triton' } as BodyProfile,
      軌道: [507733056, 0] as const,
    },
    冥王星: {
      本体: MEAN_ASTRONOMY.Pluto.body,
      軌道: MEAN_ASTRONOMY.Pluto.orbital,
      自転: MEAN_ASTRONOMY.Pluto.rotation,
    },
    カロン: {
      本体: { kind: 'physical', name: 'Charon' } as BodyProfile,
      軌道: [551880000, 0] as const,
    },
    セレス: {
      本体: { kind: 'physical', name: 'Ceres', radiusKm: 469.7 } as BodyProfile,
      軌道: [145423814400, 0] as const,
      自転: [32667012, 0, 4] as const,
    },
    ハウメア: {
      本体: { kind: 'physical', name: 'Haumea' } as BodyProfile,
      軌道: [8908394904000, 0] as const,
      自転: [14095440, 0, 0] as const,
    },
    ナマカ: {
      本体: { kind: 'physical', name: 'Namaka' } as BodyProfile,
      軌道: [1579245120, 0] as const,
    },
    ヒイアカ: {
      本体: { kind: 'physical', name: 'Hiiaka' } as BodyProfile,
      軌道: [4273516800, 0] as const,
    },
    マケマケ: {
      本体: { kind: 'physical', name: 'Makemake' } as BodyProfile,
      軌道: [9639268920000, 0] as const,
      自転: [27975600, 0, 0] as const,
    },
    エリス: {
      本体: { kind: 'physical', name: 'Eris' } as BodyProfile,
      軌道: [17610403104000, 0] as const,
      自転: [93240000, 0, 0] as const,
    },
    ディスノミア: {
      本体: { kind: 'physical', name: 'Dysnomia' } as BodyProfile,
      軌道: [1362700800, 0] as const,
    },
  } as const
  const 太歳 = {
    本体: { kind: 'virtual', name: '太歳', derivedFrom: 平均.木星 },
    軌道: transformOrbital(平均.木星.軌道, { direction: -1 }),
    自転: 平均.木星.自転,
  } as const
  return { ...平均, 太歳 }
})()

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
export const セレス: PLANET = placeMeanPlanet(太陽, 天文.セレス)
export const ハウメア: PLANET = placeMeanPlanet(太陽, 天文.ハウメア)
export const マケマケ: PLANET = placeMeanPlanet(太陽, 天文.マケマケ)
export const エリス: PLANET = placeMeanPlanet(太陽, 天文.エリス)
export const 太歳: PLANET = placeMeanPlanet(太陽, 天文.太歳)
Object.defineProperties(太歳, {
  本体: { value: 天文.太歳.本体 },
  軌道: { value: 天文.太歳.軌道 },
  自転: { value: 天文.太歳.自転 },
})

export const 天文月: SATELLITE = EarthMoonOrbital.satellite(天文地球, { body: 天文.月.本体 })
export const 月: SATELLITE = placeMeanSatellite(地球, 天文.月)
export const 白分月: SATELLITE = 月

export const 黒分月軌道 = transformOrbital(天文.月.軌道, { phaseOffset: 0.5 })
export const 黒分月: SATELLITE = placeMeanSatellite(地球, {
  本体: 天文.月.本体,
  軌道: 黒分月軌道,
  自転: 天文.月.自転,
})

export const ガニメデ: SATELLITE = placeMeanSatellite(木星, 天文.ガニメデ)
export const カリスト: SATELLITE = placeMeanSatellite(木星, 天文.カリスト)
export const タイタン: SATELLITE = placeMeanSatellite(土星, 天文.タイタン)
export const チタニア: SATELLITE = placeMeanSatellite(天王星, 天文.チタニア)
export const トリトン: SATELLITE = placeMeanSatellite(海王星, 天文.トリトン)

export const ナマカ: SATELLITE = placeMeanSatellite(ハウメア, 天文.ナマカ)
export const ヒイアカ: SATELLITE = placeMeanSatellite(ハウメア, 天文.ヒイアカ)
export const カロン: SATELLITE = placeMeanSatellite(冥王星, 天文.カロン)
export const ディスノミア: SATELLITE = placeMeanSatellite(エリス, 天文.ディスノミア)

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
