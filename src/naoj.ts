// フラットな import 経路(`fancy-date/lib/naoj`)を維持するための薄いラッパー。
// export * from の tslib.__exportStar() 実行時呼び出しがバンドラの静的解析を
// 妨げる不具合があったため、明示的な named export に置き換える
// (development-notes.md 参照)。
export { EarthMoonOrbital, EarthSolarOrbital } from './naoj/index'
export type { EarthMoonOrbitalOptions, EarthSolarOrbitalOptions } from './naoj/index'
