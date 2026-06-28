"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solar_phase = solar_phase;
exports.solar_term = solar_term;
exports.solar_phase_before = solar_phase_before;
exports.solar_terms = solar_terms;
exports.noon = noon;
exports.solor = solor;
exports.雑節_by_phase = 雑節_by_phase;
exports.to_tempo_by_solor = to_tempo_by_solor;
const number_1 = require("../number");
const orbital_model_1 = require("../orbital-model");
const time_1 = require("../time");
function solar_phase(sunny, phase, near) {
    return sunny.timeOfPhase((0, number_1.mod)(phase, 1), near);
}
function solar_term(sunny, dayMsec, dayZero, utc, phase) {
    const at = solar_phase(sunny, phase, utc);
    return (0, time_1.to_tempo_bare)(dayMsec, dayZero, at);
}
function solar_phase_before(sunny, phase, utc) {
    let at = solar_phase(sunny, phase, utc);
    while (utc < at) {
        at = solar_phase(sunny, phase, at - sunny.periodMsec);
    }
    return at;
}
function solar_terms(sunny, dayMsec, dayZero, utc) {
    const phases = {
        立春: 1 / 8,
        入梅: 80 / 360,
        春分: 2 / 8,
        半夏生: 100 / 360,
        夏土用: 13 / 40,
        立夏: 3 / 8,
        夏至: 4 / 8,
        秋土用: 23 / 40,
        立秋: 5 / 8,
        秋分: 6 / 8,
        冬土用: 33 / 40,
        立冬: 7 / 8,
        冬至: 8 / 8,
        春土用: 43 / 40,
        次立春: 9 / 8,
    };
    const springEquinoxPhase = 2 / 8;
    const basePhase = phases.立春;
    const baseAt = solar_phase_before(sunny, basePhase - springEquinoxPhase, utc);
    const term = (phase) => {
        const near = baseAt + (phase - basePhase) * sunny.periodMsec;
        return solar_term(sunny, dayMsec, dayZero, near, phase - springEquinoxPhase);
    };
    return {
        立春: term(phases.立春),
        入梅: term(phases.入梅),
        春分: term(phases.春分),
        半夏生: term(phases.半夏生),
        夏土用: term(phases.夏土用),
        立夏: term(phases.立夏),
        夏至: term(phases.夏至),
        秋土用: term(phases.秋土用),
        立秋: term(phases.立秋),
        秋分: term(phases.秋分),
        冬土用: term(phases.冬土用),
        立冬: term(phases.立冬),
        冬至: term(phases.冬至),
        春土用: term(phases.春土用),
        次立春: term(phases.次立春),
    };
}
function noon(sunny, dayMsec, dayZero, yearMsec, seasonZero, utc, day = (0, time_1.to_tempo_bare)(dayMsec, dayZero, utc)) {
    const { last_at, center_at } = day;
    const { sin, PI } = Math;
    const deg_to_day = dayMsec / 360;
    const year_to_rad = (2 * PI) / yearMsec;
    const T0 = (0, time_1.to_tempo_bare)(yearMsec, seasonZero, utc);
    const 南中差分A = deg_to_day * 2.0 * sin(year_to_rad * T0.since);
    const 南中差分B = deg_to_day * 2.5 * sin(year_to_rad * T0.since * 2 + PI * 0.4);
    const 南中差分 = 南中差分A + 南中差分B;
    const 南中時刻 = center_at + 南中差分;
    const 真夜中 = last_at + 南中差分;
    const T1 = (0, time_1.to_tempo_bare)(yearMsec, sunny.epochMsec, 南中時刻);
    const 季節 = T1.since * year_to_rad;
    return { ...day, center_at, T0, T1, 季節, 南中差分, 南中時刻, 真夜中 };
}
function solor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, utc, idx = 2, solarNoon = noon(sunny, dayMsec, dayZero, yearMsec, seasonZero, utc)) {
    const days = [
        6,
        -18 / 60,
        -50 / 60,
        -6,
        -7.36,
        -12,
        -18,
    ];
    if ((0, orbital_model_1.hasSolarEvents)(sunny)) {
        return sunny.solarEvents(utc, {
            latitudeDeg: geo[0],
            longitudeDeg: geo[1],
            timezoneDeg: geo[2],
            horizonDeg: days[idx],
            dayStartUtc: solarNoon.last_at,
            dayCenterUtc: solarNoon.center_at,
        });
    }
    const { 季節, 南中時刻, 真夜中 } = solarNoon;
    const { asin, acos, atan, sin, cos, tan, PI } = Math;
    const deg_to_rad = (2 * PI) / 360;
    const rad_to_day = dayMsec / (2 * PI);
    const 高度 = days[idx] * deg_to_rad;
    const K = earthy.axialTiltDeg * deg_to_rad;
    const lat = geo[0] * deg_to_rad;
    const 赤緯 = asin(sin(K) * sin(季節));
    const 赤経 = atan(tan(季節) * cos(K));
    const 時角 = acos((sin(高度) - sin(lat) * sin(赤緯)) / (cos(lat) * cos(赤緯)));
    const 方向 = acos((cos(lat) * sin(赤緯) - sin(lat) * cos(赤緯) * cos(時角)) / cos(高度));
    const 日の出 = Math.floor(南中時刻 - 時角 * rad_to_day);
    const 日の入 = Math.floor(南中時刻 + 時角 * rad_to_day);
    return { K, lat, 時角, 方向, 高度, 真夜中, 日の出, 南中時刻, 日の入 };
}
function 雑節_by_phase(sunny, dayMsec, dayZero, day10Zero, stemLength, utc) {
    let { 立春, 入梅, 春分, 半夏生, 夏土用, 立夏, 夏至, 秋土用, 立秋, 秋分, 冬土用, 立冬, 冬至, 春土用, 次立春: 立春2, } = solar_terms(sunny, dayMsec, dayZero, utc);
    const [八十八夜, 二百十日, 二百二十日] = [88, 210, 220].map((n) => 立春.succ(n - 1));
    const [春彼岸, 秋彼岸] = [春分, 秋分].map((dd) => {
        return time_1.Tempo.join(dd.back(3), dd.succ(3));
    });
    const [春社日, 秋社日] = [春分, 秋分].map((dd) => {
        const C = (0, time_1.to_tempo_bare)(dayMsec, day10Zero, dd.write_at);
        C.now_idx = (0, number_1.mod)(C.now_idx, stemLength);
        return C.slide(stemLength / 2 - C.now_idx - 1);
    });
    const 春 = time_1.Tempo.join(立春, 夏土用.back());
    const 夏節分 = 立夏.back();
    const 夏 = time_1.Tempo.join(立夏, 秋土用.back());
    const 秋節分 = 立秋.back();
    const 秋 = time_1.Tempo.join(立秋, 冬土用.back());
    const 冬節分 = 立冬.back();
    const 冬 = time_1.Tempo.join(立冬, 春土用.back());
    const 春節分 = 立春2.back();
    const 節分 = 春節分;
    夏土用 = time_1.Tempo.join(夏土用, 夏節分);
    秋土用 = time_1.Tempo.join(秋土用, 秋節分);
    冬土用 = time_1.Tempo.join(冬土用, 冬節分);
    春土用 = time_1.Tempo.join(春土用, 立春2);
    return {
        立春,
        立夏,
        立秋,
        立冬,
        冬至,
        春分,
        夏至,
        秋分,
        入梅,
        半夏生,
        春,
        夏,
        秋,
        冬,
        春社日,
        秋社日,
        春土用,
        夏土用,
        秋土用,
        冬土用,
        春節分,
        夏節分,
        秋節分,
        冬節分,
        節分,
        春彼岸,
        秋彼岸,
        八十八夜,
        二百十日,
        二百二十日,
    };
}
function to_tempo_by_solor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, hourLength, utc, day) {
    let idx, end, start;
    const solarNoon = noon(sunny, dayMsec, dayZero, yearMsec, seasonZero, utc, day);
    const { 日の出, 南中時刻, 日の入 } = solor(sunny, earthy, geo, dayMsec, dayZero, yearMsec, seasonZero, utc, 4, solarNoon);
    const size = hourLength / 4;
    const list = [];
    let next_at = 0;
    let msec = (日の出 - day.last_at) / size;
    for (idx = 0, end = 1 * size; idx < end; idx++) {
        next_at += msec;
        list.push(Math.floor(next_at));
    }
    next_at = 日の出 - day.last_at;
    msec = (日の入 - 日の出) / (2 * size);
    for (start = 1 * size, idx = start, end = 3 * size; idx < end; idx++) {
        next_at += msec;
        list.push(Math.floor(next_at));
    }
    next_at = day.size;
    msec = (day.next_at - 日の入) / size;
    const tails = [];
    for (start = 3 * size, idx = start, end = 4 * size; idx < end; idx++) {
        tails.push(Math.ceil(next_at));
        next_at -= msec;
    }
    list.push(...tails.reverse());
    return (0, time_1.to_tempo_by)(list, day.last_at, utc);
}
//# sourceMappingURL=solar.js.map