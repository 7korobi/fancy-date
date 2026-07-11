"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarthMoonOrbital = exports.EarthSolarOrbital = void 0;
// 国立天文台 暦要項 fixture と分単位で合うように調整したモデル。
// 国立天文台の公式アルゴリズムではなく、二十四節気は VSOP87 項、朔弦望は Meeus 系の式を使う。
// export * from はコンパイル時に tslib.__exportStar() という実行時関数呼び出しになり、
// 静的な named export 解析に依存するバンドラで再エクスポート名が undefined になる
// 不具合があった(development-notes.md 参照)。明示的な named export に置き換える。
var earth_solar_1 = require("./earth-solar");
Object.defineProperty(exports, "EarthSolarOrbital", { enumerable: true, get: function () { return earth_solar_1.EarthSolarOrbital; } });
var earth_moon_1 = require("./earth-moon");
Object.defineProperty(exports, "EarthMoonOrbital", { enumerable: true, get: function () { return earth_moon_1.EarthMoonOrbital; } });
//# sourceMappingURL=index.js.map