"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSolarEvents = hasSolarEvents;
exports.hasLunarEvents = hasLunarEvents;
function hasSolarEvents(model) {
    return typeof model.solarEvents === 'function';
}
function hasLunarEvents(model) {
    return typeof model?.lunarEvents === 'function';
}
//# sourceMappingURL=orbital-model.js.map