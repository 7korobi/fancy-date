"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeStar = placeStar;
exports.placePlanet = placePlanet;
exports.placeSatellite = placeSatellite;
exports.isPlanetSkyBody = isPlanetSkyBody;
exports.centerOf = centerOf;
exports.orbitalOf = orbitalOf;
exports.rotationOf = rotationOf;
exports.bodyProfileOf = bodyProfileOf;
exports.hasSolarEvents = hasSolarEvents;
exports.hasLunarEvents = hasLunarEvents;
function definePlacementProps(target, props) {
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined)
            continue;
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: false,
            value,
            writable: false,
        });
    }
    return target;
}
function placeStar(body) {
    return definePlacementProps([null, null, null], { body });
}
function placePlanet(options) {
    const { body, center, orbital, rotation } = options;
    return definePlacementProps([center, orbital, rotation], {
        body,
        center,
        orbital,
        rotation,
    });
}
function placeSatellite(options) {
    const { body, center, orbital, rotation } = options;
    return definePlacementProps([center, orbital, rotation], {
        body,
        center,
        orbital,
        rotation,
    });
}
function isPlanetSkyBody(body) {
    return centerOf(body)[0] === null;
}
function centerOf(body) {
    return ('center' in body ? body.center : body[0]);
}
function orbitalOf(body) {
    return ('orbital' in body ? body.orbital : body[1]);
}
function rotationOf(body) {
    return ('rotation' in body ? body.rotation : body[2]);
}
function bodyProfileOf(body) {
    return body.body;
}
function hasSolarEvents(model) {
    return typeof model.solarEvents === 'function';
}
function hasLunarEvents(model) {
    return typeof model?.lunarEvents === 'function';
}
//# sourceMappingURL=orbital-model.js.map