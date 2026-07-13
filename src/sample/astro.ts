import type { BodyProfile, PLANET, SATELLITE, SPOT, STAR } from '../fancy-date'
import { placeStar, transformOrbital } from '../fancy-date'
import { MarsSolarOrbital, VenusSolarOrbital } from '../nasa'
import { EarthMoonOrbital, EarthSolarOrbital } from '../naoj'
import { placeMeanPlanet, placeMeanSatellite } from '../preset'

export const 天文 = (function () {
  const 平均 = {
    太陽: {
      本体: { kind: 'physical', name: 'Sun', radiusKm: 695700 } as BodyProfile,
    },
    水星: {
      本体: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 } as BodyProfile,
      軌道: [7596288000, 1553119080000] as const, // 太陽年 2019/03/21 06:58
      自転: [15192576000, 0, 0.01] as const, // 太陽日
    },
    金星: {
      本体: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 } as BodyProfile,
      軌道: [19414456423, 1553119080000] as const, // 公転周期 2019/03/21 06:58
      自転: [10087251840, 0, -2.64] as const, // 太陽日
    },
    地球: {
      本体: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 } as BodyProfile,
      軌道: [31556925147, 1553119080000] as const, // 2019/03/21 06:58
      自転: [86400000, 0, 23.4397] as const, // LOD ではなく、暦上の1日。Unix epoch では閏秒を消し去るため。
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
      本体: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 } as BodyProfile,
      軌道: [59355616881, 1540684800000] as const, // 公転周期 UTC 2018/10/28 00:00
      自転: [88740035, 0, 25.19] as const, // 自転周期 24時間39分35秒。
    },
    木星: {
      本体: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 } as BodyProfile,
      軌道: [374322050280, 1553119080000] as const, // 公転周期 2019/03/21 06:58
      自転: [35769600, 0, 3.12] as const,
    },
    土星: {
      本体: { kind: 'physical', name: 'Saturn', radiusKm: 58232 } as BodyProfile,
      軌道: [931964092416, 1553119080000] as const, // 公転周期 2019/03/21 06:58
      自転: [37920035, 0, 25.33] as const,
    },
    タイタン: {
      本体: { kind: 'physical', name: 'Titan' } as BodyProfile,
      軌道: [1377684374, 0] as const,
    },
    天王星: {
      本体: { kind: 'physical', name: 'Uranus', radiusKm: 25362 } as BodyProfile,
      軌道: [2658822788376, 1553119080000] as const, // 公転周期 2019/03/21 06:58
      自転: [62061120, 0, -82.23] as const,
    },
    チタニア: {
      本体: { kind: 'physical', name: 'Titania' } as BodyProfile,
      軌道: [752198400, 0] as const,
    },
    海王星: {
      本体: { kind: 'physical', name: 'Neptune', radiusKm: 24622 } as BodyProfile,
      軌道: [5200376904000, 1553119080000] as const, // 公転周期 2019/03/21 06:58
      自転: [64800000, 0, 28.32] as const,
    },
    トリトン: {
      本体: { kind: 'physical', name: 'Triton' } as BodyProfile,
      軌道: [507733056, 0] as const,
    },
    冥王星: {
      本体: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 } as BodyProfile,
      軌道: [7818100727754, 0] as const,
      自転: [551856672, 0, -60.41] as const,
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

export const 太陽: STAR = placeStar(天文.太陽.本体)

export const 天文地球: PLANET = EarthSolarOrbital.planet(太陽, { body: 天文.地球.本体 })
export const 天文金星: PLANET = VenusSolarOrbital.planet(太陽, { body: 天文.金星.本体 })
export const 天文火星: PLANET = MarsSolarOrbital.planet(太陽, { body: 天文.火星.本体 })

export const 地球: PLANET = placeMeanPlanet(太陽, 天文.地球)
export const 水星: PLANET = placeMeanPlanet(太陽, 天文.水星)
export const 金星: PLANET = placeMeanPlanet(太陽, 天文.金星)
export const 火星: PLANET = placeMeanPlanet(太陽, 天文.火星)
export const 木星: PLANET = placeMeanPlanet(太陽, 天文.木星)
export const 土星: PLANET = placeMeanPlanet(太陽, 天文.土星)
export const 天王星: PLANET = placeMeanPlanet(太陽, 天文.天王星)
export const 海王星: PLANET = placeMeanPlanet(太陽, 天文.海王星)
export const 冥王星: PLANET = placeMeanPlanet(太陽, 天文.冥王星)
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
