import type { BodyProfile, PLANET, ROTATION, STAR } from '../orbital-model';
export type MarsSolarOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
    body?: BodyProfile;
};
export declare class MarsSolarOrbital {
    static readonly sun: STAR;
    static readonly meanSolarDayMsec = 88775244;
    static readonly rotationEpochMsec = 0;
    static readonly axialTiltDeg = 25.19;
    static readonly meanTropicalYearMsec = 59355072000;
    static readonly vernalEquinoxEpochMsec: number;
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor({ periodMsec, epochMsec, }?: MarsSolarOrbitalOptions);
    static rotation(): ROTATION;
    static planet(center?: STAR, options?: MarsSolarOrbitalOptions): PLANET;
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
    solarLongitudeDeg(utc: number): number;
}
