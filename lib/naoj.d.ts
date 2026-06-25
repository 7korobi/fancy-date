import type { BodyProfile, LunarEquatorialCoordinates, LunarEventModel, LunarHorizontalCoordinates, LunarObservation, LunarObservationOptions, PLANET, ROTATION, SATELLITE, SolarEquatorialCoordinates, SolarEventModel, SolarHorizontalCoordinates, SolarObservation, SolarObservationOptions, STAR } from './orbital-model';
export type { LunarEquatorialCoordinates, LunarHorizontalCoordinates, LunarObservation, LunarObservationOptions, SolarEquatorialCoordinates, SolarHorizontalCoordinates, SolarObservation, SolarObservationOptions, } from './orbital-model';
export type EarthSolarOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
    body?: BodyProfile;
};
export type EarthMoonOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
    body?: BodyProfile;
};
export declare class EarthSolarOrbital implements SolarEventModel {
    static readonly sun: STAR;
    static readonly meanSolarDayMsec = 86400000;
    static readonly rotationEpochMsec = 0;
    static readonly axialTiltDeg = 23.4397;
    static readonly meanTropicalYearMsec = 31556925147;
    static readonly vernalEquinoxEpochMsec = 1553119080000;
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor({ periodMsec, epochMsec, }?: EarthSolarOrbitalOptions);
    static rotation(): ROTATION;
    static planet(center?: STAR, options?: EarthSolarOrbitalOptions): PLANET;
    solarLongitudeDeg(utc: number): number;
    solarEquatorial(utc: number): SolarEquatorialCoordinates;
    solarHorizontal(utc: number, latitudeDeg: number, longitudeDeg: number): SolarHorizontalCoordinates;
    solarEvents(utc: number, options: SolarObservationOptions): SolarObservation;
    private riseSetHourAngleDeg;
    private timeOfSolarHourAngle;
    private timeOfSolarAltitude;
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
}
export declare class EarthMoonOrbital implements LunarEventModel {
    static readonly meanSynodicMonthMsec = 2551442889;
    static readonly newMoonEpochMsec = 1577310360000;
    static readonly rotationAxialTiltDeg = 6.68;
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor({ periodMsec, epochMsec, }?: EarthMoonOrbitalOptions);
    static rotation(): ROTATION;
    static satellite(center: PLANET, options?: EarthMoonOrbitalOptions): SATELLITE;
    lunarEquatorial(utc: number): LunarEquatorialCoordinates;
    lunarHorizontal(utc: number, latitudeDeg: number, longitudeDeg: number, heightM?: number): LunarHorizontalCoordinates;
    lunarEvents(utc: number, options: LunarObservationOptions): LunarObservation;
    private lunarSamples;
    private findAltitudeEvent;
    private findTransitEvent;
    private timeOfLunarAltitude;
    private timeOfLunarHourAngle;
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
    private nearestLunation;
    private phaseJde;
    private phaseCorrection;
    private newOrFullCorrection;
    private additionalCorrection;
}
