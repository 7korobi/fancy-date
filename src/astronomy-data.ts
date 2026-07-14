import type { BodyProfile } from './orbital-model'

// 2019/03/21 06:58 JST
export const MEAN_SEASON_EPOCH_MSEC = 1553119080000

export const MEAN_ASTRONOMY = {
  Sun: {
    body: { kind: 'physical', name: 'Sun', radiusKm: 695700 } as BodyProfile,
  },
  Mercury: {
    body: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 } as BodyProfile,
    orbital: [7596288000, MEAN_SEASON_EPOCH_MSEC] as const, // 87.92d; epoch 2019/03/21 06:58 JST
    rotation: [15192576000, 0, 0.01] as const, // 175.84d; epoch 0
  },
  Venus: {
    body: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 } as BodyProfile,
    orbital: [19414456423, MEAN_SEASON_EPOCH_MSEC] as const, // 224.704357d; epoch 2019/03/21 06:58 JST
    rotation: [10087251840, 0, -2.64] as const, // 116.7506d; epoch 0
  },
  Earth: {
    body: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 } as BodyProfile,
    orbital: [31556925147, MEAN_SEASON_EPOCH_MSEC] as const, // 365.242189d; epoch 2019/03/21 06:58 JST
    rotation: [86400000, 0, 23.4397] as const, // 1d; epoch 0
  },
  Moon: {
    body: {
      kind: 'physical',
      name: 'Moon',
      radiusKm: 1737.4,
      meanDistanceKm: 384400,
    } as BodyProfile,
    orbital: [2551442889, 1577310360000] as const, // 29.530589d; epoch 2019/12/26 06:46 JST
    whiteOrbital: [2551442889, 1577310360000] as const, // 29.530589d; epoch 2019/12/26 06:46 JST
    rotation: [2551442889, 0, 6.68] as const, // 29.530589d; epoch 0
  },
  Mars: {
    body: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 } as BodyProfile,
    orbital: [59355616881, 1540684800000] as const, // 686.986306d; epoch 2018/10/28 00:00 UTC
    rotation: [88740035, 0, 25.19] as const, // 1.027084d; epoch 0
  },
  Jupiter: {
    body: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 } as BodyProfile,
    orbital: [374322050280, MEAN_SEASON_EPOCH_MSEC] as const, // 4332.431137d; epoch 2019/03/21 06:58 JST
    rotation: [35769600, 0, 3.12] as const, // 0.414d; epoch 0
  },
  Ganymede: {
    body: { kind: 'physical', name: 'Ganymede' } as BodyProfile,
    orbital: [618192000, 0] as const, // 7.155d; epoch 0
  },
  Callisto: {
    body: { kind: 'physical', name: 'Callisto' } as BodyProfile,
    orbital: [1441929600, 0] as const, // 16.689d; epoch 0
  },
  Saturn: {
    body: { kind: 'physical', name: 'Saturn', radiusKm: 58232 } as BodyProfile,
    orbital: [931964092416, MEAN_SEASON_EPOCH_MSEC] as const, // 10786.62144d; epoch 2019/03/21 06:58 JST
    rotation: [37920035, 0, 25.33] as const, // 0.438889d; epoch 0
  },
  Titan: {
    body: { kind: 'physical', name: 'Titan' } as BodyProfile,
    orbital: [1377684374, 0] as const, // 15.945421d; epoch 0
  },
  Uranus: {
    body: { kind: 'physical', name: 'Uranus', radiusKm: 25362 } as BodyProfile,
    orbital: [2658822788376, MEAN_SEASON_EPOCH_MSEC] as const, // 30773.411902d; epoch 2019/03/21 06:58 JST
    rotation: [62061120, 0, -82.23] as const, // 0.7183d; epoch 0
  },
  Titania: {
    body: { kind: 'physical', name: 'Titania' } as BodyProfile,
    orbital: [752198400, 0] as const, // 8.706d; epoch 0
  },
  Neptune: {
    body: { kind: 'physical', name: 'Neptune', radiusKm: 24622 } as BodyProfile,
    orbital: [5200376904000, MEAN_SEASON_EPOCH_MSEC] as const, // 60189.5475d; epoch 2019/03/21 06:58 JST
    rotation: [64800000, 0, 28.32] as const, // 0.75d; epoch 0
  },
  Triton: {
    body: { kind: 'physical', name: 'Triton' } as BodyProfile,
    orbital: [507733056, 0] as const, // 5.87654d; epoch 0
  },
  Pluto: {
    body: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 } as BodyProfile,
    orbital: [7818100727754, 0] as const, // 90487.276942d; epoch 0
    rotation: [551856672, 0, -60.41] as const, // 6.38723d; epoch 0
  },
  Charon: {
    body: { kind: 'physical', name: 'Charon' } as BodyProfile,
    orbital: [551880000, 0] as const, // 6.3875d; epoch 0
  },
  Ceres: {
    body: { kind: 'physical', name: 'Ceres', radiusKm: 469.7 } as BodyProfile,
    orbital: [145423814400, 0] as const, // 1683.146d; epoch 0
    rotation: [32667012, 0, 4] as const, // 0.37809d; epoch 0
  },
  Haumea: {
    body: { kind: 'physical', name: 'Haumea' } as BodyProfile,
    orbital: [8908394904000, 0] as const, // 103106.4225d; epoch 0
    rotation: [14095440, 0, 0] as const, // 0.163142d; epoch 0
  },
  Namaka: {
    body: { kind: 'physical', name: 'Namaka' } as BodyProfile,
    orbital: [1579245120, 0] as const, // 18.2783d; epoch 0
  },
  Hiiaka: {
    body: { kind: 'physical', name: 'Hiiaka' } as BodyProfile,
    orbital: [4273516800, 0] as const, // 49.462d; epoch 0
  },
  Makemake: {
    body: { kind: 'physical', name: 'Makemake' } as BodyProfile,
    orbital: [9639268920000, 0] as const, // 111565.6125d; epoch 0
    rotation: [27975600, 0, 0] as const, // 0.323792d; epoch 0
  },
  Eris: {
    body: { kind: 'physical', name: 'Eris' } as BodyProfile,
    orbital: [17610403104000, 0] as const, // 203824.11d; epoch 0
    rotation: [93240000, 0, 0] as const, // 1.079167d; epoch 0
  },
  Dysnomia: {
    body: { kind: 'physical', name: 'Dysnomia' } as BodyProfile,
    orbital: [1362700800, 0] as const, // 15.772d; epoch 0
  },
} as const
