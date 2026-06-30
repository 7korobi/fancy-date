"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarsSolarOrbital = void 0;
const orbital_model_1 = require("../orbital-model");
const number_1 = require("../number");
const MSEC_PER_DAY = 86400000;
class MarsSolarOrbital {
    static { this.sun = [null, null, null]; }
    static { this.meanSolarDayMsec = 88775244; }
    static { this.rotationEpochMsec = 0; }
    static { this.axialTiltDeg = 25.19; }
    static { this.meanTropicalYearMsec = 59355072000; }
    static { this.vernalEquinoxEpochMsec = Date.UTC(2018, 4, 22, 13, 54); }
    constructor({ periodMsec = MarsSolarOrbital.meanTropicalYearMsec, epochMsec = MarsSolarOrbital.vernalEquinoxEpochMsec, } = {}) {
        this.periodMsec = periodMsec;
        this.epochMsec = epochMsec;
    }
    static rotation() {
        return [
            MarsSolarOrbital.meanSolarDayMsec,
            MarsSolarOrbital.rotationEpochMsec,
            MarsSolarOrbital.axialTiltDeg,
        ];
    }
    static planet(center = MarsSolarOrbital.sun, options = {}) {
        const { body, ...orbitalOptions } = options;
        return (0, orbital_model_1.placePlanet)({
            body,
            center,
            orbital: new MarsSolarOrbital(orbitalOptions),
            rotation: MarsSolarOrbital.rotation(),
        });
    }
    phaseAt(utc) {
        return (0, number_1.mod)(this.solarLongitudeDeg(utc) / 360, 1);
    }
    timeOfPhase(phase, near) {
        const target = (0, number_1.mod)(phase, 1);
        let at = near + signedPhaseDelta(target, this.phaseAt(near)) * this.periodMsec;
        for (let index = 0; index < 8; index++) {
            const error = signedPhaseDelta(target, this.phaseAt(at));
            if (Math.abs(error * this.periodMsec) < 1000)
                break;
            at += error * this.periodMsec;
        }
        return Math.round([at - this.periodMsec, at, at + this.periodMsec].reduce((best, candidate) => Math.abs(candidate - near) < Math.abs(best - near) ? candidate : best));
    }
    solarLongitudeDeg(utc) {
        const days = (utc - Date.UTC(2000, 0, 6, 0, 0)) / MSEC_PER_DAY;
        const meanAnomalyDeg = (0, number_1.mod)(19.387 + 0.52402075 * days, 360);
        const alphaFmsDeg = (0, number_1.mod)(270.3863 + 0.5240384 * days, 360);
        const pbsDeg = 0.0071 * cosDeg((0.985626 * days) / 2.2353 + 49.409) +
            0.0057 * cosDeg((0.985626 * days) / 2.7543 + 168.173) +
            0.0039 * cosDeg((0.985626 * days) / 1.1177 + 191.837) +
            0.0037 * cosDeg((0.985626 * days) / 15.7866 + 21.736) +
            0.0021 * cosDeg((0.985626 * days) / 2.1354 + 15.704) +
            0.0020 * cosDeg((0.985626 * days) / 2.4694 + 95.528) +
            0.0018 * cosDeg((0.985626 * days) / 32.8493 + 49.095);
        const equationOfCenterDeg = (10.691 + 3e-7 * days) * sinDeg(meanAnomalyDeg) +
            0.623 * sinDeg(2 * meanAnomalyDeg) +
            0.050 * sinDeg(3 * meanAnomalyDeg) +
            0.005 * sinDeg(4 * meanAnomalyDeg) +
            0.0005 * sinDeg(5 * meanAnomalyDeg) +
            pbsDeg;
        return (0, number_1.mod)(alphaFmsDeg + equationOfCenterDeg, 360);
    }
}
exports.MarsSolarOrbital = MarsSolarOrbital;
function signedPhaseDelta(target, actual) {
    const delta = (0, number_1.mod)(target - actual + 0.5, 1) - 0.5;
    return delta === -0.5 ? 0.5 : delta;
}
function sinDeg(deg) {
    return Math.sin((Math.PI * deg) / 180);
}
function cosDeg(deg) {
    return Math.cos((Math.PI * deg) / 180);
}
//# sourceMappingURL=mars-solar.js.map