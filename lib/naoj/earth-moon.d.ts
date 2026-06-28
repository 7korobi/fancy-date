import type { BodyProfile, LunarApsis, LunarApsisKind, LunarEquatorialCoordinates, LunarEventModel, LunarHorizontalCoordinates, LunarNode, LunarNodeKind, LunarObservation, LunarObservationOptions, PLANET, ROTATION, SATELLITE } from '../orbital-model';
export type EarthMoonOrbitalOptions = {
    periodMsec?: number;
    epochMsec?: number;
    body?: BodyProfile;
};
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
    lunarApsis(kind: LunarApsisKind, near: number): LunarApsis;
    lunarNode(kind: LunarNodeKind, near: number): LunarNode;
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
