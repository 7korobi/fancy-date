import type { OrbitalModel, PLANET, ROTATION, SATELLITE, STAR } from './fancy-date';
export type EarthSolarOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
};
export type EarthMoonOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
};
export declare class EarthSolarOrbital implements OrbitalModel {
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
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
}
export declare class EarthMoonOrbital implements OrbitalModel {
    static readonly meanSynodicMonthMsec = 2551442889;
    static readonly newMoonEpochMsec = 1577310360000;
    static readonly rotationAxialTiltDeg = 6.68;
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor({ periodMsec, epochMsec, }?: EarthMoonOrbitalOptions);
    static rotation(): ROTATION;
    static satellite(center: PLANET, options?: EarthMoonOrbitalOptions): SATELLITE;
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
    private nearestLunation;
    private phaseJde;
    private phaseCorrection;
    private newOrFullCorrection;
    private additionalCorrection;
}
