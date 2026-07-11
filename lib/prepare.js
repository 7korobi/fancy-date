"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareSpotModels = prepareSpotModels;
exports.prepareSpot = prepareSpot;
const orbital_model_1 = require("./orbital-model");
const mean_1 = require("./mean");
function prepareSpotModels(body) {
    const { planetaryOrbital, planetaryRotation, satelliteOrbital } = (0, orbital_model_1.resolveSkyBody)(body);
    return {
        sunny: mean_1.MeanOrbital.from(planetaryOrbital),
        moony: satelliteOrbital ? mean_1.MeanOrbital.from(satelliteOrbital) : undefined,
        earthy: mean_1.MeanRotation.from(planetaryRotation),
    };
}
function prepareSpot(...spot) {
    const [body, ...geo] = spot;
    return {
        ...prepareSpotModels(body),
        geo,
    };
}
//# sourceMappingURL=prepare.js.map