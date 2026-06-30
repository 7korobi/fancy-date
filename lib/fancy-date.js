"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FancyDate = exports.prepareSpotModels = exports.prepareSpot = exports.transformOrbital = exports.TransformedOrbital = exports.MeanRotation = exports.MeanOrbital = exports.MarsSolarOrbital = exports.EarthSolarOrbital = exports.EarthMoonOrbital = void 0;
const tslib_1 = require("tslib");
const orbital_model_1 = require("./orbital-model");
const number_1 = require("./number");
const lunisolar_1 = require("./phenomena/lunisolar");
const solar_1 = require("./phenomena/solar");
const prepare_1 = require("./prepare");
const time_1 = require("./time");
var naoj_1 = require("./naoj");
Object.defineProperty(exports, "EarthMoonOrbital", { enumerable: true, get: function () { return naoj_1.EarthMoonOrbital; } });
Object.defineProperty(exports, "EarthSolarOrbital", { enumerable: true, get: function () { return naoj_1.EarthSolarOrbital; } });
var nasa_1 = require("./nasa");
Object.defineProperty(exports, "MarsSolarOrbital", { enumerable: true, get: function () { return nasa_1.MarsSolarOrbital; } });
var mean_1 = require("./mean");
Object.defineProperty(exports, "MeanOrbital", { enumerable: true, get: function () { return mean_1.MeanOrbital; } });
Object.defineProperty(exports, "MeanRotation", { enumerable: true, get: function () { return mean_1.MeanRotation; } });
Object.defineProperty(exports, "TransformedOrbital", { enumerable: true, get: function () { return mean_1.TransformedOrbital; } });
Object.defineProperty(exports, "transformOrbital", { enumerable: true, get: function () { return mean_1.transformOrbital; } });
var prepare_2 = require("./prepare");
Object.defineProperty(exports, "prepareSpot", { enumerable: true, get: function () { return prepare_2.prepareSpot; } });
Object.defineProperty(exports, "prepareSpotModels", { enumerable: true, get: function () { return prepare_2.prepareSpotModels; } });
tslib_1.__exportStar(require("./orbital-model"), exports);
const span_anchor = Symbol('span_anchor');
const core_tokens = 'GHMSdmpsy';
const main_tokens = 'ABCEFabcfx' + core_tokens;
const sub_tokens = 'DJNQVYZuw';
const all_tokens = main_tokens + sub_tokens;
const reg_token = /([ABCEFHMNQVZabcdfms][or]|([ABCDEFGHJMNQSVYZabcdfmpsuwxy])\2*)|''|'(''|[^'])+('|$)|./g;
function calc_set(path, o) {
    for (let key in o) {
        const val = o[key];
        if (val == null) {
            delete this.calc[path][key];
            continue;
        }
        this.calc[path][key] = val?.[path] || val;
    }
}
function sub_define(msec, size) {
    const range = [size];
    msec = msec / size;
    return { range, msec };
}
function daily_define(msec, day) {
    const range = [Math.floor(msec / day)];
    msec = range[0] * day;
    return { range, msec };
}
function daily_measure(msec, day) {
    const range = [Math.floor(msec / day), Math.ceil(msec / day)];
    return { range, msec };
}
function cloneValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => cloneValue(item));
    }
    if (value instanceof Date) {
        return new Date(value.getTime());
    }
    if (value && 'object' === typeof value) {
        const clone = Object.create(Object.getPrototypeOf(value));
        for (const key of Reflect.ownKeys(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (!descriptor)
                continue;
            if ('value' in descriptor) {
                descriptor.value = cloneValue(descriptor.value);
            }
            Object.defineProperty(clone, key, descriptor);
        }
        return clone;
    }
    return value;
}
function to_indexs(zero) {
    let A, a, b, B, c, C, d, D, E, f, F, G, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z;
    A =
        B =
            C =
                D =
                    E =
                        F =
                            G =
                                H =
                                    J =
                                        M =
                                            N =
                                                Q =
                                                    S =
                                                        V =
                                                            Y =
                                                                Z =
                                                                    a =
                                                                        b =
                                                                            c =
                                                                                d =
                                                                                    f =
                                                                                        m =
                                                                                            p =
                                                                                                s =
                                                                                                    u =
                                                                                                        w =
                                                                                                            x =
                                                                                                                y =
                                                                                                                    zero;
    return { A, B, C, D, E, F, G, H, J, M, N, Q, S, V, Y, Z, a, b, c, d, f, m, p, s, u, w, x, y };
}
const shift_up = function (a, b, size) {
    if (0 <= b && b <= size) {
        return arguments;
    }
    a += Math.floor(b / size);
    b = (0, number_1.mod)(b, size);
    return [a, b];
};
class Indexer {
    constructor(arg) {
        this.list = [];
        this.rubys = [];
        this.length = 0;
        this.zero = 0;
        this.regex = '';
        this.regex_o = '';
        this.to_idx = () => 0;
        this.to_value = () => '';
        this.to_label = () => '';
        this.to_ruby = () => '';
        const [list, rubys, relatives] = arg;
        const [zero] = arg.slice(-1);
        if (list instanceof Array) {
            this.list = list;
            this.length = list.length;
        }
        if ('number' === typeof list) {
            this.length = list;
        }
        if (rubys instanceof Array && rubys.length === this.length) {
            this.rubys = rubys;
        }
        if (relatives instanceof Array && relatives.length === this.length) {
            Object.defineProperty(this, 'relatives', {
                configurable: true,
                enumerable: false,
                value: relatives,
                writable: false,
            });
        }
        if ('string' === typeof relatives) {
            Object.defineProperty(this, 'relatives', {
                configurable: true,
                enumerable: false,
                value: relatives,
                writable: false,
            });
        }
        if ('number' === typeof zero) {
            this.zero = zero;
        }
    }
}
class FancyDate {
    constructor(o) {
        if (o) {
            ;
            ({ dic: this.dic, calc: this.calc } = cloneValue(o));
        }
        else {
            this.dic = {
                parse: 'y年M月d日',
                format: 'Gy年M月d日(E)H時m分s秒',
            };
            this.calc = {
                eras: [],
                idx: {},
                zero: {},
                msec: {},
                range: {},
            };
            [...all_tokens].map((key) => (this.dic[key] = new Indexer([])));
        }
    }
    spot(...spot) {
        Object.assign(this.dic, (0, prepare_1.prepareSpot)(...spot));
        return this;
    }
    lang(parse, format) {
        Object.assign(this.dic, { parse, format });
        return this;
    }
    era(era, past, eras = []) {
        const all_eras = [past, ...eras.map(([s]) => s)];
        this.dic.G = new Indexer([all_eras, null]);
        Object.assign(this.dic, { era, eras });
        return this;
    }
    calendar(start = ['1970-1-1 0:0:0', 'y-M-d H:m:s', 0], leaps = null, month_divs = null) {
        Object.assign(this.dic, { month_divs, leaps, start });
        return this;
    }
    algo(o) {
        for (let key in o) {
            const val = o[key];
            this.dic[key] = new Indexer(val);
        }
        // A B C a b c 日の不断、年の不断を構築
        if (o.C?.[0] instanceof Array && o.B?.[0] instanceof Array) {
            this.dic.c = new Indexer(o.C);
            this.dic.b = new Indexer(o.B);
            this.dic.C.zero = this.dic.B.zero = this.dic.A.zero;
            this.dic.c.zero = this.dic.b.zero = this.dic.a.zero;
        }
        const { A, B, C, a } = this.dic;
        if (C.list && B.list) {
            A.list = a.list = [...Array(A.length)].map((_, idx) => {
                const c = C.list[idx % C.length];
                const b = B.list[idx % B.length];
                return `${c}${b}`;
            });
        }
        if (C.rubys && B.rubys) {
            A.rubys = a.rubys = [...Array(a.length)].map((_, idx) => {
                const c = C.rubys[idx % C.length];
                const b = B.rubys[idx % B.length];
                return `${c.replace(/と$/, 'との')}${b}`;
            });
        }
        return this;
    }
    daily(is_solor = false) {
        this.dic.is_solor = !!is_solor;
        return this;
    }
    numeral(numeral = null) {
        this.dic.numeral = numeral;
        return this;
    }
    format_number(value, size, appendix = '') {
        const numeral = this.dic.numeral;
        if (numeral)
            return numeral.parse(value, appendix);
        return `${value}`.padStart(size, '0');
    }
    parse_number(text) {
        const numeric = Number(text);
        if (Number.isFinite(numeric))
            return numeric;
        const parsed = this.dic.numeral?.to_number?.(text);
        return parsed ?? numeric;
    }
    number_pattern(fallback = '\\d+') {
        const pattern = this.dic.numeral?.regex;
        return pattern ? `(?:${pattern}|${fallback})` : fallback;
    }
    init() {
        const { sunny, moony, earthy, leaps, month_divs } = this.dic;
        const year = daily_measure(sunny.periodMsec, earthy.periodMsec);
        const day = daily_define(earthy.periodMsec, earthy.periodMsec);
        const moon = moony ? daily_measure(moony.periodMsec, earthy.periodMsec) : undefined;
        calc_set.call(this, 'range', { year });
        calc_set.call(this, 'msec', { year, moon, day });
        this.is_table_leap = leaps != null;
        this.is_table_month = this.is_table_leap || month_divs != null;
        this.strategy = leaps != null ? 'SolarTable' : month_divs != null ? 'SeasonTable' : 'SolarLunar';
        this.def_regex();
        this.def_to_idx();
        this.def_to_label();
        this.def_calc();
        this.def_table();
        this.def_idx();
        this.def_zero();
        this.def_eras();
        return this;
    }
    yeary_table(utc) {
        return this.to_table(utc, 'y', 'M', true);
    }
    monthry_table(utc) {
        return this.to_table(utc, 'M', 'd', true);
    }
    weekly_table(utc) {
        return this.to_table(utc, 'w', 'd', true);
    }
    time_table(utc) {
        return this.to_table(utc, 'd', 'H');
    }
    solar_phase(phase, near) {
        return (0, solar_1.solar_phase)(this.dic.sunny, phase, near);
    }
    lunar_phase(phase, near) {
        if (!this.dic.moony) {
            throw new Error('lunar_phase requires a satellite orbital model');
        }
        return this.dic.moony.timeOfPhase((0, number_1.mod)(phase, 1), near);
    }
    lunisolar(utc) {
        return (0, lunisolar_1.lunisolar)({
            moony: this.dic.moony,
            geo: this.dic.geo,
            dayMsec: this.calc.msec.day,
            dayZero: this.calc.zero.day,
            lunarPhase: (phase, near) => this.lunar_phase(phase, near),
            solarPhase: (phase, near) => this.solar_phase(phase, near),
        }, utc);
    }
    solar_term(utc, phase) {
        return (0, solar_1.solar_term)(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, utc, phase);
    }
    solar_phase_before(phase, utc) {
        return (0, solar_1.solar_phase_before)(this.dic.sunny, phase, utc);
    }
    solar_terms(utc) {
        return (0, solar_1.solar_terms)(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, utc);
    }
    succ(utc, diff) {
        return this.add(utc, diff);
    }
    back(utc, diff) {
        return this.sub(utc, diff);
    }
    parse(tgt, str) {
        return this.parse_by(this.parse_obj(tgt, str));
    }
    parse_obj(tgt, str) {
        return 'string' === typeof tgt ? this.index(tgt, str) : cloneValue(tgt);
    }
    format(utc, str) {
        return this.format_by(this.to_tempos_input(utc), str);
    }
    add(utc, span) {
        return this.add_span(this.to_utc(utc), span);
    }
    add_obj(utc, span) {
        return this.to_tempos(this.add(utc, span));
    }
    sub(utc, span) {
        return this.add_span(this.to_utc(utc), this.invert_span(span));
    }
    sub_obj(utc, span) {
        return this.to_tempos(this.sub(utc, span));
    }
    span(to, from, options) {
        return this.span_obj(to, from, options).label;
    }
    span_obj(to, from, options = {}) {
        if (this.is_span_text(to, from))
            return this.parse_span(to);
        const [fromAt, spanOptions] = this.span_args(from, options);
        return this.span_between(this.to_utc(to), fromAt, spanOptions);
    }
    add_span(utc, span) {
        const anchor = span[span_anchor];
        if (anchor?.[1] === utc && anchor[2] === this)
            return anchor[0];
        const parts = this.span_parts_of(span);
        const target = this.span_target(utc, parts);
        return this.find_span_time(target, utc);
    }
    parse_span(text) {
        const source = text.trim();
        if (source === '今')
            return { unit: 'second', value: 0, label: '今', parts: [] };
        const match = source.match(/^(.*)(前|後)$/);
        if (!match)
            throw new Error(`invalid relative time ${text}`);
        const [, body] = match;
        const direction = match[2];
        if (!body)
            throw new Error(`invalid relative time ${text}`);
        const sign = direction === '後' ? -1 : 1;
        let rest = body;
        const parts = [];
        while (rest) {
            const part = this.parse_span_part(rest, sign);
            if (!part)
                throw new Error(`invalid relative time ${text}`);
            parts.push(part);
            rest = rest.slice(part.label.length);
        }
        return this.format_span(parts, direction);
    }
    format_span(parts, direction) {
        const activeParts = parts.filter(({ value }) => value);
        if (!activeParts.length)
            return { unit: 'second', value: 0, label: '今', parts: [] };
        const primary = activeParts[0];
        return {
            unit: primary.unit,
            value: primary.value,
            label: `${activeParts.map(({ label }) => label).join('')}${direction}`,
            parts: activeParts,
        };
    }
    span_parts_of(span) {
        const parts = (() => {
            if ('string' === typeof span)
                return this.parse_span(span).parts ?? [];
            if (Array.isArray(span))
                return span;
            return 'parts' in span ? (span.parts ?? [span]) : [span];
        })();
        return parts.map((part) => this.normalize_span_part(part));
    }
    normalize_span_part(part) {
        return 'token' in part ? part : { ...part, token: span_unit_token(part.unit) };
    }
    invert_span(span) {
        return this.span_parts_of(span).map(({ token, unit, value, label }) => ({ token, unit, value: 0 - value, label }));
    }
    parse_span_part(text, sign) {
        let best;
        const accept = (token, unit, count, label) => {
            if (!label)
                return;
            if (best && best.label.length >= label.length)
                return;
            best = { token, unit, value: count * sign, label };
        };
        const rows = [
            ['y', 'year', '年'],
            ['M', 'month', 'ヶ月'],
            ['d', 'day', '日'],
            ['H', 'hour', '時間'],
            ['m', 'minute', '分'],
            ['s', 'second', '秒'],
            ['S', 'msec', 'ミリ秒'],
        ];
        for (const [token, unit, fallbackUnit] of rows) {
            const relatives = this.dic[token].relatives;
            if ('string' === typeof relatives) {
                const match = text.match(new RegExp(`^(\\d+)${escape_regexp(relatives)}`));
                if (match)
                    accept(token, unit, Number(match[1]), match[0]);
            }
            if (relatives instanceof Array) {
                relatives.forEach((label, count) => {
                    if (label && text.startsWith(label))
                        accept(token, unit, count, label);
                });
            }
            const match = text.match(new RegExp(`^(\\d+)${escape_regexp(fallbackUnit)}`));
            if (match)
                accept(token, unit, Number(match[1]), match[0]);
        }
        return best;
    }
    span_target(utc, parts) {
        const source = this.to_tempos(utc);
        const target = {
            u: source.u.now_idx,
            y: source.y.now_idx,
            M: source.M.now_idx,
            d: source.d.now_idx,
            H: source.H.now_idx,
            m: source.m.now_idx,
            s: source.s.now_idx,
            S: source.S.now_idx,
            M_is_leap: source.M.is_leap,
            changedRank: -1,
            near: utc,
            sourceDaySince: source.d.since,
            sourceHourSince: source.H.since,
            sourceMinuteSince: source.m.since,
            sourceSecondSince: source.s.since,
        };
        for (const { token: spanToken, unit, value } of parts) {
            const token = (spanToken ?? span_unit_token(unit));
            const amount = 0 - value;
            target[token] += amount;
            if (token === 'y')
                target.u += amount;
            target.changedRank = Math.max(target.changedRank, span_rank(token));
            target.near += amount * this.unit_msec(unit);
        }
        this.normalize_span_target(target);
        return target;
    }
    normalize_span_target(target) {
        const carry = (token, parent, size) => {
            const amount = Math.floor(target[token] / size);
            target[token] = (0, number_1.mod)(target[token], size);
            target[parent] += amount;
        };
        const rank = target.changedRank;
        if (span_rank('S') <= rank)
            carry('S', 's', this.dic.S.length);
        if (span_rank('s') <= rank) {
            carry('s', 'm', this.dic.s.length);
            if (this.dic.is_solor && target.m < 0 && target.s === 0) {
                target.s = this.dic.s.length;
                target.m--;
            }
        }
        if (span_rank('m') <= rank)
            carry('m', 'H', this.dic.m.length);
        if (span_rank('H') <= rank)
            carry('H', 'd', this.dic.H.length);
        if (span_rank('M') <= rank) {
            const years = Math.floor(target.M / this.dic.M.length);
            target.M = (0, number_1.mod)(target.M, this.dic.M.length);
            target.y += years;
            target.u += years;
        }
    }
    unit_msec(unit) {
        switch (unit) {
            case 'year':
                return this.calc.msec.year;
            case 'month':
                return this.calc.msec.month;
            case 'day':
                return this.calc.msec.day;
            case 'hour':
                return this.calc.msec.hour;
            case 'minute':
                return this.calc.msec.minute;
            case 'second':
                return this.calc.msec.second;
            case 'msec':
                return 1;
        }
    }
    find_span_time(target, utc) {
        if (target.changedRank < 0)
            return utc;
        const month = this.find_span_month(target);
        const dayIndex = target.changedRank <= span_rank('M')
            ? Math.min(Math.max(target.d, 0), Math.max(0, Math.floor(month.size / this.calc.msec.day) - 1))
            : target.d;
        const day = this.to_tempos(month.last_at + dayIndex * this.calc.msec.day).d;
        if (target.changedRank <= span_rank('d')) {
            return this.clamp_since(day, target.sourceDaySince);
        }
        const direct = this.find_span_time_in_day_direct(day, target);
        if (direct != null)
            return direct;
        return this.find_span_time_in_day(day, target);
    }
    find_span_time_in_day_direct(day, target) {
        if (target.changedRank < span_rank('H'))
            return null;
        const firstHour = this.to_tempos(day.last_at).H;
        const hour = firstHour.succ(target.H);
        if (hour.now_idx !== target.H)
            return null;
        let at = hour.last_at;
        if (target.changedRank < span_rank('m'))
            return at + Math.min(Math.max(0, target.sourceHourSince), Math.max(0, hour.size - 1));
        const minuteSize = hour.size / this.dic.m.length;
        if (span_rank('m') <= target.changedRank)
            at += target.m * (hour.size / this.dic.m.length);
        if (target.changedRank < span_rank('s'))
            return at + Math.min(Math.max(0, target.sourceMinuteSince), Math.max(0, minuteSize - 1));
        if (span_rank('s') <= target.changedRank)
            at += target.s * this.calc.msec.second;
        if (target.changedRank < span_rank('S'))
            return at + Math.min(Math.max(0, target.sourceSecondSince), Math.max(0, this.calc.msec.second - 1));
        if (span_rank('S') <= target.changedRank)
            at += target.S;
        return at;
    }
    find_span_month(target) {
        const near = this.to_tempos(target.near);
        if (near.u.now_idx === target.u && near.M.now_idx === target.M && near.M.is_leap === target.M_is_leap) {
            return near.M;
        }
        const yearStart = this.find_span_year_start(target.u, target.near);
        const nextYearStart = this.to_tempos(yearStart).u.next_at;
        let cursor = yearStart;
        let fallback;
        while (cursor < nextYearStart) {
            const month = this.to_tempos(cursor).M;
            if (month.now_idx === target.M) {
                if (month.is_leap === target.M_is_leap)
                    return month;
                fallback ??= month;
            }
            cursor = month.next_at;
        }
        return fallback ?? this.to_tempos(yearStart).M;
    }
    find_span_year_start(year, near) {
        let tempo = this.to_tempos(near).u;
        while (tempo.now_idx < year) {
            tempo = this.to_tempos(tempo.next_at).u;
        }
        while (year < tempo.now_idx) {
            tempo = this.to_tempos(tempo.last_at - this.calc.msec.day).u;
        }
        return tempo.last_at;
    }
    find_span_time_in_day(day, target) {
        let from = day.last_at;
        let to = day.next_at;
        while (from < to) {
            const at = Math.floor((from + to) / 2);
            const comparison = this.compare_span_digits(this.to_tempos(at), target);
            if (comparison < 0) {
                from = at + 1;
            }
            else {
                to = at;
            }
        }
        const tempos = this.to_tempos(from);
        const interval = this.interval_for_rank(tempos, target.changedRank);
        return this.clamp_since(interval, this.source_since(target));
    }
    compare_span_digits(tempos, target) {
        const rows = [
            [span_rank('H'), tempos.H.now_idx, target.H],
            [span_rank('m'), tempos.m.now_idx, target.m],
            [span_rank('s'), tempos.s.now_idx, target.s],
            [span_rank('S'), tempos.S.now_idx, target.S],
        ];
        for (const [rank, actual, expected] of rows) {
            if (target.changedRank < rank)
                break;
            if (actual !== expected)
                return actual < expected ? -1 : 1;
        }
        return 0;
    }
    interval_for_rank(tempos, rank) {
        if (rank <= span_rank('H'))
            return tempos.H;
        if (rank <= span_rank('m'))
            return tempos.m;
        if (rank <= span_rank('s'))
            return tempos.s;
        return tempos.S;
    }
    source_since(target) {
        if (target.changedRank <= span_rank('H'))
            return target.sourceHourSince;
        if (target.changedRank <= span_rank('m'))
            return target.sourceMinuteSince;
        if (target.changedRank <= span_rank('s'))
            return target.sourceSecondSince;
        return 0;
    }
    clamp_since(interval, since) {
        return interval.last_at + Math.min(Math.max(0, since), Math.max(0, interval.size - 1));
    }
    find(unit, between, conditions) {
        const [from, to] = between;
        if (from == null || to == null || from >= to) {
            throw new Error(`invalid range ${from}..${to}`);
        }
        if (!conditions.length) {
            throw new Error('find requires conditions');
        }
        const first = this.to_tempos(from)[unit];
        if (!first) {
            throw new Error(`invalid unit ${String(unit)}`);
        }
        let tempo = first;
        if (tempo.last_at < from) {
            tempo = tempo.succ();
        }
        const list = [];
        while (tempo.last_at < to) {
            if (conditions.every((condition) => this.match_find_condition(tempo.last_at, condition))) {
                list.push(tempo.last_at);
            }
            tempo = tempo.succ();
        }
        return list;
    }
    span_between(from, to = Date.now(), { precise = false } = {}) {
        if (!Number.isFinite(to - from)) {
            return this.with_span_anchor(from, to, { unit: 'year', value: NaN, label: '？？？' });
        }
        if (precise) {
            const precision = precise === true ? 's' : precise;
            return this.with_span_anchor(from, to, this.precise_span(from, to, precision), this.next_precise_span_at(to, precision));
        }
        const fromTempos = this.to_tempos(from);
        const toTempos = this.to_tempos(to);
        if (fromTempos.m.last_at === toTempos.m.last_at) {
            const span = this.precise_span(from, to, 's');
            return this.with_span_anchor(from, to, span, this.next_span_at(to, span));
        }
        if (fromTempos.H.last_at === toTempos.H.last_at) {
            const span = this.precise_span(from, to, 'm');
            return this.with_span_anchor(from, to, span, this.next_span_at(to, span));
        }
        if (fromTempos.d.last_at === toTempos.d.last_at) {
            const span = this.precise_span(from, to, 'H');
            return this.with_span_anchor(from, to, span, this.next_span_at(to, span));
        }
        const parts = this.span_parts(from, to, 'd');
        for (const part of parts) {
            if (part.value) {
                return this.with_span_anchor(from, to, this.format_span([part], part.value < 0 ? '後' : '前'), toTempos.d.next_at);
            }
        }
        return this.with_span_anchor(from, to, { unit: 'day', value: 0, label: '今', parts: [] }, toTempos.s.next_at);
    }
    with_span_anchor(from, to, span, next_at) {
        if (Number.isFinite(next_at) && to < next_at) {
            span.next_at = next_at;
            span.timeout = next_at - to;
        }
        Object.defineProperty(span, span_anchor, {
            value: [from, to, this],
            enumerable: false,
        });
        return span;
    }
    precise_span(from, to, precision) {
        const parts = this.span_parts(from, to, precision);
        return this.format_span(parts, to < from ? '後' : '前');
    }
    next_precise_span_at(at, precision) {
        return this.to_tempos(at)[precision]?.next_at;
    }
    next_span_at(at, span) {
        const token = span.parts?.[0]?.token;
        return token ? this.to_tempos(at)[token]?.next_at : undefined;
    }
    span_parts(from, to, precision) {
        if (!is_core_precision(precision))
            return this.token_span_parts(from, to, precision);
        const rank = span_rank(precision);
        const [earlier, later] = from <= to ? [from, to] : [to, from];
        const sign = from <= to ? 1 : -1;
        const earlierTempos = this.to_tempos(earlier);
        const laterTempos = this.to_tempos(later);
        const rows = [
            ['y', 'year', '年', earlierTempos.y.now_idx, laterTempos.y.now_idx, Infinity],
            ['M', 'month', 'ヶ月', earlierTempos.M.now_idx, laterTempos.M.now_idx, this.dic.M.length],
            ['d', 'day', '日', earlierTempos.d.now_idx, laterTempos.d.now_idx, earlierTempos.M.size / this.calc.msec.day],
            ['H', 'hour', '時間', earlierTempos.H.now_idx, laterTempos.H.now_idx, this.dic.H.length],
            ['m', 'minute', '分', earlierTempos.m.now_idx, laterTempos.m.now_idx, this.dic.m.length],
            ['s', 'second', '秒', earlierTempos.s.now_idx, laterTempos.s.now_idx, this.dic.s.length],
            ['S', 'msec', 'ミリ秒', earlierTempos.S.now_idx, laterTempos.S.now_idx, this.dic.S.length],
        ];
        const diffs = rows.map(([, , , start, end]) => end - start);
        for (let index = Math.min(rank, rows.length - 1); 0 < index; index--) {
            if (0 <= diffs[index] || !Number.isFinite(rows[index][5]))
                continue;
            diffs[index] += rows[index][5];
            diffs[index - 1]--;
        }
        return rows
            .slice(0, rank + 1)
            .map(([token, unit, fallbackUnit], index) => {
            const count = Math.abs(diffs[index]);
            return {
                token,
                unit,
                value: diffs[index] * sign,
                label: this.span_part_label(token, count, fallbackUnit),
            };
        })
            .filter(({ value }) => value);
    }
    token_span_parts(from, to, token) {
        const fromTempo = this.to_tempos(from)[token];
        const toTempo = this.to_tempos(to)[token];
        if (!fromTempo || !toTempo)
            return [];
        const value = toTempo.now_idx - fromTempo.now_idx;
        return [
            {
                token,
                unit: this.span_part_unit(token),
                value,
                label: this.span_part_label(token, Math.abs(value), String(token)),
            },
        ].filter(({ value }) => value);
    }
    span_part_unit(token) {
        switch (token) {
            case 'y':
            case 'u':
            case 'Y':
                return 'year';
            case 'M':
            case 'N':
            case 'Q':
                return 'month';
            case 'd':
            case 'D':
            case 'w':
            case 'A':
            case 'B':
            case 'C':
            case 'E':
            case 'F':
            case 'V':
                return 'day';
            case 'H':
                return 'hour';
            case 'm':
                return 'minute';
            case 's':
                return 'second';
            case 'S':
            default:
                return 'msec';
        }
    }
    span_part_label(unit, count, fallbackUnit) {
        const indexer = this.dic[unit];
        const relatives = indexer?.relatives;
        if ('string' === typeof relatives)
            return `${count}${relatives}`;
        const label = relatives?.[count];
        return label != null ? label : `${count}${fallbackUnit}`;
    }
    match_find_condition(utc, condition) {
        return Object.entries(condition).every(([format, matcher]) => {
            if (format === 'note') {
                return this.note(utc).some((note) => this.match_find_value(note, matcher));
            }
            return this.match_find_value(this.format(utc, format), matcher);
        });
    }
    match_find_value(value, matcher) {
        if (matcher instanceof RegExp) {
            matcher.lastIndex = 0;
            return matcher.test(value);
        }
        return value === matcher;
    }
    to_utc(utc) {
        if ('number' === typeof utc)
            return utc;
        if ('string' === typeof utc)
            return this.parse(utc);
        return utc.d.write_at;
    }
    to_tempos_input(utc) {
        return this.is_tempos(utc) ? utc : this.to_tempos(this.to_utc(utc));
    }
    is_tempos(utc) {
        return !!utc && 'object' === typeof utc && utc.d instanceof time_1.Tempo && utc.M instanceof time_1.Tempo;
    }
    span_args(from, options) {
        if (from == null)
            return [Date.now(), options];
        if (this.is_span_options(from))
            return [Date.now(), from];
        return [this.to_utc(from), options];
    }
    is_span_options(value) {
        return !!value && 'object' === typeof value && !this.is_tempos(value);
    }
    is_span_text(to, from) {
        return 'string' === typeof to && from == null && (to === '今' || /(?:前|後)$/.test(to));
    }
    dup() {
        return new FancyDate(this);
    }
    def_regex() {
        let A, B, C, D, E, F, G, H, N, Q, S, V, Y, Z;
        let a, b, c, d, f, m, p, s, w, x, y;
        const number = (fallback) => this.number_pattern(fallback);
        (() => {
            A = B = C = E = F = G = H = N = V = Z = a = b = c = f = m = p = s = strategy;
            const M = () => `(閏?${number()})`;
            const u = () => `(${number('[-\\d]+')})`;
            D = Q = S = Y = d = w = y = () => `(${number()})`;
            const J = (x = () => `(${number('[\\d.]+')})`);
            const object = {
                A,
                B,
                C,
                D,
                E,
                F,
                G,
                H,
                J,
                M,
                N,
                Q,
                S,
                V,
                Y,
                Z,
                a,
                b,
                c,
                d,
                f,
                m,
                p,
                s,
                u,
                w,
                x,
                y,
            };
            for (const key in object) {
                const func = object[key];
                const indexer = this.dic[key];
                indexer.regex = func(indexer.list);
            }
        })();
        (() => {
            H = N = Q = V = d = m = s = strategy;
            const M = (list) => {
                if (list && list.length) {
                    if (list.every((s) => 1 === s.length)) {
                        return `(閏?[${list.join('')}])`;
                    }
                    if (list.join) {
                        return `(閏?(?:${list.join('|')}))`;
                    }
                }
                return `(閏?${number()})`;
            };
            const object = { H, M, N, Q, V, Z, d, m, s };
            for (const key in object) {
                const func = object[key];
                const indexer = this.dic[key];
                indexer.regex_o = func(indexer.list);
            }
        })();
        function strategy(list) {
            if (list && list.length) {
                if (list.every((s) => 1 === s.length)) {
                    return `([${list.join('')}])`;
                }
                if (list.join) {
                    return `(${list.join('|')})`;
                }
            }
            return `(${number()})`;
        }
    }
    def_to_idx() {
        let A, a, b, B, c, C, D, d, E, f, F, H, J, m, M, N, p, Q, s, S, u, V, w, x, y, Y, Z;
        const numeric = (s) => this.parse_number(s);
        const G = function (s) {
            const idx = this.list?.indexOf(s);
            if (-1 < idx) {
                return idx;
            }
            else {
                return numeric(s);
            }
        };
        H =
            N =
                m =
                    s =
                        function (s) {
                            const idx = this.list?.indexOf(s);
                            if (-1 < idx) {
                                return idx;
                            }
                            else {
                                return numeric(s);
                            }
                        };
        A =
            B =
                C =
                    E =
                        F =
                            M =
                                V =
                                    Z =
                                        a =
                                            b =
                                                c =
                                                    d =
                                                        f =
                                                            function (s) {
                                                                const idx = this.list?.indexOf(s);
                                                                if (-1 < idx) {
                                                                    return idx;
                                                                }
                                                                else {
                                                                    return numeric(s) - 1;
                                                                }
                                                            };
        D = Q = p = w = (s) => numeric(s) - 1;
        J = S = Y = u = x = y = (s) => numeric(s);
        const object = {
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H,
            J,
            M,
            N,
            Q,
            S,
            V,
            Y,
            Z,
            a,
            b,
            c,
            d,
            f,
            m,
            p,
            s,
            u,
            w,
            x,
            y,
        };
        for (let key in object) {
            const val = object[key];
            const indexer = this.dic[key];
            indexer.to_idx = val;
        }
    }
    def_to_label() {
        let A, B, C, E, F, N, Q, S, V, Y, Z;
        let a, b, c, d, f, m, p, s, u, w, x, y;
        const integer = (idx) => {
            return (_, val, size) => this.format_number(val.now_idx + idx, size);
        };
        function at(cb) {
            return function (list, val, size) {
                if (list) {
                    if (val.now_idx != null) {
                        const s = list[val.now_idx];
                        if (s != null) {
                            return s;
                        }
                    }
                }
                return cb(list, val, size);
            };
        }
        function month(cb) {
            return (list, val, size) => `${val.is_leap ? '閏' : ''}${cb(list, val, size)}`;
        }
        const float = (__, val, size) => {
            const num = Math.trunc(val.now_idx);
            const sub = `${val.now_idx % 1}`.slice(1);
            return this.format_number(num, size) + sub;
        };
        const G = (__, val) => val.label;
        let M = month(integer(1));
        let H = (N = m = s = S = Y = u = y = integer(0));
        const D = (Q = d = p = w = integer(1));
        const J = (x = float);
        A = B = C = E = F = V = Z = a = b = c = f = at(integer(1));
        const object = {
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H,
            J,
            M,
            N,
            Q,
            S,
            V,
            Y,
            Z,
            a,
            b,
            c,
            d,
            f,
            m,
            p,
            s,
            u,
            w,
            x,
            y,
        };
        for (const key in object) {
            const val = object[key];
            const indexer = this.dic[key];
            indexer.to_value = val;
        }
        M = month(at(integer(1)));
        H = N = m = s = at(integer(0));
        A = B = C = E = F = Q = V = Z = a = b = c = d = f = at(integer(1));
        const object1 = { A, B, C, E, F, H, M, N, Q, V, Z, a, b, c, d, f, m, s };
        for (const key in object1) {
            const val = object1[key];
            const indexer = this.dic[key];
            indexer.to_label = val;
        }
        const cut = () => '';
        M = month(at(cut));
        A = B = C = E = F = H = N = Q = V = Z = a = b = c = d = f = m = s = at(cut);
        const object2 = { A, B, C, E, F, H, M, N, Q, V, Z, a, b, c, d, f, m, s };
        for (const key in object2) {
            const val = object2[key];
            const indexer = this.dic[key];
            indexer.to_ruby = val;
        }
    }
    def_calc() {
        const season = sub_define(this.calc.msec.year, this.dic.Z.length);
        const month = daily_measure(this.calc.msec.year / this.dic.M.length, this.calc.msec.day);
        const week = daily_define(this.dic.E.length * this.calc.msec.day, this.calc.msec.day);
        const hour = sub_define(this.calc.msec.day, this.dic.H.length);
        const minute = sub_define(hour.msec, this.dic.m.length);
        const second = sub_define(minute.msec, this.dic.s.length);
        const msec = sub_define(second.msec, second.msec);
        calc_set.call(this, 'range', { season, month, week, hour, minute, second, msec });
        calc_set.call(this, 'msec', { season, month, week, hour, minute, second, msec });
    }
    def_eras() {
        const zero = this.calc.zero.era;
        const list = [];
        for (let idx = 0; idx < this.dic.eras.length; idx++) {
            const [title, msec] = this.dic.eras[idx];
            const { u } = this.to_tempos(msec);
            this.calc.eras.push([title, msec, u.now_idx]);
            list.push(msec - zero);
        }
        list.push(Infinity);
        this.table.msec.era = list;
    }
    def_year_table() {
        const { range, msec } = this.table;
        const { day } = this.calc.msec;
        const leaps = [...this.dic.leaps];
        let period = leaps.pop();
        if (period) {
            range.year = [];
            for (let idx = 0; idx < period; idx++) {
                let is_leap = 0;
                for (let mode = 0; mode < leaps.length; mode++) {
                    const div = leaps[mode];
                    if (idx % div)
                        continue;
                    is_leap = !mode % 2;
                }
                range.year.push(this.calc.range.year[is_leap]);
            }
            range.year[0] = this.calc.range.year[1];
        }
        else {
            range.year = [this.calc.range.year[0]];
        }
        msec.year = upto(range.year);
        period = msec.year[msec.year.length - 1];
        calc_set.call(this, 'msec', { period: daily_define(period, day) });
        function upto(src) {
            let x = 0;
            return src.map((i) => (x += i * day));
        }
    }
    def_month_table() {
        const { range, msec } = this.table;
        const { day } = this.calc.msec;
        const years = this.calc.range.year;
        let { month_divs } = this.dic;
        // auto month table.
        if (!month_divs) {
            month_divs = [];
            for (let idx = 0; idx < this.dic.M.length; idx++) {
                month_divs.push(this.calc.range.month[1 - (idx % 2)]);
            }
            month_divs[1] = null;
        }
        let month_sum = 0;
        for (let i of month_divs) {
            month_sum += i;
        }
        range.month = {};
        for (const size of years) {
            const a = Array.from(month_divs);
            const idx = month_divs.indexOf(null);
            a[idx] = size - month_sum;
            range.month[size] = a;
        }
        msec.month = {};
        for (const size of years) {
            const year_size = Math.floor(day * size);
            msec.month[year_size] = upto(range.month[size]);
        }
        function upto(src) {
            let x = 0;
            return src.map((i) => (x += i * day));
        }
    }
    def_table() {
        this.table = {
            range: {},
            msec: {},
        };
        if (this.is_table_month) {
            this.def_month_table();
        }
        if (this.is_table_leap) {
            this.def_year_table();
        }
    }
    def_idx() {
        let period = NaN;
        if (this.is_table_leap) {
            period = this.dic.leaps[this.dic.leaps.length - 1];
            this.dic.p.length = period || 1;
        }
        const o = this.index(...this.dic.start);
        o.Z = (this.dic.Z.length * 1) / 8;
        const year = (period || 0) * o.p + o.y;
        const year_s = year - o.f;
        const year10 = year - o.c;
        const year12 = year - o.b;
        const year60 = year - o.a;
        Object.assign(this.calc.zero, { year10, year12, year60, year_s });
        Object.assign(this.calc.idx, o);
    }
    def_zero() {
        const zero_size = (idx_path, path) => {
            return 0 - this.calc.idx[idx_path] * this.calc.msec[path];
        };
        const timezone = (this.calc.msec.day * (this.dic.geo[2] != null ? this.dic.geo[2] : this.dic.geo[1])) / 360;
        const x = (this.dic.x.tempo = (0, time_1.to_tempo_bare)(this.calc.msec.hour, -0.5 * this.calc.msec.hour, timezone));
        x.now_idx = timezone;
        const start_at = this.dic.start[2];
        const zero = start_at - x.center_at;
        const second = zero + zero_size('s', 'second');
        const minute = second + zero_size('m', 'minute');
        const hour = minute + zero_size('H', 'hour');
        const day = hour + zero_size('d', 'day');
        let moon = NaN;
        let year = NaN;
        let month = NaN;
        let period = NaN;
        if (this.is_table_leap) {
            const year_size = Math.floor(this.calc.msec.day * this.table.range.year[this.calc.idx.y]);
            month = day - (this.table.msec.month[year_size][this.calc.idx.M - 1] || 0);
            year = month - (this.table.msec.year[this.calc.idx.y - 1] || 0);
            period = year + zero_size('p', 'period');
        }
        else {
            if (this.is_table_month) {
                month = day - (Object.values(this.table.msec.month)[0][this.calc.idx.M - 1] || 0);
            }
            else {
                month = day + zero_size('M', 'moon');
            }
            year = month + zero_size('y', 'year');
        }
        // 単純のため平気法。
        const sunny_epoch = this.dic.sunny.epochMsec;
        const 啓蟄 = sunny_epoch - (1 / 6 - 1 / 8) * this.dic.Z.length * this.calc.msec.season;
        let { last_at } = (0, time_1.to_tempo_bare)(this.calc.msec.year, 啓蟄, period || year);
        const spring = last_at;
        const 立春 = sunny_epoch + zero_size('Z', 'season');
        ({ last_at } = (0, time_1.to_tempo_bare)(this.calc.msec.year, 立春, period || year));
        const season = last_at;
        // 元号
        let era = this.dic.eras[0]?.[1] || Infinity;
        this.calc.eras = [];
        const era_tgt = this.is_table_leap
            ? period + this.table.msec.year[0]
            : season + this.calc.msec.year;
        if (era_tgt < era) {
            era = era_tgt;
            this.calc.eras = [[this.dic.era, era, 1]];
        }
        if (this.dic.moony) {
            moon = this.dic.moony.epochMsec;
        }
        // JD
        const day_utc = day + x.center_at;
        const cjd = (0, time_1.to_tempo_bare)(this.calc.msec.day, day, -210866803200000).center_at;
        const jd = (0, time_1.to_tempo_bare)(this.calc.msec.day, day_utc, -210866803200000).center_at; // -2440587.5 * 86400000
        const ld = (0, time_1.to_tempo_bare)(this.calc.msec.day, day_utc, -12219379200000).last_at; //  -141428   * 86400000
        const mjd = (0, time_1.to_tempo_bare)(this.calc.msec.day, day_utc, -3506716800000).last_at; //   -40587   * 86400000
        // 干支、九星、週
        const week = day + zero_size('E', 'day');
        const day_9 = day + zero_size('F', 'day');
        const day10 = day + zero_size('C', 'day');
        const day12 = day + zero_size('B', 'day');
        const day60 = day + zero_size('A', 'day');
        const day28 = day + zero_size('V', 'day');
        Object.assign(this.calc.zero, {
            period,
            era,
            week,
            season,
            spring,
            moon,
            day,
            jd,
            ld,
            mjd,
            cjd,
            day_9,
            day10,
            day12,
            day28,
            day60,
        });
    }
    precision() {
        const is_just = (x, n) => n === Math.floor(n / x) * x;
        const gaps = [this.calc.msec.year / this.calc.msec.day - this.calc.range.year[0]];
        if (this.dic.leaps) {
            for (let idx = 0; idx < this.dic.leaps.length; idx++) {
                const v = this.dic.leaps[idx];
                let gap = gaps[gaps.length - 1];
                if (idx & 1) {
                    gap += 1 / v;
                }
                else {
                    gap -= 1 / v;
                }
                gaps.push(gap);
            }
        }
        return {
            strategy: this.strategy,
            year: [[this.dic.M.length], this.calc.range.month],
            day: [this.calc.range.hour, this.calc.range.minute, this.calc.range.second],
            leap: gaps.map((i) => parseInt((1 / i))),
            is_legal_solor: is_just(4, this.dic.H.length),
            is_legal_eto: is_just(this.dic.c.length, this.dic.a.length) &&
                is_just(this.dic.b.length, this.dic.a.length),
            is_legal_ETO: is_just(this.dic.C.length, this.dic.A.length) &&
                is_just(this.dic.B.length, this.dic.A.length),
        };
    }
    /*
  http://bakamoto.sakura.ne.jp/buturi/2hinode.pdf
  ベクトルで
  a1 = e1 * cos(lat/360) + e3 * sin(lat/360)
  a2 = e3 * cos(lat/360) - e1 * sin(lat/360)
  T = (赤緯, 時角)->
    a1 * sin(赤緯) + cos(赤緯) * (a2 * cos(時角) - e2 * sin(時角))
  T = ( lat, 赤緯, 時角 )->
    e1 * ( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) +
    e2 * (-cos(赤緯) * sin(時角)) +
    e3 * ( sin(lat/360) * sin(赤緯) + cos(lat/360) * cos(赤緯) * cos(時角) )
  
  K   = @dic.earthy[2] / 360
  高度 = -50/60
  時角 = ( lat, 高度, 赤緯 )->
    acos(( sin(高度) - sin(lat/360) * sin(赤緯) ) / cos(lat/360) * cos(赤緯) )
  方向 = ( lat, 高度, 赤緯, 時角 )->
    acos(( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) / cos(高度) )
  季節 = 春分点からの移動角度
  赤緯 = asin( sin(K) * sin(季節) )
  赤経 = atan( tan(季節) * cos(K) )
  南中時刻 = ->
    正午 + 時角 + ( 赤経 - 季節 ) + 平均値 + timezone
  日の出 = ->
    南中時刻 - 時角
  日の入 = ->
    南中時刻 + 時角
  */
    noon(utc, day = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day, utc)) {
        return (0, solar_1.noon)(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, this.calc.msec.year, this.calc.zero.season, utc, day);
    }
    solor(utc, idx = 2, solarNoon = this.noon(utc)) {
        return (0, solar_1.solor)(this.dic.sunny, this.dic.earthy, this.dic.geo, this.calc.msec.day, this.calc.zero.day, this.calc.msec.year, this.calc.zero.season, utc, idx, solarNoon);
    }
    lunar(utc, day = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day, utc)) {
        if (!(0, orbital_model_1.hasLunarEvents)(this.dic.moony)) {
            throw new Error('lunar requires a satellite orbital model with lunarEvents');
        }
        return this.dic.moony.lunarEvents(utc, {
            latitudeDeg: this.dic.geo[0],
            longitudeDeg: this.dic.geo[1],
            timezoneDeg: this.dic.geo[2],
            dayStartUtc: day.last_at,
        });
    }
    lunar_apsis(kind, near) {
        if (!(0, orbital_model_1.hasLunarOrbitEvents)(this.dic.moony)) {
            throw new Error('lunar_apsis requires a satellite orbital model with lunarApsis');
        }
        return this.dic.moony.lunarApsis(kind, near);
    }
    lunar_node(kind, near) {
        if (!(0, orbital_model_1.hasLunarOrbitEvents)(this.dic.moony)) {
            throw new Error('lunar_node requires a satellite orbital model with lunarNode');
        }
        return this.dic.moony.lunarNode(kind, near);
    }
    節句(_utc, _tempos = this.to_tempos(_utc)) {
        // M,d,B,E
        return {
            カトリック: {
                万聖節: [11, 1],
                万霊節: [11, 2],
            },
            節句: {
                人日: [1, 7],
                初午: [2, , 7],
                上巳: [3, 3],
                端午: [5, 5],
                七夕: [7, 7],
                重陽: [9, 9],
            },
            仏教: {
                灌仏会: [4, 8],
                盂蘭盆会: [7, 15],
            },
            風習: {
                小正月: [1, 15],
                十五夜: [8, 15],
                十三夜: [9, 13],
                七五三: [11, 15],
                正月事始め: [12, 13],
            },
        };
    }
    雑節(utc, { Zz, d } = this.to_tempos(utc)) {
        const d0 = d.reset(Zz.zero);
        let [立春, 入梅, 春分, 半夏生, 夏土用, 立夏, 夏至, 秋土用, 立秋, 秋分, 冬土用, 立冬, 冬至, 春土用, 立春2,] = [
            1 / 8,
            80 / 360,
            2 / 8,
            100 / 360,
            13 / 40,
            3 / 8,
            4 / 8,
            23 / 40,
            5 / 8,
            6 / 8,
            33 / 40,
            7 / 8,
            8 / 8,
            43 / 40,
            9 / 8,
        ].map((n) => {
            const now = Zz.last_at + (n - 1 / 8) * Zz.size;
            return (0, time_1.to_tempo_bare)(d.size, d0.last_at, now);
        });
        const [八十八夜, 二百十日, 二百二十日] = [88, 210, 220].map((n) => 立春.succ(n - 1));
        const [春彼岸, 秋彼岸] = [春分, 秋分].map((dd) => {
            return time_1.Tempo.join(dd.back(3), dd.succ(3));
        });
        const [春社日, 秋社日] = [春分, 秋分].map((dd) => {
            const C = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day10, dd.write_at);
            C.now_idx = (0, number_1.mod)(C.now_idx, this.dic.C.length);
            return C.slide(this.dic.C.length / 2 - C.now_idx - 1);
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
    雑節_by_phase(utc) {
        return (0, solar_1.雑節_by_phase)(this.dic.sunny, this.calc.msec.day, this.calc.zero.day, this.calc.zero.day10, this.dic.C.length, utc);
    }
    to_tempo_by_solor(utc, day) {
        return (0, solar_1.to_tempo_by_solor)(this.dic.sunny, this.dic.earthy, this.dic.geo, this.calc.msec.day, this.calc.zero.day, this.calc.msec.year, this.calc.zero.season, this.dic.H.length, utc, day);
    }
    note(utc, tempos = this.to_tempos(utc), arg1 = this.雑節(utc, tempos), arg2 = this.節句(utc, tempos)) {
        let k;
        const list = [];
        for (k in arg1) {
            const t = arg1[k];
            if (t.is_cover(tempos.d.center_at)) {
                list.push(k
                    .match(/.(彼岸|社日|節分|土用)|(.+)/)
                    .slice(1)
                    .join(''));
            }
        }
        for (let root in arg2) {
            const arg3 = arg2[root];
            for (k in arg3) {
                const [M, d, B, E] = arg3[k];
                if (M && M !== tempos.M.now_idx)
                    continue;
                if (d && d !== tempos.d.now_idx)
                    continue;
                if (B && B !== tempos.B.now_idx)
                    continue;
                if (E && E !== tempos.E.now_idx)
                    continue;
                list.push(k);
            }
        }
        return list;
    }
    to_tempos(utc) {
        let d, H, m, M, p, u;
        if (utc == null)
            throw new Error(`invalid timestamp ${utc}`);
        const drill_down = (base, path, at = utc) => {
            let o;
            const data = this.table.msec[path];
            const table = data?.[base.size] || data;
            if (table) {
                o = (0, time_1.to_tempo_by)(table, base.last_at, at);
            }
            else {
                const b_size = this.calc.msec[path];
                o = (0, time_1.to_tempo_bare)(b_size, base.last_at, at);
                o.length = base.size / o.size;
            }
            o.path = path;
            return o;
        };
        const to_tempo = (path, write_at = utc) => {
            return (0, time_1.to_tempo_bare)(this.calc.msec[path], this.calc.zero[path], write_at);
        };
        const J = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.jd, utc); // ユリウス日
        // season in year_of_planet
        const Zz = (0, time_1.to_tempo_bare)(this.calc.msec.year, this.calc.zero.season, utc); // 太陽年
        const Z = drill_down(Zz, 'season'); // 太陽年の二十四節気
        let N;
        let Nn;
        const moon_msec = this.calc.msec.moon;
        const usesObservedLunisolar = !this.is_table_month && (0, orbital_model_1.hasSolarEvents)(this.dic.sunny) && (0, orbital_model_1.hasLunarEvents)(this.dic.moony);
        if (this.dic.moony && moon_msec != null && !usesObservedLunisolar) {
            // 今月と中気
            Nn = (0, time_1.to_tempo_bare)(moon_msec, this.calc.zero.moon, utc).floor(this.calc.msec.day, this.calc.zero.day);
            N = drill_down(Nn, 'day');
            let Zs = drill_down(Zz, 'season', Nn.last_at);
            if (!Nn.is_cover(Zs.moderate_at)) {
                Zs = drill_down(Zz, 'season', Nn.next_at);
                if (!Nn.is_cover(Zs.moderate_at)) {
                    Nn.is_leap = true;
                }
            }
            Nn.now_idx = (0, number_1.mod)(Zs.now_idx, this.dic.Z.length) >> 1;
        }
        if (this.is_table_leap) {
            p = to_tempo('period');
            u = drill_down(p, 'year');
            u.now_idx += p.now_idx * this.dic.p.length;
            M = drill_down(u, 'month');
            d = drill_down(M, 'day');
        }
        else {
            if (this.is_table_month) {
                u = (0, time_1.to_tempo_bare)(this.calc.msec.year, this.calc.zero.spring, utc).floor(this.calc.msec.day, this.calc.zero.day);
                M = drill_down(u, 'month');
                d = drill_down(M, 'day');
            }
            else {
                if (usesObservedLunisolar) {
                    const lunisolar = this.lunisolar(utc);
                    const yearSize = lunisolar.next_year_start_at - lunisolar.year_start_at;
                    const monthSize = lunisolar.next_at - lunisolar.last_at;
                    u = new time_1.Tempo(lunisolar.year_start_at - lunisolar.year * yearSize, lunisolar.year, utc, lunisolar.year_start_at, lunisolar.next_year_start_at);
                    M = new time_1.Tempo(lunisolar.last_at - (lunisolar.month - 1) * monthSize, lunisolar.month - 1, utc, lunisolar.last_at, lunisolar.next_at);
                    M.is_leap = lunisolar.is_leap;
                    d = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day, utc);
                    d.now_idx = lunisolar.day - 1;
                    N = d;
                }
                else if (!Nn || !N) {
                    throw new Error('Lunar month calculation requires a satellite orbital period.');
                }
                else {
                    u = (0, time_1.to_tempo_bare)(this.calc.msec.year, this.calc.zero.season + this.calc.msec.season, utc)
                        .floor(moon_msec, this.calc.zero.moon)
                        .floor(this.calc.msec.day, this.calc.zero.day);
                    M = Nn;
                    d = N;
                }
            }
        }
        // hour minute second  in day
        if (this.dic.is_solor) {
            H = this.to_tempo_by_solor(utc, d);
            const size = H.size / this.dic.m.length;
            m = (0, time_1.to_tempo_bare)(size, H.last_at, utc);
        }
        else {
            H = drill_down(d, 'hour');
            m = drill_down(H, 'minute');
        }
        const s = drill_down(m, 'second');
        const S = drill_down(s, 'msec');
        let G = {};
        if (this.table.msec.era != null) {
            G = (0, time_1.to_tempo_by)(this.table.msec.era, this.calc.zero.era, utc);
            const era = this.calc.eras[G.now_idx];
            if (era?.[0]) {
                u.now_idx += 1 - era[2];
                G.label = era[0];
            }
        }
        const y = u.copy();
        if (y.now_idx < 1) {
            G.label = '紀元前';
            y.now_idx = 1 - y.now_idx;
        }
        const x = this.dic.x.tempo;
        // 年初来番号
        const w0 = to_tempo('week', u.last_at);
        const w = drill_down(w0, 'week');
        const D = drill_down(u, 'day');
        const Y = { now_idx: u.now_idx };
        if (u.next_at < w.next_at) {
            // 年末最終週は、翌年初週
            Y.now_idx += 1;
            w.now_idx = 0;
        }
        // 年不断
        const a = { now_idx: (0, number_1.mod)(u.now_idx - this.calc.zero.year60, this.dic.a.length) };
        const b = { now_idx: (0, number_1.mod)(u.now_idx - this.calc.zero.year12, this.dic.b.length) };
        const c = { now_idx: (0, number_1.mod)(u.now_idx - this.calc.zero.year10, this.dic.c.length) };
        const f = { now_idx: (0, number_1.mod)(u.now_idx - this.calc.zero.year_s, this.dic.f.length) };
        // 月不断
        const Q = { now_idx: Math.floor((4 * M.now_idx) / this.dic.M.length) };
        // 日不断
        const A = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day60, utc);
        const B = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day12, utc);
        const C = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day10, utc);
        const E = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.week, utc);
        const F = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day_9, utc);
        const V = (0, time_1.to_tempo_bare)(this.calc.msec.day, this.calc.zero.day28, utc);
        A.now_idx = (0, number_1.mod)(A.now_idx, this.dic.A.length);
        B.now_idx = (0, number_1.mod)(B.now_idx, this.dic.B.length);
        C.now_idx = (0, number_1.mod)(C.now_idx, this.dic.C.length);
        F.now_idx = (0, number_1.mod)(F.now_idx, this.dic.F.length);
        if (this.is_table_leap) {
            // 旧暦では、週は月初にリセットする。
            E.now_idx = (0, number_1.mod)(E.now_idx, this.dic.E.length);
            V.now_idx = (0, number_1.mod)(V.now_idx, this.dic.V.length);
        }
        else {
            E.now_idx = (0, number_1.mod)(M.now_idx + d.now_idx, this.dic.E.length);
            V.now_idx = (0, number_1.mod)([11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9][M.now_idx] + d.now_idx, this.dic.V.length);
        }
        return {
            Zz,
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H,
            J,
            M,
            N,
            Q,
            S,
            V,
            Y,
            Z,
            a,
            b,
            c,
            d,
            f,
            m,
            p,
            s,
            u,
            w,
            x,
            y,
        };
    }
    get_dic(tgt, tokens, reg) {
        const data = to_indexs(0);
        const items = tgt.match(reg);
        if (!items)
            throw new Error(`invalid match ${tgt} ${reg}`);
        const iterable = items.slice(1);
        for (let p = 0; p < iterable.length; p++) {
            let s = iterable[p];
            const token = tokens[p];
            const [top] = token;
            const dic = this.dic[top];
            if (dic) {
                if ('M' === top && '閏' === s[0]) {
                    data.M_is_leap = true;
                    s = s.slice(1);
                }
                data[top] = dic.to_idx(s);
            }
        }
        return data;
    }
    index(src, str = this.dic.parse, _disuse = 0) {
        const tokens = str.match(reg_token);
        const data = this.get_dic(src, tokens, this.regex(tokens));
        if (this.is_table_leap) {
            data.p = Math.floor(data.y / this.dic.p.length);
            data.y = data.y - data.p * this.dic.p.length;
        }
        data.c = (0, number_1.mod)(data.a, this.dic.c.length);
        data.b = (0, number_1.mod)(data.a, this.dic.b.length);
        data.C = (0, number_1.mod)(data.A, this.dic.C.length);
        data.B = (0, number_1.mod)(data.A, this.dic.B.length);
        return data;
    }
    regex(tokens) {
        const reg = ['^'];
        tokens.forEach((token) => {
            const [top, mode] = token;
            const dic = this.dic[top];
            if (dic) {
                if ('or'.includes(mode)) {
                    reg.push(dic.regex_o);
                }
                else {
                    reg.push(dic.regex);
                }
            }
            else {
                reg.push(`(${token.replace(/([\\\[\]().*?])/g, '\\$1')})`);
            }
        });
        return new RegExp(reg.join(''));
    }
    to_table(utc, bk, ik, has_notes = false) {
        const indexer = this.dic[ik];
        let o = this.to_tempos(utc);
        const arg1 = this.雑節(utc, o);
        const arg2 = this.節句(utc, o);
        let { last_at } = o[bk];
        o = this.to_tempos(last_at);
        const anker = o[bk].now_idx;
        const list = [];
        while (true) {
            o = this.to_tempos(last_at);
            ({ last_at } = o[ik].succ());
            if (anker !== o[bk].now_idx) {
                break;
            }
            const item = o[ik];
            list.push([
                this.format(last_at),
                indexer.to_value(null, item, 0),
                indexer.to_label(indexer.list, item, 0),
                indexer.to_ruby(indexer.rubys, item, 0),
                has_notes ? this.note(last_at, this.to_tempos(last_at), arg1, arg2) : undefined,
            ]);
        }
        return list;
    }
    parse_by(data, diff = {}) {
        let year_size = NaN;
        let last_at = NaN;
        let zero = NaN;
        if (!data) {
            return NaN;
        }
        for (const key of main_tokens) {
            data[key] = (diff[key] || 0) + (data[key] || 0);
        }
        for (const key of sub_tokens) {
            data[key] = diff[key] || 0;
        }
        let { M_is_leap, G, p, y, M, d, H, m, s, S, J, D, Y, Z, N, Q, u, w } = data;
        let utc = H * this.calc.msec.hour + m * this.calc.msec.minute + s * this.calc.msec.second + S;
        if (J) {
            return this.calc.zero.jd + J * this.calc.msec.day + utc;
        }
        if (D) {
            d += D;
        }
        if (w) {
            d += w * this.dic.E.length;
        }
        if (Q) {
            M += (Q * this.dic.M.length) / 4;
        }
        y += this.calc.eras[G][2] - 1;
        if (u) {
            y += u;
        }
        if (Y) {
            y += Y;
        }
        if (G < 0) {
            G = 0;
        }
        if (this.calc.eras.length <= G) {
            G = this.calc.eras.length - 1;
        }
        ;
        [m, s] = shift_up(m, s, this.dic.s.length);
        [H, m] = shift_up(H, m, this.dic.m.length);
        [d, H] = shift_up(d, H, this.dic.H.length);
        if (this.is_table_month) {
            ;
            [y, M] = shift_up(y, M, this.dic.M.length);
        }
        if (this.is_table_leap) {
            ;
            [p, y] = shift_up(p, y, this.dic.p.length);
        }
        utc += Z * this.calc.msec.season + d * this.calc.msec.day;
        const moon_msec = this.calc.msec.moon;
        if (this.dic.moony && moon_msec != null) {
            utc += N * moon_msec;
        }
        // year section
        if (this.is_table_leap) {
            utc += this.calc.zero.period + p * this.calc.msec.period + (this.table.msec.year[y - 1] || 0);
            year_size = Math.floor(this.calc.msec.day * this.table.range.year[y]);
        }
        else {
            let size;
            if (this.is_table_month) {
                zero = this.calc.zero.spring;
            }
            else {
                zero = this.calc.zero.season;
            }
            ;
            ({ size, last_at } = (0, time_1.to_tempo_bare)(this.calc.msec.year, zero, zero + y * this.calc.msec.year).floor(this.calc.msec.day, this.calc.zero.day));
            year_size = size;
            utc += last_at;
        }
        // month section
        if (this.is_table_month) {
            utc += this.table.msec.month[year_size][M - 1] || 0;
        }
        else {
            if (!this.dic.moony || moon_msec == null) {
                throw new Error('Lunar month parsing requires a satellite orbital period.');
            }
            const base = last_at;
            const M_utc = M_is_leap
                ? base + this.calc.msec.season * (M * 2 + 2) - moon_msec
                : base + this.calc.msec.season * (M * 2 + 1);
            ({ last_at } = (0, time_1.to_tempo_bare)(moon_msec, this.calc.zero.moon, M_utc).floor(this.calc.msec.day, this.calc.zero.day));
            utc += last_at - base;
        }
        return utc;
    }
    format_by(tempos, str = this.dic.format) {
        return str
            .match(reg_token)
            .map((token) => {
            const [top, mode] = token;
            const val = tempos[top];
            if (val) {
                const dic = this.dic[top];
                switch (mode) {
                    case 'r':
                        return dic.to_ruby(dic.rubys, val, token.length);
                    case 'o':
                        return dic.to_label(dic.list, val, token.length);
                    default:
                        return dic.to_value(dic.list, val, token.length);
                }
            }
            else {
                return token;
            }
        })
            .join('');
    }
    tree() {
        const { y, M, d, H, m, s, A, B, C, E, F, V, a, b, c, f } = this.dic;
        const yyyy = [
            [a, b, c, f, y],
            ['ao ar', 'bo br', 'co cr', 'fo fr', 'Gy'],
        ];
        const eeee = [
            [A, B, C, E, F, V],
            ['Ao Ar', 'Bo Br', 'Co Cr', 'Fo Fr', 'Vo Vr'],
        ];
        return [yyyy, M, d, eeee, H, m, s];
    }
}
exports.FancyDate = FancyDate;
function escape_regexp(text) {
    return text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}
function span_rank(precision) {
    return 'yMdHmsS'.indexOf(precision);
}
function is_core_precision(precision) {
    return 0 <= span_rank(precision);
}
function span_unit_token(unit) {
    switch (unit) {
        case 'year':
            return 'y';
        case 'month':
            return 'M';
        case 'day':
            return 'd';
        case 'hour':
            return 'H';
        case 'minute':
            return 'm';
        case 'second':
            return 's';
        case 'msec':
            return 'S';
    }
}
//# sourceMappingURL=fancy-date.js.map