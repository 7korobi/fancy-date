import type { BodyProfile } from './orbital-model'

// 元データの「2019/03/21 06:58」はJST相当として扱う。
export const MEAN_SEASON_EPOCH_MSEC = Date.UTC(2019, 2, 20, 21, 58)

export const MEAN_ASTRONOMY = {
  Sun: {
    body: { kind: 'physical', name: 'Sun', radiusKm: 695700 } as BodyProfile,
  },
  Mercury: {
    body: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 } as BodyProfile,
    orbital: [7596288000, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [15192576000, 0, 0.01] as const,
  },
  Venus: {
    body: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 } as BodyProfile,
    orbital: [19414456423, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [10087251840, 0, -2.64] as const,
  },
  Earth: {
    body: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 } as BodyProfile,
    orbital: [31556925147, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [86400000, 0, 23.4397] as const,
  },
  Mars: {
    body: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 } as BodyProfile,
    orbital: [59355616881, Date.UTC(2018, 9, 28)] as const,
    rotation: [88740035, 0, 25.19] as const,
  },
  Jupiter: {
    body: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 } as BodyProfile,
    orbital: [374322050280, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [35769600, 0, 3.12] as const,
  },
  Saturn: {
    body: { kind: 'physical', name: 'Saturn', radiusKm: 58232 } as BodyProfile,
    orbital: [931964092416, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [37920035, 0, 25.33] as const,
  },
  Uranus: {
    body: { kind: 'physical', name: 'Uranus', radiusKm: 25362 } as BodyProfile,
    orbital: [2658822788376, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [62061120, 0, -82.23] as const,
  },
  Neptune: {
    body: { kind: 'physical', name: 'Neptune', radiusKm: 24622 } as BodyProfile,
    orbital: [5200376904000, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [64800000, 0, 28.32] as const,
  },
  Pluto: {
    body: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 } as BodyProfile,
    orbital: [7818100727754, 0] as const,
    rotation: [551856672, 0, -60.41] as const,
  },
} as const
