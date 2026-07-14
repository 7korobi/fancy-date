export type {
  LunarEquatorialCoordinates,
  LunarApsis,
  LunarApsisKind,
  LunarHorizontalCoordinates,
  LunarNode,
  LunarNodeKind,
  LunarObservation,
  LunarObservationOptions,
  SolarEquatorialCoordinates,
  SolarHorizontalCoordinates,
  SolarObservation,
  SolarObservationOptions,
} from '../orbital-model'

// 国立天文台 暦要項 fixture と分単位で合うように調整したモデル。
// 国立天文台の公式アルゴリズムではなく、二十四節気は VSOP87 項、朔弦望は Meeus 系の式を使う。
// export * from はコンパイル時に tslib.__exportStar() という実行時関数呼び出しになり、
// 静的な named export 解析に依存するバンドラで再エクスポート名が undefined になる
// 不具合があった(development-notes.md 参照)。明示的な named export に置き換える。
export { EarthSolarOrbital, type EarthSolarOrbitalOptions } from './earth-solar'
export type { EarthSolarOrbitalPlanetOptions } from './earth-solar'
export { EarthMoonOrbital, type EarthMoonOrbitalOptions } from './earth-moon'
