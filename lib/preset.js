'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.make元号 = make元号
exports.placeMeanPlanet = placeMeanPlanet
exports.placeMeanSatellite = placeMeanSatellite
const fancy_date_1 = require('./fancy-date')
function make元号(source, base, target) {
  const replace = {}
  source.forEach(([name, start, side]) => {
    if (side && side.includes(target)) {
      replace[name] = [name, start, side]
    }
  })
  return base.map(([name, start, side]) => [name, replace[name]?.[1] ?? start, side])
}
function placeMeanPlanet(center, { 本体, 軌道, 自転 }) {
  return (0, fancy_date_1.placePlanet)({ body: 本体, center, orbital: 軌道, rotation: 自転 })
}
function placeMeanSatellite(center, { 本体, 軌道, 自転 }) {
  return (0, fancy_date_1.placeSatellite)({ body: 本体, center, orbital: 軌道, rotation: 自転 })
}
//# sourceMappingURL=preset.js.map
