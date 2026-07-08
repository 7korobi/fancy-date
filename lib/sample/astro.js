'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Istanbul =
  exports.Babylon =
  exports.Jaypore =
  exports.Madurai =
  exports.NewYork_Summer =
  exports.NewYork =
  exports.Alexandria =
  exports.Cairo =
  exports.London =
  exports.Romus =
  exports.Paris =
  exports.zürich =
  exports.天文東京 =
  exports.東京 =
  exports.ディスノミア =
  exports.カロン =
  exports.ヒイアカ =
  exports.ナマカ =
  exports.トリトン =
  exports.チタニア =
  exports.タイタン =
  exports.カリスト =
  exports.ガニメデ =
  exports.黒分月 =
  exports.黒分月軌道 =
  exports.白分月 =
  exports.月 =
  exports.天文月 =
  exports.太歳 =
  exports.エリス =
  exports.マケマケ =
  exports.ハウメア =
  exports.セレス =
  exports.冥王星 =
  exports.海王星 =
  exports.天王星 =
  exports.土星 =
  exports.木星 =
  exports.火星 =
  exports.金星 =
  exports.水星 =
  exports.地球 =
  exports.天文火星 =
  exports.天文地球 =
  exports.太陽 =
  exports.天文 =
    void 0
const fancy_date_1 = require('../fancy-date')
const nasa_1 = require('../nasa')
const naoj_1 = require('../naoj')
const preset_1 = require('../preset')
exports.天文 = (function () {
  const 平均 = {
    太陽: {
      本体: { kind: 'physical', name: 'Sun', radiusKm: 695700 },
    },
    水星: {
      本体: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 },
      軌道: [7596288000, 1553119080000], // 太陽年 2019/03/21 06:58
      自転: [15192576000, 0, 0.01], // 太陽日
    },
    金星: {
      本体: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 },
      軌道: [19414456423, 1553119080000], // 公転周期 2019/03/21 06:58
      自転: [10087251840, 0, -2.64], // 太陽日
    },
    地球: {
      本体: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 },
      軌道: [31556925147, 1553119080000], // 2019/03/21 06:58
      自転: [86400000, 0, 23.4397], // LOD ではなく、暦上の1日。Unix epoch では閏秒を消し去るため。
    },
    月: {
      本体: {
        kind: 'physical',
        name: 'Moon',
        radiusKm: 1737.4,
        meanDistanceKm: 384400,
      },
      軌道: [2551442889, 1577310360000], // 2019/12/26 06:46
      白分軌道: [2551442889, 1577310360000],
      自転: [2551442889, 0, 6.68],
    },
    ガニメデ: {
      本体: { kind: 'physical', name: 'Ganymede' },
      軌道: [618192000, 0],
    },
    カリスト: {
      本体: { kind: 'physical', name: 'Callisto' },
      軌道: [1441929600, 0],
    },
    火星: {
      本体: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 },
      軌道: [59355616881, 1540684800000], // 公転周期 UTC 2018/10/28 00:00
      自転: [88740035, 0, 25.19], // 自転周期 24時間39分35秒。
    },
    木星: {
      本体: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 },
      軌道: [374322050280, 1553119080000], // 公転周期 2019/03/21 06:58
      自転: [35769600, 0, 3.12],
    },
    土星: {
      本体: { kind: 'physical', name: 'Saturn', radiusKm: 58232 },
      軌道: [931964092416, 1553119080000], // 公転周期 2019/03/21 06:58
      自転: [37920035, 0, 25.33],
    },
    タイタン: {
      本体: { kind: 'physical', name: 'Titan' },
      軌道: [1377684374, 0],
    },
    天王星: {
      本体: { kind: 'physical', name: 'Uranus', radiusKm: 25362 },
      軌道: [2658822788376, 1553119080000], // 公転周期 2019/03/21 06:58
      自転: [62061120, 0, -82.23],
    },
    チタニア: {
      本体: { kind: 'physical', name: 'Titania' },
      軌道: [752198400, 0],
    },
    海王星: {
      本体: { kind: 'physical', name: 'Neptune', radiusKm: 24622 },
      軌道: [5200376904000, 1553119080000], // 公転周期 2019/03/21 06:58
      自転: [64800000, 0, 28.32],
    },
    トリトン: {
      本体: { kind: 'physical', name: 'Triton' },
      軌道: [507733056, 0],
    },
    冥王星: {
      本体: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 },
      軌道: [7818100727754, 0],
      自転: [551856672, 0, -60.41],
    },
    カロン: {
      本体: { kind: 'physical', name: 'Charon' },
      軌道: [551880000, 0],
    },
    セレス: {
      本体: { kind: 'physical', name: 'Ceres', radiusKm: 469.7 },
      軌道: [145423814400, 0],
      自転: [32667012, 0, 4],
    },
    ハウメア: {
      本体: { kind: 'physical', name: 'Haumea' },
      軌道: [8908394904000, 0],
      自転: [14095440, 0, 0],
    },
    ナマカ: {
      本体: { kind: 'physical', name: 'Namaka' },
      軌道: [1579245120, 0],
    },
    ヒイアカ: {
      本体: { kind: 'physical', name: 'Hiiaka' },
      軌道: [4273516800, 0],
    },
    マケマケ: {
      本体: { kind: 'physical', name: 'Makemake' },
      軌道: [9639268920000, 0],
      自転: [27975600, 0, 0],
    },
    エリス: {
      本体: { kind: 'physical', name: 'Eris' },
      軌道: [17610403104000, 0],
      自転: [93240000, 0, 0],
    },
    ディスノミア: {
      本体: { kind: 'physical', name: 'Dysnomia' },
      軌道: [1362700800, 0],
    },
  }
  const 太歳 = {
    本体: { kind: 'virtual', name: '太歳', derivedFrom: 平均.木星 },
    軌道: (0, fancy_date_1.transformOrbital)(平均.木星.軌道, { direction: -1 }),
    自転: 平均.木星.自転,
  }
  return { ...平均, 太歳 }
})()
exports.太陽 = (0, fancy_date_1.placeStar)(exports.天文.太陽.本体)
exports.天文地球 = naoj_1.EarthSolarOrbital.planet(exports.太陽, { body: exports.天文.地球.本体 })
exports.天文火星 = nasa_1.MarsSolarOrbital.planet(exports.太陽, { body: exports.天文.火星.本体 })
exports.地球 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.地球)
exports.水星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.水星)
exports.金星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.金星)
exports.火星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.火星)
exports.木星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.木星)
exports.土星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.土星)
exports.天王星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.天王星)
exports.海王星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.海王星)
exports.冥王星 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.冥王星)
exports.セレス = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.セレス)
exports.ハウメア = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.ハウメア)
exports.マケマケ = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.マケマケ)
exports.エリス = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.エリス)
exports.太歳 = (0, preset_1.placeMeanPlanet)(exports.太陽, exports.天文.太歳)
Object.defineProperties(exports.太歳, {
  本体: { value: exports.天文.太歳.本体 },
  軌道: { value: exports.天文.太歳.軌道 },
  自転: { value: exports.天文.太歳.自転 },
})
exports.天文月 = naoj_1.EarthMoonOrbital.satellite(exports.天文地球, { body: exports.天文.月.本体 })
exports.月 = (0, preset_1.placeMeanSatellite)(exports.地球, exports.天文.月)
exports.白分月 = exports.月
exports.黒分月軌道 = (0, fancy_date_1.transformOrbital)(exports.天文.月.軌道, { phaseOffset: 0.5 })
exports.黒分月 = (0, preset_1.placeMeanSatellite)(exports.地球, {
  本体: exports.天文.月.本体,
  軌道: exports.黒分月軌道,
  自転: exports.天文.月.自転,
})
exports.ガニメデ = (0, preset_1.placeMeanSatellite)(exports.木星, exports.天文.ガニメデ)
exports.カリスト = (0, preset_1.placeMeanSatellite)(exports.木星, exports.天文.カリスト)
exports.タイタン = (0, preset_1.placeMeanSatellite)(exports.土星, exports.天文.タイタン)
exports.チタニア = (0, preset_1.placeMeanSatellite)(exports.天王星, exports.天文.チタニア)
exports.トリトン = (0, preset_1.placeMeanSatellite)(exports.海王星, exports.天文.トリトン)
exports.ナマカ = (0, preset_1.placeMeanSatellite)(exports.ハウメア, exports.天文.ナマカ)
exports.ヒイアカ = (0, preset_1.placeMeanSatellite)(exports.ハウメア, exports.天文.ヒイアカ)
exports.カロン = (0, preset_1.placeMeanSatellite)(exports.冥王星, exports.天文.カロン)
exports.ディスノミア = (0, preset_1.placeMeanSatellite)(exports.エリス, exports.天文.ディスノミア)
exports.東京 = [exports.月, 35.7, 139.8, 15 * +9]
exports.天文東京 = [exports.天文月, 35.7, 139.8, 15 * +9]
exports.zürich = [exports.月, 47.3, 8.5, 15 * +1]
exports.Paris = [exports.月, 48.9, 2.4, 15 * 0]
exports.Romus = [exports.月, 42.0, 12.5, 15 * +1]
exports.London = [exports.月, 51.5, 0.0, 15 * 0]
exports.Cairo = [exports.月, 30.0, 31.2, 15 * +2]
exports.Alexandria = [exports.月, 31.2, 29.9, 15 * +2]
exports.NewYork = [exports.月, 40.3, -74.0, 15 * -5]
exports.NewYork_Summer = [exports.月, 40.3, -74.0, 15 * -4]
exports.Madurai = [exports.白分月, 9.8, 78.1, 15 * +5.5]
exports.Jaypore = [exports.黒分月, 18.8, 82.5, 15 * +5.5]
exports.Babylon = [exports.月, 32.5, 44.4, 15 * +3]
exports.Istanbul = [exports.月, 41.0, 28.9, 15 * +2]
//# sourceMappingURL=astro.js.map
