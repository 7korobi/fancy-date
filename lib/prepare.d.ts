import type { OrbitalModel, RotationModel, SKY_BODY, SPOT, TIMEZONE } from './orbital-model';
export type PreparedSpotModels = {
    sunny: OrbitalModel;
    moony?: OrbitalModel;
    earthy: RotationModel;
};
export type PreparedSpot = PreparedSpotModels & {
    geo: TIMEZONE;
};
export declare function prepareSpotModels(body: SKY_BODY): PreparedSpotModels;
export declare function prepareSpot(...spot: SPOT): PreparedSpot;
