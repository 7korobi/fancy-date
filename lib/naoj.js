'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.EarthSolarOrbital = exports.EarthMoonOrbital = void 0
// フラットな import 経路(`fancy-date/lib/naoj`)を維持するための薄いラッパー。
// export * from の tslib.__exportStar() 実行時呼び出しがバンドラの静的解析を
// 妨げる不具合があったため、明示的な named export に置き換える
// (development-notes.md 参照)。
var index_1 = require('./naoj/index')
Object.defineProperty(exports, 'EarthMoonOrbital', {
  enumerable: true,
  get: function () {
    return index_1.EarthMoonOrbital
  },
})
Object.defineProperty(exports, 'EarthSolarOrbital', {
  enumerable: true,
  get: function () {
    return index_1.EarthSolarOrbital
  },
})
//# sourceMappingURL=naoj.js.map
