# 天文データ出典メモ

fancy-date のサンプル天体・軌道モデルで使う天文定数と近似式の出典メモ。実装上の値は、暦サンプルとして扱いやすいようにミリ秒・度へ変換している。

## 平均天体データ

対象: `src/sample/astro.ts` の `天文.平均` 配下。

| データ                                   | 主な項目                       | 出典・状態                                                                                                                |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 太陽・惑星・月・主な衛星・準惑星の本体値 | 半径など                       | 理科年表由来として扱う。ただし旧コードには版・ページが残っていないため、正確な版情報は未特定。                            |
| 平均軌道                                 | 公転周期・基準 epoch           | 理科年表由来の平均値を、暦用にミリ秒へ変換したもの。複数天体の epoch は春分相当の `2019-03-21T06:58:00Z` にそろえている。 |
| 平均自転                                 | 太陽日または自転周期・赤道傾斜 | 理科年表由来の平均値として扱う。金星・天王星・冥王星など逆行/大傾斜天体は、既存データの符号を維持している。               |

注意: 理科年表の版が未記録なので、将来データを更新する場合は、版・ページ・単位変換手順をこのファイルへ追記する。

## 地球・月の観測モデル

対象: `EarthSolarOrbital`, `EarthMoonOrbital` (`src/naoj/`)。

| データ                       | 出典・状態                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 二十四節気・雑節 fixture     | 国立天文台 暦要項。`__tests__/fixtures/solar-terms-naoj.js` にURLと精度を記録。                                                          |
| 朔弦望 fixture               | 国立天文台 暦要項。`__tests__/fixtures/lunar-phases-naoj.js` にURLと精度を記録。                                                         |
| 日の出・日の入・南中 fixture | 国立天文台 暦要項。`__tests__/fixtures/solar-events-naoj.js` にURLと地点を記録。                                                         |
| 月の出・月の入・南中 fixture | 国立天文台 暦要項。`__tests__/fixtures/lunar-events-naoj.js` にURLと地点を記録。                                                         |
| 実装式                       | 国立天文台公式アルゴリズムそのものではない。太陽は VSOP87 系、月は Meeus 系の式を使い、暦要項 fixture と分単位で合うように検証している。 |

## 火星

対象: `MarsSolarOrbital` (`src/nasa/mars-solar.ts`)。

| データ               | 出典・状態                                                           |
| -------------------- | -------------------------------------------------------------------- |
| 太陽黄経 Ls          | NASA GISS Mars24 / Allison-McEwen 系の近似式。                       |
| 平均太陽日・赤道傾斜 | `src/sample/astro.ts` の平均データと同系統。理科年表由来として扱う。 |

## 水星・金星

対象: `MercurySolarOrbital`, `VenusSolarOrbital` (`src/nasa/mean-planet-solar.ts`)。

| データ                  | 出典・状態                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kepler 軌道要素・変化率 | JPL Solar System Dynamics, "Approximate Positions of the Planets", Table 1。1800 AD - 2050 AD の近似要素。                                             |
| 計算式                  | 同ページの Keplerian elements formulae。平均近点角を Newton 反復で離心近点角へ変換し、J2000 黄道面へ回転して、惑星中心から見た太陽黄経へ変換している。 |
| 回転・赤道傾斜          | `src/sample/astro.ts` の平均データと同系統。理科年表由来として扱う。                                                                                   |

参考: <https://ssd.jpl.nasa.gov/planets/approx_pos.html>

## 冥王星

対象: `PlutoSolarOrbital` (`src/nasa/mean-planet-solar.ts`)。

| データ          | 出典・状態                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Kepler 軌道要素 | JPL SBDB API, `sstr=134340`, `full-prec=true`。`epoch=2457588.5`, `equinox=J2000` の osculating elements。 |
| 平均運動        | 同 API の `n=.003956838955553025 deg/d` を century あたりの `meanLongitudeDeg` rate へ変換。               |
| 回転・赤道傾斜  | `src/sample/astro.ts` の平均データと同系統。理科年表由来として扱う。                                       |

参考: <https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=134340&full-prec=true>

## 木星・土星・天王星・海王星

対象: `JupiterSolarOrbital`, `SaturnSolarOrbital`, `UranusSolarOrbital`, `NeptuneSolarOrbital`。

現状は `MeanPlanetSolarOrbital` の平均黄経モデル。軌道周期・自転・赤道傾斜は `src/sample/astro.ts` の平均データを使う。高精度化する場合は、水星・金星と同じ JPL SSD approximate positions の Table 1/2 へ移行できる。ただし巨大惑星は固体表面を持たないため、日の出・日の入は「基準回転楕円体上の観測者」というモデル化になる。

## 今後の注意

- 理科年表由来の平均値は、版情報が未特定。値を更新するときは、版・ページ・単位変換を必ず残す。
- KeplerianSolarOrbital は現状、太陽方向ベクトルの黄経投影を `solarLongitudeDeg()` として使う段階。高傾斜天体の季節を本格化する場合は、黄経だけでなく太陽方向ベクトルから赤道座標へ変換するモデルへ拡張する。
- JPL SSD の惑星近似要素は full ephemeris ではない。高精度検証が必要な場合は JPL Horizons 等で fixture を作る。
