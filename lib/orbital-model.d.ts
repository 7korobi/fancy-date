export type BodyProfile = {
    kind?: 'physical' | 'virtual';
    name?: string;
    radiusKm?: number;
    meanDistanceKm?: number;
    massKg?: number;
    albedo?: number;
    derivedFrom?: BodyProfileReference;
};
export type BodyProfileReference = STAR | SKY_BODY | {
    readonly 本体: BodyProfile;
};
export type STAR = readonly [center: null, orbital: null, rotation: null] & {
    body?: BodyProfile;
};
export type PLANET_TUPLE = readonly [center: STAR, orbital: ORBITAL, rotation: ROTATION];
export type SATELLITE_TUPLE = readonly [center: PLANET, orbital: ORBITAL, rotation?: ROTATION];
export type PlanetPlacement = PLANET_TUPLE & {
    body?: BodyProfile;
    center: STAR;
    orbital: ORBITAL;
    rotation: ROTATION;
};
export type SatellitePlacement = SATELLITE_TUPLE & {
    body?: BodyProfile;
    center: PLANET;
    orbital: ORBITAL;
    rotation?: ROTATION;
};
export type PLANET = PLANET_TUPLE | PlanetPlacement;
export type SATELLITE = SATELLITE_TUPLE | SatellitePlacement;
export type SKY_BODY = PLANET | SATELLITE;
export type SPOT = readonly [
    body: SKY_BODY,
    latitudeDeg: number,
    longitudeDeg: number,
    timezoneDeg: number
];
export type TIMEZONE = readonly [latitudeDeg: number, longitudeDeg: number, timezoneDeg: number];
export type ORBITAL = readonly [periodMsec: number, epochMsec: number] | OrbitalModel;
export type ROTATION = readonly [periodMsec: number, epochMsec: number, axialTiltDeg: number] | RotationModel;
export type PlanetPlacementOptions = {
    body?: BodyProfile;
    center: STAR;
    orbital: ORBITAL;
    rotation: ROTATION;
};
export type SatellitePlacementOptions = {
    body?: BodyProfile;
    center: PLANET;
    orbital: ORBITAL;
    rotation?: ROTATION;
};
export interface OrbitalModel {
    periodMsec: number;
    epochMsec: number;
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
}
export type OrbitalTransformOptions = {
    phaseOffset?: number;
    direction?: 1 | -1;
    epochMsec?: number;
};
export interface RotationModel {
    periodMsec: number;
    epochMsec: number;
    axialTiltDeg: number;
}
export declare function placeStar(body?: BodyProfile): STAR;
export declare function placePlanet(options: PlanetPlacementOptions): PlanetPlacement;
export declare function placeSatellite(options: SatellitePlacementOptions): SatellitePlacement;
export declare function isPlanetSkyBody(body: SKY_BODY): body is PLANET;
export declare function centerOf(body: PLANET): STAR;
export declare function centerOf(body: SATELLITE): PLANET;
export declare function centerOf(body: SKY_BODY): STAR | PLANET;
export declare function orbitalOf(body: SKY_BODY): ORBITAL;
export declare function rotationOf(body: SKY_BODY): ROTATION | undefined;
export declare function bodyProfileOf(body: STAR | SKY_BODY): BodyProfile | undefined;
export type ResolvedSkyBody = {
    planet: PLANET;
    satellite?: SATELLITE;
    planetaryOrbital: ORBITAL;
    satelliteOrbital?: ORBITAL;
    planetaryRotation: ROTATION;
};
export declare function resolveSkyBody(body: SKY_BODY): ResolvedSkyBody;
export type SolarObservationOptions = {
    latitudeDeg: number;
    longitudeDeg: number;
    timezoneDeg?: number;
    horizonDeg?: number;
    dayStartUtc?: number;
    dayCenterUtc?: number;
};
export type SolarObservation = {
    K: number;
    lat: number;
    時角: number;
    方向: number;
    高度: number;
    真夜中: number;
    /** 白夜・極夜(太陽がその暦日内で地平線を越えない)の場合は NaN。`has_sunrise` で判定できる。 */
    日の出: number;
    南中時刻: number;
    /** 白夜・極夜の場合は NaN。`has_sunrise` で判定できる。 */
    日の入: number;
    /** 白夜・極夜の場合は NaN。`has_sunrise` で判定できる。 */
    日の出方位: number;
    /** 白夜・極夜の場合は NaN。`has_sunrise` で判定できる。 */
    日の入方位: number;
    南中高度: number;
    /** 日の出/日の入/日の出方位/日の入方位 が有効な値かどうか(この4項目は同時にNaNになる)。 */
    has_sunrise: boolean;
    /** `has_sunrise` が false のとき、白夜(終日太陽が沈まない)なら true、
     * 極夜(終日太陽が昇らない)なら false。南中高度(その暦日で太陽が最も
     * 高く昇る瞬間の高度)の符号から判定しており、`has_sunrise` が true の
     * 通常の日でも(南中時は地平線より上にあるはずなので)true になる。 */
    is_up_all_day: boolean;
};
export type SolarEquatorialCoordinates = {
    longitudeDeg: number;
    rightAscensionDeg: number;
    declinationDeg: number;
    obliquityDeg: number;
};
export type SolarHorizontalCoordinates = SolarEquatorialCoordinates & {
    altitudeDeg: number;
    azimuthDeg: number;
    hourAngleDeg: number;
};
export interface SolarPositionModel extends OrbitalModel {
    solarLongitudeDeg(utc: number): number;
    solarEquatorial(utc: number): SolarEquatorialCoordinates;
    solarHorizontal(utc: number, latitudeDeg: number, longitudeDeg: number): SolarHorizontalCoordinates;
}
export interface SolarEventModel extends SolarPositionModel {
    solarEvents(utc: number, options: SolarObservationOptions): SolarObservation;
}
export type LunarObservationOptions = {
    latitudeDeg: number;
    longitudeDeg: number;
    timezoneDeg?: number;
    heightM?: number;
    horizonDeg?: number;
    dayStartUtc?: number;
};
export type LunarObservation = {
    /** 月の出の周期(約24時間50分)と暦日(24時間)のずれにより、この暦日に月の出が
     * 一度も起きない日がある。その場合は NaN。`has_moonrise` で判定できる。 */
    月の出: number;
    /** 同様の理由で南中が一度も起きない日がある。その場合は NaN。`has_transit` で判定できる。 */
    南中時刻: number;
    /** 同様の理由で月の入が一度も起きない日がある。その場合は NaN。`has_moonset` で判定できる。 */
    月の入: number;
    /** 月の出がない日は NaN。`has_moonrise` で判定できる。 */
    月の出方位: number;
    /** 月の入がない日は NaN。`has_moonset` で判定できる。 */
    月の入方位: number;
    /** 南中がない日は NaN。`has_transit` で判定できる。 */
    南中高度: number;
    /** 月の出/月の出方位 が有効な値かどうか。月の出・南中・月の入は(太陽と異なり)
     * それぞれ独立に暦日から外れうるため、個別のフラグを持つ。 */
    has_moonrise: boolean;
    /** 南中時刻/南中高度 が有効な値かどうか。 */
    has_transit: boolean;
    /** 月の入/月の入方位 が有効な値かどうか。 */
    has_moonset: boolean;
    /** `has_moonrise` と `has_moonset` が両方 false のとき、月がその暦日ずっと
     * 地平線の上にある(終日沈まない)なら true、ずっと下にある(終日昇らない)
     * なら false。南中高度の符号から判定する。`has_transit` も false な
     * (南中自体が暦日から外れる)極めて稀なケースでは判定できず false になる。 */
    is_up_all_day: boolean;
};
export type LunarEquatorialCoordinates = {
    longitudeDeg: number;
    latitudeDeg: number;
    distanceKm: number;
    rightAscensionDeg: number;
    declinationDeg: number;
    horizontalParallaxDeg: number;
    obliquityDeg: number;
};
export type LunarHorizontalCoordinates = LunarEquatorialCoordinates & {
    altitudeDeg: number;
    azimuthDeg: number;
    hourAngleDeg: number;
    topocentricRightAscensionDeg: number;
    topocentricDeclinationDeg: number;
};
export interface LunarPositionModel extends OrbitalModel {
    lunarEquatorial(utc: number): LunarEquatorialCoordinates;
    lunarHorizontal(utc: number, latitudeDeg: number, longitudeDeg: number, heightM?: number): LunarHorizontalCoordinates;
}
export interface LunarEventModel extends LunarPositionModel {
    lunarEvents(utc: number, options: LunarObservationOptions): LunarObservation;
}
export type LunarApsisKind = 'perigee' | 'apogee';
export type LunarApsis = {
    kind: LunarApsisKind;
    at: number;
    distanceKm: number;
};
export type LunarNodeKind = 'ascending' | 'descending';
export type LunarNode = {
    kind: LunarNodeKind;
    at: number;
    longitudeDeg: number;
    latitudeDeg: number;
};
export interface LunarOrbitEventModel extends LunarPositionModel {
    lunarApsis(kind: LunarApsisKind, near: number): LunarApsis;
    lunarNode(kind: LunarNodeKind, near: number): LunarNode;
}
export declare function hasSolarEvents(model: OrbitalModel): model is SolarEventModel;
export declare function hasLunarEvents(model: OrbitalModel | undefined): model is LunarEventModel;
export declare function hasLunarOrbitEvents(model: OrbitalModel | undefined): model is LunarOrbitEventModel;
