import type { ORBITAL, OrbitalModel, OrbitalTransformOptions, ROTATION, RotationModel } from './orbital-model';
export declare class MeanOrbital implements OrbitalModel {
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor(periodMsec: number, epochMsec: number);
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
    static from(src: ORBITAL): OrbitalModel;
}
export declare class TransformedOrbital implements OrbitalModel {
    readonly source: OrbitalModel;
    readonly phaseOffset: number;
    readonly direction: 1 | -1;
    readonly periodMsec: number;
    readonly epochMsec: number;
    constructor(source: ORBITAL, { phaseOffset, direction, epochMsec }?: OrbitalTransformOptions);
    phaseAt(utc: number): number;
    timeOfPhase(phase: number, near: number): number;
}
export declare function transformOrbital(source: ORBITAL, options?: OrbitalTransformOptions): OrbitalModel;
export declare class MeanRotation implements RotationModel {
    readonly periodMsec: number;
    readonly epochMsec: number;
    readonly axialTiltDeg: number;
    constructor(periodMsec: number, epochMsec: number, axialTiltDeg: number);
    static from(src: ROTATION): RotationModel;
}
