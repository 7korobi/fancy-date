"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeanRotation = exports.TransformedOrbital = exports.MeanOrbital = void 0;
exports.transformOrbital = transformOrbital;
const number_1 = require("./number");
class MeanOrbital {
    constructor(periodMsec, epochMsec) {
        this.periodMsec = periodMsec;
        this.epochMsec = epochMsec;
    }
    phaseAt(utc) {
        return (0, number_1.mod)((utc - this.epochMsec) / this.periodMsec, 1);
    }
    timeOfPhase(phase, near) {
        const cycle = Math.round((near - this.epochMsec) / this.periodMsec - phase);
        return this.epochMsec + (cycle + phase) * this.periodMsec;
    }
    static from(src) {
        return is_orbital_tuple(src) ? new MeanOrbital(src[0], src[1]) : src;
    }
}
exports.MeanOrbital = MeanOrbital;
class TransformedOrbital {
    constructor(source, { phaseOffset = 0, direction = 1, epochMsec } = {}) {
        this.source = MeanOrbital.from(source);
        this.phaseOffset = phaseOffset;
        this.direction = direction;
        this.periodMsec = this.source.periodMsec;
        this.epochMsec =
            epochMsec ?? this.source.epochMsec - direction * phaseOffset * this.source.periodMsec;
    }
    phaseAt(utc) {
        return (0, number_1.mod)(this.direction * this.source.phaseAt(utc) + this.phaseOffset, 1);
    }
    timeOfPhase(phase, near) {
        const sourcePhase = (0, number_1.mod)(this.direction * ((0, number_1.mod)(phase, 1) - this.phaseOffset), 1);
        return this.source.timeOfPhase(sourcePhase, near);
    }
}
exports.TransformedOrbital = TransformedOrbital;
function transformOrbital(source, options = {}) {
    return new TransformedOrbital(source, options);
}
class MeanRotation {
    constructor(periodMsec, epochMsec, axialTiltDeg) {
        this.periodMsec = periodMsec;
        this.epochMsec = epochMsec;
        this.axialTiltDeg = axialTiltDeg;
    }
    static from(src) {
        return is_rotation_tuple(src) ? new MeanRotation(src[0], src[1], src[2]) : src;
    }
}
exports.MeanRotation = MeanRotation;
function is_orbital_tuple(src) {
    return Array.isArray(src);
}
function is_rotation_tuple(src) {
    return Array.isArray(src);
}
//# sourceMappingURL=mean.js.map