import { atan2_deg, cos_deg, julian_day, sin_deg } from './naoj/astro-math'
import { mod } from './number'

export type KeplerianElements = {
  /** 軌道長半径（AU など任意の単位） */
  semiMajorAxisAu: number
  /** 離心率。0 で真円、1 に近いほど楕円が扁平 */
  eccentricity: number
  /** 軌道傾斜角（度） */
  inclinationDeg: number
  /** 平均黄経（度） */
  meanLongitudeDeg: number
  /** 近心点黄経（度） */
  perihelionLongitudeDeg: number
  /** 昇交点黄経（度） */
  ascendingNodeLongitudeDeg: number
}

export type KeplerianElementRates = Partial<{
  [K in keyof KeplerianElements]: number
}>

export type KeplerianAnomalyTerms = {
  /** t^2 の係数 */
  b?: number
  /** cos(f t) の係数 */
  c?: number
  /** sin(f t) の係数 */
  s?: number
  /** cos/sin の引数係数 */
  f?: number
}

export type KeplerianOrbitalProfile = {
  /** 公転周期（ミリ秒） */
  periodMsec: number
  /** 位相 0 となる基準時刻（ミリ秒） */
  epochMsec: number
  /** ケプラー要素の基準ユリウス日。省略時は J2000.0 (2451545.0) */
  elementEpochJd?: number
  /** 詳細なケプラー要素。省略時は下記簡易指定から構築される。 */
  elements?: KeplerianElements
  /** 創作天体向け簡易指定: 離心率。0 で真円、1 に近いほど扁平。 */
  eccentricity?: number
  /** 創作天体向け簡易指定: 平均黄経（度） */
  meanLongitudeDeg?: number
  /** 創作天体向け簡易指定: 近心点黄経（度） */
  perihelionLongitudeDeg?: number
  /** 単位: 要素値 / ユリウス世紀。長期変化がない場合は省略可 */
  elementRates?: KeplerianElementRates
  /** 平均近点角への補正項。冥王星のような摂動の大きい天体で使用 */
  anomalyTerms?: KeplerianAnomalyTerms
}

export type KeplerianOrbitalOptions = {
  /** 公転周期の上書き */
  periodMsec?: number
  /** 位相 0 の基準時刻の上書き */
  epochMsec?: number
}

/**
 * ケプラー方程式に基づく楕円軌道モデル。
 *
 * 中心天体の周りを楕円軌道で公転する任意の天体に使える。
 * 惑星の太陽周回だけでなく、惑星の周りを回る衛星にも利用可能。
 * phaseAt() は軌道面内での公転位相（平均黄経基準）を返し、
 * solarLongitudeDeg() 等の上位クラスがそれを黄経などに変換する。
 */
export class KeplerianOrbital {
  readonly periodMsec: number
  readonly epochMsec: number
  private readonly profile: KeplerianOrbitalProfile
  private readonly referenceLongitudeDeg: number

  constructor(profile: KeplerianOrbitalProfile, options: KeplerianOrbitalOptions = {}) {
    this.profile = profile
    this.periodMsec = options.periodMsec ?? profile.periodMsec
    this.epochMsec = options.epochMsec ?? profile.epochMsec
    this.referenceLongitudeDeg = apparentLongitudeDeg(this.epochMsec, profile)
  }

  /**
   * 指定時刻における公転位相を返す。
   * 位相 0 は profile.elements.meanLongitudeDeg（または簡易指定の meanLongitudeDeg）に対応。
   */
  phaseAt(utc: number): number {
    const longitude = mod(apparentLongitudeDeg(utc, this.profile) - this.referenceLongitudeDeg, 360)
    return longitude / 360
  }

  /**
   * 指定の位相となる最も near に近い時刻を返す。
   */
  timeOfPhase(phase: number, near: number): number {
    const targetLongitude = mod(phase * 360 + this.referenceLongitudeDeg, 360)
    // 初期値: 平均運動から近似的な時刻を求め、それを near 付近に合わせる。
    const meanPhase = mod(phase, 1)
    const cycle = Math.round((near - this.epochMsec) / this.periodMsec - meanPhase)
    let t = this.epochMsec + (cycle + meanPhase) * this.periodMsec
    // ニュートン法で targetLongitude となる時刻を微調整する。
    for (let i = 0; i < 16; i++) {
      const longitude = apparentLongitudeDeg(t, this.profile)
      const diff = signedDegree(targetLongitude - longitude)
      const angularSpeedDegPerMs = 360 / this.periodMsec
      const dt = diff / angularSpeedDegPerMs
      t += dt
      if (Math.abs(dt) < 1e-6) break
    }
    return t
  }

  /**
   * 指定時刻における視黄経（度）を返す。
   */
  apparentLongitudeDeg(utc: number): number {
    return apparentLongitudeDeg(utc, this.profile)
  }

  /**
   * 軌道長半径に対する現在距離の比率を返す。
   * 半長軸の単位はprofileごとに任意なので、比率だけを公開する。
   */
  radialDistanceRatioAt(utc: number): number {
    const elementEpochJd = this.profile.elementEpochJd ?? 2451545.0
    const utcCenturies = (julian_day(utc) - elementEpochJd) / 36525
    const elements = elementsAt(this.profile, utcCenturies)
    const epochCenturies =
      (julian_day(this.profile.epochMsec) - elementEpochJd) / 36525
    const epochElements = elementsAt(this.profile, epochCenturies)
    const meanLongitudeDeg = mod(
      epochElements.meanLongitudeDeg +
        ((utc - this.profile.epochMsec) / this.profile.periodMsec) * 360,
      360,
    )
    const meanAnomalyDeg = signedDegree(
      meanLongitudeDeg - elements.perihelionLongitudeDeg + anomalyCorrectionDeg(this.profile, utcCenturies),
    )
    const eccentricAnomalyRad = solveEccentricAnomalyRad(meanAnomalyDeg, elements.eccentricity)
    return 1 - elements.eccentricity * Math.cos(eccentricAnomalyRad)
  }
}

export function solveEccentricAnomalyRad(meanAnomalyDeg: number, eccentricity: number) {
  const meanAnomalyRad = (meanAnomalyDeg * Math.PI) / 180
  let eccentricAnomalyRad = meanAnomalyRad + eccentricity * Math.sin(meanAnomalyRad)
  for (let index = 0; index < 8; index++) {
    const delta =
      (eccentricAnomalyRad - eccentricity * Math.sin(eccentricAnomalyRad) - meanAnomalyRad) /
      (1 - eccentricity * Math.cos(eccentricAnomalyRad))
    eccentricAnomalyRad -= delta
    if (Math.abs(delta) < 1e-12) break
  }
  return eccentricAnomalyRad
}

function elementsAt(profile: KeplerianOrbitalProfile, centuries: number): Required<KeplerianElements> {
  const base = profile.elements ?? buildElementsFromSimpleProfile(profile)
  const element = (key: keyof KeplerianElements) => base[key] + (profile.elementRates?.[key] ?? 0) * centuries
  return {
    semiMajorAxisAu: element('semiMajorAxisAu'),
    eccentricity: element('eccentricity'),
    inclinationDeg: element('inclinationDeg'),
    meanLongitudeDeg: element('meanLongitudeDeg'),
    perihelionLongitudeDeg: element('perihelionLongitudeDeg'),
    ascendingNodeLongitudeDeg: element('ascendingNodeLongitudeDeg'),
  }
}

function buildElementsFromSimpleProfile(profile: KeplerianOrbitalProfile): KeplerianElements {
  return {
    semiMajorAxisAu: 1,
    eccentricity: profile.eccentricity ?? 0,
    inclinationDeg: 0,
    meanLongitudeDeg: profile.meanLongitudeDeg ?? 0,
    perihelionLongitudeDeg: profile.perihelionLongitudeDeg ?? 0,
    ascendingNodeLongitudeDeg: 0,
  }
}

function anomalyCorrectionDeg(profile: KeplerianOrbitalProfile, centuries: number): number {
  const terms = profile.anomalyTerms
  if (!terms) return 0
  return (
    (terms.b ?? 0) * centuries * centuries +
    (terms.c ?? 0) * cos_deg((terms.f ?? 0) * centuries) +
    (terms.s ?? 0) * sin_deg((terms.f ?? 0) * centuries)
  )
}

function apparentLongitudeDeg(utc: number, profile: KeplerianOrbitalProfile): number {
  const elementEpochJd = profile.elementEpochJd ?? 2451545.0
  const epochCenturies = (julian_day(profile.epochMsec) - elementEpochJd) / 36525
  const epochElements = elementsAt(profile, epochCenturies)
  const utcCenturies = (julian_day(utc) - elementEpochJd) / 36525
  const utcElements = elementsAt(profile, utcCenturies)
  // epochMsec での平均黄経を基準に、periodMsec 周期の平均運動で utc 時の平均黄経を求める。
  const meanLongitudeDeg = mod(
    epochElements.meanLongitudeDeg + ((utc - profile.epochMsec) / profile.periodMsec) * 360,
    360,
  )
  const meanAnomalyDeg = signedDegree(
    meanLongitudeDeg - utcElements.perihelionLongitudeDeg + anomalyCorrectionDeg(profile, utcCenturies),
  )
  const eccentricAnomalyRad = solveEccentricAnomalyRad(meanAnomalyDeg, utcElements.eccentricity)
  const trueAnomalyRad =
    2 *
    Math.atan2(
      Math.sqrt(1 + utcElements.eccentricity) * Math.sin(eccentricAnomalyRad / 2),
      Math.sqrt(1 - utcElements.eccentricity) * Math.cos(eccentricAnomalyRad / 2),
    )
  return mod(utcElements.perihelionLongitudeDeg + (trueAnomalyRad * 180) / Math.PI, 360)
}

function meanLongitudeDeg(elements: Required<KeplerianElements>): number {
  return elements.meanLongitudeDeg
}

function perihelionLongitudeDeg(elements: Required<KeplerianElements>): number {
  return elements.perihelionLongitudeDeg
}

function signedDegree(deg: number): number {
  return mod(deg + 180, 360) - 180
}
