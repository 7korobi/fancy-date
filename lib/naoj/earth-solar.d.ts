import type { BodyProfile, PLANET, ROTATION, SolarEquatorialCoordinates, SolarEventModel, SolarHorizontalCoordinates, SolarObservation, SolarObservationOptions, STAR } from '../orbital-model';
export type EarthSolarOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
    body?: BodyProfile;
};
export declare class EarthSolarOrbital implements SolarEventModel {
    static readonly sun: STAR;
    static readonly meanSolarDayMsec: number;
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
