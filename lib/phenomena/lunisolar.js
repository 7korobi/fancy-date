"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lunisolar = lunisolar;
const time_1 = require("../time");
function lunisolar(options, utc) {
    const months = lunisolar_months_around(options, utc);
    const month = months.find(({ last_at, next_at }) => last_at <= utc && utc < next_at);
    if (!month || month.year == null) {
        throw new Error('failed to resolve lunisolar month');
    }
    const currentMonth = month;
    const currentYear = month.year;
    const yearStartAt = months.find(({ year, month, is_leap }) => year === currentYear && month === 1 && !is_leap)?.last_at ?? currentMonth.last_at;
    const nextYearStartAt = months.find(({ year, month, is_leap }) => year === currentYear + 1 && month === 1 && !is_leap)?.last_at ?? currentMonth.next_at;
    const day = (0, time_1.to_tempo_bare)(options.dayMsec, options.dayZero, utc);
    return {
        ...month,
        year: month.year,
        year_start_at: yearStartAt,
        next_year_start_at: nextYearStartAt,
        day: Math.floor((day.last_at - month.last_at) / options.dayMsec) + 1,
        day_start_at: day.last_at,
    };
}
function lunisolar_months_around(options, utc) {
    if (!options.moony) {
        throw new Error('lunisolar requires a satellite orbital model');
    }
    const { lunarPhase } = options;
    const periodMsec = options.moony.periodMsec;
    let newMoonAt = lunarPhase(0, utc);
    let monthStartAt = local_day_start(options, newMoonAt);
    while (utc < monthStartAt) {
        newMoonAt = lunarPhase(0, newMoonAt - periodMsec);
        monthStartAt = local_day_start(options, newMoonAt);
    }
    while (local_day_start(options, lunarPhase(0, newMoonAt + periodMsec)) <= utc) {
        newMoonAt = lunarPhase(0, newMoonAt + periodMsec);
        monthStartAt = local_day_start(options, newMoonAt);
    }
    // 前後18/19ヶ月(中心含め計37ヶ月)は「1年 ≈ 12〜13朔望月」という
    // 地球の月・太陽比率(朔望月≈29.53日 / 太陽年12等分≈30.44日)を
    // 前提にしたハードコード値であり、options.moony.periodMsec と
    // options.sunny(太陽側の周期)の比率からは動的に導出していない。
    // 前後の正月(年境界)を確実に窓へ収めるための安全マージンなので、
    // 月/年比率がこれと大きく異なる衛星(地球の月以外)を LunarEventModel
    // として実装した場合、この固定マージンでは年境界を見失う
    // (比率が地球よりずっと高い場合)か、無駄に広い範囲を探索する
    // (比率がずっと低い場合)おそれがある。同種の前提は
    // lunisolar_principal_term() の `index < 12`(太陽の中気間隔が
    // 概ね1朔望月と同程度という前提)にも独立に存在する。現状
    // LunarEventModel を実装するのは naoj/earth-moon.ts の
    // EarthMoonOrbital のみなので、この制約が実害になることはない
    // (ドーマント)。地球以外の衛星向け実装を追加する際は、この2箇所を
    // 比率から動的に導出する形へ見直すこと。
    const newMoons = [newMoonAt];
    for (let i = 0; i < 18; i++) {
        newMoons.unshift(lunarPhase(0, newMoons[0] - periodMsec));
    }
    for (let i = 0; i < 19; i++) {
        newMoons.push(lunarPhase(0, newMoons[newMoons.length - 1] + periodMsec));
    }
    const months = newMoons.slice(0, -1).map((at, index) => {
        const nextAt = newMoons[index + 1];
        return {
            month: NaN,
            is_leap: false,
            last_at: local_day_start(options, at),
            next_at: local_day_start(options, nextAt),
            new_moon_at: at,
            next_new_moon_at: nextAt,
            principal_term: lunisolar_principal_term(options, at, nextAt),
        };
    });
    assign_lunisolar_months(options, months);
    return months;
}
function assign_lunisolar_months(options, months) {
    let month = NaN;
    for (const item of months) {
        if (item.principal_term) {
            month = item.principal_term.month;
            item.month = month;
            item.is_leap = false;
        }
        else {
            item.month = month;
            item.is_leap = true;
        }
    }
    const firstAssignedIndex = months.findIndex(({ month }) => Number.isFinite(month));
    if (0 < firstAssignedIndex) {
        let previousMonth = months[firstAssignedIndex].month;
        for (let i = firstAssignedIndex - 1; 0 <= i; i--) {
            const item = months[i];
            if (item.principal_term) {
                previousMonth = item.principal_term.month;
                item.month = previousMonth;
                item.is_leap = false;
            }
            else {
                item.month = previousMonth;
                item.is_leap = true;
            }
        }
    }
    const firstMonthOneIndex = months.findIndex(({ month, is_leap }) => month === 1 && !is_leap);
    if (firstMonthOneIndex < 0) {
        const year = new Date(months[0].last_at + local_timezone_msec(options)).getUTCFullYear();
        for (const item of months)
            item.year = year;
        return;
    }
    let year = new Date(months[firstMonthOneIndex].last_at + local_timezone_msec(options)).getUTCFullYear();
    for (let i = 0; i < firstMonthOneIndex; i++) {
        months[i].year = year - 1;
    }
    for (let i = firstMonthOneIndex; i < months.length; i++) {
        const item = months[i];
        if (item.month === 1 && !item.is_leap) {
            year = new Date(item.last_at + local_timezone_msec(options)).getUTCFullYear();
        }
        item.year = year;
    }
}
function lunisolar_principal_term(options, monthStartAt, nextMonthStartAt) {
    const near = (monthStartAt + nextMonthStartAt) / 2;
    const startAt = local_day_start(options, monthStartAt);
    const nextAt = local_day_start(options, nextMonthStartAt);
    // index < 12 は「太陽の1公転(黄経360°)を12等分した中気の間隔が、
    // 概ね1朔望月と同程度の長さである」という地球の月・太陽比率を前提に
    // している(該当する中気を1朔望月の範囲内から探すだけで、複数の中気が
    // 同じ月に入らない・逆に何ヶ月も中気が入らない月が連続しない、という
    // 前提)。lunisolar_months_around() の前後18/19ヶ月マージンと同じく
    // 地球以外の月/年比率では成り立たない可能性がある(詳細はそちら側の
    // コメント参照)。
    for (let index = 0; index < 12; index++) {
        const at = options.solarPhase(index / 12, near);
        if (startAt <= at && at < nextAt) {
            return {
                index,
                longitudeDeg: index * 30,
                month: ((index + 1) % 12) + 1,
                at,
            };
        }
    }
    return undefined;
}
function local_day_start({ dayMsec, dayZero }, utc) {
    return (0, time_1.to_tempo_bare)(dayMsec, dayZero, utc).last_at;
}
function local_timezone_msec({ dayMsec, geo }) {
    return (dayMsec * (geo[2] != null ? geo[2] : geo[1])) / 360;
}
//# sourceMappingURL=lunisolar.js.map