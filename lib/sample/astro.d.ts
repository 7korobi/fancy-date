import type { BodyProfile, PLANET, SATELLITE, SPOT, STAR } from '../fancy-date';
export declare const 天文: {
    太歳: {
        readonly 本体: {
            readonly kind: "virtual";
            readonly name: "太歳";
            readonly derivedFrom: {
                readonly 本体: BodyProfile;
                readonly 軌道: readonly [374322050280, 1553119080000];
                readonly 自転: readonly [35769600, 0, 3.12];
            };
        };
        readonly 軌道: import("../orbital-model").OrbitalModel;
        readonly 自転: readonly [35769600, 0, 3.12];
    };
    太陽: {
        readonly 本体: BodyProfile;
    };
    水星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [7596288000, 1553119080000];
        readonly 自転: readonly [15192576000, 0, 0.01];
    };
    金星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [19414456423, 1553119080000];
        readonly 自転: readonly [10087251840, 0, -2.64];
    };
    地球: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [31556925147, 1553119080000];
        readonly 自転: readonly [86400000, 0, 23.4397];
    };
    月: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [2551442889, 1577310360000];
        readonly 白分軌道: readonly [2551442889, 1577310360000];
        readonly 自転: readonly [2551442889, 0, 6.68];
    };
    ガニメデ: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [618192000, 0];
    };
    カリスト: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [1441929600, 0];
    };
    火星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [59355616881, 1540684800000];
        readonly 自転: readonly [88740035, 0, 25.19];
    };
    木星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [374322050280, 1553119080000];
        readonly 自転: readonly [35769600, 0, 3.12];
    };
    土星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [931964092416, 1553119080000];
        readonly 自転: readonly [37920035, 0, 25.33];
    };
    タイタン: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [1377684374, 0];
    };
    天王星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [2658822788376, 1553119080000];
        readonly 自転: readonly [62061120, 0, -82.23];
    };
    チタニア: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [752198400, 0];
    };
    海王星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [5200376904000, 1553119080000];
        readonly 自転: readonly [64800000, 0, 28.32];
    };
    トリトン: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [507733056, 0];
    };
    冥王星: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [7818100727754, 0];
        readonly 自転: readonly [551856672, 0, -60.41];
    };
    カロン: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [551880000, 0];
    };
    セレス: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [145423814400, 0];
        readonly 自転: readonly [32667012, 0, 4];
    };
    ハウメア: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [8908394904000, 0];
        readonly 自転: readonly [14095440, 0, 0];
    };
    ナマカ: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [1579245120, 0];
    };
    ヒイアカ: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [4273516800, 0];
    };
    マケマケ: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [9639268920000, 0];
        readonly 自転: readonly [27975600, 0, 0];
    };
    エリス: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [17610403104000, 0];
        readonly 自転: readonly [93240000, 0, 0];
    };
    ディスノミア: {
        readonly 本体: BodyProfile;
        readonly 軌道: readonly [1362700800, 0];
    };
};
export declare const 太陽: STAR;
export declare const 天文地球: PLANET;
export declare const 天文火星: PLANET;
export declare const 地球: PLANET;
export declare const 水星: PLANET;
export declare const 金星: PLANET;
export declare const 火星: PLANET;
export declare const 木星: PLANET;
export declare const 土星: PLANET;
export declare const 天王星: PLANET;
export declare const 海王星: PLANET;
export declare const 冥王星: PLANET;
export declare const セレス: PLANET;
export declare const ハウメア: PLANET;
export declare const マケマケ: PLANET;
export declare const エリス: PLANET;
export declare const 太歳: PLANET;
export declare const 天文月: SATELLITE;
export declare const 月: SATELLITE;
export declare const 白分月: SATELLITE;
export declare const 黒分月軌道: import("../orbital-model").OrbitalModel;
export declare const 黒分月: SATELLITE;
export declare const ガニメデ: SATELLITE;
export declare const カリスト: SATELLITE;
export declare const タイタン: SATELLITE;
export declare const チタニア: SATELLITE;
export declare const トリトン: SATELLITE;
export declare const ナマカ: SATELLITE;
export declare const ヒイアカ: SATELLITE;
export declare const カロン: SATELLITE;
export declare const ディスノミア: SATELLITE;
export declare const 東京: SPOT;
export declare const 天文東京: SPOT;
export declare const zürich: SPOT;
export declare const Paris: SPOT;
export declare const Romus: SPOT;
export declare const London: SPOT;
export declare const NewYork: SPOT;
export declare const NewYork_Summer: SPOT;
export declare const Madurai: SPOT;
export declare const Jaypore: SPOT;
