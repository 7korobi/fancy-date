import type {
  ORBITAL,
  OrbitalModel,
  OrbitalTransformOptions,
  ROTATION,
  RotationModel,
} from './orbital-model'
import { mod } from './number'

export class MeanOrbital implements OrbitalModel {
  constructor(
    readonly periodMsec: number,
    readonly epochMsec: number,
  ) {}

  phaseAt(utc: number) {
    return mod((utc - this.epochMsec) / this.periodMsec, 1)
  }

  timeOfPhase(phase: number, near: number) {
    const cycle = Math.round((near - this.epochMsec) / this.periodMsec - phase)
    return this.epochMsec + (cycle + phase) * this.periodMsec
  }

  static from(src: ORBITAL): OrbitalModel {
    return is_orbital_tuple(src) ? new MeanOrbital(src[0], src[1]) : src
  }
}

export class TransformedOrbital implements OrbitalModel {
  readonly source: OrbitalModel
  readonly phaseOffset: number
  readonly direction: 1 | -1
  readonly periodMsec: number
  readonly epochMsec: number

  constructor(
    source: ORBITAL,
    { phaseOffset = 0, direction = 1, epochMsec }: OrbitalTransformOptions = {},
  ) {
    this.source = MeanOrbital.from(source)
    this.phaseOffset = phaseOffset
    this.direction = direction
    this.periodMsec = this.source.periodMsec
    this.epochMsec =
      epochMsec ?? this.source.epochMsec - direction * phaseOffset * this.source.periodMsec
  }

  phaseAt(utc: number) {
    return mod(this.direction * this.source.phaseAt(utc) + this.phaseOffset, 1)
  }

  timeOfPhase(phase: number, near: number) {
    const sourcePhase = mod(this.direction * (mod(phase, 1) - this.phaseOffset), 1)
    return this.source.timeOfPhase(sourcePhase, near)
  }
}

export function transformOrbital(
  source: ORBITAL,
  options: OrbitalTransformOptions = {},
): OrbitalModel {
  return new TransformedOrbital(source, options)
}

export class MeanRotation implements RotationModel {
  constructor(
    readonly periodMsec: number,
    readonly epochMsec: number,
    readonly axialTiltDeg: number,
  ) {}

  static from(src: ROTATION): RotationModel {
    return is_rotation_tuple(src) ? new MeanRotation(src[0], src[1], src[2]) : src
  }
}

function is_orbital_tuple(src: ORBITAL): src is readonly [number, number] {
  return Array.isArray(src)
}

function is_rotation_tuple(src: ROTATION): src is readonly [number, number, number] {
  return Array.isArray(src)
}
