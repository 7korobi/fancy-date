"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarthMoonOrbital = exports.EarthSolarOrbital = void 0;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const MSEC_PER_DAY = 86400000;
const MSEC_PER_MINUTE = 60000;
const EARTH_EQUATORIAL_RADIUS_KM = 6378.14;
const SOLAR_HOUR_ANGLE_DEG_PER_DAY = 360.98564736629;
const EARTH_L_TERMS = [
    [
        [175347046, 0, 0],
        [3341656, 4.6692568, 6283.07585],
        [34894, 4.6261, 12566.1517],
        [3497, 2.7441, 5753.3849],
        [3418, 2.8289, 3.5231],
        [3136, 3.6277, 77713.7715],
        [2676, 4.4181, 7860.4194],
        [2343, 6.1352, 3930.2097],
        [1324, 0.7425, 11506.7698],
        [1273, 2.0371, 529.691],
        [1199, 1.1096, 1577.3435],
        [990, 5.233, 5884.927],
        [902, 2.045, 26.298],
        [857, 3.508, 398.149],
        [780, 1.179, 5223.694],
        [753, 2.533, 5507.553],
        [505, 4.583, 18849.228],
        [492, 4.205, 775.523],
        [357, 2.92, 0.067],
        [317, 5.849, 11790.629],
        [284, 1.899, 796.298],
        [271, 0.315, 10977.079],
        [243, 0.345, 5486.778],
        [206, 4.806, 2544.314],
        [205, 1.869, 5573.143],
        [202, 2.458, 6069.777],
        [156, 0.833, 213.299],
        [132, 3.411, 2942.463],
        [126, 1.083, 20.775],
        [115, 0.645, 0.98],
        [103, 0.636, 4694.003],
        [102, 0.976, 15720.839],
        [102, 4.267, 7.114],
        [99, 6.21, 2146.17],
        [98, 0.68, 155.42],
        [86, 5.98, 161000.69],
        [85, 1.3, 6275.96],
        [85, 3.67, 71430.7],
        [80, 1.81, 17260.15],
        [79, 3.04, 12036.46],
        [75, 1.76, 5088.63],
        [74, 3.5, 3154.69],
        [74, 4.68, 801.82],
        [70, 0.83, 9437.76],
        [62, 3.98, 8827.39],
        [61, 1.82, 7084.9],
        [57, 2.78, 6286.6],
        [56, 4.39, 14143.5],
        [56, 3.47, 6279.55],
        [52, 0.19, 12139.55],
        [52, 1.33, 1748.02],
        [51, 0.28, 5856.48],
        [49, 0.49, 1194.45],
        [41, 5.37, 8429.24],
        [41, 2.4, 19651.05],
        [39, 6.17, 10447.39],
        [37, 6.04, 10213.29],
        [37, 2.57, 1059.38],
        [36, 1.71, 2352.87],
        [36, 1.78, 6812.77],
        [33, 0.59, 17789.85],
        [30, 0.44, 83996.85],
        [30, 2.74, 1349.87],
        [25, 3.16, 4690.48],
    ],
    [
        [628331966747, 0, 0],
        [206059, 2.678235, 6283.07585],
        [4303, 2.6351, 12566.1517],
        [425, 1.59, 3.523],
        [119, 5.796, 26.298],
        [109, 2.966, 1577.344],
        [93, 2.59, 18849.23],
        [72, 1.14, 529.69],
        [68, 1.87, 398.15],
        [67, 4.41, 5507.55],
        [59, 2.89, 5223.69],
        [56, 2.17, 155.42],
        [45, 0.4, 796.3],
        [36, 0.47, 775.52],
        [29, 2.65, 7.11],
        [21, 5.34, 0.98],
        [19, 1.85, 5486.78],
        [19, 4.97, 213.3],
        [17, 2.99, 6275.96],
        [16, 0.03, 2544.31],
        [16, 1.43, 2146.17],
        [15, 1.21, 10977.08],
        [12, 2.83, 1748.02],
        [12, 3.26, 5088.63],
        [12, 5.27, 1194.45],
        [12, 2.08, 4694],
        [11, 0.77, 553.57],
        [10, 1.3, 6286.6],
        [10, 4.24, 1349.87],
        [9, 2.7, 242.73],
        [9, 5.64, 951.72],
        [8, 5.3, 2352.87],
        [6, 2.65, 9437.76],
        [6, 4.67, 4690.48],
    ],
    [
        [52919, 0, 0],
        [8720, 1.0721, 6283.0758],
        [309, 0.867, 12566.152],
        [27, 0.05, 3.52],
        [16, 5.19, 26.3],
        [16, 3.68, 155.42],
        [10, 0.76, 18849.23],
        [9, 2.06, 77713.77],
        [7, 0.83, 775.52],
        [5, 4.66, 1577.34],
        [4, 1.03, 7.11],
        [4, 3.44, 5573.14],
        [3, 5.14, 796.3],
        [3, 6.05, 5507.55],
        [3, 1.19, 242.73],
        [3, 6.12, 529.69],
        [3, 0.31, 398.15],
        [3, 2.28, 553.57],
        [2, 4.38, 5223.69],
        [2, 3.75, 0.98],
    ],
    [
        [289, 5.844, 6283.076],
        [35, 0, 0],
        [17, 5.49, 12566.15],
        [3, 5.2, 155.42],
        [1, 4.72, 3.52],
        [1, 5.3, 18849.23],
        [1, 5.97, 242.73],
    ],
    [
        [114, 3.142, 0],
        [8, 4.13, 6283.08],
        [1, 3.84, 12566.15],
    ],
    [[1, 3.14, 0]],
];
const MOON_LR_TERMS = [
    [0, 0, 1, 0, 6288774, -20905355],
    [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888],
    [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158],
    [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620],
    [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755],
    [2, 0, 0, -2, 15327, 10321],
    [0, 0, 1, 2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782],
    [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636],
    [2, 1, -1, 0, -7888, 24208],
    [2, 1, 0, 0, -6766, 30824],
    [1, 0, -1, 0, -5163, -8379],
    [1, 1, 0, 0, 4987, -16675],
    [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445],
    [4, 0, 0, 0, 3861, -11650],
    [2, 0, -3, 0, 3665, 14403],
    [0, 1, -2, 0, -2689, -7003],
    [2, 0, -1, 2, -2602, 0],
    [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322],
    [2, -2, 0, 0, 2236, -9884],
    [0, 1, 2, 0, -2120, 5751],
    [0, 2, 0, 0, -2069, 0],
    [2, -2, -1, 0, 2048, -4950],
    [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0],
    [4, -1, -1, 0, 1215, -3958],
    [0, 0, 2, 2, -1110, 0],
    [3, 0, -1, 0, -892, 3258],
    [2, 1, 1, 0, -810, 2616],
    [4, -1, -2, 0, 759, -1897],
    [0, 2, -1, 0, -713, -2117],
    [2, 2, -1, 0, -700, 2354],
    [2, 1, -2, 0, 691, 0],
    [2, -1, 0, -2, 596, 0],
    [4, 0, 1, 0, 549, -1423],
    [0, 0, 4, 0, 537, -1117],
    [4, -1, 0, 0, 520, -1571],
    [1, 0, -2, 0, -487, -1739],
    [2, 1, 0, -2, -399, 0],
    [0, 0, 2, -2, -381, -4421],
    [1, 1, 1, 0, 351, 0],
    [3, 0, -2, 0, -340, 0],
    [4, 0, -3, 0, 330, 0],
    [2, -1, 2, 0, 327, 0],
    [0, 2, 1, 0, -323, 1165],
    [1, 1, -1, 0, 299, 0],
    [2, 0, 3, 0, 294, 0],
    [2, 0, -1, -2, 0, 8752],
];
const MOON_B_TERMS = [
    [0, 0, 0, 1, 5128122],
    [0, 0, 1, 1, 280602],
    [0, 0, 1, -1, 277693],
    [2, 0, 0, -1, 173237],
    [2, 0, -1, 1, 55413],
    [2, 0, -1, -1, 46271],
    [2, 0, 0, 1, 32573],
    [0, 0, 2, 1, 17198],
    [2, 0, 1, -1, 9266],
    [0, 0, 2, -1, 8822],
    [2, -1, 0, -1, 8216],
    [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200],
    [2, 1, 0, -1, -3359],
    [2, -1, -1, 1, 2463],
    [2, -1, 0, 1, 2211],
    [2, -1, -1, -1, 2065],
    [0, 1, -1, -1, -1870],
    [4, 0, -1, -1, 1828],
    [0, 1, 0, 1, -1794],
    [0, 0, 0, 3, -1749],
    [0, 1, -1, 1, -1565],
    [1, 0, 0, 1, -1491],
    [0, 1, 1, 1, -1475],
    [0, 1, 1, -1, -1410],
    [0, 1, 0, -1, -1344],
    [1, 0, 0, -1, -1335],
    [0, 0, 3, 1, 1107],
    [4, 0, 0, -1, 1021],
    [4, 0, -1, 1, 833],
    [0, 0, 1, -3, 777],
    [4, 0, -2, 1, 671],
    [2, 0, 0, -3, 607],
    [2, 0, 2, -1, 596],
    [2, -1, 1, -1, 491],
    [2, 0, -2, 1, -451],
    [0, 0, 3, -1, 439],
    [2, 0, 2, 1, 422],
    [2, 0, -3, -1, 421],
    [2, 1, -1, 1, -366],
    [2, 1, 0, 1, -351],
    [4, 0, 0, 1, 331],
    [2, -1, 1, 1, 315],
    [2, -2, 0, -1, 302],
    [0, 0, 1, 3, -283],
    [2, 1, 1, -1, -229],
    [1, 1, 0, -1, 223],
    [1, 1, 0, 1, 223],
    [0, 1, -2, -1, -220],
    [2, 1, -1, -1, -220],
    [1, 0, 1, 1, -185],
    [2, -1, -2, -1, 181],
    [0, 1, 2, 1, -177],
    [4, 0, -2, -1, 176],
    [4, -1, -1, -1, 166],
    [1, 0, 1, -1, -164],
    [4, 0, 1, -1, 132],
    [1, 0, -1, -1, -119],
    [4, -1, 0, -1, 115],
    [2, -2, 0, 1, 107],
];
function mod(a, b) {
    a = +a;
    b = +b;
    return ((a % b) + b) % b;
}
function signed_degree_diff(a, b) {
    return mod(a - b + 180, 360) - 180;
}
function julian_day(utc) {
    return utc / MSEC_PER_DAY + 2440587.5;
}
function utc_year(utc) {
    const date = new Date(utc);
    const year = date.getUTCFullYear();
    const start = Date.UTC(year, 0, 1);
    const next = Date.UTC(year + 1, 0, 1);
    return year + (utc - start) / (next - start);
}
function delta_t_sec(utc) {
    const year = utc_year(utc);
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
}
function sin_deg(deg) {
    return Math.sin(deg * DEG_TO_RAD);
}
function cos_deg(deg) {
    return Math.cos(deg * DEG_TO_RAD);
}
function tan_deg(deg) {
    return Math.tan(deg * DEG_TO_RAD);
}
function asin_deg(value) {
    return Math.asin(Math.max(-1, Math.min(1, value))) * RAD_TO_DEG;
}
function acos_deg(value) {
    return Math.acos(Math.max(-1, Math.min(1, value))) * RAD_TO_DEG;
}
function atan2_deg(y, x) {
    return Math.atan2(y, x) * RAD_TO_DEG;
}
function mean_obliquity_deg(jde) {
    const T = (jde - 2451545.0) / 36525;
    const U = T / 100;
    const arcsec = 84381.448 -
        4680.93 * U -
        1.55 * U ** 2 +
        1999.25 * U ** 3 -
        51.38 * U ** 4 -
        249.67 * U ** 5 -
        39.05 * U ** 6 +
        7.12 * U ** 7 +
        27.87 * U ** 8 +
        5.79 * U ** 9 +
        2.45 * U ** 10;
    return arcsec / 3600;
}
function true_obliquity_deg(jde) {
    const T = (jde - 2451545.0) / 36525;
    const omega = 125.04 - 1934.136 * T;
    return mean_obliquity_deg(jde) + 0.00256 * cos_deg(omega);
}
function greenwich_apparent_sidereal_time_deg(utc) {
    const jd = julian_day(utc);
    const T = (jd - 2451545.0) / 36525;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
    const jde = jd + delta_t_sec(utc) / 86400;
    const omega = 125.04 - 1934.136 * ((jde - 2451545.0) / 36525);
    const nutationLongitudeDeg = -0.00478 * sin_deg(omega);
    return mod(gmst + nutationLongitudeDeg * cos_deg(true_obliquity_deg(jde)), 360);
}
function local_horizontal_from_equatorial(utc, latitudeDeg, longitudeDeg, rightAscensionDeg, declinationDeg) {
    const hourAngleDeg = signed_degree_diff(greenwich_apparent_sidereal_time_deg(utc) + longitudeDeg, rightAscensionDeg);
    const altitudeDeg = asin_deg(sin_deg(latitudeDeg) * sin_deg(declinationDeg) +
        cos_deg(latitudeDeg) * cos_deg(declinationDeg) * cos_deg(hourAngleDeg));
    const azimuthDeg = mod(atan2_deg(sin_deg(hourAngleDeg), cos_deg(hourAngleDeg) * sin_deg(latitudeDeg) - tan_deg(declinationDeg) * cos_deg(latitudeDeg)) + 180, 360);
    return { altitudeDeg, azimuthDeg, hourAngleDeg };
}
function jde_to_utc(jde) {
    let utc = (jde - 2440587.5) * MSEC_PER_DAY;
    for (let i = 0; i < 3; i++) {
        utc = (jde - 2440587.5) * MSEC_PER_DAY - delta_t_sec(utc) * 1000;
    }
    return Math.round(utc);
}
class EarthSolarOrbital {
    static { this.sun = [null, null, null]; }
    static { this.meanSolarDayMsec = MSEC_PER_DAY; }
    static { this.rotationEpochMsec = 0; }
    static { this.axialTiltDeg = 23.4397; }
    static { this.meanTropicalYearMsec = 31556925147; }
    static { this.vernalEquinoxEpochMsec = 1553119080000; }
    constructor({ periodMsec = EarthSolarOrbital.meanTropicalYearMsec, epochMsec = EarthSolarOrbital.vernalEquinoxEpochMsec, } = {}) {
        this.periodMsec = periodMsec;
        this.epochMsec = epochMsec;
    }
    static rotation() {
        return [
            EarthSolarOrbital.meanSolarDayMsec,
            EarthSolarOrbital.rotationEpochMsec,
            EarthSolarOrbital.axialTiltDeg,
        ];
    }
    static planet(center = EarthSolarOrbital.sun, options = {}) {
        return [center, new EarthSolarOrbital(options), EarthSolarOrbital.rotation()];
    }
    solarLongitudeDeg(utc) {
        const jde = julian_day(utc) + delta_t_sec(utc) / 86400;
        const tau = (jde - 2451545.0) / 365250;
        let earthLongitude = 0;
        let tauPower = 1;
        for (const terms of EARTH_L_TERMS) {
            let sum = 0;
            for (const [amplitude, phase, frequency] of terms) {
                sum += amplitude * Math.cos(phase + frequency * tau);
            }
            earthLongitude += sum * tauPower;
            tauPower *= tau;
        }
        const T = (jde - 2451545.0) / 36525;
        const omega = (125.04 - 1934.136 * T) * DEG_TO_RAD;
        return mod((earthLongitude / 1e8) * RAD_TO_DEG + 180 - 0.00569 - 0.00478 * Math.sin(omega), 360);
    }
    solarEquatorial(utc) {
        const jde = julian_day(utc) + delta_t_sec(utc) / 86400;
        const longitudeDeg = this.solarLongitudeDeg(utc);
        const obliquityDeg = true_obliquity_deg(jde);
        const rightAscensionDeg = mod(atan2_deg(cos_deg(obliquityDeg) * sin_deg(longitudeDeg), cos_deg(longitudeDeg)), 360);
        const declinationDeg = asin_deg(sin_deg(obliquityDeg) * sin_deg(longitudeDeg));
        return { longitudeDeg, rightAscensionDeg, declinationDeg, obliquityDeg };
    }
    solarHorizontal(utc, latitudeDeg, longitudeDeg) {
        const equatorial = this.solarEquatorial(utc);
        const horizontal = local_horizontal_from_equatorial(utc, latitudeDeg, longitudeDeg, equatorial.rightAscensionDeg, equatorial.declinationDeg);
        return { ...equatorial, ...horizontal };
    }
    solarEvents(utc, options) {
        const { latitudeDeg, longitudeDeg, timezoneDeg = longitudeDeg, horizonDeg = -50 / 60 } = options;
        const timezoneMsec = (timezoneDeg / 360) * MSEC_PER_DAY;
        const dayStartUtc = options.dayStartUtc ??
            Math.floor((utc + timezoneMsec) / MSEC_PER_DAY) * MSEC_PER_DAY - timezoneMsec;
        const dayCenterUtc = options.dayCenterUtc ?? dayStartUtc + MSEC_PER_DAY / 2;
        const transitAt = this.timeOfSolarHourAngle(0, dayCenterUtc, latitudeDeg, longitudeDeg);
        const midnightAt = this.timeOfSolarHourAngle(180, transitAt - MSEC_PER_DAY / 2, latitudeDeg, longitudeDeg);
        const transit = this.solarHorizontal(transitAt, latitudeDeg, longitudeDeg);
        const hourAngleDeg = this.riseSetHourAngleDeg(latitudeDeg, transit.declinationDeg, horizonDeg);
        const riseAt = Number.isNaN(hourAngleDeg)
            ? NaN
            : this.timeOfSolarAltitude(transitAt - (hourAngleDeg / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY, latitudeDeg, longitudeDeg, horizonDeg);
        const setAt = Number.isNaN(hourAngleDeg)
            ? NaN
            : this.timeOfSolarAltitude(transitAt + (hourAngleDeg / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY, latitudeDeg, longitudeDeg, horizonDeg);
        const rise = Number.isNaN(riseAt)
            ? undefined
            : this.solarHorizontal(riseAt, latitudeDeg, longitudeDeg);
        const set = Number.isNaN(setAt)
            ? undefined
            : this.solarHorizontal(setAt, latitudeDeg, longitudeDeg);
        const directionDeg = rise?.azimuthDeg ?? NaN;
        return {
            K: transit.obliquityDeg * DEG_TO_RAD,
            lat: latitudeDeg * DEG_TO_RAD,
            時角: hourAngleDeg * DEG_TO_RAD,
            方向: directionDeg * DEG_TO_RAD,
            高度: horizonDeg * DEG_TO_RAD,
            真夜中: midnightAt,
            日の出: riseAt,
            南中時刻: transitAt,
            日の入: setAt,
            日の出方位: directionDeg * DEG_TO_RAD,
            日の入方位: (set?.azimuthDeg ?? NaN) * DEG_TO_RAD,
            南中高度: transit.altitudeDeg * DEG_TO_RAD,
        };
    }
    riseSetHourAngleDeg(latitudeDeg, declinationDeg, horizonDeg) {
        const value = (sin_deg(horizonDeg) - sin_deg(latitudeDeg) * sin_deg(declinationDeg)) /
            (cos_deg(latitudeDeg) * cos_deg(declinationDeg));
        if (value < -1 || 1 < value)
            return NaN;
        return acos_deg(value);
    }
    timeOfSolarHourAngle(targetDeg, near, latitudeDeg, longitudeDeg) {
        let at = near;
        for (let i = 0; i < 8; i++) {
            const { hourAngleDeg } = this.solarHorizontal(at, latitudeDeg, longitudeDeg);
            const diff = signed_degree_diff(hourAngleDeg, targetDeg);
            at -= (diff / SOLAR_HOUR_ANGLE_DEG_PER_DAY) * MSEC_PER_DAY;
            if (Math.abs(diff) < 1e-7)
                break;
        }
        return Math.round(at);
    }
    timeOfSolarAltitude(near, latitudeDeg, longitudeDeg, altitudeDeg) {
        let at = near;
        for (let i = 0; i < 8; i++) {
            const altitude = this.solarHorizontal(at, latitudeDeg, longitudeDeg).altitudeDeg;
            const diff = altitude - altitudeDeg;
            if (Math.abs(diff) < 1e-7)
                break;
            const before = this.solarHorizontal(at - 60000, latitudeDeg, longitudeDeg).altitudeDeg;
            const after = this.solarHorizontal(at + 60000, latitudeDeg, longitudeDeg).altitudeDeg;
            const rate = (after - before) / 120000;
            if (!Number.isFinite(rate) || Math.abs(rate) < 1e-10)
                break;
            const correction = Math.max(-7200000, Math.min(7200000, diff / rate));
            at -= correction;
        }
        return Math.round(at);
    }
    phaseAt(utc) {
        return this.solarLongitudeDeg(utc) / 360;
    }
    timeOfPhase(phase, near) {
        const target = mod(phase, 1) * 360;
        let at = near;
        for (let i = 0; i < 8; i++) {
            const diff = signed_degree_diff(this.solarLongitudeDeg(at), target);
            at -= (diff / 360) * this.periodMsec;
            if (Math.abs(diff) < 1e-8)
                break;
        }
        return Math.round(at);
    }
}
exports.EarthSolarOrbital = EarthSolarOrbital;
class EarthMoonOrbital {
    static { this.meanSynodicMonthMsec = 2551442889; }
    static { this.newMoonEpochMsec = 1577310360000; }
    static { this.rotationAxialTiltDeg = 6.68; }
    constructor({ periodMsec = EarthMoonOrbital.meanSynodicMonthMsec, epochMsec = EarthMoonOrbital.newMoonEpochMsec, } = {}) {
        this.periodMsec = periodMsec;
        this.epochMsec = epochMsec;
    }
    static rotation() {
        return [EarthMoonOrbital.meanSynodicMonthMsec, 0, EarthMoonOrbital.rotationAxialTiltDeg];
    }
    static satellite(center, options = {}) {
        return [center, new EarthMoonOrbital(options), EarthMoonOrbital.rotation()];
    }
    lunarEquatorial(utc) {
        const jde = julian_day(utc) + delta_t_sec(utc) / 86400;
        const T = (jde - 2451545.0) / 36525;
        const T2 = T * T;
        const T3 = T2 * T;
        const T4 = T3 * T;
        const Lp = mod(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000, 360);
        const D = mod(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000, 360);
        const M = mod(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000, 360);
        const Mp = mod(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000, 360);
        const F = mod(93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000, 360);
        const A1 = 119.75 + 131.849 * T;
        const A2 = 53.09 + 479264.29 * T;
        const A3 = 313.45 + 481266.484 * T;
        const E = 1 - 0.002516 * T - 0.0000074 * T2;
        let sigmaL = 0;
        let sigmaR = 0;
        for (const [d, m, mp, f, l, r] of MOON_LR_TERMS) {
            const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
            const argument = d * D + m * M + mp * Mp + f * F;
            sigmaL += e * l * sin_deg(argument);
            sigmaR += e * r * cos_deg(argument);
        }
        sigmaL += 3958 * sin_deg(A1) + 1962 * sin_deg(Lp - F) + 318 * sin_deg(A2);
        let sigmaB = 0;
        for (const [d, m, mp, f, b] of MOON_B_TERMS) {
            const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
            sigmaB += e * b * sin_deg(d * D + m * M + mp * Mp + f * F);
        }
        sigmaB +=
            -2235 * sin_deg(Lp) +
                382 * sin_deg(A3) +
                175 * sin_deg(A1 - F) +
                175 * sin_deg(A1 + F) +
                127 * sin_deg(Lp - Mp) -
                115 * sin_deg(Lp + Mp);
        const longitudeDeg = mod(Lp + sigmaL / 1000000, 360);
        const latitudeDeg = sigmaB / 1000000;
        const distanceKm = 385000.56 + sigmaR / 1000;
        const obliquityDeg = true_obliquity_deg(jde);
        const rightAscensionDeg = mod(atan2_deg(sin_deg(longitudeDeg) * cos_deg(obliquityDeg) - tan_deg(latitudeDeg) * sin_deg(obliquityDeg), cos_deg(longitudeDeg)), 360);
        const declinationDeg = asin_deg(sin_deg(latitudeDeg) * cos_deg(obliquityDeg) +
            cos_deg(latitudeDeg) * sin_deg(obliquityDeg) * sin_deg(longitudeDeg));
        const horizontalParallaxDeg = asin_deg(EARTH_EQUATORIAL_RADIUS_KM / distanceKm);
        return {
            longitudeDeg,
            latitudeDeg,
            distanceKm,
            rightAscensionDeg,
            declinationDeg,
            horizontalParallaxDeg,
            obliquityDeg,
        };
    }
    lunarHorizontal(utc, latitudeDeg, longitudeDeg, heightM = 0) {
        const equatorial = this.lunarEquatorial(utc);
        const siderealDeg = greenwich_apparent_sidereal_time_deg(utc) + longitudeDeg;
        const hourAngleDeg = signed_degree_diff(siderealDeg, equatorial.rightAscensionDeg);
        const u = Math.atan(0.99664719 * Math.tan(latitudeDeg * DEG_TO_RAD));
        const heightKm = heightM / 1000;
        const rhoSinPhiPrime = 0.99664719 * Math.sin(u) + (heightKm / EARTH_EQUATORIAL_RADIUS_KM) * sin_deg(latitudeDeg);
        const rhoCosPhiPrime = Math.cos(u) + (heightKm / EARTH_EQUATORIAL_RADIUS_KM) * cos_deg(latitudeDeg);
        const parallaxRad = equatorial.horizontalParallaxDeg * DEG_TO_RAD;
        const hourAngleRad = hourAngleDeg * DEG_TO_RAD;
        const declinationRad = equatorial.declinationDeg * DEG_TO_RAD;
        const deltaAlphaRad = Math.atan2(-rhoCosPhiPrime * Math.sin(parallaxRad) * Math.sin(hourAngleRad), Math.cos(declinationRad) - rhoCosPhiPrime * Math.sin(parallaxRad) * Math.cos(hourAngleRad));
        const topocentricRightAscensionDeg = mod(equatorial.rightAscensionDeg + deltaAlphaRad * RAD_TO_DEG, 360);
        const topocentricDeclinationDeg = atan2_deg((Math.sin(declinationRad) - rhoSinPhiPrime * Math.sin(parallaxRad)) * Math.cos(deltaAlphaRad), Math.cos(declinationRad) - rhoCosPhiPrime * Math.sin(parallaxRad) * Math.cos(hourAngleRad));
        const horizontal = local_horizontal_from_equatorial(utc, latitudeDeg, longitudeDeg, topocentricRightAscensionDeg, topocentricDeclinationDeg);
        return {
            ...equatorial,
            ...horizontal,
            topocentricRightAscensionDeg,
            topocentricDeclinationDeg,
        };
    }
    lunarEvents(utc, options) {
        const { latitudeDeg, longitudeDeg, timezoneDeg = longitudeDeg, heightM = 0, horizonDeg = -34 / 60, } = options;
        const timezoneMsec = (timezoneDeg / 360) * MSEC_PER_DAY;
        const dayStartUtc = options.dayStartUtc ?? Math.floor((utc + timezoneMsec) / MSEC_PER_DAY) * MSEC_PER_DAY - timezoneMsec;
        const samples = this.lunarSamples(dayStartUtc, latitudeDeg, longitudeDeg, heightM);
        const moonrise = this.findAltitudeEvent(samples, horizonDeg, 1, horizonDeg, latitudeDeg, longitudeDeg, heightM);
        const moonset = this.findAltitudeEvent(samples, horizonDeg, -1, horizonDeg, latitudeDeg, longitudeDeg, heightM);
        const transit = this.findTransitEvent(samples, latitudeDeg, longitudeDeg, heightM);
        const rise = Number.isNaN(moonrise) ? undefined : this.lunarHorizontal(moonrise, latitudeDeg, longitudeDeg, heightM);
        const set = Number.isNaN(moonset) ? undefined : this.lunarHorizontal(moonset, latitudeDeg, longitudeDeg, heightM);
        const transitHorizontal = Number.isNaN(transit)
            ? undefined
            : this.lunarHorizontal(transit, latitudeDeg, longitudeDeg, heightM);
        return {
            月の出: moonrise,
            南中時刻: transit,
            月の入: moonset,
            月の出方位: (rise?.azimuthDeg ?? NaN) * DEG_TO_RAD,
            月の入方位: (set?.azimuthDeg ?? NaN) * DEG_TO_RAD,
            南中高度: (transitHorizontal?.altitudeDeg ?? NaN) * DEG_TO_RAD,
        };
    }
    lunarSamples(dayStartUtc, latitudeDeg, longitudeDeg, heightM) {
        const samples = [];
        for (let i = 0; i <= 24; i++) {
            const at = dayStartUtc + i * 60 * MSEC_PER_MINUTE;
            const { altitudeDeg, hourAngleDeg } = this.lunarHorizontal(at, latitudeDeg, longitudeDeg, heightM);
            samples.push({ at, altitudeDeg, hourAngleDeg });
        }
        return samples;
    }
    findAltitudeEvent(samples, targetDeg, direction, horizonDeg, latitudeDeg, longitudeDeg, heightM) {
        for (let i = 1; i < samples.length; i++) {
            const prev = samples[i - 1];
            const next = samples[i];
            const prevAltitude = prev.altitudeDeg - targetDeg;
            const nextAltitude = next.altitudeDeg - targetDeg;
            if (prevAltitude === 0 || prevAltitude * nextAltitude <= 0) {
                if (direction === 1 && nextAltitude < prevAltitude)
                    continue;
                if (direction === -1 && prevAltitude < nextAltitude)
                    continue;
                return this.timeOfLunarAltitude(prev.at, next.at, horizonDeg, latitudeDeg, longitudeDeg, heightM);
            }
        }
        return NaN;
    }
    findTransitEvent(samples, latitudeDeg, longitudeDeg, heightM) {
        for (let i = 1; i < samples.length; i++) {
            const prev = samples[i - 1];
            const next = samples[i];
            if (prev.hourAngleDeg <= 0 && 0 < next.hourAngleDeg) {
                return this.timeOfLunarHourAngle(prev.at, next.at, 0, latitudeDeg, longitudeDeg, heightM);
            }
        }
        return NaN;
    }
    timeOfLunarAltitude(from, to, altitudeDeg, latitudeDeg, longitudeDeg, heightM) {
        let start = from;
        let end = to;
        let startAltitude = this.lunarHorizontal(start, latitudeDeg, longitudeDeg, heightM).altitudeDeg - altitudeDeg;
        for (let i = 0; i < 32; i++) {
            const middle = (start + end) / 2;
            const middleAltitude = this.lunarHorizontal(middle, latitudeDeg, longitudeDeg, heightM).altitudeDeg - altitudeDeg;
            if (Math.abs(end - start) < 500)
                return Math.round(middle);
            if (startAltitude * middleAltitude <= 0) {
                end = middle;
            }
            else {
                start = middle;
                startAltitude = middleAltitude;
            }
        }
        return Math.round((start + end) / 2);
    }
    timeOfLunarHourAngle(from, to, targetDeg, latitudeDeg, longitudeDeg, heightM) {
        let start = from;
        let end = to;
        let startDiff = signed_degree_diff(this.lunarHorizontal(start, latitudeDeg, longitudeDeg, heightM).hourAngleDeg, targetDeg);
        for (let i = 0; i < 32; i++) {
            const middle = (start + end) / 2;
            const middleDiff = signed_degree_diff(this.lunarHorizontal(middle, latitudeDeg, longitudeDeg, heightM).hourAngleDeg, targetDeg);
            if (Math.abs(end - start) < 500)
                return Math.round(middle);
            if (startDiff * middleDiff <= 0) {
                end = middle;
            }
            else {
                start = middle;
                startDiff = middleDiff;
            }
        }
        return Math.round((start + end) / 2);
    }
    phaseAt(utc) {
        return mod((utc - this.epochMsec) / this.periodMsec, 1);
    }
    timeOfPhase(phase, near) {
        const k = this.nearestLunation(phase, near);
        return jde_to_utc(this.phaseJde(k));
    }
    nearestLunation(phase, near) {
        const jde = julian_day(near) + delta_t_sec(near) / 86400;
        return Math.round((jde - 2451550.09766) / 29.530588861 - phase) + phase;
    }
    phaseJde(k) {
        const T = k / 1236.85;
        const T2 = T * T;
        const T3 = T2 * T;
        const T4 = T3 * T;
        const E = 1 - 0.002516 * T - 0.0000074 * T2;
        const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
        const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
        const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
        const Omega = 124.7746 - 1.5637558 * k + 0.0020691 * T2 + 0.00000215 * T3;
        let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
        jde += this.phaseCorrection(mod(k, 1), E, M, Mp, F, Omega);
        jde += this.additionalCorrection(k, T);
        return jde;
    }
    phaseCorrection(phase, E, M, Mp, F, Omega) {
        if (phase < 0.125 || 0.875 < phase) {
            return this.newOrFullCorrection(E, M, Mp, F, Omega, false);
        }
        if (0.375 < phase && phase < 0.625) {
            return this.newOrFullCorrection(E, M, Mp, F, Omega, true);
        }
        const correction = -0.62801 * sin_deg(Mp) +
            0.17172 * E * sin_deg(M) -
            0.01183 * E * sin_deg(Mp + M) +
            0.00862 * sin_deg(2 * Mp) +
            0.00804 * sin_deg(2 * F) +
            0.00454 * E * sin_deg(Mp - M) +
            0.00204 * E * E * sin_deg(2 * M) -
            0.0018 * sin_deg(Mp - 2 * F) -
            0.0007 * sin_deg(Mp + 2 * F) -
            0.0004 * sin_deg(3 * Mp) -
            0.00034 * E * sin_deg(2 * Mp - M) +
            0.00032 * E * sin_deg(M + 2 * F) +
            0.00032 * E * sin_deg(M - 2 * F) -
            0.00028 * E * E * sin_deg(Mp + 2 * M) +
            0.00027 * E * sin_deg(2 * Mp + M) -
            0.00017 * sin_deg(Omega) -
            0.00005 * sin_deg(Mp - M - 2 * F) +
            0.00004 * sin_deg(2 * Mp + 2 * F) -
            0.00004 * sin_deg(Mp + M + 2 * F) +
            0.00004 * sin_deg(Mp - 2 * M) +
            0.00003 * sin_deg(Mp + M - 2 * F) +
            0.00003 * sin_deg(3 * M) +
            0.00002 * sin_deg(2 * Mp - 2 * F) +
            0.00002 * sin_deg(Mp - M + 2 * F) -
            0.00002 * sin_deg(3 * Mp + M);
        const w = 0.00306 -
            0.00038 * E * cos_deg(M) +
            0.00026 * cos_deg(Mp) -
            0.00002 * cos_deg(Mp - M) +
            0.00002 * cos_deg(Mp + M) +
            0.00002 * cos_deg(2 * F);
        return phase < 0.5 ? correction + w : correction - w;
    }
    newOrFullCorrection(E, M, Mp, F, Omega, isFullMoon) {
        return ((isFullMoon ? -0.40614 : -0.4072) * sin_deg(Mp) +
            (isFullMoon ? 0.17302 : 0.17241) * E * sin_deg(M) +
            (isFullMoon ? 0.01614 : 0.01608) * sin_deg(2 * Mp) +
            (isFullMoon ? 0.01043 : 0.01039) * sin_deg(2 * F) +
            (isFullMoon ? 0.00734 : 0.00739) * E * sin_deg(Mp - M) -
            0.00514 * E * sin_deg(Mp + M) +
            0.00208 * E * E * sin_deg(2 * M) -
            0.00111 * sin_deg(Mp - 2 * F) -
            0.00057 * sin_deg(Mp + 2 * F) +
            0.00056 * E * sin_deg(2 * Mp + M) -
            0.00042 * sin_deg(3 * Mp) +
            0.00042 * E * sin_deg(M + 2 * F) +
            0.00038 * E * sin_deg(M - 2 * F) -
            0.00024 * E * sin_deg(2 * Mp - M) -
            0.00017 * sin_deg(Omega) -
            0.00007 * sin_deg(Mp + 2 * M) +
            0.00004 * sin_deg(2 * Mp - 2 * F) +
            0.00004 * sin_deg(3 * M) +
            0.00003 * sin_deg(Mp + M - 2 * F) +
            0.00003 * sin_deg(2 * Mp + 2 * F) -
            0.00003 * sin_deg(Mp + M + 2 * F) +
            0.00003 * sin_deg(Mp - M + 2 * F) -
            0.00002 * sin_deg(Mp - M - 2 * F) -
            0.00002 * sin_deg(3 * Mp + M) +
            0.00002 * sin_deg(4 * Mp));
    }
    additionalCorrection(k, T) {
        const angles = [
            299.77 + 0.107408 * k - 0.009173 * T * T,
            251.88 + 0.016321 * k,
            251.83 + 26.651886 * k,
            349.42 + 36.412478 * k,
            84.66 + 18.206239 * k,
            141.74 + 53.303771 * k,
            207.14 + 2.453732 * k,
            154.84 + 7.30686 * k,
            34.52 + 27.261239 * k,
            207.19 + 0.121824 * k,
            291.34 + 1.844379 * k,
            161.72 + 24.198154 * k,
            239.56 + 25.513099 * k,
            331.55 + 3.592518 * k,
        ];
        const coefficients = [
            0.000325, 0.000165, 0.000164, 0.000126, 0.00011, 0.000062, 0.00006, 0.000056, 0.000047,
            0.000042, 0.00004, 0.000037, 0.000035, 0.000023,
        ];
        return angles.reduce((sum, angle, index) => sum + coefficients[index] * sin_deg(angle), 0);
    }
}
exports.EarthMoonOrbital = EarthMoonOrbital;
//# sourceMappingURL=naoj.js.map